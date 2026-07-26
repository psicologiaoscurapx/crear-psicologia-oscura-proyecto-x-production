import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import db from "./db.js";

const sourceDir = path.resolve("storage/books");
const previewDir = path.resolve("storage/previews");
fs.mkdirSync(previewDir,{recursive:true});

for (const book of db.prepare("SELECT * FROM books").all()) {
  const source = path.join(sourceDir, book.pdf_filename);
  if (!fs.existsSync(source)) { console.warn("Missing:", source); continue; }
  const srcBytes = fs.readFileSync(source);
  const srcPdf = await PDFDocument.load(srcBytes);
  const out = await PDFDocument.create();
  const count = Math.min(3, srcPdf.getPageCount());
  const pages = await out.copyPages(srcPdf, Array.from({length:count},(_,i)=>i));
  pages.forEach(p=>out.addPage(p));
  fs.writeFileSync(path.join(previewDir, `${book.id}-preview.pdf`), await out.save());
  console.log(`Generated preview for ${book.id}: ${count} pages`);
}
