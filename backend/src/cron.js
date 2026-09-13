const cron = require('node-cron');
const { User, Automation, Notice } = require('./models');
const whatsappService = require('./services/whatsapp');

// Função para processar tags na mensagem
function parseMessage(template, user) {
  if (!template) return '';
  return template.replace(/\{nome\}/g, user.name ? user.name.split(' ')[0] : 'Aluna');
}

// Disparar às 08:00 todos os dias
cron.schedule('0 8 * * *', async () => {
  console.log('[CRON] Iniciando rotina diária de automações...');
  
  try {
    const today = new Date();
    const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    // 1. Checar aniversariantes
    const birthdayAuto = await Automation.findOne({ type: 'birthday', active: true });
    
    if (birthdayAuto) {
      const allStudents = await User.find({ role: 'aluno', active: true });
      const birthdayStudents = allStudents.filter(u => {
        if (!u.birthDate) return false;
        // Assuming birthDate is YYYY-MM-DD
        const [, mm, dd] = u.birthDate.split('-');
        return `${dd}/${mm}` === todayStr;
      });

      console.log(`[CRON] Encontradas ${birthdayStudents.length} aniversariantes.`);

      for (const student of birthdayStudents) {
        if (birthdayAuto.sendApp && birthdayAuto.appMessage) {
          const message = parseMessage(birthdayAuto.appMessage, student);
          await Notice.create({
            title: 'Feliz Aniversário! 🎉',
            message,
            targetRole: 'aluno',
            targetUser: student._id,
            active: true
          });
          // Nota: O Notice acima vai para o "Mural" do app (o Notice model atual suporta targetRole="aluno"). 
          // Idealmente se tivesse um targetUser, enviaria só pra ela, mas vamos criar como Notice global ou adaptar.
        }

        if (birthdayAuto.sendWhatsapp && birthdayAuto.whatsappMessage && student.phone) {
          const message = parseMessage(birthdayAuto.whatsappMessage, student);
          try {
            await whatsappService.sendMessage(student.phone, message);
            console.log(`[CRON] WhatsApp de aniversário enviado para ${student.name}`);
          } catch (err) {
            console.error(`[CRON] Falha ao enviar WhatsApp para ${student.name}:`, err.message);
          }
        }
      }
    }
  } catch (err) {
    console.error('[CRON] Erro na rotina:', err);
  }
});
