const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Rutas de almacenamiento
// ---------------------------------------------------------------------------
// DATA_DIR debe apuntar a un disco persistente en producción (ver README.md).
// Si no se define, se usa una carpeta local dentro del proyecto.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Límite de tamaño por archivo (por defecto 500 MB). Ajustable con la
// variable de entorno MAX_FILE_SIZE_MB.
const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB || 500);

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ videos: [] }, null, 2));
}

// ---------------------------------------------------------------------------
// "Base de datos" simple basada en un archivo JSON.
// Suficiente para un proyecto personal / de bajo tráfico. Si necesitas más
// robustez (muchos uploads simultáneos, varias instancias del servidor),
// sustituye esto por Postgres, MongoDB, etc. — ver README.md.
// ---------------------------------------------------------------------------
function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}
function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ---------------------------------------------------------------------------
// Multer: configuración de subida de archivos
// ---------------------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('video/')) {
      return cb(new Error('Solo se permiten archivos de video.'));
    }
    cb(null, true);
  },
});

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// ---------------------------------------------------------------------------
// Rutas de la API
// ---------------------------------------------------------------------------

// Listar todos los videos (más recientes primero)
app.get('/api/videos', (req, res) => {
  const db = readDB();
  const videos = [...db.videos].sort((a, b) => b.uploadedAt - a.uploadedAt);
  res.json(videos);
});

// Subir un video nuevo
app.post('/api/videos', (req, res) => {
  upload.single('video')(req, res, (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? `El archivo supera el límite de ${MAX_FILE_SIZE_MB} MB.`
          : err.message || 'No se pudo subir el archivo.';
      return res.status(400).json({ error: message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo.' });
    }

    const db = readDB();
    const video = {
      id: uuidv4(),
      title: (req.body.title || req.file.originalname).slice(0, 200),
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: Date.now(),
    };
    db.videos.push(video);
    writeDB(db);

    res.status(201).json(video);
  });
});

// Eliminar un video
app.delete('/api/videos/:id', (req, res) => {
  const db = readDB();
  const idx = db.videos.findIndex((v) => v.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Video no encontrado.' });
  }
  const [video] = db.videos.splice(idx, 1);
  writeDB(db);

  const filePath = path.join(UPLOADS_DIR, video.filename);
  fs.unlink(filePath, () => {}); // si falla, no es crítico

  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Carrete corriendo en http://localhost:${PORT}`);
  console.log(`Archivos guardados en: ${UPLOADS_DIR}`);
});
