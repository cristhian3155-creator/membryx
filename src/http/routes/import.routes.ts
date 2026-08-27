import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth";
import { config } from "../../config";
import { applyImport, validateImportFile } from "../../services/import-service";
import { prisma } from "../../db/client";

export const importRouter = Router();
importRouter.use(requireAuth);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

importRouter.get("/", (req, res) => {
  res.render("dashboard/import", { business: config.business, report: null, importSummary: null });
});

importRouter.get("/template", (req, res) => {
  res.download(path.join(process.cwd(), "templates", "customer_import_template.csv"));
});

importRouter.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).render("dashboard/import", {
      business: config.business,
      report: { validRows: [], errors: [{ row: 0, message: "No se recibio ningun archivo" }] },
      importSummary: null,
    });
  }

  const report = await validateImportFile(req.file.buffer, req.file.originalname);

  const confirmed = req.body.confirm === "true";
  let importSummary = null;

  if (confirmed && report.errors.length === 0 && report.validRows.length > 0) {
    const business = await prisma.business.findFirstOrThrow();
    importSummary = await applyImport(business.id, report.validRows);
  }

  res.render("dashboard/import", { business: config.business, report, importSummary });
});
