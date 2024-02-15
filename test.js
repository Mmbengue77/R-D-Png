const fs = require('fs').promises;
const Jimp = require('jimp');

const BADGE_SIZE = 512;
const JOYFUL_COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#008000'];
const COLOR_TOLERANCE = 30;
const TRANSPARENCY_MARGIN = 20;

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
  if (!colors.every(color => isJoyfulColor(color))) {
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
 * @returns {boolean}
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
    const color = `#${pixel.r.toString(16).padStart(2, '0')}${pixel.g.toString(16).padStart(2, '0')}${pixel.b.toString(16).padStart(2, '0')}`;
    colors.add(color);
  });
  return Array.from(colors);
}

/**
 * Check if a color is within the range of joyful colors.
 * @param {string} color
 * @returns {boolean}
 */
function isJoyfulColor(color) {
  return JOYFUL_COLORS.some(joyfulColor => areColorsSimilar(color, joyfulColor));
}

/**
 * Check if two colors are similar within a tolerance range.
 * @param {string} color1
 * @param {string} color2
 * @returns {boolean}
 */
function areColorsSimilar(color1, color2) {
  const rgb1 = Jimp.cssColorToHex(color1);
  const rgb2 = Jimp.cssColorToHex(color2);

  const r1 = (rgb1 >> 16) & 255;
  const g1 = (rgb1 >> 8) & 255;
  const b1 = rgb1 & 255;

  const r2 = (rgb2 >> 16) & 255;
  const g2 = (rgb2 >> 8) & 255;
  const b2 = rgb2 & 255;

  const distance = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);

  return distance <= COLOR_TOLERANCE;
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
 * Verify properties of the uploaded badge.
 * @param {string} filePath 
 * @returns {Promise<void>}
 */
async function verifyBadge(filePath) {
  try {
    // Load image
    const image = await Jimp.read(filePath);

    // Validate size
    if (!validateSize(image.bitmap.width, image.bitmap.height, BADGE_SIZE)) {
      console.log('Incorrect badge size. The badge must be 512x512 pixels.');
      return;
    }

    // All criteria passed
    console.log('The badge is valid.');
  } catch (error) {
    console.error('Error verifying the badge:', error.message);
  }
}

/**
 * Validate image size.
 * @param {number} width
 * @param {number} height 
 * @param {number} targetSize 
 * @returns {boolean}
 */
function validateSize(width, height, targetSize) {
  return width === targetSize && height === targetSize;
}


/**
 * Retrieve the distinct colors from an image.
 * @param {Jimp} image
 * @returns {string[]} 
 */
function getColors(image) {
  const colors = new Set();
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
    const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
    const color = `#${pixel.r.toString(16).padStart(2, '0')}${pixel.g.toString(16).padStart(2, '0')}${pixel.b.toString(16).padStart(2, '0')}`;
    colors.add(color);
  });
  return Array.from(colors);
}

/**
 * Find missing colors.
 * @param {string[]} colors 
 * @param {string[]} targetColors 
 * @param {number} transparencyMargin
 * @returns {string[]} 
 */
function findMissingColors(colors, targetColors, transparencyMargin) {
  const missingColors = [];

  for (const targetColor of targetColors) {
    if (!colors.includes(targetColor)) {
      missingColors.push(targetColor);
    }
  }

  return missingColors;
}

/**
 * Convert an image to a badge.
 * @param {string} inputPath 
 * @param {string} outputPath 
 * @returns {Promise<void>}
 */
async function convertToBadge(inputPath, outputPath) {
  try {
    // Load image
    const image = await Jimp.read(inputPath);

    // Resize and apply circle effect
    const badge = await image
      .resize(BADGE_SIZE, BADGE_SIZE)
      .circle()
      .getBufferAsync(Jimp.MIME_PNG);

    // Save the converted badge
    await fs.writeFile(outputPath, badge);

    console.log('Conversion successful. Badge saved at:', outputPath);
  } catch (error) {
    console.error('Error converting the image to a badge:', error.message);
  }
}

// Example usage
const imagePath = "test3.jpg";
const outputPath = "badge.png";

verifyBadge(imagePath).then(() => {
  // Continue with the rest of your code or actions after badge verification
  convertToBadge(imagePath, outputPath);
}).catch((error) => {
  console.error('An error occurred:', error.message);
});
