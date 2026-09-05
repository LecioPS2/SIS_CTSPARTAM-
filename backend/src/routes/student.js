const router = require('express').Router();
const { Workout, WorkoutLog, Measurement, Payment, User } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/today', requireRole('aluno'), async (req, res) => {
  const today = new Date();
  const dow = today.getDay();
  const dateStr = today.toISOString().slice(0, 10);
  const workouts = await Workout.find({ studentId: req.user._id, active: true })
    .populate('personalId', 'name')
    .populate('exercises.exerciseId', 'imageUrl videoUrl');
  const todayWorkouts = workouts.filter((w) => w.days.includes(dow));
  const logs = await WorkoutLog.find({ studentId: req.user._id, date: dateStr });
  const doneIds = new Set(logs.map((l) => l.workoutId.toString()));
  res.json({
    todayWorkouts: todayWorkouts.map((w) => ({ ...w.toJSON(), completedToday: doneIds.has(w._id.toString()) })),
    allWorkouts: workouts.map((w) => w.toJSON()),
  });
});

router.post('/complete/:workoutId', requireRole('aluno'), async (req, res) => {
  const dateStr = new Date().toISOString().slice(0, 10);
  const existing = await WorkoutLog.findOne({ studentId: req.user._id, workoutId: req.params.workoutId, date: dateStr });
  if (existing) return res.status(400).json({ error: 'Treino já concluído hoje' });
  const log = await WorkoutLog.create({ studentId: req.user._id, workoutId: req.params.workoutId, date: dateStr });
  res.status(201).json(log.toJSON());
});

router.get('/history', requireRole('aluno'), async (req, res) => {
  const logs = await WorkoutLog.find({ studentId: req.user._id }).populate('workoutId', 'name').sort({ date: -1 }).limit(30);
  res.json(logs.map((l) => l.toJSON()));
});

router.get('/measurements', requireRole('aluno'), async (req, res) => {
  const list = await Measurement.find({ studentId: req.user._id }).sort({ date: 1 });
  res.json(list.map((m) => m.toJSON()));
});

router.post('/measurements', requireRole('aluno'), async (req, res) => {
  const { weight, height, chest, waist, hip, arm, thigh, bodyFat, muscleMass, date } = req.body;
  const m = await Measurement.create({
    studentId: req.user._id,
    date: date || new Date().toISOString().slice(0, 10),
    weight, height, chest, waist, hip, arm, thigh, bodyFat, muscleMass,
  });
  res.status(201).json(m.toJSON());
});

router.get('/membership', requireRole('aluno'), async (req, res) => {
  const user = await User.findById(req.user._id).populate('planId').populate('personalId', 'name');
  const payments = await Payment.find({ studentId: req.user._id }).sort({ dueDate: -1 }).limit(12);
  res.json({ plan: user.planId ? user.planId.toJSON() : null, personal: user.personalId ? { id: user.personalId._id, name: user.personalId.name } : null, payments: payments.map((p) => p.toJSON()) });
});

module.exports = router;


