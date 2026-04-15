const net = require("net");
const http = require("http");
const path = require("path");
const express = require("express");
const { Server } = require("socket.io");

const TCP_PORT = 9000;
const WEB_PORT = 3000;

// ── in-memory log ──────────────────────────────────────────────────────────
const MAX_LOGS = 500;
const logs = [];           // { id, timestamp, clientIp, clientPort, raw, lines }
let logIdCounter = 0;

function addLog(entry) {
  entry.id = ++logIdCounter;
  logs.unshift(entry);
  if (logs.length > MAX_LOGS) logs.pop();
  return entry;
}

// ── TCP server ─────────────────────────────────────────────────────────────
const tcpServer = net.createServer((socket) => {
  const clientIp   = socket.remoteAddress;
  const clientPort = socket.remotePort;

  console.log(`[TCP] New connection: ${clientIp}:${clientPort}`);

  // Emit connection event to dashboard
  io.emit("tcp_connect", { clientIp, clientPort, timestamp: new Date().toISOString() });

  let buffer = "";

  socket.on("data", (chunk) => {
    buffer += chunk.toString();

    // Process line-by-line (AT commands are newline-delimited)
    const parts = buffer.split(/\r?\n/);
    buffer = parts.pop(); // keep incomplete last line

    for (const line of parts) {
      if (!line.trim()) continue;

      const entry = addLog({
        timestamp:  new Date().toISOString(),
        clientIp,
        clientPort,
        raw:        line,
        lines:      [line],
      });

      console.log(`[TCP] ${clientIp}:${clientPort} → ${line}`);
      io.emit("tcp_message", entry);
    }
  });

  socket.on("end", () => {
    console.log(`[TCP] Disconnected: ${clientIp}:${clientPort}`);
    io.emit("tcp_disconnect", { clientIp, clientPort, timestamp: new Date().toISOString() });
  });

  socket.on("error", (err) => {
    console.error(`[TCP] Socket error (${clientIp}:${clientPort}):`, err.message);
  });
});

tcpServer.listen(TCP_PORT, () => {
  console.log(`[TCP] Listening on port ${TCP_PORT}`);
});

// ── Express + Socket.io ───────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "dashboard.html")));

// REST: fetch existing logs (pagination)
app.get("/api/logs", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, MAX_LOGS);
  res.json({ total: logs.length, logs: logs.slice(0, limit) });
});

// REST: clear logs
app.delete("/api/logs", (req, res) => {
  logs.length = 0;
  io.emit("logs_cleared");
  res.json({ ok: true });
});

io.on("connection", (wsClient) => {
  // Send current log snapshot to new dashboard client
  wsClient.emit("init", { logs: logs.slice(0, 100) });
});

httpServer.listen(WEB_PORT, () => {
  console.log(`[WEB] Dashboard at http://localhost:${WEB_PORT}`);
});
