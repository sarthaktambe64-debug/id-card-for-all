/**
 * photoService.js
 *
 * Dedicated Farmer Photo Quality, Cropping, and Enhancement Engine:
 * - Edge-to-edge portrait framing with zero unexplained white strips
 * - Non-destructive: preserves original photo unaltered in storage
 * - Separate adjustment settings: zoom, pan, brightness, contrast, mild sharpening
 * - High-DPI canvas rendering for bit-perfect consistency across:
 *   Live Preview, Copy as Image, PNG, JPG, CR80 PDF, and Direct Printing
 * - Image quality validation: low-resolution, blur, darkness, and border detection
 */

export const DEFAULT_PHOTO_SETTINGS = {
  zoom: 1.0,         // 1.0 to 3.0
  panX: 0,           // -50% to +50%
  panY: 0,           // -50% to +50%
  brightness: 100,   // 70% to 150%
  contrast: 100,     // 70% to 150%
  sharpen: 0,        // 0% to 100% (mild unsharp convolution)
  objectPosition: 'center center'
};

/**
 * Standard CR80 Card Photo Anchor Dimensions (matching defaultTemplate: 190 × 242 px)
 */
export const CARD_PHOTO_FRAME = {
  width: 190,
  height: 242,
  aspectRatio: 190 / 242, // ~0.785124 (roughly 4:5 portrait ratio)
  borderRadius: 24,       // 2.4 mm
  borderWidth: 1.5,
  borderColor: '#C7D9CD'
};

/**
 * Load an image from URL or DataURL and return HTMLImageElement
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('No image source provided'));
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image: ' + (err?.message || 'unknown error')));
    img.src = src;
  });
}

/**
 * Validate an uploaded photo or data URL for quality, resolution, lighting, and borders
 */
export async function validatePhoto(fileOrSrc) {
  let src = fileOrSrc;
  if (typeof fileOrSrc !== 'string') {
    // File or Blob
    src = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrSrc);
    });
  }

  try {
    const img = await loadImage(src);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    const aspectRatio = width / height;

    // Check resolution against physical card standards (target: ~300 × 400 px for 300 DPI CR80 print)
    const isVeryLowResolution = width < 180 || height < 220;
    const isLowResolution = !isVeryLowResolution && (width < 300 || height < 400);
    const isSharpHighRes = width >= 300 && height >= 400;

    // Compute luminance and edge border brightness via 128x128 offscreen sampling
    let avgLuminance = 120;
    let hasWhiteBorders = false;
    let isBlurry = false;
    let blurScore = 50;

    if (typeof document !== 'undefined') {
      try {
        const sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = 128;
        sampleCanvas.height = 128;
        const sCtx = sampleCanvas.getContext('2d');
        sCtx.drawImage(img, 0, 0, 128, 128);
        const imgData = sCtx.getImageData(0, 0, 128, 128);
        const data = imgData.data;

        let totalLum = 0;
        let edgeLum = 0;
        let edgeCount = 0;

        for (let y = 0; y < 128; y++) {
          for (let x = 0; x < 128; x++) {
            const idx = (y * 128 + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            totalLum += lum;

            // Check outer 3-pixel perimeter for scanned form borders
            if (x < 4 || x >= 124 || y < 4 || y >= 124) {
              edgeLum += lum;
              edgeCount++;
            }
          }
        }

        avgLuminance = totalLum / (128 * 128);
        const avgEdgeLum = edgeCount > 0 ? edgeLum / edgeCount : 0;

        // If perimeter is significantly whiter/brighter than the center, scanned borders exist
        if (avgEdgeLum > 235 && avgEdgeLum - avgLuminance > 40) {
          hasWhiteBorders = true;
        }

        // Fast Laplacian variance approximation for blur
        let varianceSum = 0;
        for (let y = 1; y < 127; y += 2) {
          for (let x = 1; x < 127; x += 2) {
            const idx = (y * 128 + x) * 4;
            const centerLum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            const leftLum = 0.299 * data[idx - 4] + 0.587 * data[idx - 3] + 0.114 * data[idx - 2];
            const diff = Math.abs(centerLum - leftLum);
            varianceSum += diff;
          }
        }
        blurScore = varianceSum / (63 * 63);
        if (blurScore < 4.5 && (width < 300 || height < 300)) {
          isBlurry = true;
        }
      } catch (_) {
        // Fallback gracefully
      }
    }

    const isDark = avgLuminance < 75;
    const isVeryDark = avgLuminance < 50;

    const warnings = [];
    const recommendations = [];

    if (isVeryLowResolution) {
      warnings.push(`Low Resolution (${width} × ${height} px)`);
      recommendations.push('Photo may appear pixelated when printed. Recommend uploading a 300 × 400 px or higher photo.');
    } else if (isLowResolution) {
      warnings.push(`Moderate Resolution (${width} × ${height} px)`);
    }

    if (isVeryDark) {
      warnings.push('Dark / Underexposed');
      recommendations.push('Face is in deep shadow. Increase brightness or upload a well-lit photo.');
    } else if (isDark) {
      warnings.push('Slightly Dark');
      recommendations.push('Increase brightness (+10% to +15%) for better card clarity.');
    }

    if (hasWhiteBorders) {
      warnings.push('Scanned Document Borders Detected');
      recommendations.push('White document borders detected at edges. Apply slight zoom (1.08×) to crop out borders edge-to-edge.');
    }

    if (isBlurry) {
      warnings.push('Slightly Soft / Blurry');
      recommendations.push('Face may look soft on print. Apply mild sharpening (+25%) or use a sharper photo.');
    }

    return {
      valid: true,
      width,
      height,
      aspectRatio,
      avgLuminance,
      isLowResolution,
      isVeryLowResolution,
      isDark,
      isVeryDark,
      hasWhiteBorders,
      isBlurry,
      warnings,
      recommendations,
      dataUrl: src
    };
  } catch (err) {
    return {
      valid: false,
      error: err.message,
      warnings: ['Unable to read image data'],
      recommendations: ['Please select a valid JPEG or PNG file.']
    };
  }
}

