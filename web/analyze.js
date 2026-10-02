const Jimp = require('jimp');

async function analyze() {
  try {
    const img = await Jimp.read('public/assets/video-frames/frame_0060.jpg');
    let totalLuma = 0;
    const width = img.bitmap.width;
    const height = img.bitmap.height;
    
    // Sample pixels
    for(let y = 0; y < height; y += 10) {
      for(let x = 0; x < width; x += 10) {
        const hex = img.getPixelColor(x, y);
        const rgba = Jimp.intToRGBA(hex);
        // luma approx
        const luma = (rgba.r * 299 + rgba.g * 587 + rgba.b * 114) / 1000;
        totalLuma += luma;
      }
    }
    
    const samples = (Math.ceil(height / 10)) * (Math.ceil(width / 10));
    console.log("Average Luma (0-255):", totalLuma / samples);
  } catch(e) {
    console.error(e);
  }
}
analyze();
