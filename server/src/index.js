const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const socketHandlers = require('./socketHandlers');

const PORT = process.env.PORT || 3003;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('/health', (req, res) => res.json({ ok: true }));
app.get(/^(?!\/socket\.io).*/, (req, res, next) => {
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

socketHandlers.attach(io);

server.listen(PORT, () => {
  console.log(`Halli Galli server listening on port ${PORT}`);
});