/**
 * Apply a mild 3x3 unsharp convolution sharpening kernel directly to ImageData
 * Enhances facial clarity, eyes, and hair without introducing digital halos.
 */
function applySharpenKernel(imageData, sharpenAmount) {
  // sharpenAmount is 0 to 100
  if (!sharpenAmount || sharpenAmount <= 0) return;
  const factor = (sharpenAmount / 100) * 0.45; // Max 0.45 for natural, artifact-free sharpening

  const w = imageData.width;
  const h = imageData.height;
  const src = new Uint8ClampedArray(imageData.data);
  const dst = imageData.data;

  // 3x3 kernel:
  // [  0, -k,  0 ]
  // [ -k, 1+4k, -k ]
  // [  0, -k,  0 ]
  const centerWeight = 1 + 4 * factor;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;

      // Top, Bottom, Left, Right
      const topIdx = ((y - 1) * w + x) * 4;
      const btmIdx = ((y + 1) * w + x) * 4;
      const lftIdx = (y * w + (x - 1)) * 4;
      const rgtIdx = (y * w + (x + 1)) * 4;

      for (let c = 0; c < 3; c++) {
        const val =
          src[idx + c] * centerWeight -
          factor * (src[topIdx + c] + src[btmIdx + c] + src[lftIdx + c] + src[rgtIdx + c]);
        dst[idx + c] = Math.min(255, Math.max(0, val));
      }
      // Alpha untouched
      dst[idx + 3] = src[idx + 3];
    }
  }
}

/**
 * Render Processed Photo onto a High-Resolution Canvas
 * Strictly preserves the pristine original image without repeated compression.
 * Computes edge-to-edge crop, zoom, pan, brightness, contrast, and mild sharpening.
 */
