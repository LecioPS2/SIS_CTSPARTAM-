require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Plan, Payment, Exercise, Workout, WorkoutLog, Measurement, Session, CheckIn, Notice, DietPlan } = require('../src/models');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'gym_management';

async function wipeDatabase() {
  try {
    console.log('Conectando ao MongoDB...', MONGO_URI);
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    console.log('Conectado com sucesso!');

    console.log('Apagando todos os dados do banco de dados...');
    
    await CheckIn.deleteMany({});
    await Payment.deleteMany({});
    await WorkoutLog.deleteMany({});
    await Workout.deleteMany({});
    await Exercise.deleteMany({});
    await Measurement.deleteMany({});
    await Session.deleteMany({});
    await Notice.deleteMany({});
    await DietPlan.deleteMany({});
    await Plan.deleteMany({});
    await User.deleteMany({});
    
    console.log('Todos os dados foram removidos.');

    console.log('Criando conta do administrador...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ctspartan.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'adminCT123';
    const hash = await bcrypt.hash(adminPass, 10);
    await User.create({
      name: 'Administrador',
      email: adminEmail,
      passwordHash: hash,
      role: 'admin'
    });
    console.log(`Conta do administrador criada: ${adminEmail}`);

    console.log('Processo finalizado com sucesso.');
    process.exit(0);
  } catch (err) {
    console.error('Erro crítico:', err);
    process.exit(1);
  }
}

wipeDatabase();
