const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

async function connectDb() {
  try {
    mongoServer = await MongoMemoryServer.create();
    const url = mongoServer.getUri();
    await mongoose.connect(url, { dbName: 'gym_management' });
    console.log('MongoDB (em-memória) conectado:', url);
    await seedAll();
  } catch (err) {
    console.error('Erro ao conectar BD:', err);
  }
}

async function seedAll() {
  const { User, Plan, Payment, Exercise, Workout } = require('./models');
  const hash = await bcrypt.hash('admin123', 10);
  const hashUser = await bcrypt.hash('senha123', 10);

  // Admin
  await User.create({ name: 'Administrador', email: 'admin@academia.com', passwordHash: hash, role: 'admin' });
  console.log('Admin criado: admin@academia.com');

  // Personal
  const personal = await User.create({ name: 'Carla Trainer', email: 'personal@academia.com', passwordHash: hashUser, role: 'personal', phone: '(11) 99999-1111' });
  console.log('Personal criada: personal@academia.com');

  // Plano
  const plan = await Plan.create({ name: 'Mensal', price: 129.9, durationDays: 30, description: 'Acesso livre à academia + app' });

  // Aluna
  const aluno = await User.create({ name: 'Maria Atleta', email: 'aluno@academia.com', passwordHash: hashUser, role: 'aluno', phone: '(11) 98888-2222', personalId: personal._id, planId: plan._id, goal: 'Hipertrofia' });
  console.log('Aluna criada: aluno@academia.com');

  // Exercícios
  const exs = await Exercise.insertMany([
    { name: 'Supino Reto', muscleGroup: 'Peito', sets: 4, reps: 10, load: 60, createdBy: personal._id },
    { name: 'Agachamento Livre', muscleGroup: 'Pernas', sets: 4, reps: 12, load: 80, createdBy: personal._id },
    { name: 'Puxada Frontal', muscleGroup: 'Costas', sets: 3, reps: 12, load: 50, createdBy: personal._id },
    { name: 'Prancha Abdominal', muscleGroup: 'Abdômen', sets: 3, reps: 0, load: 0, timeSeconds: 60, createdBy: personal._id },
  ]);

  // Treino
  await Workout.create({
    name: 'Treino A — Full Body',
    studentId: aluno._id,
    personalId: personal._id,
    days: [0, 1, 2, 3, 4, 5, 6],
    exercises: exs.map((e) => ({ exerciseId: e._id, name: e.name, muscleGroup: e.muscleGroup, sets: e.sets, reps: e.reps, load: e.load, timeSeconds: e.timeSeconds })),
  });

  // Pagamento (Atrasado para gerar notificação no teste)
  const pastDate = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
  await Payment.create({ studentId: aluno._id, planId: plan._id, amount: 129.9, dueDate: pastDate, status: 'pendente', method: 'Pix' });
}

module.exports = { connectDb };
