import { parse as parseCsv } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { DateTime } from "luxon";
import { prisma } from "../db/client";
import { config } from "../config";
import { deriveMembershipStatus } from "../domain/membership";
import { businessToday, daysBetween, toDateOnly } from "../domain/dates";

export const IMPORT_COLUMNS = [
  "full_name",
  "phone",
  "email",
  "plan_code",
  "start_date",
  "expiration_date",
  "status",
  "external_id",
] as const;

const VALID_PLAN_CODES = new Set(["monthly", "quarterly", "semester", "annual"]);
const VALID_STATUSES = new Set(["ACTIVE", "EXPIRING", "EXPIRED", "CANCELLED"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ValidImportRow {
  row: number;
  fullName: string;
  phone: string;
  email: string | null;
  planCode: string;
  startDate: string;
  expirationDate: string;
  status: string | null;
  externalId: string | null;
}

export interface ValidationReport {
  validRows: ValidImportRow[];
  errors: ImportRowError[];
}

function readRawRows(buffer: Buffer, filename: string): Record<string, string>[] {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) {
    return parseCsv(buffer, { columns: true, skip_empty_lines: true, trim: true });
  }
  if (lower.endsWith(".xlsx")) {
    throw new Error("XLSX_NEEDS_ASYNC");
  }
  throw new Error("Extension no soportada: use .csv o .xlsx");
}

async function readXlsxRows(buffer: Buffer): Promise<Record<string, string>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1).values as unknown[];
  const headers = headerRow
    .slice(1)
    .map((h) => String(h ?? "").trim());

  const rows: Record<string, string>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = row.values as unknown[];
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      const cell = values[idx + 1];
      record[header] = cell === undefined || cell === null ? "" : String(cell).trim();
    });
    rows.push(record);
  });
  return rows;
}

export async function validateImportFile(buffer: Buffer, filename: string): Promise<ValidationReport> {
  const lower = filename.toLowerCase();
  if (!lower.endsWith(".csv") && !lower.endsWith(".xlsx")) {
    return { validRows: [], errors: [{ row: 0, message: "Extension no soportada: use .csv o .xlsx" }] };
  }

  let rawRows: Record<string, string>[];
  try {
    rawRows = lower.endsWith(".xlsx") ? await readXlsxRows(buffer) : readRawRows(buffer, filename);
  } catch (err: any) {
    return { validRows: [], errors: [{ row: 0, message: `No se pudo leer el archivo: ${err.message}` }] };
  }

  if (rawRows.length === 0) {
    return { validRows: [], errors: [{ row: 0, message: "El archivo no tiene filas de datos" }] };
  }

  const headers = Object.keys(rawRows[0]);
  const missingColumns = IMPORT_COLUMNS.filter(
    (col) => col !== "email" && col !== "status" && col !== "external_id" && !headers.includes(col)
  );
  if (missingColumns.length > 0) {
    return {
      validRows: [],
      errors: [{ row: 0, message: `Faltan columnas requeridas: ${missingColumns.join(", ")}` }],
    };
  }

  const errors: ImportRowError[] = [];
  const validRows: ValidImportRow[] = [];
  const seenExternalIds = new Set<string>();

  rawRows.forEach((raw, idx) => {
    const rowNum = idx + 2; // +1 header, +1 base-1
    const fullName = (raw.full_name ?? "").trim();
    const phone = (raw.phone ?? "").trim();
    const email = (raw.email ?? "").trim();
    const planCode = (raw.plan_code ?? "").trim();
    const startDate = (raw.start_date ?? "").trim();
    const expirationDate = (raw.expiration_date ?? "").trim();
    const status = (raw.status ?? "").trim();
    const externalId = (raw.external_id ?? "").trim();

    const rowErrors: string[] = [];
    if (!fullName) rowErrors.push("full_name vacio");
    if (!phone) rowErrors.push("phone vacio");
    if (email && !EMAIL_RE.test(email)) rowErrors.push("email invalido");
    if (!VALID_PLAN_CODES.has(planCode)) rowErrors.push(`plan_code invalido: "${planCode}"`);
    if (!DATE_RE.test(startDate)) rowErrors.push("start_date invalida (use YYYY-MM-DD)");
    if (!DATE_RE.test(expirationDate)) rowErrors.push("expiration_date invalida (use YYYY-MM-DD)");
    if (DATE_RE.test(startDate) && DATE_RE.test(expirationDate) && expirationDate < startDate) {
      rowErrors.push("expiration_date es anterior a start_date");
    }
    if (status && !VALID_STATUSES.has(status)) rowErrors.push(`status invalido: "${status}"`);
    if (externalId) {
      if (seenExternalIds.has(externalId)) {
        rowErrors.push(`external_id duplicado dentro del archivo: "${externalId}"`);
      }
      seenExternalIds.add(externalId);
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNum, message: rowErrors.join("; ") });
      return;
    }

    validRows.push({
      row: rowNum,
      fullName,
      phone,
      email: email || null,
      planCode,
      startDate,
      expirationDate,
      status: status || null,
      externalId: externalId || null,
    });
  });

  return { validRows, errors };
}

/**
 * Aplica una importacion ya validada. Politica transaccional: todo o nada
 * (si alguna fila fallara al aplicar, se revierte el lote completo).
 */
export async function applyImport(businessId: string, rows: ValidImportRow[]) {
  const plans = await prisma.plan.findMany({ where: { businessId } });
  const planByCode = new Map(plans.map((p) => [p.code, p]));
  const timezone = config.business.timezone;
  const today = businessToday(timezone);

  return prisma.$transaction(async (tx) => {
    let created = 0;
    let updated = 0;

    for (const row of rows) {
      const plan = planByCode.get(row.planCode as any);
      if (!plan) throw new Error(`Plan no encontrado para el negocio: ${row.planCode}`);

      const existing = row.externalId
        ? await tx.customer.findUnique({
            where: { businessId_externalId: { businessId, externalId: row.externalId } },
          })
        : null;

      const customer = existing
        ? await tx.customer.update({
            where: { id: existing.id },
            data: { fullName: row.fullName, phone: row.phone, email: row.email, active: true },
          })
        : await tx.customer.create({
            data: {
              businessId,
              externalId: row.externalId,
              fullName: row.fullName,
              phone: row.phone,
              email: row.email,
              demoRecord: false,
            },
          });

      existing ? updated++ : created++;

      const expirationDate = DateTime.fromISO(row.expirationDate, { zone: timezone });
      const daysUntil = daysBetween(today, expirationDate);
      const status = row.status ?? deriveMembershipStatus(daysUntil, config.reminderDays);

      const existingMembership = await tx.membership.findFirst({
        where: { customerId: customer.id, businessId },
        orderBy: { expirationDate: "desc" },
      });

      if (existingMembership) {
        await tx.membership.update({
          where: { id: existingMembership.id },
          data: {
            planId: plan.id,
            startDate: toDateOnly(DateTime.fromISO(row.startDate, { zone: timezone })),
            expirationDate: toDateOnly(expirationDate),
            status: status as any,
          },
        });
      } else {
        await tx.membership.create({
          data: {
            businessId,
            customerId: customer.id,
            planId: plan.id,
            startDate: toDateOnly(DateTime.fromISO(row.startDate, { zone: timezone })),
            expirationDate: toDateOnly(expirationDate),
            status: status as any,
          },
        });
      }
    }

    return { created, updated, total: rows.length };
  });
}
