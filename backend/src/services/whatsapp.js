const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.qrCodeDataUrl = null;
    this.status = 'DISCONNECTED'; // DISCONNECTED, INITIALIZING, QR_READY, CONNECTED
  }

  initialize() {
    if (this.status === 'INITIALIZING' || this.status === 'CONNECTED') return;
    this.status = 'INITIALIZING';

    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      }
    });

    this.client.on('qr', async (qr) => {
      this.status = 'QR_READY';
      this.qrCodeDataUrl = await qrcode.toDataURL(qr);
      console.log('WhatsApp QR Code pronto para ser lido.');
    });

    this.client.on('ready', () => {
      this.status = 'CONNECTED';
      this.qrCodeDataUrl = null;
      console.log('WhatsApp Cliente Conectado!');
    });

    this.client.on('auth_failure', msg => {
      console.error('WhatsApp falha na autenticação', msg);
      this.status = 'DISCONNECTED';
      this.qrCodeDataUrl = null;
    });

    this.client.on('disconnected', (reason) => {
      console.log('WhatsApp desconectado:', reason);
      this.status = 'DISCONNECTED';
      this.client = null;
      this.qrCodeDataUrl = null;
    });

    this.client.initialize().catch(err => {
      console.error('Erro ao inicializar whatsapp-web.js:', err);
      this.status = 'DISCONNECTED';
    });
  }

  getStatus() {
    return {
      status: this.status,
      qr: this.qrCodeDataUrl
    };
  }

  async logout() {
    if (this.client) {
      await this.client.logout().catch(e => console.error(e));
      await this.client.destroy().catch(e => console.error(e));
      this.client = null;
    }
    this.status = 'DISCONNECTED';
    this.qrCodeDataUrl = null;
  }

  async sendMessage(number, message) {
    if (this.status !== 'CONNECTED' || !this.client) {
      throw new Error('WhatsApp não está conectado.');
    }
    const cleanNumber = number.replace(/\D/g, '');
    let formattedNumber = cleanNumber;
    if (cleanNumber.length === 10 || cleanNumber.length === 11) {
      formattedNumber = `55${cleanNumber}`;
    }
    const chatId = `${formattedNumber}@c.us`;
    await this.client.sendMessage(chatId, message);
  }
}

module.exports = new WhatsAppService();
