const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YTkwN2MxNDg3M2IxMmJmOTA0OWMxZjYiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODgxOTgyMDMsImV4cCI6MTc4ODgwMzAwM30.W9lB0fkrhaljheZOh55oWyRjIhIHqHl9jExuJQOTY80';
const apiUrl = 'https://lavenderblush-koala-353033.hostingersite.com/api/exercises';

const defaultExercises = [
  { name: 'Supino reto', muscleGroup: 'Peito' }, { name: 'Supino inclinado', muscleGroup: 'Peito' }, { name: 'Crucifixo', muscleGroup: 'Peito' }, { name: 'Crossover', muscleGroup: 'Peito' },
  { name: 'Puxada alta', muscleGroup: 'Costas' }, { name: 'Remada curvada', muscleGroup: 'Costas' }, { name: 'Remada baixa', muscleGroup: 'Costas' }, { name: 'Barra fixa', muscleGroup: 'Costas' },
  { name: 'Rosca direta', muscleGroup: 'Bíceps' }, { name: 'Rosca alternada', muscleGroup: 'Bíceps' }, { name: 'Rosca martelo', muscleGroup: 'Bíceps' }, { name: 'Rosca na polia', muscleGroup: 'Bíceps' },
  { name: 'Tríceps testa', muscleGroup: 'Tríceps' }, { name: 'Tríceps pulley', muscleGroup: 'Tríceps' }, { name: 'Tríceps corda', muscleGroup: 'Tríceps' }, { name: 'Mergulho', muscleGroup: 'Tríceps' },
  { name: 'Desenvolvimento', muscleGroup: 'Ombros' }, { name: 'Elevação lateral', muscleGroup: 'Ombros' }, { name: 'Elevação frontal', muscleGroup: 'Ombros' }, { name: 'Crucifixo invertido', muscleGroup: 'Ombros' },
  { name: 'Abdominal supra', muscleGroup: 'Abdômen' }, { name: 'Abdominal infra', muscleGroup: 'Abdômen' }, { name: 'Abdominal oblíquo', muscleGroup: 'Abdômen' }, { name: 'Abdominal na polia', muscleGroup: 'Abdômen' }, { name: 'Prancha abdominal', muscleGroup: 'Abdômen' },
  { name: 'Agachamento', muscleGroup: 'Pernas' }, { name: 'Búlgaro', muscleGroup: 'Pernas' }, { name: 'Sumô', muscleGroup: 'Pernas' }, { name: 'Afundo', muscleGroup: 'Pernas' }, { name: 'Passada', muscleGroup: 'Pernas' },
  { name: 'Agachamento livre', muscleGroup: 'Pernas' }, { name: 'Agachamento no Smith', muscleGroup: 'Pernas' }, { name: 'Polia', muscleGroup: 'Pernas' }, { name: 'Panturrilha', muscleGroup: 'Pernas' },
  { name: 'Elevação', muscleGroup: 'Pernas' }, { name: 'Mesa flexora', muscleGroup: 'Pernas' }, { name: 'Flexora em pé', muscleGroup: 'Pernas' }, { name: 'Abdução', muscleGroup: 'Pernas' }, { name: 'Adução', muscleGroup: 'Pernas' }, { name: 'Cadeira extensora', muscleGroup: 'Pernas' }
];

async function seed() {
  console.log('Fetching existing...');
  const res = await fetch(apiUrl, { headers: { Authorization: 'Bearer ' + token } });
  const existing = await res.json();
  console.log('Found ' + existing.length + ' exercises.');
  
  for (const ex of defaultExercises) {
    const exists = existing.find(e => e.name.toLowerCase() === ex.name.toLowerCase());
    if (!exists) {
      console.log('Adding ' + ex.name + '...');
      await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(Object.assign({}, ex, { sets: 3, reps: 12, load: 0, timeSeconds: 0, notes: '' }))
      });
    } else {
      console.log('Skipping ' + ex.name + ' (already exists)');
    }
  }
  console.log('Done!');
}
seed();
