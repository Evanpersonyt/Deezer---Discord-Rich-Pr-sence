// pour start type npm start on your cmd at the app folder
import net from 'net';
import express from 'express';
import { Buffer } from 'buffer';

const clientId = '1377263638322089994'; // Remplace par ton vrai client ID
const PORT = 3000;

const slashFrames = ["\\", "|", "/", "—"];
let slashIndex = 0;
let lastTrack = '';
let socket;
let connected = false;

const app = express();
app.use(express.json());

// CORS basique pour ton extension (Arc/Chrome)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'chrome-extension://jjhlpbaecoeanmdoioopmmpdbmbiogcm');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Connexion au socket Discord IPC
function connectToDiscordIPC() {
  const ipcPath = process.platform === 'win32'
    ? '\\\\.\\pipe\\discord-ipc-0'
    : '/tmp/discord-ipc-0';

  socket = net.createConnection(ipcPath, () => {
    console.log('✅ Connecté à Discord IPC');
    // handshake
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
    console.log('🔌 IPC fermé, je reconnecte...');
    connected = false;
    setTimeout(connectToDiscordIPC, 3000);
  });
}

// Envoi un payload sur le socket Discord IPC
function sendIPC(op, payload) {
  const body = Buffer.from(JSON.stringify(payload));
  const header = Buffer.alloc(8);
  header.writeInt32LE(op, 0);
  header.writeInt32LE(body.length, 4);
  socket.write(Buffer.concat([header, body]));
}

// Génère la clé d’asset Discord à partir du track
function generateDiscordAssetKey(track) {
  return track
    .toLowerCase()
    // Remplace les espaces et virgules par underscore
    .replace(/[\s,®]+/g, '_')
    // Garde les lettres, chiffres, underscores et tirets
    .replace(/[^a-z0-9_-]/g, '')
    // Supprime underscore ou tiret au début ou à la fin
    .replace(/^[_-]+|[_-]+$/g, '');
}


// Met à jour la Rich Presence
function updatePresence(artist, title, durationText) {
  const track = `${artist} - ${title}`;
  if (track === lastTrack) {
    process.stdout.write("\r" + slashFrames[slashIndex % slashFrames.length] + " En attente de nouveau morceau...");
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
        state: `Durée : ${durationText}`,  // 👈 affiché sous le titre
        assets: {
          large_image: imageKey,
          large_text: `Pochette de ${title}`
        },
        timestamps: {
          start: Math.floor(Date.now() / 1000)
        }
      }
    },
    nonce: `${Date.now()}`
  };

  if (connected) {
    console.log("Payload envoyé à Discord:");
    console.log(JSON.stringify(payload, null, 2));
    sendIPC(1, payload);
    console.log("✅ Discord Rich Presence mis à jour :", track, 'avec clé image:', imageKey);
  }
}


// Route HTTP pour recevoir l’artiste et le titre depuis l’extension
app.post('/update', (req, res) => {
  const { artist, title, durationText } = req.body;
  if (!artist || !title) {
    return res.status(400).send('Artiste ou titre manquant');
  }
  updatePresence(artist, title, durationText);
  res.sendStatus(200);
});




// Démarrage serveur et connexion IPC
app.listen(PORT, () => {
  console.log(`🚀 Serveur en écoute sur http://localhost:${PORT}`);
  connectToDiscordIPC();
});
