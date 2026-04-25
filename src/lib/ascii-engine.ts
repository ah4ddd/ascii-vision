/**
 * AsciiVision - Advanced ASCII Rendering Engine
 *
 * Handles:
 * - Auto-Contrast Stretching (Min-Max normalization)
 * - Floyd-Steinberg Dithering for optional tonal depth
 * - Perceptual luminance calculation (BT.709)
 * - Sharpness enhancement (Convolution)
 * - Multi-mode rendering architecture
 */

export type RenderingMode = 'classic' | 'single-char' | 'scanline' | 'neon';
export type NeonPalette = 'matrix' | 'cyan' | 'purple' | 'pink' | 'blue' | 'red' | 'ember' | 'custom';

export interface AsciiOptions {
    width: number;
    brightness: number;
    contrast: number;
    gamma: number;
    sharpen: number;
    ramp: string;
    invert: boolean;
    colorMode: 'grayscale' | 'color';
    aspectRatio: number;
    dithering: boolean;
    mode: RenderingMode;
    singleChar?: string;
    neonPalette?: NeonPalette;
    glowIntensity?: number;
}

export interface AsciiResult {
    text: string;
    colors?: string[][];
    width: number;
    height: number;
}

/**
 * High-impact character ramps
 */
export const STRONG_RAMP = "@%#*+=-:. ";
export const QUALITY_RAMP = "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ";

export async function convertToAscii(
    image: HTMLImageElement,
    options: AsciiOptions
): Promise<AsciiResult> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get canvas context');

    // 1. Calculate target grid dimensions
    const targetWidth = options.width;
    const scale = targetWidth / image.width;
    const targetHeight = Math.floor((image.height * scale) / options.aspectRatio);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // 2. Downsample
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    let pixels = imageData.data;
    const totalPixels = targetWidth * targetHeight;

    // 3. Optional Sharpening Filter (Convolution)
    if (options.sharpen > 0) {
        const copy = new Uint8ClampedArray(pixels);
        const s = options.sharpen;
        for (let y = 1; y < targetHeight - 1; y++) {
            for (let x = 1; x < targetWidth - 1; x++) {
                const i = (y * targetWidth + x) * 4;
                for (let c = 0; c < 3; c++) {
                    const val = copy[i + c] + (copy[i + c] * 4 - copy[i - (targetWidth * 4) + c] - copy[i + (targetWidth * 4) + c] - copy[i - 4 + c] - copy[i + 4 + c]) * s;
                    pixels[i + c] = Math.max(0, Math.min(255, val));
                }
            }
        }
    }

    // 4. Initial Luminosity Calculation & Auto-Contrast Prep
    const rawLuma = new Float32Array(totalPixels);
    let minLuma = 1.0;
    let maxLuma = 0.0;

    for (let i = 0; i < totalPixels; i++) {
        const r = pixels[i * 4];
        const g = pixels[i * 4 + 1];
        const b = pixels[i * 4 + 2];

        // BT.709 Luma
        let luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

        rawLuma[i] = luma;
        if (luma < minLuma) minLuma = luma;
        if (luma > maxLuma) maxLuma = luma;
    }

    // 4. Contrast Stretching & Normalization
    const luminanceMap = new Float32Array(totalPixels);
    const range = maxLuma - minLuma;
    const stretchFactor = range > 0 ? 1.0 / range : 1.0;

    for (let i = 0; i < totalPixels; i++) {
        let luma = rawLuma[i];

        // Min-Max auto-contrast stretch
        luma = (luma - minLuma) * stretchFactor;

        // Apply manual contrast/brightness/gamma
        luma = (luma - 0.5) * options.contrast + 0.5;
        luma += (options.brightness - 1);
        luma = Math.pow(Math.max(0, luma), 1 / options.gamma);

        luminanceMap[i] = Math.max(0, Math.min(1, luma));
    }

    // 5. Optional Dithering
    if (options.dithering) {
        for (let y = 0; y < targetHeight; y++) {
            for (let x = 0; x < targetWidth; x++) {
                const i = y * targetWidth + x;
                const oldVal = luminanceMap[i];
                const steps = options.ramp.length - 1;
                const newVal = Math.round(oldVal * steps) / steps;
                luminanceMap[i] = newVal;

                const error = oldVal - newVal;
                if (x + 1 < targetWidth) luminanceMap[i + 1] += error * 7 / 16;
                if (y + 1 < targetHeight) {
                    if (x - 1 >= 0) luminanceMap[i + targetWidth - 1] += error * 3 / 16;
                    luminanceMap[i + targetWidth] += error * 5 / 16;
                    if (x + 1 < targetWidth) luminanceMap[i + targetWidth + 1] += error * 1 / 16;
                }
            }
        }
    }

    // 6. Mapping to ASCII
    let ascii = '';
    const finalColors: string[][] = [];
    const ramp = options.invert ? [...options.ramp].reverse().join('') : options.ramp;

    for (let y = 0; y < targetHeight; y++) {
        const rowColors: string[] = [];
        const isScanline = options.mode === 'scanline' && y % 2 === 0;

        for (let x = 0; x < targetWidth; x++) {
            const idx = y * targetWidth + x;
            const luma = Math.max(0, Math.min(1, luminanceMap[idx]));

            const pIdx = idx * 4;
            const r = pixels[pIdx];
            const g = pixels[pIdx + 1];
            const b = pixels[pIdx + 2];

            let char = ' ';
            if (isScanline) {
                char = luma > 0.3 ? '⎯' : ' ';
            } else if (options.mode === 'single-char') {
                char = luma > 0.25 ? (options.singleChar || '@') : ' ';
            } else {
                const charIdx = Math.floor(luma * (ramp.length - 1));
                char = ramp[charIdx];
            }

            ascii += char;

            let colorStr = `rgb(${r},${g},${b})`;
            if (options.mode === 'neon' && options.neonPalette) {
                colorStr = getNeonColor(r, g, b, options.neonPalette);
            }
            rowColors.push(colorStr);
        }
        ascii += '\n';
        finalColors.push(rowColors);
    }

    return {
        text: ascii,
        colors: (options.colorMode === 'color' || options.mode === 'neon' || options.mode === 'single-char') ? finalColors : undefined,
        width: targetWidth,
        height: targetHeight
    };
}

