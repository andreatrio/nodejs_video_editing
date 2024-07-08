const puppeteer = require('puppeteer');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const sharp = require('sharp');
const path = require('path');
const svg_path = require("svg-path-properties");


const bananaPath = "M 8,223 c 0,0 143,3 185,-181 c 2,-11 -1,-20 1,-33 h 16 c 0,0 -3,17 1,30 c 21,68 -4,242 -204,196 L 8,223 z M 8,230 c 0,0 188,40 196,-160"; // con curve
const heartPath = "M140 20C73 20 20 74 20 140c0 135 136 170 228 303 88-132 229-173 229-303 0-66-54-120-120-120-48 0-90 28-109 69-19-41-60-69-108-69z"; // con curve
const zigzagPath = "M2,2 L8,2 L2,5 L8,5 L2,8 L8,8"; // senza curve
const polyPath = "M66.039,133.545c0,0-21-57,18-67s49-4,65,8s30,41,53,27s66,4,58,32s-5,44,18,57s22,46,0,45s-54-40-68-16s-40,88-83,48s11-61-11-80s-79-7-70-41C46.039,146.545,53.039,128.545,66.039,133.545z";
const testPath = "M 50,50 L 450,50 L 450,450 L 50,450 Z"

// Funzione per generare il contenuto SVG con il progresso dell'animazione
const generateSvgContent = (svgPath, strokeDashArray, progress) => `
  <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
    <rect width="500" height="500" fill="none"/>
    <path d="${svgPath}" stroke="white" fill="transparent" stroke-width="2"
      stroke-dasharray="${strokeDashArray}" stroke-dashoffset="${strokeDashArray * (1 - progress)}"/>
  </svg>
`;

const getPathLength = (path) => {
  const properties = new svg_path.svgPathProperties(path);
  const pathLength = properties.getTotalLength();
  return pathLength;
}

const generateFrames = async (svgPath) => {
  const fps = 30;
  const videoDuration = 10;
  const frames = videoDuration * fps;
  const outputDir = path.resolve(__dirname, 'frames');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  const pathLength = getPathLength(svgPath);
  for (let i = 0; i < frames; i++) {
    const progress = i / (frames - 1);
    const svgContent = generateSvgContent(svgPath, pathLength, progress);
    const svgBuffer = Buffer.from(svgContent);
    const outputPath = path.join(outputDir, `frame_${String(i).padStart(3, '0')}.png`);
    await sharp(svgBuffer)
      .png()
      .toFile(outputPath);
  }
};

const generateVideo = async () => {
  await generateFrames(heartPath);
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

/* const mergeVideos = () => {
  const bgVideo = path.resolve(__dirname, 'bgVideo.mp4'); 
  const overlayVideo = path.resolve(__dirname, 'output.mp4'); 
  const output = path.resolve(__dirname, 'sovrapposizione.mp4');
  ffmpeg.setFfmpegPath(ffmpegStatic);
  ffmpeg()
    .input(bgVideo)
    .input(overlayVideo)
    .complexFilter([
      '[0:v]scale=iw:ih[bg]; [1:v]scale=-1:-1[fg]; [bg][fg] overlay=(W-w)/2:(H-h)/2'
    ])
    .outputOptions('-c:v libx264') 
    .outputOptions('-c:a aac')   
    .output(output)
    .on('end', () => {
      console.log('Video sovrapposti e esportati con successo!');
    })
    .on('error', (err) => {
      console.error('Errore durante la sovrapposizione dei video:', err);
    })
    .run();
}

mergeVideos(); */
