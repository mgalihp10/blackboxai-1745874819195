const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const axios = require('axios');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsappdb',
  password: 'yourpassword',
  port: 5432,
});

// Store clients and websocket connections in memory for active sessions
const clients = new Map();
const wss = new WebSocket.Server({ noServer: true });
const wsClients = new Map(); // Map sessionName to ws connection

// Helper function to save session data to DB
async function saveSession(sessionName, sessionData) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO sessions (session_name, session_data, status, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (session_name) DO UPDATE SET session_data = $2, status = $3, updated_at = NOW()`,
      [sessionName, sessionData, 'connected']
    );
  } finally {
    client.release();
  }
}

// Helper function to save message to DB
async function saveMessage(sessionName, chatId, message) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO messages (session_name, chat_id, message_id, sender, content, timestamp, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, to_timestamp($6), $7, NOW(), NOW())
       ON CONFLICT (message_id) DO NOTHING`,
      [
        sessionName,
        chatId,
        message.id._serialized,
        message.from,
        message.body,
        message.timestamp,
        message.isStatus ? 'status' : 'received',
      ]
    );
  } finally {
    client.release();
  }
}

// Initialize a WhatsApp client session
async function initClient(sessionName) {
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: sessionName }),
    puppeteer: { headless: true },
  });

  client.on('qr', (qr) => {
    console.log(`QR for session ${sessionName}:`, qr);
    // Emit QR code to frontend via websocket if connected
    const ws = wsClients.get(sessionName);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'qr', qr }));
    }
  });

  client.on('ready', () => {
    console.log(`Client ${sessionName} is ready!`);
    saveSession(sessionName, JSON.stringify(client.info));
    // Notify frontend session is ready
    const ws = wsClients.get(sessionName);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ready' }));
    }
  });

  client.on('message', async (message) => {
    console.log(`Message from ${message.from} in session ${sessionName}: ${message.body}`);
    await saveMessage(sessionName, message.from, message);
    // Here you can add hooks or forward message to API service if needed
  });

  await client.initialize();
  clients.set(sessionName, client);
}

// API to create a new session
app.post('/sessions', async (req, res) => {
  const { sessionName } = req.body;
  if (!sessionName) {
    return res.status(400).json({ error: 'sessionName is required' });
  }
  if (clients.has(sessionName)) {
    return res.status(400).json({ error: 'Session already exists' });
  }
  try {
    await initClient(sessionName);
    res.json({ message: `Session ${sessionName} created` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API to list active sessions
app.get('/sessions', (req, res) => {
  res.json({ sessions: Array.from(clients.keys()) });
});

// API to send message
app.post('/messages/send', async (req, res) => {
  const { sessionName, to, message } = req.body;
  if (!sessionName || !to || !message) {
    return res.status(400).json({ error: 'sessionName, to, and message are required' });
  }
  const client = clients.get(sessionName);
  if (!client) {
    return res.status(404).json({ error: 'Session not found' });
  }
  try {
    const sentMessage = await client.sendMessage(to, message);
    await saveMessage(sessionName, to, sentMessage);
    res.json({ message: 'Message sent', id: sentMessage.id._serialized });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API to reply to a message
app.post('/messages/reply', async (req, res) => {
  const { sessionName, chatId, messageId, message } = req.body;
  if (!sessionName || !chatId || !messageId || !message) {
    return res.status(400).json({ error: 'sessionName, chatId, messageId, and message are required' });
  }
  const client = clients.get(sessionName);
  if (!client) {
    return res.status(404).json({ error: 'Session not found' });
  }
  try {
    const chat = await client.getChatById(chatId);
    const repliedMessage = await chat.sendMessage(message, { quotedMessageId: messageId });
    await saveMessage(sessionName, chatId, repliedMessage);
    res.json({ message: 'Reply sent', id: repliedMessage.id._serialized });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API to get chats for a session
app.get('/chats/:sessionName', async (req, res) => {
  const { sessionName } = req.params;
  const client = clients.get(sessionName);
  if (!client) {
    return res.status(404).json({ error: 'Session not found' });
  }
  try {
    const chats = await client.getChats();
    res.json({ chats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API to get messages for a chat
app.get('/messages/:sessionName/:chatId', async (req, res) => {
  const { sessionName, chatId } = req.params;
  const client = clients.get(sessionName);
  if (!client) {
    return res.status(404).json({ error: 'Session not found' });
  }
  try {
    const chat = await client.getChatById(chatId);
    const messages = await chat.fetchMessages({ limit: 50 });
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upgrade HTTP server to handle WebSocket connections for QR code
const server = http.createServer(app);

server.on('upgrade', (request, socket, head) => {
  // Parse sessionName from query string
  const url = new URL(request.url, `http://${request.headers.host}`);
  const sessionName = url.searchParams.get('sessionName');
  if (!sessionName) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wsClients.set(sessionName, ws);
    ws.on('close', () => {
      wsClients.delete(sessionName);
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WhatsApp service listening on port ${PORT}`);
});
