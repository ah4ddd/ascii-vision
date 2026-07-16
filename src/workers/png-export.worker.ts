/**
 * PNG Export Web Worker
 * Handles heavy canvas rendering off the main thread
 */

interface PngExportMessage {
    glyphRows: string[][];
    width: number;
    height: number;
    fontSize: number;
    charWidth: number;
    colors?: string[][];
    colorMode: 'grayscale' | 'color';
    mode: string;
    glyphLanguage: string;
    fontStack: string;
    glowIntensity: number;
    bloomIntensity: number;
    cellAspectRatio: number;
}

self.onmessage = (event: MessageEvent<PngExportMessage>) => {
    try {
        const {
            glyphRows,
            width,
            height,
            fontSize,
            charWidth,
            colors,
            colorMode,
            mode,
            fontStack,
            glowIntensity,
            bloomIntensity,
        } = event.data;

        // Create offscreen canvas
        const canvas = new OffscreenCanvas(
            Math.ceil(width * charWidth),
            glyphRows.length * fontSize
        );

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${fontSize}px ${fontStack}`;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.direction = 'ltr';

        const useColors = (colorMode === 'color' || mode === 'neon' || mode === 'single-char') && colors;
        const isNeon = mode === 'neon';

        glyphRows.forEach((glyphs, y) => {
            glyphs.forEach((char, x) => {
                if (char === ' ') return;

                let color = '#fff';
                if (useColors) {
                    color = colors![y]?.[x] || '#fff';
                }

                const drawX = x * charWidth;
                const drawY = y * fontSize;

                if (isNeon) {
                    ctx.shadowColor = color;
                    ctx.fillStyle = color;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;

                    // Optimized multi-pass: bloom + glow + text (fast & quality)
                    // Pass 1: Subtle outer bloom (spreads wide, gives presence)
                    if (bloomIntensity > 0) {
                        ctx.shadowBlur = 3 * bloomIntensity;
                        ctx.fillText(char, drawX, drawY);
                    }

                    // Pass 2: Main glow (strong core effect)
                    if (glowIntensity > 0) {
                        ctx.shadowBlur = 5 * glowIntensity;
                        ctx.fillText(char, drawX, drawY);
                    }

                    // Pass 3: Crisp final text
                    ctx.shadowBlur = 0;
                    ctx.fillText(char, drawX, drawY);
                } else {
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = color;
                    ctx.fillText(char, drawX, drawY);
                }
            });
        });

        // Convert to blob
        canvas.convertToBlob({ type: 'image/png', quality: 1 }).then((blob) => {
            self.postMessage({ success: true, blob }, [blob]);
        }).catch((error) => {
            self.postMessage({ success: false, error: error.message });
        });
    } catch (error) {
        self.postMessage({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