function getNeonColor(r: number, g: number, b: number, palette: NeonPalette): string {
    const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const alpha = 0.5 + luma * 0.5;

    switch (palette) {
        case 'matrix': return `rgba(0, 255, 65, ${alpha})`;
        case 'cyan': return `rgba(0, 255, 255, ${alpha})`;
        case 'purple': return `rgba(189, 0, 255, ${alpha})`;
        case 'pink': return `rgba(255, 0, 255, ${alpha})`;
        case 'blue': return `rgba(0, 102, 255, ${alpha})`;
        case 'red': return getRedNeonColor(luma, alpha);
        case 'ember': return getEmberColor(luma, alpha);
        default: return `rgb(${r},${g},${b})`;
    }
}

function getRedNeonColor(luma: number, alpha: number): string {
    const low = { r: 22, g: 0, b: 0 };
    const mid = { r: 255, g: 0, b: 60 };
    const high = { r: 255, g: 179, b: 193 };

    return getGradientColor(luma, alpha, low, mid, high);
}

function getEmberColor(luma: number, alpha: number): string {
    const low = { r: 26, g: 10, b: 0 };
    const mid = { r: 255, g: 106, b: 0 };
    const high = { r: 255, g: 210, b: 122 };

    return getGradientColor(luma, alpha, low, mid, high);
}

function getGradientColor(
    luma: number,
    alpha: number,
    low: { r: number; g: number; b: number },
    mid: { r: number; g: number; b: number },
    high: { r: number; g: number; b: number }
): string {
    const from = luma < 0.65 ? low : mid;
    const to = luma < 0.65 ? mid : high;
    const rangeStart = luma < 0.65 ? 0 : 0.65;
    const rangeSize = luma < 0.65 ? 0.65 : 0.35;
    const t = Math.max(0, Math.min(1, (luma - rangeStart) / rangeSize));

    const r = Math.round(from.r + (to.r - from.r) * t);
    const g = Math.round(from.g + (to.g - from.g) * t);
    const b = Math.round(from.b + (to.b - from.b) * t);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
