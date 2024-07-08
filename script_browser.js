const bananaPath = "M 8,223 c 0,0 143,3 185,-181 c 2,-11 -1,-20 1,-33 h 16 c 0,0 -3,17 1,30 c 21,68 -4,242 -204,196 L 8,223 z M 8,230 c 0,0 188,40 196,-160"; // con curve
const heartPath = "M140 20C73 20 20 74 20 140c0 135 136 170 228 303 88-132 229-173 229-303 0-66-54-120-120-120-48 0-90 28-109 69-19-41-60-69-108-69z"; // con curve
const zigzagPath = "M2,2 L8,2 L2,5 L8,5 L2,8 L8,8"; // senza curve

const puppeteer = require('puppeteer');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');

const generateFrames = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Impostare il contenuto HTML con l'SVG e l'animazione CSS
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          @keyframes draw {
            to {
              stroke-dashoffset: 0;
            }
          }
          #animatedPath {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            animation: draw 3s linear forwards;
          }
        </style>
      </head>
      <body>
        <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
          <path id="animatedPath" d="${zigzagPath}" stroke="black" fill="transparent" stroke-width="2"/>
        </svg>
      </body>
    </html>
  `);

  const frames = 60; // Numero di frame da catturare
  const fps = 30; // Frame per secondo
  const outputDir = path.resolve(__dirname, 'frames');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  for (let i = 0; i < frames; i++) {
    await page.screenshot({ path: path.join(outputDir, `frame_${String(i).padStart(3, '0')}.png`) });
    await page.evaluate((i, fps) => {
      document.documentElement.style.setProperty('--animation-progress', (i / fps) * 100 + '%');
    }, i, fps);
    // Utilizzare una funzione di timeout per simulare il ritardo tra i frame
    await new Promise(resolve => setTimeout(resolve, 1000 / fps));
  }

  await browser.close();
};

const generateVideo = async () => {

  await generateFrames();

  const outputDir = path.resolve(__dirname, 'frames');
  const outputVideo = path.resolve(__dirname, 'output.mp4');

  ffmpeg.setFfmpegPath(ffmpegStatic);

  ffmpeg()
    .input(`${outputDir}/frame_%03d.png`)
    .inputOptions('-framerate 30')
    .outputOptions([
      '-c:v libx264',
      '-crf 25',
      '-pix_fmt yuv420p'
    ])
    .save(outputVideo)
    .on('end', () => {
      console.log(`Video generato in ${outputVideo}`);
    })
    .on('error', (err) => {
      console.error(`Errore nell'esecuzione di FFmpeg: ${err.message}`);
    });
}

generateVideo();
