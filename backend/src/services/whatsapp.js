const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const pino = require('pino');

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.qrCodeDataUrl = null;
    this.status = 'DISCONNECTED'; // DISCONNECTED, INITIALIZING, QR_READY, CONNECTED
  }

  async initialize() {
    if (this.status === 'INITIALIZING' || this.status === 'CONNECTED') return;
    this.status = 'INITIALIZING';
    this.qrCodeDataUrl = null;

    try {
      const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
      
      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['CT Spartan', 'Chrome', '1.0.0']
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.status = 'QR_READY';
          this.qrCodeDataUrl = await qrcode.toDataURL(qr);
          console.log('WhatsApp QR Code pronto para ser lido.');
        }

        if (connection === 'close') {
          const statusCode = lastDisconnect.error?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== DisconnectReason.connectionClosed;
          console.log('WhatsApp connection closed due to', lastDisconnect.error, ', reconnecting:', shouldReconnect);
          
          if (shouldReconnect) {
            this.status = 'INITIALIZING';
            setTimeout(() => this.initialize(), 2000); // add small delay
          } else {
            this.status = 'DISCONNECTED';
            this.sock = null;
            this.qrCodeDataUrl = null;
            const fs = require('fs');
            if (fs.existsSync('baileys_auth_info')) {
              fs.rmSync('baileys_auth_info', { recursive: true, force: true });
            }
          }
        } else if (connection === 'open') {
          this.status = 'CONNECTED';
          this.qrCodeDataUrl = null;
          console.log('WhatsApp Cliente Conectado com Baileys!');
        }
      });

    } catch (err) {
      console.error('Erro ao inicializar baileys:', err);
      this.status = 'DISCONNECTED';
    }
  }

  getStatus() {
    return {
      status: this.status,
      qr: this.qrCodeDataUrl
    };
  }

  async logout() {
    if (this.sock) {
      this.sock.logout().catch(() => {});
    }
    this.status = 'DISCONNECTED';
    this.sock = null;
    this.qrCodeDataUrl = null;
    const fs = require('fs');
    if (fs.existsSync('baileys_auth_info')) {
      fs.rmSync('baileys_auth_info', { recursive: true, force: true });
    }
  }

  async sendMessage(number, message) {
    if (this.status !== 'CONNECTED' || !this.sock) {
      throw new Error('WhatsApp não está conectado.');
    }
    const cleanNumber = number.replace(/\D/g, '');
    let formattedNumber = cleanNumber;
    
    // Baileys requires country code. In Brazil, standard is 55.
    if (cleanNumber.length === 10 || cleanNumber.length === 11) {
      formattedNumber = `55${cleanNumber}`;
    }
    
    const jid = `${formattedNumber}@s.whatsapp.net`;
    await this.sock.sendMessage(jid, { text: message });
  }
}

module.exports = new WhatsAppService();
