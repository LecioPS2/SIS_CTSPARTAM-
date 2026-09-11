const router = require('express').Router();
const { Payment: DbPayment, User } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');

// Get access token from env, or a fallback empty string so it doesn't crash on boot without it
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'APP_USR-test' });

// POST /api/mercadopago/pix/:id
router.post('/pix/:id', requireAuth, async (req, res) => {
  try {
    const dbPayment = await DbPayment.findById(req.params.id).populate('studentId');
    if (!dbPayment) return res.status(404).json({ error: 'Pagamento não encontrado' });
    if (dbPayment.status === 'pago') return res.status(400).json({ error: 'Pagamento já foi realizado' });

    const student = dbPayment.studentId || { name: 'Aluno', email: 'aluno@ctspartan.com' };

    const paymentApi = new Payment(client);
    const body = {
      transaction_amount: dbPayment.amount,
      description: dbPayment.description || 'Mensalidade CT Spartan',
      payment_method_id: 'pix',
      external_reference: dbPayment._id.toString(),
      payer: {
        email: student.email,
        first_name: student.name.split(' ')[0],
      }
    };

    const response = await paymentApi.create({ body });
    
    res.json({
      qr_code: response.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: response.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: response.point_of_interaction?.transaction_data?.ticket_url,
      payment_id: response.id
    });
  } catch (error) {
    console.error('Erro ao gerar PIX no Mercado Pago:', error);
    res.status(500).json({ error: 'Falha ao conectar com Mercado Pago. Verifique o Token.' });
  }
});

// POST /api/mercadopago/checkout/:id
router.post('/checkout/:id', requireAuth, async (req, res) => {
  try {
    const dbPayment = await DbPayment.findById(req.params.id).populate('studentId');
    if (!dbPayment) return res.status(404).json({ error: 'Pagamento não encontrado' });
    if (dbPayment.status === 'pago') return res.status(400).json({ error: 'Pagamento já foi realizado' });

    const student = dbPayment.studentId || { name: 'Aluno', email: 'aluno@ctspartan.com' };

    const preferenceApi = new Preference(client);
    
    const frontendUrl = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',')[0] : 'http://localhost:3000';
    
    const body = {
      items: [
        {
          id: dbPayment._id.toString(),
          title: dbPayment.description || 'Mensalidade CT Spartan',
          quantity: 1,
          unit_price: dbPayment.amount,
          currency_id: 'BRL'
        }
      ],
      payer: {
        email: student.email,
        name: student.name.split(' ')[0],
      },
      external_reference: dbPayment._id.toString(),
      back_urls: {
        success: `${frontendUrl}/aluno/mensalidade`,
        failure: `${frontendUrl}/aluno/mensalidade`,
        pending: `${frontendUrl}/aluno/mensalidade`
      },
      auto_return: 'approved'
    };

    const response = await preferenceApi.create({ body });
    
    res.json({
      init_point: response.init_point, 
      sandbox_init_point: response.sandbox_init_point
    });
  } catch (error) {
    console.error('Erro ao gerar Checkout no Mercado Pago:', error);
    res.status(500).json({ error: 'Falha ao conectar com Mercado Pago. Verifique o Token.' });
  }
});

// POST /api/mercadopago/webhook
router.post('/webhook', async (req, res) => {
  try {
    const action = req.body.action || req.query.topic;
    const paymentId = req.body.data?.id || req.query.id;

    // Responde rapidamente ao MP
    res.status(200).send('OK');

    if ((action === 'payment.created' || action === 'payment.updated' || action === 'payment') && paymentId) {
      const paymentApi = new Payment(client);
      const mpPayment = await paymentApi.get({ id: paymentId });
      
      if (mpPayment.status === 'approved' && mpPayment.external_reference) {
        const localPayment = await DbPayment.findById(mpPayment.external_reference);
        if (localPayment && localPayment.status !== 'pago') {
          localPayment.status = 'pago';
          localPayment.paidAt = new Date().toISOString().slice(0, 10);
          localPayment.method = mpPayment.payment_type_id === 'account_money' || mpPayment.payment_type_id === 'bank_transfer' ? 'pix' : 'cartao';
          await localPayment.save();
          console.log(`Pagamento ${localPayment._id} confirmado via Mercado Pago Webhook!`);
        }
      }
    }
  } catch (error) {
    console.error('Erro no webhook do Mercado Pago:', error);
    if (!res.headersSent) {
      res.status(500).send('Error');
    }
  }
});

module.exports = router;
