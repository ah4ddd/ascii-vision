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
export type GlyphLanguage = 'default' | 'english' | 'japanese' | 'chinese' | 'hindi' | 'russian' | 'arabic';
export type ColorPalettePreset = 'source' | 'mono' | 'terminal' | 'amber' | 'gameboy' | 'cyberpunk' | 'sepia' | 'warm' | 'cool';

export interface AsciiOptions {
    width: number;
    brightness: number;
    contrast: number;
    gamma: number;
    sharpen: number;
    ramp: string;
    invert: boolean;
    colorMode: 'grayscale' | 'color';
    colorPalette: ColorPalettePreset;
    aspectRatio: number;
    dithering: boolean;
    mode: RenderingMode;
    glyphLanguage: GlyphLanguage;
    singleChar?: string;
    neonPalette?: NeonPalette;
    glowIntensity?: number;
    bloomIntensity?: number;
}

export interface AsciiResult {
    text: string;
    colors?: string[][];
    width: number;
    height: number;
}

export interface GlyphLanguageProfile {
    id: GlyphLanguage;
    label: string;
    nativeLabel: string;
    shortLabel: string;
    ramp: string;
    singleChar: string;
    fontStack: string;
    cellAspectRatio: number;
}

export interface ColorPaletteProfile {
    id: ColorPalettePreset;
    label: string;
    shortLabel: string;
    colors: string[];
}

/**
 * High-impact character ramps
 */
export const STRONG_RAMP = "@%#*+=-:. ";
export const QUALITY_RAMP = "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ";
export const CHARACTER_CELL_ASPECT_RATIO = 0.6;
export const SOURCE_PRESERVING_ASPECT_CORRECTION = 1 / CHARACTER_CELL_ASPECT_RATIO;

const LATIN_MONO_STACK = '"JetBrains Mono", ui-monospace, SFMono-Regular, Consolas, monospace';
const ENGLISH_LETTER_RAMP = 'MWQBHNRDEGKOAUPXSZVYFCTJLmwqbdpghkxaeousvznrtcilj. ';

type RgbColor = { r: number; g: number; b: number };

export const GLYPH_LANGUAGE_ORDER: GlyphLanguage[] = [
    'default',
    'english',
    'japanese',
    'chinese',
    'hindi',
    'russian',
    'arabic'
];

export const GLYPH_LANGUAGE_PROFILES: Record<GlyphLanguage, GlyphLanguageProfile> = {
    default: {
        id: 'default',
        label: 'Default',
        nativeLabel: 'ASCII Symbols',
        shortLabel: 'ASCII',
        ramp: STRONG_RAMP,
        singleChar: '@',
        fontStack: LATIN_MONO_STACK,
        cellAspectRatio: CHARACTER_CELL_ASPECT_RATIO
    },
    english: {
        id: 'english',
        label: 'English',
        nativeLabel: 'Alphabet',
        shortLabel: 'EN',
        ramp: ENGLISH_LETTER_RAMP,
        singleChar: 'E',
        fontStack: LATIN_MONO_STACK,
        cellAspectRatio: CHARACTER_CELL_ASPECT_RATIO
    },
    japanese: {
        id: 'japanese',
        label: 'Japanese',
        nativeLabel: '日本語',
        shortLabel: 'JP',
        ramp: '鬱曜躍藤響熊鳥風雨光水火木日月口一、・ ',
        singleChar: '日',
        fontStack: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", "MS Gothic", monospace',
        cellAspectRatio: 0.9
    },
    chinese: {
        id: 'chinese',
        label: 'Chinese',
        nativeLabel: '中文',
        shortLabel: 'CN',
        ramp: '龜龍藝國黑森晶星光水山田口工一丶、· ',
        singleChar: '龍',
        fontStack: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", SimHei, monospace',
        cellAspectRatio: 0.9
    },
    hindi: {
        id: 'hindi',
        label: 'Hindi',
        nativeLabel: 'हिन्दी',
        shortLabel: 'HI',
        ramp: 'भझघधछफथमहनकगलरचसयवटइअ।॰ ',
        singleChar: 'भ',
        fontStack: '"Noto Sans Devanagari", Mangal, "Kohinoor Devanagari", sans-serif',
        cellAspectRatio: 0.82
    },
    russian: {
        id: 'russian',
        label: 'Russian',
        nativeLabel: 'Русский',
        shortLabel: 'RU',
        ramp: 'ШЖФЮМЫБДЯНРКЕСТЗХЛЧПУОИГЬ· ',
        singleChar: 'Ж',
        fontStack: LATIN_MONO_STACK,
        cellAspectRatio: 0.62
    },
    arabic: {
        id: 'arabic',
        label: 'Arabic',
        nativeLabel: 'العربية',
        shortLabel: 'AR',
        ramp: 'ظضصشغفقعمكبنهلريا،· ',
        singleChar: 'ض',
        fontStack: '"Noto Sans Arabic", Tahoma, Arial, sans-serif',
        cellAspectRatio: 0.78
    }
};

