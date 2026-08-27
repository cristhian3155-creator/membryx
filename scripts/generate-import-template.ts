import fs from "node:fs";
import path from "node:path";
import { IMPORT_COLUMNS } from "../src/services/import-service";

const EXAMPLE_ROWS = [
  ["Juan Perez", "+573001112233", "juan.perez@example.com", "monthly", "2026-08-01", "2026-08-31", "ACTIVE", "EXT-0001"],
  ["Maria Gomez", "+573002223344", "", "quarterly", "2026-06-01", "2026-08-30", "", "EXT-0002"],
];

const outPath = path.join(process.cwd(), "templates", "customer_import_template.csv");
const lines = [IMPORT_COLUMNS.join(","), ...EXAMPLE_ROWS.map((row) => row.join(","))];
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf-8");
console.log(`[generate-import-template] escrito en ${outPath}`);