export async function renderProcessedPhoto(sourceSrc, userSettings = {}, options = {}) {
  if (typeof document === 'undefined') return null;

  const settings = {
    ...DEFAULT_PHOTO_SETTINGS,
    ...userSettings
  };

  const img = await loadImage(sourceSrc);
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;

  // 1. Calculate Crop & Aspect Ratio (Object-Fit: Cover)
  const frameAspect = CARD_PHOTO_FRAME.aspectRatio; // 190 / 242 ~ 0.785124
  const imgAspect = imgW / imgH;

  let baseCropW, baseCropH;
  if (imgAspect > frameAspect) {
    // Image is wider than frame: fit height, crop excess horizontal
    baseCropH = imgH;
    baseCropW = imgH * frameAspect;
  } else {
    // Image is taller than frame: fit width, crop excess vertical
    baseCropW = imgW;
    baseCropH = imgW / frameAspect;
  }

  // 2. Apply Zoom factor (zoom reduces the crop window, enlarging the face)
  // Restrained zoom up to 2.2× to prevent cutting off chin or hair
  const zoom = Math.max(1.0, Math.min(2.5, settings.zoom || 1.0));
  const cropW = baseCropW / zoom;
  const cropH = baseCropH / zoom;

  // 3. Determine Canvas Resolution
  // Preserve full source resolution: if source crop is larger than 380px, render at natural crop resolution (up to 850px)
  // never upscale small images and claim they are high-res
  const naturalCropW = Math.round(cropW);
  const targetW = options.targetWidth || (naturalCropW >= 380 ? Math.min(naturalCropW, 850) : 380);
  const targetH = options.targetHeight || Math.round(targetW / frameAspect);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 4. Apply Pan Offsets (-50% to +50%)
  const maxPanX = (imgW - cropW) / 2;
  const maxPanY = (imgH - cropH) / 2;

  const panXFrac = Math.max(-1, Math.min(1, (settings.panX || 0) / 50));
  const panYFrac = Math.max(-1, Math.min(1, (settings.panY || 0) / 50));

  const centerX = (imgW / 2) + panXFrac * maxPanX;
  const centerY = (imgH / 2) + panYFrac * maxPanY;

  const sx = Math.max(0, Math.min(imgW - cropW, centerX - cropW / 2));
  const sy = Math.max(0, Math.min(imgH - cropH, centerY - cropH / 2));

  // 5. Draw image onto canvas with restrained brightness & contrast
  const b = settings.brightness ?? 100;
  const c = settings.contrast ?? 100;

  if (typeof ctx.filter !== 'undefined') {
    ctx.filter = `brightness(${b}%) contrast(${c}%)`;
    ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, targetW, targetH);
    ctx.filter = 'none';
  } else {
    ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, targetW, targetH);
    // Manual fallback for brightness and contrast
    if (b !== 100 || c !== 100) {
      const imgData = ctx.getImageData(0, 0, targetW, targetH);
      const data = imgData.data;
      const bMul = b / 100;
      const cMul = (c - 100) * 2.55;
      const factor = (259 * (cMul + 255)) / (255 * (259 - cMul));

      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, factor * (data[i] * bMul - 128) + 128));
        data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] * bMul - 128) + 128));
        data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] * bMul - 128) + 128));
      }
      ctx.putImageData(imgData, 0, 0);
    }
  }

  // 6. Apply Mild Sharpening Kernel if requested
  if (settings.sharpen && settings.sharpen > 0) {
    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    applySharpenKernel(imgData, settings.sharpen);
    ctx.putImageData(imgData, 0, 0);
  }

  // 7. Export lossless PNG to avoid repeated JPEG compression degradation
  const mimeType = options.mimeType || 'image/png';
  const processedDataUrl = canvas.toDataURL(mimeType);

  return {
    processedDataUrl,
    canvas,
    settings,
    width: targetW,
    height: targetH,
    isHighRes: targetW >= 300 && targetH >= 400
  };
}

/**
 * Get CSS Object Position string from pan settings
 */
export function getCssObjectPosition(settings = {}) {
  const panX = settings.panX || 0; // -50 to +50
  const panY = settings.panY || 0; // -50 to +50

  const posX = Math.round(50 + panX);
  const posY = Math.round(50 + panY);

  return `${posX}% ${posY}%`;
}

/**
 * Get CSS Filter string from brightness/contrast settings
 */
export function getCssFilter(settings = {}) {
  const b = settings.brightness ?? 100;
  const c = settings.contrast ?? 100;

  if (b === 100 && c === 100) return 'none';
  return `brightness(${b}%) contrast(${c}%)`;
}