export function getGlyphLanguageProfile(language: GlyphLanguage = 'default'): GlyphLanguageProfile {
    return GLYPH_LANGUAGE_PROFILES[language] ?? GLYPH_LANGUAGE_PROFILES.default;
}

export function getGlyphAspectCorrection(language: GlyphLanguage = 'default'): number {
    return 1 / getGlyphLanguageProfile(language).cellAspectRatio;
}

export const COLOR_PALETTE_ORDER: ColorPalettePreset[] = [
    'source',
    'mono',
    'terminal',
    'amber',
    'gameboy',
    'cyberpunk',
    'sepia',
    'warm',
    'cool'
];

export const COLOR_PALETTE_PRESETS: Record<ColorPalettePreset, ColorPaletteProfile> = {
    source: {
        id: 'source',
        label: 'Source Colors',
        shortLabel: 'SRC',
        colors: ['#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#6366f1']
    },
    mono: {
        id: 'mono',
        label: 'Black & White',
        shortLabel: 'B&W',
        colors: ['#050505', '#3f3f46', '#a1a1aa', '#f4f4f5']
    },
    terminal: {
        id: 'terminal',
        label: 'Terminal Green',
        shortLabel: 'TERM',
        colors: ['#00140a', '#006b35', '#00c853', '#c8ffd8']
    },
    amber: {
        id: 'amber',
        label: 'Amber CRT',
        shortLabel: 'CRT',
        colors: ['#160900', '#7a3200', '#ff9f1c', '#ffe1a8']
    },
    gameboy: {
        id: 'gameboy',
        label: 'Game Boy',
        shortLabel: 'GB',
        colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']
    },
    cyberpunk: {
        id: 'cyberpunk',
        label: 'Cyberpunk',
        shortLabel: 'CYBR',
        colors: ['#060014', '#2b0f54', '#00e5ff', '#ff2bd6', '#fff15a']
    },
    sepia: {
        id: 'sepia',
        label: 'Sepia',
        shortLabel: 'SEPIA',
        colors: ['#1b1008', '#5f3920', '#b7794b', '#f1d2a2']
    },
    warm: {
        id: 'warm',
        label: 'Warm',
        shortLabel: 'WARM',
        colors: ['#1c0505', '#7f1d1d', '#ea580c', '#facc15', '#fff7ed']
    },
    cool: {
        id: 'cool',
        label: 'Cool',
        shortLabel: 'COOL',
        colors: ['#020617', '#1e3a8a', '#0891b2', '#67e8f9', '#f8fafc']
    }
};

export function getColorPaletteProfile(palette: ColorPalettePreset = 'source'): ColorPaletteProfile {
    return COLOR_PALETTE_PRESETS[palette] ?? COLOR_PALETTE_PRESETS.source;
}

