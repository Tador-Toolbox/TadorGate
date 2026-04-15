# TCP Monitor Server

A TCP server that logs all incoming messages and displays them in a real-time web dashboard.

## Requirements

- Node.js 16+

## Installation

```bash
npm install
```

## Running

```bash
node server.js
```

Or:

```bash
npm start
```

## Ports

| Port | Purpose |
|------|---------|
| **9000** | TCP server — your devices connect here |
| **3000** | Web dashboard — open in browser |

## Web Dashboard

Open your browser at:

```
http://localhost:3000
```

Or from another machine on the network:

```
http://<server-ip>:3000
```

## Connecting a Device

Your device should connect to:

```
AT+CIPOPEN=0,"TCP","<server-ip>",9000
```

Expected response from the module:

```
+CIPOPEN: 0,4
```

## Dashboard Features

- **Real-time message log** — every TCP message appears instantly
- **Connection tracking** — shows which IPs are connected / disconnected
- **Message filter** — type to filter by content or IP
- **Auto-scroll** — toggleable, keeps latest message visible
- **Clear logs** — wipe the log from the dashboard

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/logs` | Fetch last 100 log entries as JSON |
| DELETE | `/api/logs` | Clear all logs |

## Notes

- The server buffers data and splits on newlines (`\r\n` or `\n`)
- Up to 500 log entries are kept in memory
- AT command syntax is highlighted automatically in the dashboard
