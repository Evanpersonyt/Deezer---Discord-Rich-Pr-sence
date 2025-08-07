import express from 'express';
import cors from 'cors';
import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;


app.use(cors({
  origin: 'chrome-extension://jjhlpbaecoeanmdoioopmmpdbmbiogcm' // ← ton vrai ID
}));

app.use(express.json());


async function downloadAndResize(url, outputFile) {
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const response = await axios.get(url, { responseType: 'arraybuffer' });

  await sharp(response.data)
    .resize(512, 512)
    .toFile(outputFile);

  console.log(`✅ Image redimensionnée sauvegardée sous : ${outputFile}`);
}


app.post('/update', async (req, res) => {

  try {
    const { artist, title, cover } = req.body;
    
    if (!title || !artist || !cover) {
      return res.status(400).send('track et cover sont requis');
    }
    const track = `${artist} - ${title}`;

    const safeName = track.replace(/[\/\\?%*:|"<>]/g, '-').toLowerCase();
    const outputFile = path.join('output', `${safeName}.png`);

    await downloadAndResize(cover, outputFile);

    res.status(200).send('Image téléchargée et redimensionnée');
  } catch (err) {
    console.error('❌ Erreur dans /update:', err);
    res.status(500).send('Erreur serveur');
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});