function getRampGlyphs(ramp: string): string[] {
    const glyphs = Array.from(ramp);
    return glyphs.length > 0 ? glyphs : Array.from(STRONG_RAMP);
}

function getSingleGlyph(value: string | undefined, language: GlyphLanguage): string {
    return Array.from(value || getGlyphLanguageProfile(language).singleChar)[0] || '@';
}

function getPresetRgbColors(palette: ColorPalettePreset): RgbColor[] | undefined {
    if (palette === 'source') return undefined;
    return getColorPaletteProfile(palette).colors.map(hexToRgb);
}

function hexToRgb(hex: string): RgbColor {
    const normalized = hex.replace('#', '');
    const value = parseInt(normalized.length === 3
        ? normalized.split('').map((char) => char + char).join('')
        : normalized, 16);

    return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255
    };
}

function getMappedColorString(r: number, g: number, b: number, paletteColors?: RgbColor[]): string {
    if (!paletteColors?.length) return `rgb(${r},${g},${b})`;

    const color = findNearestColor(r, g, b, paletteColors);
    return `rgb(${color.r},${color.g},${color.b})`;
}

function findNearestColor(r: number, g: number, b: number, paletteColors: RgbColor[]): RgbColor {
    let nearest = paletteColors[0];
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const color of paletteColors) {
        const dr = r - color.r;
        const dg = g - color.g;
        const db = b - color.b;
        const distance = dr * dr * 0.2126 + dg * dg * 0.7152 + db * db * 0.0722;

        if (distance < nearestDistance) {
            nearest = color;
            nearestDistance = distance;
        }
    }

    return nearest;
}

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
    const aspectCorrection = Math.max(0.1, options.aspectRatio);
    const targetHeight = Math.max(1, Math.round((image.height * scale) / aspectCorrection));

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
    const baseRamp = getRampGlyphs(options.ramp);
    const steps = Math.max(1, baseRamp.length - 1);

    if (options.dithering) {
        for (let y = 0; y < targetHeight; y++) {
            for (let x = 0; x < targetWidth; x++) {
                const i = y * targetWidth + x;
                const oldVal = luminanceMap[i];
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
    const ramp = options.invert ? [...baseRamp].reverse() : baseRamp;
    const singleGlyph = getSingleGlyph(options.singleChar, options.glyphLanguage);
    const paletteColors = options.mode === 'neon' ? undefined : getPresetRgbColors(options.colorPalette);

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
                char = luma > 0.25 ? singleGlyph : ' ';
            } else {
                const charIdx = Math.floor(luma * (ramp.length - 1));
                char = ramp[charIdx];
            }

            ascii += char;

            let colorStr = getMappedColorString(r, g, b, paletteColors);
            if (options.mode === 'neon' && options.neonPalette) {
                colorStr = getNeonColor(r, g, b, options.neonPalette, options.bloomIntensity ?? 0);
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

function getNeonColor(r: number, g: number, b: number, palette: NeonPalette, bloomIntensity = 0): string {
    const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const alpha = 0.5 + luma * 0.5;
    const bloom = Math.max(0, Math.min(2, bloomIntensity));

    switch (palette) {
        case 'matrix': return applyBloomWash(getRgbString(0, 255, 65, alpha), luma, alpha, palette, bloom);
        case 'cyan': return applyBloomWash(getRgbString(0, 255, 255, alpha), luma, alpha, palette, bloom);
        case 'purple': return applyBloomWash(getRgbString(189, 0, 255, alpha), luma, alpha, palette, bloom);
        case 'pink': return applyBloomWash(getRgbString(255, 0, 255, alpha), luma, alpha, palette, bloom);
        case 'blue': return applyBloomWash(getRgbString(0, 102, 255, alpha), luma, alpha, palette, bloom);
        case 'red': return applyBloomWash(getRedNeonColor(luma, alpha), luma, alpha, palette, bloom);
        case 'ember': return applyBloomWash(getEmberColor(luma, alpha), luma, alpha, palette, bloom);
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
    high: { r: number; g: number; b: number },
    midpoint = 0.65
): string {
    const from = luma < midpoint ? low : mid;
    const to = luma < midpoint ? mid : high;
    const rangeStart = luma < midpoint ? 0 : midpoint;
    const rangeSize = luma < midpoint ? midpoint : 1 - midpoint;
    const t = Math.max(0, Math.min(1, (luma - rangeStart) / rangeSize));

    const r = Math.round(from.r + (to.r - from.r) * t);
    const g = Math.round(from.g + (to.g - from.g) * t);
    const b = Math.round(from.b + (to.b - from.b) * t);

    return getRgbString(r, g, b, alpha);
}

function getRgbString(r: number, g: number, b: number, alpha: number): string {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyBloomWash(baseColor: string, luma: number, alpha: number, palette: NeonPalette, bloom: number): string {
    if (bloom <= 0) return baseColor;

    const flash = getBloomFlashColor(luma, alpha, palette);
    const washAmount = Math.min(1, bloom * 0.55 + Math.max(0, luma - 0.2) * bloom * 0.35);

    return mixRgbStrings(baseColor, flash, washAmount);
}

function getBloomFlashColor(luma: number, alpha: number, palette: NeonPalette): string {
    switch (palette) {
        case 'matrix':
            return getGradientColor(
                luma,
                alpha,
                { r: 2, g: 16, b: 12 },
                { r: 126, g: 221, b: 148 },
                { r: 236, g: 255, b: 228 },
                0.38
            );
        case 'cyan':
            return getGradientColor(luma, alpha, { r: 0, g: 17, b: 22 }, { r: 121, g: 226, b: 232 }, { r: 228, g: 255, b: 255 }, 0.38);
        case 'purple':
            return getGradientColor(luma, alpha, { r: 18, g: 0, b: 24 }, { r: 186, g: 126, b: 226 }, { r: 249, g: 231, b: 255 }, 0.38);
        case 'pink':
            return getGradientColor(luma, alpha, { r: 24, g: 0, b: 15 }, { r: 229, g: 119, b: 174 }, { r: 255, g: 231, b: 244 }, 0.38);
        case 'blue':
            return getGradientColor(luma, alpha, { r: 0, g: 7, b: 28 }, { r: 105, g: 164, b: 235 }, { r: 226, g: 240, b: 255 }, 0.38);
        case 'red':
            return getGradientColor(luma, alpha, { r: 28, g: 0, b: 0 }, { r: 225, g: 111, b: 124 }, { r: 255, g: 232, b: 236 }, 0.38);
        case 'ember':
            return getGradientColor(luma, alpha, { r: 28, g: 10, b: 0 }, { r: 225, g: 154, b: 84 }, { r: 255, g: 239, b: 205 }, 0.38);
        default:
            return getRgbString(255, 255, 255, alpha);
    }
}

function mixRgbStrings(from: string, to: string, amount: number): string {
    const fromRgb = parseRgbString(from);
    const toRgb = parseRgbString(to);
    const t = Math.max(0, Math.min(1, amount));

    const r = Math.round(fromRgb.r + (toRgb.r - fromRgb.r) * t);
    const g = Math.round(fromRgb.g + (toRgb.g - fromRgb.g) * t);
    const b = Math.round(fromRgb.b + (toRgb.b - fromRgb.b) * t);
    const alpha = fromRgb.alpha + (toRgb.alpha - fromRgb.alpha) * t;

    return getRgbString(r, g, b, alpha);
}

function parseRgbString(color: string): { r: number; g: number; b: number; alpha: number } {
    const values = color.match(/[\d.]+/g)?.map(Number) || [255, 255, 255, 1];
    return {
        r: values[0],
        g: values[1],
        b: values[2],
        alpha: values[3] ?? 1
    };
}
