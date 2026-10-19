const mongoose = require('mongoose');
const { Schema } = mongoose;

const opts = { timestamps: true, toJSON: { virtuals: true, transform: (doc, ret) => { if (ret._id) { ret.id = ret._id.toString(); delete ret._id; } else if (doc && doc._id) { ret.id = doc._id.toString(); } else if (ret.id) { ret.id = ret.id.toString(); } delete ret.__v; delete ret.passwordHash; return ret; } } };

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'personal', 'aluno', 'assessor'], required: true },
  phone: String,
  personalId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  planId: { type: Schema.Types.ObjectId, ref: 'Plan', default: null },
  active: { type: Boolean, default: true },
  birthDate: String,
  avatarUrl: String,
  goal: String,
  healthConditions: String,
  medications: String,
  injuries: String,
  experienceLevel: String,
  trainingFrequency: String,
  anamnesisNotes: String,
  timeSlot: String, //
  paymentDueDate: String,
  planDuration: String,
  whatsappConsent: { type: Boolean, default: true },
  whatsappMarketingConsent: { type: Boolean, default: true },
  whatsappOptOutAt: { type: Date, default: null },
  whatsappLastInboundAt: { type: Date, default: null },
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
  studentId: { type: Schema.Types.ObjectId, ref: 'User' },
  planId: { type: Schema.Types.ObjectId, ref: 'Plan' },
  type: { type: String, enum: ['entrada', 'saida'], default: 'entrada' },
  description: { type: String },
  amount: { type: Number, required: true },
  dueDate: { type: String, required: true },
  paidAt: { type: String, default: null },
  status: { type: String, enum: ['pago', 'pendente', 'atrasado'], default: 'pendente' },
  method: String,
  reference: String,
}, opts);

const noticeSchema = new Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  targetRole: { type: String, enum: ['todos', 'aluno', 'personal'], default: 'todos' },
  targetUser: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }, // not required if created by system
  active: { type: Boolean, default: true }
}, opts);

const exerciseSchema = new Schema({
  name: { type: String, required: true },
  muscleGroup: { type: String, required: true },
  sets: { type: Number, default: 3 },
  reps: { type: Number, default: 12 },
  load: { type: Number, default: 0 },
  timeSeconds: { type: Number, default: 0 },
  notes: String,
  imageUrl: String,
  videoUrl: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, opts);

const workoutSchema = new Schema({
  name: { type: String, required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  personalId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  days: [{ type: Number }],
  exercises: [{
    day: Number, // Dia da semana específico para este exercício (0 a 6)
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
  bodyFat: Number,
  muscleMass: Number,
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

const checkInSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  method: { type: String, enum: ['qrcode', 'manual'], default: 'qrcode' },
}, opts);
checkInSchema.index({ studentId: 1, date: 1 }, { unique: true });

const dietPlanSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  goal: String,
  notes: String,
  meals: [{
    name: { type: String }, // e.g. Café da manhã
    time: { type: String }, // e.g. 08:00
    items: [{
      food: String,
      quantity: String
    }]
  }]
}, opts);

const automationSchema = new Schema({
  type: { type: String, required: true, unique: true }, // 'payment_due_soon', 'payment_overdue', 'payment_confirmed', 'welcome_student', 'birthday', 'direct_message'
  name: { type: String, default: '' },
  description: { type: String, default: '' },
  active: { type: Boolean, default: false },
  sendApp: { type: Boolean, default: true },
  sendWhatsapp: { type: Boolean, default: false },
  appMessage: { type: String, default: '' },
  whatsappMessage: { type: String, default: '' },
  templateName: { type: String, default: '' },
  templateLanguage: { type: String, default: 'pt_BR' },
  daysOffset: { type: Number, default: 3 },
  sendHour: { type: String, default: '09:00' },
}, opts);

const whatsAppConfigSchema = new Schema({
  singletonKey: { type: String, default: 'default', unique: true },
  enabled: { type: Boolean, default: false },
  status: { type: String, enum: ['pending_config', 'configured', 'error'], default: 'pending_config' },
  connectedPhoneNumber: { type: String, default: '' },
  verifiedName: { type: String, default: '' },
  qualityRating: { type: String, default: '' },
  apiVersion: { type: String, default: 'v21.0' },
  lastValidatedAt: { type: Date, default: null },
  lastWebhookAt: { type: Date, default: null },
  lastError: { type: String, default: '' },
  dailyLimit: { type: Number, default: 250 },
  lastDailyRunDate: { type: String, default: '' },
}, opts);

const whatsAppTemplateSchema = new Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  category: { type: String, enum: ['UTILITY', 'MARKETING', 'AUTHENTICATION'], default: 'UTILITY' },
  language: { type: String, default: 'pt_BR' },
  status: { type: String, enum: ['APPROVED', 'PENDING', 'REJECTED', 'DRAFT'], default: 'DRAFT' },
  metaTemplateId: { type: String, default: '' },
  bodyText: { type: String, required: true },
  variables: [{
    index: Number,
    key: String,
    label: String,
    example: String,
  }],
  automationType: { type: String, default: '' },
}, opts);

const whatsAppMessageLogSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  studentName: { type: String, default: '' },
  phone: { type: String, required: true },
  maskedPhone: { type: String, default: '' },
  direction: { type: String, enum: ['outbound', 'inbound'], default: 'outbound' },
  automationType: { type: String, default: 'manual' },
  messageType: { type: String, enum: ['template', 'text'], default: 'template' },
  templateName: { type: String, default: '' },
  templateCategory: { type: String, default: 'UTILITY' },
  contentPreview: { type: String, default: '' },
  parameters: [{ type: String }],
  paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', default: null },
  idempotencyKey: { type: String, index: true, default: null },
  wamid: { type: String, index: true, default: '' },
  status: { type: String, enum: ['queued', 'sent', 'delivered', 'read', 'failed', 'cancelled'], default: 'queued' },
  errorCode: { type: String, default: '' },
  errorMessage: { type: String, default: '' },
  attempts: { type: Number, default: 0 },
  scheduledFor: { type: Date, default: Date.now },
  sentAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  readAt: { type: Date, default: null },
  failedAt: { type: Date, default: null },
  estimatedCostBrl: { type: Number, default: 0 },
}, opts);

const whatsAppWebhookEventSchema = new Schema({
  eventKey: { type: String, required: true, unique: true },
  eventType: { type: String, required: true },
  wamid: { type: String, default: '' },
  phone: { type: String, default: '' },
  status: { type: String, default: '' },
  summary: { type: String, default: '' },
  processedAt: { type: Date, default: Date.now },
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
  CheckIn: mongoose.model('CheckIn', checkInSchema),
  Notice: mongoose.model('Notice', noticeSchema),
  DietPlan: mongoose.model('DietPlan', dietPlanSchema),
  Automation: mongoose.model('Automation', automationSchema),
  WhatsAppConfig: mongoose.model('WhatsAppConfig', whatsAppConfigSchema),
  WhatsAppTemplate: mongoose.model('WhatsAppTemplate', whatsAppTemplateSchema),
  WhatsAppMessageLog: mongoose.model('WhatsAppMessageLog', whatsAppMessageLogSchema),
  WhatsAppWebhookEvent: mongoose.model('WhatsAppWebhookEvent', whatsAppWebhookEventSchema),
};





