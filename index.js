import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import 'dotenv/config';

const app = express();
app.use(bodyParser.json());

const userSessions = {}; // Guarda el estado por número

app.post('/webhook', async (req, res) => {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from; // Número del usuario
    const text = message.text?.body;

    if (!userSessions[from]) userSessions[from] = { step: 0 };

    const session = userSessions[from];

    let reply;

    switch (session.step) {
        case 0:
            reply = 'Hola, somos del Grupo Polo. ¿En qué podemos ayudarte?';
            session.step = 1;
            break;
        case 1:
            session.servicio = text;
            reply = '¿Cuál es tu nombre';
            session.step = 2;
            break;
        case 2:
            session.nombre = text;
            reply = '¿Cuál es tu DNI?';
            session.step = 3;
            break;
        case 3:
            session.dni = text;
            reply = '¿Cuál es tu correo electrónico?';
            session.step = 4;
            break;
        case 4:
            session.telefono = text;
            reply = ` Gracias, ${session.nombre}. Un agente se comunicará contigo pronto.`;
            session.step = 5;
            console.log('📝 Nuevo registro:', session);
            break;
        default:
            reply = 'Gracias. Ya estamos procesando tu información.';
    }

    await sendMessage(from, reply);
    res.sendStatus(200);
});

const sendMessage = async (to, message) => {
    const url = `https://graph.facebook.com/v17.0/${process.env.WA_PHONE_ID}/messages`;

    await axios.post(url, {
        messaging_product: 'whatsapp',
        to,
        text: { body: message }
    }, {
        headers: {
            Authorization: `Bearer ${process.env.WA_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });
};

app.get('/', (req, res) => res.send('Bot listo para recibir mensajes'));

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Forbidden');
    }
    console.log('📥 LLEGÓ AL WEBHOOK:', JSON.stringify(req.body, null, 2));

});




app.listen(3000, () => console.log('http://localhost:3000'));
