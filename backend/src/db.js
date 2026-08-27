const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function connectDb() {
  const url = process.env.MONGO_URL;
  const dbName = process.env.DB_NAME;
  await mongoose.connect(url, { dbName });
  console.log('MongoDB conectado:', dbName);
  await seedAdmin();
}

async function seedAdmin() {
  const { User } = require('./models');
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const existing = await User.findOne({ email });
  if (!existing) {
    const hash = await bcrypt.hash(password, 10);
    await User.create({ name: 'Administrador', email, passwordHash: hash, role: 'admin' });
    console.log('Admin criado:', email);
  } else if (!(await bcrypt.compare(password, existing.passwordHash))) {
    existing.passwordHash = await bcrypt.hash(password, 10);
    await existing.save();
  }
}

module.exports = { connectDb };
