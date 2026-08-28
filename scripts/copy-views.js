// Copia los assets no-TS (vistas EJS) al build compilado, con la misma
// estructura relativa que produce tsc (rootDir "." -> dist/src/...).
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "src", "dashboard", "views");
const dest = path.join(__dirname, "..", "dist", "src", "dashboard", "views");

fs.cpSync(src, dest, { recursive: true });
console.log(`[copy-views] ${src} -> ${dest}`);
