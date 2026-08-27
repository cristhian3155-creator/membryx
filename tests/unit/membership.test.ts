import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import { computeRenewal, deriveMembershipStatus } from "../../src/domain/membership";

const d = (iso: string) => DateTime.fromISO(iso, { zone: "America/Bogota" });

describe("computeRenewal", () => {
  it("renovacion anticipada: conserva dias restantes (31/08 + pago 21/08, mensual 30d -> 30/09)", () => {
    const result = computeRenewal({
      currentStartDate: d("2026-08-01"),
      currentExpirationDate: d("2026-08-31"),
      referenceDate: d("2026-08-21"),
      durationDays: 30,
    });
    expect(result.expirationDate.toISODate()).toBe("2026-09-30");
    expect(result.wasActive).toBe(true);
    expect(result.startDate.toISODate()).toBe("2026-08-01");
  });

  it("renovacion tras vencimiento: inicia desde fecha de pago (31/07 vencida, paga 05/08, mensual 30d -> 04/09)", () => {
    const result = computeRenewal({
      currentStartDate: d("2026-07-01"),
      currentExpirationDate: d("2026-07-31"),
      referenceDate: d("2026-08-05"),
      durationDays: 30,
    });
    expect(result.expirationDate.toISODate()).toBe("2026-09-04");
    expect(result.wasActive).toBe(false);
    expect(result.startDate.toISODate()).toBe("2026-08-05");
  });

  it("cliente sin membresia previa: nueva vigencia desde fecha de pago", () => {
    const result = computeRenewal({
      currentStartDate: null,
      currentExpirationDate: null,
      referenceDate: d("2026-08-05"),
      durationDays: 90,
    });
    expect(result.startDate.toISODate()).toBe("2026-08-05");
    expect(result.expirationDate.toISODate()).toBe("2026-11-03");
    expect(result.wasActive).toBe(false);
  });

  it("pago el mismo dia del vencimiento cuenta como vigente (no vencida)", () => {
    const result = computeRenewal({
      currentStartDate: d("2026-08-01"),
      currentExpirationDate: d("2026-08-31"),
      referenceDate: d("2026-08-31"),
      durationDays: 30,
    });
    expect(result.wasActive).toBe(true);
    expect(result.expirationDate.toISODate()).toBe("2026-09-30");
  });

  it("los cuatro planes calculan duraciones distintas correctamente desde vencida", () => {
    const base = { currentStartDate: null, currentExpirationDate: null, referenceDate: d("2026-01-01") };
    expect(computeRenewal({ ...base, durationDays: 30 }).expirationDate.toISODate()).toBe("2026-01-31");
    expect(computeRenewal({ ...base, durationDays: 90 }).expirationDate.toISODate()).toBe("2026-04-01");
    expect(computeRenewal({ ...base, durationDays: 180 }).expirationDate.toISODate()).toBe("2026-06-30");
    expect(computeRenewal({ ...base, durationDays: 365 }).expirationDate.toISODate()).toBe("2027-01-01");
  });
});

describe("deriveMembershipStatus", () => {
  const reminderDays = [3, 2, 1, 0];

  it("EXPIRED cuando dias restantes es negativo", () => {
    expect(deriveMembershipStatus(-1, reminderDays)).toBe("EXPIRED");
  });

  it("EXPIRING dentro de la ventana de recordatorios", () => {
    expect(deriveMembershipStatus(0, reminderDays)).toBe("EXPIRING");
    expect(deriveMembershipStatus(3, reminderDays)).toBe("EXPIRING");
  });

  it("ACTIVE fuera de la ventana de recordatorios", () => {
    expect(deriveMembershipStatus(4, reminderDays)).toBe("ACTIVE");
    expect(deriveMembershipStatus(30, reminderDays)).toBe("ACTIVE");
  });
});
