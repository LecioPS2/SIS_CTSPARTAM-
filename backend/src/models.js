const mongoose = require('mongoose');
const { Schema } = mongoose;

const opts = { timestamps: true, toJSON: { virtuals: true, transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; delete ret.passwordHash; return ret; } } };

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'personal', 'aluno'], required: true },
  phone: String,
  personalId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  planId: { type: Schema.Types.ObjectId, ref: 'Plan', default: null },
  active: { type: Boolean, default: true },
  birthDate: String,
  goal: String,
  healthConditions: String,
  medications: String,
  injuries: String,
  experienceLevel: String,
  trainingFrequency: String,
  anamnesisNotes: String,
}, opts);

const planSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  durationDays: { type: Number, default: 30 },
  daysPerWeek: { type: Number, default: 7 },
  description: String,
  active: { type: Boolean, default: true },
}, opts);

const paymentSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: Schema.Types.ObjectId, ref: 'Plan' },
  amount: { type: Number, required: true },
  dueDate: { type: String, required: true },
  paidAt: { type: String, default: null },
  status: { type: String, enum: ['pago', 'pendente', 'atrasado'], default: 'pendente' },
  method: String,
  reference: String,
}, opts);

const exerciseSchema = new Schema({
  name: { type: String, required: true },
  muscleGroup: { type: String, required: true },
  sets: { type: Number, default: 3 },
  reps: { type: Number, default: 12 },
  load: { type: Number, default: 0 },
  timeSeconds: { type: Number, default: 0 },
  notes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, opts);

const workoutSchema = new Schema({
  name: { type: String, required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  personalId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  days: [{ type: Number }],
  exercises: [{
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise' },
    name: String,
    muscleGroup: String,
    sets: Number,
    reps: Number,
    load: Number,
    timeSeconds: Number,
    notes: String,
  }],
  active: { type: Boolean, default: true },
}, opts);

const workoutLogSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  workoutId: { type: Schema.Types.ObjectId, ref: 'Workout', required: true },
  date: { type: String, required: true },
}, opts);

const measurementSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  weight: Number,
  height: Number,
  chest: Number,
  waist: Number,
  hip: Number,
  arm: Number,
  thigh: Number,
}, opts);

const sessionSchema = new Schema({
  personalId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  durationMin: { type: Number, default: 60 },
  notes: String,
  status: { type: String, enum: ['agendada', 'concluida', 'cancelada'], default: 'agendada' },
}, opts);

module.exports = {
  User: mongoose.model('User', userSchema),
  Plan: mongoose.model('Plan', planSchema),
  Payment: mongoose.model('Payment', paymentSchema),
  Exercise: mongoose.model('Exercise', exerciseSchema),
  Workout: mongoose.model('Workout', workoutSchema),
  WorkoutLog: mongoose.model('WorkoutLog', workoutLogSchema),
  Measurement: mongoose.model('Measurement', measurementSchema),
  Session: mongoose.model('Session', sessionSchema),
};
