import db from "./db.js";

const books = [
  {
    id: "tablero",
    title: "El Tablero de Carne",
    category: "Psicología oscura",
    description: "Una exploración de conceptos relacionados con el narcisismo, el maquiavelismo, la psicopatía, la triangulación, el gaslighting y la distorsión de la realidad.",
    pdf_filename: "EL TABLERO DE CARNE2.docx (2).pdf"
  },
  {
    id: "seduccion",
    title: "El Código de la Seducción",
    category: "Seducción e influencia",
    description: "Una inmersión en conceptos de seducción, misterio, opacidad, atención e influencia interpersonal.",
    pdf_filename: "EL CODIGO DE LA SEDUCCION.pdf"
  },
  {
    id: "desarme",
    title: "Manual de Desarme: Psicología Oscura Aplicada",
    category: "Psicología aplicada",
    description: "Un manual centrado en técnicas y conceptos de interacción, interrupción del ego, control del marco, influencia invisible y blindaje mental.",
    pdf_filename: "MANUAL DE DESARME.pdf"
  }
];

const stmt = db.prepare(`
  INSERT INTO books (id,title,category,description,pdf_filename)
  VALUES (@id,@title,@category,@description,@pdf_filename)
  ON CONFLICT(id) DO UPDATE SET
    title=excluded.title,
    category=excluded.category,
    description=excluded.description,
    pdf_filename=excluded.pdf_filename
`);
const tx = db.transaction(() => books.forEach(b => stmt.run(b)));
tx();
console.log("Books seeded:", books.length);
