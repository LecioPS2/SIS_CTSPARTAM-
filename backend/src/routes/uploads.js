const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { User, Exercise } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

// Garantir que as pastas existam
const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
['avatars', 'exercises', 'videos'].forEach((dir) => {
  const full = path.join(uploadsDir, dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subdir = 'exercises';
    if (req.uploadType === 'avatar') subdir = 'avatars';
    if (req.uploadType === 'video') subdir = 'videos';
    cb(null, path.join(uploadsDir, subdir));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || (req.uploadType === 'video' ? '.mp4' : '.jpg');
    const id = req.uploadType === 'avatar' ? req.user._id.toString() : req.params.id;
    cb(null, `${id}${ext}`);
  },
});

const uploadImage = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new Error('Formato não suportado. Use JPEG, PNG ou WebP.'));
    }
    cb(null, true);
  },
});

const uploadVideo = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      return cb(new Error('Formato de vídeo não suportado. Use MP4, WebM ou MOV.'));
    }
    cb(null, true);
  },
});

router.use(requireAuth);

// POST /api/uploads/avatar — upload de foto de perfil
router.post('/avatar', (req, res, next) => { req.uploadType = 'avatar'; next(); }, uploadImage.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  await User.findByIdAndUpdate(req.user._id, { avatarUrl });
  res.json({ avatarUrl });
});

// POST /api/uploads/exercise/:id — upload de foto de exercício
router.post('/exercise/:id', requireRole('admin', 'personal'), (req, res, next) => { req.uploadType = 'exercise'; next(); }, uploadImage.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  const imageUrl = `/uploads/exercises/${req.file.filename}`;
  const exercise = await Exercise.findByIdAndUpdate(req.params.id, { imageUrl }, { new: true });
  if (!exercise) return res.status(404).json({ error: 'Exercício não encontrado' });
  res.json({ imageUrl });
});

// POST /api/uploads/exercise/:id/video — upload de vídeo do exercício
router.post('/exercise/:id/video', requireRole('admin', 'personal'), (req, res, next) => { req.uploadType = 'video'; next(); }, uploadVideo.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  const videoUrl = `/uploads/videos/${req.file.filename}`;
  const exercise = await Exercise.findByIdAndUpdate(req.params.id, { videoUrl }, { new: true });
  if (!exercise) return res.status(404).json({ error: 'Exercício não encontrado' });
  res.json({ videoUrl });
});

// Error handler para multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Arquivo muito grande. Máximo 2MB.' });
    return res.status(400).json({ error: err.message });
  }
  if (err.message) return res.status(400).json({ error: err.message });
  next(err);
});

module.exports = router;
