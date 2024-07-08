const { JSDOM } = require('jsdom');
const { create } = require('@svgdotjs/svg.js');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

const frames = 60; // Numero di frame da catturare
const fps = 30; // Frame per secondo
const outputDir = path.resolve(__dirname, 'frames');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Funzione per generare e salvare il frame SVG
async function generateAndSaveFrame(frameIndex) {
  const dom = new JSDOM();
  const window = dom.window;
  const document = window.document;

  const canvas = create(document.documentElement);

  // Crea un elemento SVG
  const svg = canvas.size(500, 500);

  // Aggiungi elementi SVG come path, rettangoli, ecc.
  svg.path('M 50 50 L 100 200 L 150 100 L 200 200 L 250 50 L 300 150 L 350 50')
    .stroke('black')
    .fill('transparent')
    .strokeWidth(2);

  // Salva il documento SVG come file
  const svgFilePath = path.join(outputDir, `frame_${String(frameIndex).padStart(3, '0')}.svg`);
  fs.writeFileSync(svgFilePath, dom.serialize());

  return svgFilePath;
}

// Array per tenere traccia dei percorsi dei file SVG generati
const svgFiles = [];

// Ciclo per catturare i frame
(async () => {
  for (let i = 0; i < frames; i++) {
    const svgFilePath = await generateAndSaveFrame(i);
    svgFiles.push(svgFilePath);

    // Simula un ritardo tra i frame per mantenere il framerate desiderato
    await new Promise(resolve => setTimeout(resolve, 1000 / fps));
  }

  console.log(`Frames catturati in ${outputDir}`);

  // Ora converte i frame SVG in un video utilizzando fluent-ffmpeg
  const outputVideoPath = path.join(__dirname, 'output.mp4');
  ffmpeg()
    .input(`${outputDir}/frame_%03d.svg`)
    .inputOptions(['-framerate', String(fps)])
    .output(outputVideoPath)
    .outputOptions(['-c:v', 'libx264', '-pix_fmt', 'yuv420p'])
    .on('end', () => {
      console.log(`Video generato: ${outputVideoPath}`);
      // Rimuovi i file SVG intermedi
      svgFiles.forEach(svgFile => fs.unlinkSync(svgFile));
    })
    .on('error', (err) => {
      console.error('Errore durante la generazione del video:', err);
    })
    .run();
})();
