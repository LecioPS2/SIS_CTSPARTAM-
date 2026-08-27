require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Plan, Payment, Exercise, Workout } = require('../src/models');

async function run() {
  await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
  const hash = await bcrypt.hash('senha123', 10);

  let personal = await User.findOne({ email: 'personal@academia.com' });
  if (!personal) personal = await User.create({ name: 'Carla Trainer', email: 'personal@academia.com', passwordHash: hash, role: 'personal', phone: '(11) 99999-1111' });

  let plan = await Plan.findOne({ name: 'Mensal' });
  if (!plan) plan = await Plan.create({ name: 'Mensal', price: 129.9, durationDays: 30, description: 'Acesso livre à academia + app' });

  let aluno = await User.findOne({ email: 'aluno@academia.com' });
  if (!aluno) aluno = await User.create({ name: 'Maria Atleta', email: 'aluno@academia.com', passwordHash: hash, role: 'aluno', phone: '(11) 98888-2222', personalId: personal._id, planId: plan._id, goal: 'Hipertrofia' });

  if ((await Exercise.countDocuments()) === 0) {
    await Exercise.insertMany([
      { name: 'Supino Reto', muscleGroup: 'Peito', sets: 4, reps: 10, load: 60, createdBy: personal._id },
      { name: 'Agachamento Livre', muscleGroup: 'Pernas', sets: 4, reps: 12, load: 80, createdBy: personal._id },
      { name: 'Puxada Frontal', muscleGroup: 'Costas', sets: 3, reps: 12, load: 50, createdBy: personal._id },
      { name: 'Prancha Abdominal', muscleGroup: 'Abdômen', sets: 3, reps: 0, load: 0, timeSeconds: 60, createdBy: personal._id },
    ]);
  }

  if ((await Workout.countDocuments({ studentId: aluno._id })) === 0) {
    const exs = await Exercise.find().limit(4);
    await Workout.create({
      name: 'Treino A — Full Body',
      studentId: aluno._id,
      personalId: personal._id,
      days: [0, 1, 2, 3, 4, 5, 6],
      exercises: exs.map((e) => ({ exerciseId: e._id, name: e.name, muscleGroup: e.muscleGroup, sets: e.sets, reps: e.reps, load: e.load, timeSeconds: e.timeSeconds })),
    });
  }

  if ((await Payment.countDocuments({ studentId: aluno._id })) === 0) {
    const today = new Date().toISOString().slice(0, 10);
    await Payment.create({ studentId: aluno._id, planId: plan._id, amount: 129.9, dueDate: today, status: 'pago', paidAt: today, method: 'Pix' });
  }

  console.log('Seed concluído');
  await mongoose.disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
