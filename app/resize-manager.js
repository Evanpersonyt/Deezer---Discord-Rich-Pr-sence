import express from 'express';
import cors from 'cors';
import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;


app.use(cors({
  origin: 'chrome-extension://HERE' // ← Replace HERE by your Extension ID ! <<<<<<<-------
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

  console.log(`✅ Cover resized saved under : ${outputFile}`);
}


app.post('/update', async (req, res) => {

  try {
    const { artist, title, cover } = req.body;
    
    if (!title || !artist || !cover) {
      return res.status(400).send('track and cover are requied');
    }
    const track = `${artist} - ${title}`;

    const safeName = track.replace(/[\/\\?%*:|"<>]/g, '-').toLowerCase();
    const outputFile = path.join('output', `${safeName}.png`);

    await downloadAndResize(cover, outputFile);

    res.status(200).send('Cover Downloaded and resized successfully');
  } catch (err) {
    console.error('❌ Error in /update:', err);
    res.status(500).send('Error server');
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});


