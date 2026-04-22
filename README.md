# AsciiVision

ASCII art converter with neon effects, creative controls, and real-time rendering.

## What It Does

AsciiVision converts images into ASCII art with multiple rendering modes, color support, and advanced image processing. Choose between artistic styles like neon glow effects or minimal ASCII representations.

## Quick Start

1. **Upload an image** — Click, paste, or drag-drop into the input area
2. **Adjust settings** (optional) — Tweak brightness, contrast, sharpness
3. **Choose rendering mode** — Classic, Neon, Scanline, or Single Char
4. **Export** — Copy to clipboard, download as TXT or PNG

## Recommended Settings (Optimized)

These settings provide the best balance for most images:

| Setting | Value | Why |
|---------|-------|-----|
| Output Width | 300 | High detail, reasonable file size |
| Brightness | 1.20 | Slightly punchy, visible details |
| Contrast | 2.00 | Sharp tonal separation |
| Gamma | 1.20 | Natural midtone curve |
| Sharpness | 0.00 | Clean baseline (increase if blurry) |
| Aspect Ratio | 1.80 | Corrects character squareness |
| Dithering | ✓ ON | Smoother tonal gradation |
| Invert Character Ramp | ✓ ON | Natural light/dark mapping |
| Colored Output | ✗ OFF | Grayscale for contrast |

<p align="center">
  <img src="images/test-9.png" alt="Test Banner" width="100%" />
</p>

## Control Breakdown

### BASIC Tab

**Output Width** (20-300 chars)
- Lower = blockier, faster
- Higher = finer detail, larger file
- Default: 300 (high-detail first render)

**Brightness** (0-2)
- Adjusts overall image lightness
- 1.0 = original
- Default: 1.2 for punchy visible detail

**Contrast** (0-2)
- Separates light and dark areas
- Higher = more dramatic
- Default: 2.0 for high-impact ASCII

### ADVANCED Tab

**Gamma** (0.5-2)
- Adjusts midtone response
- 1.0 = linear
- Default: 1.2 for a natural curve

**Sharpness** (0-2)
- 0 = soft/smooth
- 0.5+ = detail enhancement
- Increase if image looks blurry

**Aspect Ratio** (0.5-3)
- Corrects stretched/squished look
- Default: 1.8 for balanced character squareness
- Adjust based on your font

**Dithering (Floyd-Steinberg)**
- Adds noise/pattern for smoother tones
- Default: ON
- Better gradation with fewer characters
- Useful for complex images

**Colored Output**
- Maps original RGB to colored ASCII
- Default: OFF
- Off = grayscale (sharper contrast)
- On = artistic multi-color look

**Invert Character Ramp** ✓ DEFAULT
- Inverts dark ↔ light mapping
- Should stay ON for best results
- Off only for artistic inversion

### MODES Tab

**Rendering Modes**

- **CLASSIC** — Full character ramp (@%#*+=-:. ) — Best for detail
- **SINGLE CHAR** — Uses one character (@) with variable density — Minimal, bold look
- **SCANLINE** — Horizontal line pattern (⎯) — Retro CRT effect
- **NEON** — RGB color output with glowing effect — Vibrant, cyberpunk style

### NEON Mode Controls

**Neon Palette** (MATRIX, CYAN, PURPLE, PINK, BLUE)
- Color scheme for the glow effect
- MATRIX (green) = default cyberpunk

**Glow Intensity** (0-2)
- 0 = no glow (flat color)
- 1.0 = subtle glow
- 1.8-2.5 = heavy glow (PNG export recommended)

<p align="center">
  <img src="images/test-3.png" alt="Test Banner" width="100%" />
</p>

## Export Options

**Copy** — Clipboard text (plain ASCII)
**TXT** — Download plain text file
**PNG** — Download as high-quality image (includes glow effects)

## How It Works

1. **Downsampling** — Image reduced to target width
2. **Luminance Mapping** — Each pixel converted to brightness value
3. **Auto-Contrast** — Min-max normalization for punch
4. **Sharpening** — Optional convolution filter
5. **Dithering** — Floyd-Steinberg error diffusion (optional)
6. **Character Mapping** — Brightness mapped to ASCII characters
7. **Color Mapping** — RGB values assigned to each character (if enabled)
8. **Glow Rendering** — Multi-layer shadow effects (PNG export)

<p align="center">
  <img src="images/test-3.png" alt="Test Banner" width="100%" />
</p>


## Tips & Tricks

- **High contrast images** work best (portraits, logos, silhouettes)
- **Increase width** for finer detail, decrease for speed
- **Adjust contrast first**, brightness second
- **Neon mode + PNG export** = stunning wall-worthy art
- **Enable dithering** for photos with lots of gradients
- **Disable dithering** for clean, bold graphic images
- **Single Char mode** = minimal zen aesthetic

## Built With

- React + TypeScript
- Vite (fast builds)
- TailwindCSS (styling)
- Canvas API (rendering & export)

## License

Public domain — Use, modify, distribute freely. No restrictions.

## Contribute

Found an issue? Have an idea? Submit a PR to [github.com/ah4ddd/ascii-vision](https://github.com/ah4ddd/ascii-vision)

---

<p align="center">
  <img src="images/test.png" alt="Test Banner" width="100%" />
</p>

**Made with ❤️ for ASCII enthusiasts**
