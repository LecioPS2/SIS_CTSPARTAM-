require('dotenv').config();
const mongoose = require('mongoose');
const { Exercise } = require('./src/models');

const superioress = [
  { name: 'Supino Reto com Barra', muscleGroup: 'Peito' },
  { name: 'Supino Inclinado com Halteres', muscleGroup: 'Peito' },
  { name: 'Crucifixo Reto', muscleGroup: 'Peito' },
  { name: 'Crossover (Polia Alta)', muscleGroup: 'Peito' },
  { name: 'Voador (Peck Deck)', muscleGroup: 'Peito' },
  { name: 'Puxada Frontal (Pulley)', muscleGroup: 'Costas' },
  { name: 'Remada Curvada com Barra', muscleGroup: 'Costas' },
  { name: 'Remada Sentada (Triângulo)', muscleGroup: 'Costas' },
  { name: 'Serrote (Remada Unilateral)', muscleGroup: 'Costas' },
  { name: 'Barra Fixa', muscleGroup: 'Costas' },
  { name: 'Desenvolvimento com Halteres', muscleGroup: 'Ombros' },
  { name: 'Elevação Lateral', muscleGroup: 'Ombros' },
  { name: 'Elevação Frontal', muscleGroup: 'Ombros' },
  { name: 'Crucifixo Invertido', muscleGroup: 'Ombros' },
  { name: 'Encolhimento com Halteres', muscleGroup: 'Ombros' },
  { name: 'Rosca Direta com Barra W', muscleGroup: 'Bíceps' },
  { name: 'Rosca Alternada', muscleGroup: 'Bíceps' },
  { name: 'Rosca Scott', muscleGroup: 'Bíceps' },
  { name: 'Rosca Martelo', muscleGroup: 'Bíceps' },
  { name: 'Tríceps Pulley (Corda)', muscleGroup: 'Tríceps' },
  { name: 'Tríceps Testa', muscleGroup: 'Tríceps' },
  { name: 'Tríceps Francês Unilateral', muscleGroup: 'Tríceps' },
  { name: 'Mergulho no Banco', muscleGroup: 'Tríceps' }
];

const inferiores = [
  { name: 'Agachamento Livre', muscleGroup: 'Pernas' },
  { name: 'Leg Press 45º', muscleGroup: 'Pernas' },
  { name: 'Cadeira Extensora', muscleGroup: 'Pernas' },
  { name: 'Cadeira Flexora', muscleGroup: 'Pernas' },
  { name: 'Mesa Flexora', muscleGroup: 'Pernas' },
  { name: 'Passada (Avanço) com Halteres', muscleGroup: 'Pernas' },
  { name: 'Panturrilha em Pé (Máquina)', muscleGroup: 'Pernas' },
  { name: 'Panturrilha Sentado (Burrinho)', muscleGroup: 'Pernas' },
  { name: 'Elevação Pélvica', muscleGroup: 'Glúteos' },
  { name: 'Glúteo na Polia', muscleGroup: 'Glúteos' },
  { name: 'Cadeira Abdutora', muscleGroup: 'Glúteos' },
  { name: 'Cadeira Adutora', muscleGroup: 'Pernas' }
];

const core = [
  { name: 'Abdominal Supra (Tradicional)', muscleGroup: 'Abdômen' },
  { name: 'Abdominal Infra (Elevação de Pernas)', muscleGroup: 'Abdômen' },
  { name: 'Prancha Isométrica', muscleGroup: 'Abdômen' },
  { name: 'Abdominal Oblíquo (Bicicleta)', muscleGroup: 'Abdômen' },
  { name: 'Esteira', muscleGroup: 'Cardio' },
  { name: 'Bicicleta Ergométrica', muscleGroup: 'Cardio' },
  { name: 'Elíptico', muscleGroup: 'Cardio' },
  { name: 'Burpee', muscleGroup: 'Corpo inteiro' }
];

const allExercises = [...superioress, ...inferiores, ...core].map(ex => ({
  ...ex,
  sets: 3,
  reps: 12,
  load: 0,
  timeSeconds: 0,
  active: true
}));

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    // Check if we already have exercises to avoid duplicates
    const count = await Exercise.countDocuments();
    if (count > 20) {
      console.log(`Already have ${count} exercises. Deleting all default ones...`);
      // For now, I'll delete all exercises, wait, maybe they have user-created ones. 
      // I'll just check if these names exist and insert if not.
    }

    let inserted = 0;
    for (const ex of allExercises) {
      const exists = await Exercise.findOne({ name: ex.name });
      if (!exists) {
        await Exercise.create(ex);
        inserted++;
      }
    }

    console.log(`Successfully seeded ${inserted} exercises.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();
