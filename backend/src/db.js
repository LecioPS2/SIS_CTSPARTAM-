const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

async function connectDb() {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (mongoUri) {
      // Produção / Banco Real
      await mongoose.connect(mongoUri, { dbName: 'gym_management' });
      console.log('MongoDB (Produção/Real) conectado com sucesso!');
    } else {
      // Ambiente de Desenvolvimento ou Hostinger s/ Banco Externo
      // Força a identificação do Sistema Operacional para evitar o erro "unknown linux" na Hostinger
      process.env.MONGOMS_DISTRO = 'ubuntu-22.04';
      
      console.log('Iniciando MongoMemoryServer (Pode demorar um pouco no primeiro boot para baixar o binário)...');
      mongoServer = await MongoMemoryServer.create();
      const url = mongoServer.getUri();
      await mongoose.connect(url, { dbName: 'gym_management' });
      console.log('MongoDB (em-memória local/Hostinger) conectado:', url);
    }
    
    await seedAll();
  } catch (err) {
    console.error('Erro ao conectar BD:', err);
    // Propaga o erro para não deixar a aplicação rodar "falsa"
    throw err;
  }
}

async function seedAll() {
  const { User, Plan, Payment, Exercise, Workout } = require('./models');
  
  // Evita duplicar dados ou apagar tudo ao reiniciar a Hostinger
  const count = await User.countDocuments();
  if (count > 0) {
    console.log('Banco de dados já configurado. Seed ignorado.');
    return;
  }

  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'adminCT123', 10);
  const hashUser = await bcrypt.hash('senha123', 10);

  // Admin
  await User.create({ name: 'Administrador', email: process.env.ADMIN_EMAIL || 'admin@ctspartan.com', passwordHash: hash, role: 'admin' });
  console.log('Admin criado:', process.env.ADMIN_EMAIL || 'admin@ctspartan.com');
}

module.exports = { connectDb };
