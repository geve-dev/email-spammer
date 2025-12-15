const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Configuração do Express para aceitar dados do formulário
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Servir arquivos estáticos da pasta 'public'
// Seus arquivos HTML, CSS e JS devem estar dentro de uma pasta chamada 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Permite que seu frontend se conecte (CORS) - **IMPORTANTE PARA TESTE**
app.use((req, res, next) => {
    // Permite requisições do seu domínio na Vercel e de previews
    const allowedOrigins = ['https://portfolio-geve-dev.vercel.app', process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'POST, GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Configuração do Transportador SMTP (Mantenha suas credenciais aqui)
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Variável de ambiente para o email
        pass: process.env.EMAIL_PASS  // Variável de ambiente para a senha
    }
});

// Rota GET para a página inicial, servindo o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Rota POST para receber os dados do formulário
// Rota POST para receber os dados do formulário
app.post('/send-email', async (req, res) => {
    // Os dados do formulário estão em req.body
    const { recipients, senderName, senderEmail, showSenderEmail, subject, message } = req.body;

    // 1. Validar e-mails (Obrigatório)
    if (!recipients || !message) {
        return res.status(400).send('Destinatários e Mensagem são obrigatórios.');
    }

    // Processar lista de destinatários
    const recipientList = recipients.split(',').map(email => email.trim()).filter(email => email);

    if (recipientList.length === 0) {
        return res.status(400).send('Nenhum destinatário válido encontrado.');
    }

    let successCount = 0;
    let failCount = 0;

    // 2. Iterar e enviar para cada um
    for (const recipient of recipientList) {
        // Montar as opções do e-mail
        let mailOptions = {
            from: `"${senderName || 'Remetente'}" <${process.env.EMAIL_USER}>`, // O 'from' deve ser o email autenticado do SMTP
            to: recipient,
            replyTo: showSenderEmail ? senderEmail : undefined, // Se marcado, responde para o email do remetente
            subject: subject || `Nova mensagem de: ${senderName || 'Desconhecido'}`,
            text: message // Mensagem simples
            // html: `<p>${message}</p>` // Se quiser suportar HTML no futuro
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`✅ Email enviado para: ${recipient}`);
            successCount++;
        } catch (error) {
            console.error(`❌ Erro ao enviar para ${recipient}:`, error.message);
            failCount++;
        }
    }

    res.status(200).json({
        message: `Envio finalizado. Sucessos: ${successCount}, Falhas: ${failCount}`,
        stats: { success: successCount, fail: failCount }
    });
});

// Inicia o servidor localmente (não é usado pela Vercel, mas bom para testes)
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

// Exporta o app para a Vercel
module.exports = app;