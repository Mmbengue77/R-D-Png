const fs = require('fs');
const Jimp = require('jimp');

const BADGE_SIZE = 512;
const JOYFUL_COLORS = ['#FF0000', '#00FF00', '#0000FF'];

/**
 * Load an image from a file.
 * @param {string} filePath 
 * @returns {Promise<Jimp>} 
 */
async function loadImage(filePath) {
  return await Jimp.read(filePath);
}

/**
 * Validate the criteria of the badge.
 * @param {Jimp} image 
 * @returns {boolean} 
 */
function validateBadge(image) {
  if (image.bitmap.width !== BADGE_SIZE || image.bitmap.height !== BADGE_SIZE) {
    console.log('Le badge n\'est pas à la bonne taille.');
    return false;
  }

  // Transparency check.
  let hasTransparentPixels = false;
  for (let y = 0; y < BADGE_SIZE; y++) {
    for (let x = 0; x < BADGE_SIZE; x++) {
      const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
      if (pixel.a === 0) {
        hasTransparentPixels = true;
        break;
      }
    }
    if (hasTransparentPixels) {
      break;
    }
  }

  if (!hasTransparentPixels) {
    console.log('Le badge n\'a pas de fond transparent.');
    return false;
  }

  // Check if a pixel is located within a circle.
  for (let y = 0; y < BADGE_SIZE; y++) {
    for (let x = 0; x < BADGE_SIZE; x++) {
      if (isCirclePixel(x, y, BADGE_SIZE) && Jimp.intToRGBA(image.getPixelColor(x, y)).a === 0) {
        console.log('Le badge contient des pixels transparents dans le cercle.');
        return false;
      }
    }
  }

  // Joyful Colors Validation
  const colors = getColors(image);
  if (!colors.every(color => JOYFUL_COLORS.includes(color))) {
    console.log('Le badge ne contient pas les couleurs joyeuses requises.');
    return false;
  }

  return true;
}

/**
 * Check if a pixel is located inside a circle.
 * @param {number} x 
 * @param {number} y 
 * @param {number} badgeSize 
 * @returns {boolean} - 
 */
function isCirclePixel(x, y, badgeSize) {
  const radius = badgeSize / 2;
  const centerX = centerY = radius;
  const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
  const color = image.getPixelColor(x, y);
  const alpha = Jimp.intToRGBA(color).a;
  return distance <= radius && alpha !== 0;
}

/**
 * Retrieve the distinct colors from an image.
 * @param {Jimp} image 
 * @returns {Set<string>} 
 */
function getColors(image) {
  const colors = new Set();
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
    const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
    const color = `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`;
    colors.add(color);
  });
  return colors;
}

/**
 * Converts an image into a badge by resizing and applying a circle effect.
 * @param {Jimp} image 
 * @returns {Promise<Jimp>} 
 */
async function convertImageToBadge(image) {

  const badge = await image
    .resize(BADGE_SIZE, BADGE_SIZE)
    .circle()
    .getBufferAsync(Jimp.MIME_PNG);

  return await Jimp.read(badge);
}

/**
 * Main function to execute the script.
 * @returns {Promise<void>}
 */
