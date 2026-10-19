const cron = require('node-cron');
const whatsappService = require('./services/whatsapp');

async function executeDailyCheck(source = 'cron') {
  try {
    const now = new Date();
    // Executa apenas a partir das 08:00 da manhã (horário do servidor)
    if (source === 'startup_or_hourly' && now.getHours() < 8) return;

    const result = await whatsappService.runDailyAutomations({ dryRun: false, force: false });
    if (!result.skipped) {
      console.log(`[CRON:${source}] Rotina diária concluída (${result.date}):`, {
        dueSoonProcessed: result.dueSoonProcessed,
        overdueProcessed: result.overdueProcessed,
        birthdayProcessed: result.birthdayProcessed,
      });
    }
  } catch (err) {
    console.error(`[CRON:${source}] Erro na rotina diária de automações:`, err.message);
  }
}

// Disparar às 08:00 todos os dias
cron.schedule('0 8 * * *', () => {
  executeDailyCheck('daily_8am');
});

// Verificação horária persistente compatível com Hostinger:
// Caso o processo Node tenha reiniciado às 08:00, garante que a verificação diária ocorra sem duplicar envios (controlado por lastDailyRunDate e idempotencyKey no MongoDB).
cron.schedule('15 * * * *', () => {
  executeDailyCheck('startup_or_hourly');
});
