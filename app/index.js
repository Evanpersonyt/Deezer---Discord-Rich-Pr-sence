
import net from 'net';
import express from 'express';
import { Buffer } from 'buffer';

const clientId = '--Client ID--'; // replace by your real client ID <<<<<<------
const PORT = 3000;

const slashFrames = ["\\", "|", "/", "—"];
let slashIndex = 0;
let lastTrack = '';
let socket;
let connected = false;

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'chrome-extension://HERE'); //replace here by your ID extension <<<<------
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

function connectToDiscordIPC() {
  const ipcPath = process.platform === 'win32'
    ? '\\\\.\\pipe\\discord-ipc-0'
    : '/tmp/discord-ipc-0';

  socket = net.createConnection(ipcPath, () => {
    console.log('✅ Connected to Discord IPC');
    sendIPC(0, { v: 1, client_id: clientId });
    connected = true;
  });

  socket.on('data', chunk => {
    const op = chunk.readInt32LE(0);
    const len = chunk.readInt32LE(4);
    const data = JSON.parse(chunk.slice(8, 8 + len).toString());
    console.log("📥 Discord IPC:", op, data);
  });

  socket.on('error', err => {
    console.error('❌ IPC Error:', err.message);
    connected = false;
  });

  socket.on('close', () => {
    console.log('🔌 IPC closed, I am reconnecting... PLEASE OPEN YOUR DISCORD CLIENT !');
    connected = false;
    setTimeout(connectToDiscordIPC, 3000);
  });
}

function sendIPC(op, payload) {
  const body = Buffer.from(JSON.stringify(payload));
  const header = Buffer.alloc(8);
  header.writeInt32LE(op, 0);
  header.writeInt32LE(body.length, 4);
  socket.write(Buffer.concat([header, body]));
}

function generateDiscordAssetKey(track) {
  return track
    .toLowerCase()
    .replace(/[\s,®]+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/^[_-]+|[_-]+$/g, '');
}


function updatePresence(artist, title, durationText) {
  const track = `${artist} - ${title}`;
  if (track === lastTrack) {
    process.stdout.write("\r" + slashFrames[slashIndex % slashFrames.length] + " waiting for a new song...");
    slashIndex++;
    return;
  }

  lastTrack = track;
  const imageKey = generateDiscordAssetKey(track);

  const payload = {
    cmd: 'SET_ACTIVITY',
    args: {
      pid: process.pid,
      activity: {
        details: `🎶 ${track}`,
        state: `Durée : ${durationText}`,  
        assets: {
          large_image: imageKey,
          large_text: `Cover of ${title}`
        },
        timestamps: {
          start: Math.floor(Date.now() / 1000)
        }
      }
    },
    nonce: `${Date.now()}`
  };

  if (connected) {
    console.log("Payload sended to Discord:");
    console.log(JSON.stringify(payload, null, 2));
    sendIPC(1, payload);
    console.log("✅ Discord Rich Presence has been updated :", track, 'with the picturekey:', imageKey);
  }
}



app.post('/update', (req, res) => {
  const { artist, title, durationText } = req.body;
  if (!artist || !title) {
    return res.status(400).send('Artiste ou titre manquant');
  }
  updatePresence(artist, title, durationText);
  res.sendStatus(200);
});





app.listen(PORT, () => {
  console.log(`🚀 Server in listening on http://localhost:${PORT}`);
  connectToDiscordIPC();
});

