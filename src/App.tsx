import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Upload,
    Image as ImageIcon,
    Copy,
    Download,
    Monitor,
    Sun,
    Contrast,
    Layers,
    Maximize,
    ChevronRight,
    ChevronLeft,
    Palette,
    Check,
    Zap
} from 'lucide-react';
import { convertToAscii, AsciiOptions, AsciiResult, QUALITY_RAMP, STRONG_RAMP } from './lib/ascii-engine';

const DEFAULT_RAMP = STRONG_RAMP;
const FULL_RAMP = QUALITY_RAMP;
const SHORT_RAMP = " .:-=+*#%@";
const BLOCK_RAMP = " ░▒▓█";

const DEFAULT_OPTIONS: AsciiOptions = {
    width: 300,
    brightness: 1.2,
    contrast: 2.0,
    gamma: 1.2,
    ramp: DEFAULT_RAMP,
    invert: true,
    colorMode: 'grayscale',
    aspectRatio: 1.8,
    dithering: true,
    sharpen: 0,
    mode: 'classic',
    singleChar: '@',
    neonPalette: 'matrix',
    glowIntensity: 0.8
};

function AppLogo() {
    return (
        <svg
            className="w-6 h-6 text-white"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M9.5 4.5 3.8 12l5.7 7.5"
                stroke="currentColor"
                strokeWidth="3.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="m14.5 4.5 5.7 7.5-5.7 7.5"
                stroke="currentColor"
                strokeWidth="3.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function GitHubIcon({ className = "h-4 w-4" }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
    );
}

export default function App() {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [asciiResult, setAsciiResult] = useState<AsciiResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'modes'>('basic');

    const [options, setOptions] = useState<AsciiOptions>(DEFAULT_OPTIONS);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const outputRef = useRef<HTMLElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            loadImage(file);
        }
    };

    const loadImage = (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                setImage(img);
                setPreviewUrl(event.target?.result as string);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handlePaste = useCallback((e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (items) {
            for (const item of Array.from(items)) {
                if (item.type.startsWith('image')) {
                    const file = item.getAsFile();
                    if (file) loadImage(file);
                }
            }
        }
    }, []);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image')) {
            loadImage(file);
        }
    };

    useEffect(() => {
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handlePaste]);

    const runConversion = useCallback(async () => {
        if (!image) return;
        setIsProcessing(true);
        try {
            const result = await convertToAscii(image, options);
            setAsciiResult(result);
        } catch (err) {
            console.error('Conversion failed', err);
        } finally {
            setIsProcessing(false);
        }
    }, [image, options]);

    // Progressive updates/Debounced
    useEffect(() => {
        const timeout = setTimeout(runConversion, 150);
        return () => clearTimeout(timeout);
    }, [runConversion]);

    const copyToClipboard = () => {
        if (asciiResult) {
            navigator.clipboard.writeText(asciiResult.text);
        }
    };

    const downloadTxt = () => {
        if (asciiResult) {
            const blob = new Blob([asciiResult.text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ascii-art.txt';
            a.click();
        }
    };

    const downloadPng = () => {
        if (!asciiResult) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const fontSize = 12;
        const charWidth = 7.2; // Approximate for JetBrains Mono
        const charHeight = 12;

        canvas.width = asciiResult.width * charWidth;
        canvas.height = (asciiResult.text.split('\n').length - 1) * charHeight;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
        ctx.textBaseline = 'top';

        const lines = asciiResult.text.split('\n');
        lines.forEach((line, y) => {
            line.split('').forEach((char, x) => {
                let color = '#fff';
                if ((options.colorMode === 'color' || options.mode === 'neon' || options.mode === 'single-char') && asciiResult.colors) {
                    color = asciiResult.colors[y]?.[x] || '#fff';
                }

                if (options.mode === 'neon') {
                    // Match UI glow subtly - same formula as textShadow in preview
                    const glowStrength = options.glowIntensity || 1;

                    // Inner glow layer (matches UI's 2x multiplier)
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 2 * glowStrength;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    ctx.fillStyle = color;
                    ctx.fillText(char, x * charWidth, y * charHeight);

                    // Outer glow layer (matches UI's 8x multiplier)
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 8 * glowStrength;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    ctx.fillStyle = color;
                    ctx.fillText(char, x * charWidth, y * charHeight);
                } else {
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = color;
                    ctx.fillText(char, x * charWidth, y * charHeight);
                }
            });
        });

        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ascii-art.png';
        a.click();
    };

    const handleReset = () => {
        setOptions(DEFAULT_OPTIONS);
    };

    const scrollToOutput = () => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div
            className="flex min-h-screen flex-col overflow-y-auto bg-[#0a0a0a] text-zinc-300 font-sans md:h-screen md:flex-row md:overflow-hidden"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            {/* Sidebar Controls */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ x: -320 }}
                        animate={{ x: 0 }}
                        exit={{ x: -320 }}
                        className="z-20 flex w-full flex-none flex-col border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl md:h-full md:w-80 md:border-b-0 md:border-r"
                    >
                        <div className="flex items-center justify-between border-b border-white/5 p-4 sm:p-6">
                            <div className="flex items-center gap-2">
                                <div className="relative w-8 h-8 overflow-hidden rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-[0_0_18px_rgba(37,99,235,0.28)]">
                                    <div className="absolute -inset-2 flex items-center justify-center text-[5px] leading-[4px] font-mono font-black text-white/18 tracking-[0.6px] rotate-[-12deg] select-none">
                                        <span className="block w-16 text-center">
                                            A@#%*+=:.V
                                            <br />
                                            #vXo/|()1@
                                            <br />
                                            .:-=+*#%@$
                                            <br />
                                            @WMB8&%#*
                                            <br />
                                            zcvunxrjf/
                                            <br />
                                            +~&lt;&gt;i!lI;
                                            <br />
                                            %$@#AV:+=
                                        </span>
                                    </div>
                                    <div className="relative z-10">
                                        <AppLogo />
                                    </div>
                                </div>
                                <h1 className="font-display font-bold text-xl text-white tracking-tight">AsciiVision</h1>
                            </div>
                            <div className="flex items-center gap-2 md:hidden">
                                <a
                                    href="https://github.com/ah4ddd/ascii-vision"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                                    aria-label="View AsciiVision on GitHub"
                                    title="View on GitHub"
                                >
                                    <GitHubIcon />
                                </a>
                                <button
                                    onClick={scrollToOutput}
                                    disabled={!asciiResult}
                                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="View generated output"
                                >
                                    <Monitor className="h-4 w-4" />
                                    <span>Output</span>
                                </button>
                            </div>
                        </div>

                        <div className="ascii-scroll space-y-6 scroll-smooth p-4 sm:p-6 md:flex-1 md:space-y-8 md:overflow-y-auto">
                            {/* Input Section */}
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3" /> Input Source
                                </h2>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-zinc-800 p-4 transition-all duration-300 hover:border-indigo-500/50 hover:bg-indigo-500/5"
                                >
                                    <label className="flex flex-col items-center justify-center gap-2 text-sm text-zinc-400 group-hover:text-zinc-200">
                                        <Upload className="w-6 h-6 mb-1" />
                                        <span>Click, Paste, or Drop</span>
                                    </label>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    {previewUrl && (
                                        <div className="relative mt-3 max-h-[42vh] overflow-hidden rounded-lg border border-white/5 bg-black md:aspect-video md:max-h-none">
                                            <img src={previewUrl} alt="Preview" className="max-h-[42vh] w-full object-contain md:h-full md:max-h-none" />
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Tabs */}
                            <div className="flex p-1 bg-zinc-900 rounded-lg">
                                {(['basic', 'advanced', 'modes'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === tab ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Controls */}
                            <div className="space-y-6">
                                {activeTab === 'basic' && (
                                    <>
                                        <ControlSlider
                                            label="Output Width"
                                            icon={<Maximize className="w-3.5 h-3.5" />}
                                            value={options.width}
                                            min={20} max={300} step={1}
                                            onChange={(v) => setOptions({ ...options, width: v })}
                                        />
                                        <ControlSlider
                                            label="Brightness"
                                            icon={<Sun className="w-3.5 h-3.5" />}
                                            value={options.brightness}
                                            min={0} max={2} step={0.01}
                                            onChange={(v) => setOptions({ ...options, brightness: v })}
                                        />
                                        <ControlSlider
                                            label="Contrast"
                                            icon={<Contrast className="w-3.5 h-3.5" />}
                                            value={options.contrast}
                                            min={0} max={2} step={0.01}
                                            onChange={(v) => setOptions({ ...options, contrast: v })}
                                        />
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-zinc-400 flex items-center gap-2">
                                                <Layers className="w-3.5 h-3.5" /> Character Ramp
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { name: 'Strong', val: STRONG_RAMP },
                                                    { name: 'Detailed', val: FULL_RAMP },
                                                    { name: 'Blocks', val: BLOCK_RAMP },
                                                    { name: 'Minimal', val: " .@" }
                                                ].map((r) => (
                                                    <button
                                                        key={r.name}
                                                        onClick={() => setOptions({ ...options, ramp: r.val })}
                                                        className={`px-3 py-2 text-[10px] rounded-md border transition-all ${options.ramp === r.val ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/20'}`}
                                                    >
                                                        {r.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {activeTab === 'advanced' && (
                                    <>
                                        <ControlSlider
                                            label="Gamma"
                                            icon={<Palette className="w-3.5 h-3.5" />}
                                            value={options.gamma}
                                            min={0.1} max={3} step={0.1}
                                            onChange={(v) => setOptions({ ...options, gamma: v })}
                                        />
                                        <ControlSlider
                                            label="Sharpness"
                                            icon={<Zap className="w-3.5 h-3.5" />}
                                            value={options.sharpen}
                                            min={0} max={2} step={0.1}
                                            onChange={(v) => setOptions({ ...options, sharpen: v })}
                                        />
                                        <ControlSlider
                                            label="Aspect Ratio Correction"
                                            icon={<Monitor className="w-3.5 h-3.5" />}
                                            value={options.aspectRatio}
                                            min={1} max={3} step={0.1}
                                            onChange={(v) => setOptions({ ...options, aspectRatio: v })}
                                        />
                                        <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${options.dithering ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-zinc-700'}`} />
                                                <span className="text-xs font-medium">Dithering (Floyd-Steinberg)</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={options.dithering}
                                                onChange={(e) => setOptions({ ...options, dithering: e.target.checked })}
                                                className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${options.colorMode === 'color' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-zinc-700'}`} />
                                                <span className="text-xs font-medium">Colored Output</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={options.colorMode === 'color'}
                                                onChange={(e) => setOptions({ ...options, colorMode: e.target.checked ? 'color' : 'grayscale' })}
                                                className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-white/5">
                                            <div className="flex items-center gap-2 text-xs font-medium">
                                                Invert Character Ramp
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={options.invert}
                                                onChange={(e) => setOptions({ ...options, invert: e.target.checked })}
                                                className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                    </>
                                )}

                                {activeTab === 'modes' && (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-zinc-400">Rendering Mode</label>
                                            <div className="grid grid-cols-1 gap-2">
                                                {(['classic', 'single-char', 'scanline', 'neon'] as const).map((m) => (
                                                    <button
                                                        key={m}
                                                        onClick={() => setOptions({ ...options, mode: m })}
                                                        className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-left rounded-md border transition-all ${options.mode === m ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/20'}`}
                                                    >
                                                        {m.replace('-', ' ')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {options.mode === 'single-char' && (
                                            <div className="p-3 bg-zinc-900 rounded-lg border border-white/5 space-y-2">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase">Single Character</label>
                                                <input
                                                    type="text"
                                                    maxLength={1}
                                                    value={options.singleChar}
                                                    onChange={(e) => setOptions({ ...options, singleChar: e.target.value })}
                                                    className="w-full bg-zinc-950 border border-white/10 rounded px-2 py-1 text-white text-center font-mono"
                                                />
                                            </div>
                                        )}

                                        {options.mode === 'neon' && (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Neon Palette</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {(['matrix', 'cyan', 'purple', 'pink', 'blue'] as const).map((p) => (
                                                            <button
                                                                key={p}
                                                                onClick={() => setOptions({ ...options, neonPalette: p })}
                                                                className={`px-2 py-1.5 text-[10px] rounded-md border transition-all ${options.neonPalette === p ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/20'}`}
                                                            >
                                                                {p.toUpperCase()}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <ControlSlider
                                                    label="Glow Intensity"
                                                    icon={<Check className="w-3.5 h-3.5" />}
                                                    value={options.glowIntensity || 0.8}
                                                    min={0} max={2} step={0.1}
                                                    onChange={(v) => setOptions({ ...options, glowIntensity: v })}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-white/5 bg-zinc-900/50 p-4 sm:p-6">
                            <button
                                onClick={handleReset}
                                className="w-full py-2.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider"
                            >
                                Reset Defaults
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Sidebar Button (Desktop Only) */}
            <button
                onClick={() => setShowControls(!showControls)}
                className="hidden md:flex absolute left-4 bottom-4 z-30 w-10 h-10 items-center justify-center bg-zinc-900 border border-white/10 rounded-full hover:bg-zinc-800 transition-colors shadow-2xl"
            >
                {showControls ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>

            {/* Main Preview Area */}
            <main ref={outputRef} className="relative flex min-h-[75vh] w-full flex-none scroll-mt-0 flex-col bg-black md:min-h-0 md:flex-1 md:min-w-0">
                <header className="z-10 flex min-h-16 flex-col gap-3 border-b border-white/5 bg-zinc-950/50 px-4 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between md:h-16 md:px-6 md:py-0">
                    <div className="flex items-center gap-4">
                        {!showControls && (
                            <button
                                onClick={() => setShowControls(true)}
                                className="p-2 hover:bg-white/5 rounded-full"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        )}
                        <div className="text-sm font-medium text-zinc-400">
                            {asciiResult ? `${asciiResult.width} × ${asciiResult.height} chars` : 'No Image Loaded'}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
                        <button
                            onClick={copyToClipboard}
                            disabled={!asciiResult}
                            className="flex items-center justify-center gap-2 rounded-md border border-white/5 bg-zinc-800 px-3 py-2 text-xs font-medium transition-all hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 sm:py-1.5"
                        >
                            <Copy className="w-3.5 h-3.5" /> <span>Copy</span>
                        </button>
                        <button
                            onClick={downloadTxt}
                            disabled={!asciiResult}
                            className="flex items-center justify-center gap-2 rounded-md border border-white/5 bg-zinc-800 px-3 py-2 text-xs font-medium transition-all hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 sm:py-1.5"
                        >
                            <Download className="w-3.5 h-3.5" /> <span>TXT</span>
                        </button>
                        <button
                            onClick={downloadPng}
                            disabled={!asciiResult}
                            className="flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white shadow-lg shadow-indigo-500/10 transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:py-1.5"
                        >
                            <ImageIcon className="w-3.5 h-3.5" /> <span>PNG</span>
                        </button>
                        <a
                            href="https://github.com/ah4ddd/ascii-vision"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden rounded-md border border-white/5 p-1.5 text-zinc-400 transition-all hover:border-white/10 hover:bg-zinc-800 hover:text-white sm:block"
                            title="View on GitHub"
                        >
                            <GitHubIcon />
                        </a>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-8 bg-[#050505] relative ascii-scroll">
                    {isProcessing && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-medium text-indigo-400">Processing...</span>
                            </div>
                        </div>
                    )}

                    {!asciiResult && !isProcessing && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-6">
                                <ImageIcon className="w-8 h-8 text-zinc-600" />
                            </div>
                            <h3 className="text-lg font-display font-semibold text-white mb-2">No image selected</h3>
                            <p className="text-sm text-zinc-500 max-w-xs mx-auto mb-8">
                                Drop an image here or use the upload button in the sidebar to start creating ASCII art.
                            </p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"
                            >
                                Upload Photo
                            </button>
                        </div>
                    )}

                    {asciiResult && (
                        <div className={`inline-block min-w-full ${options.mode === 'neon' ? 'neon-glow' : ''}`}>
                            <pre
                                className="font-mono whitespace-pre cursor-default selection:bg-indigo-500/30 transition-all duration-300"
                                style={{
                                    lineHeight: '1',
                                    fontSize: `${Math.max(4, 12 - (options.width / 20))}px`,
                                    ...(options.mode === 'neon' ? {
                                        textShadow: `0 0 ${2 * (options.glowIntensity || 1)}px currentColor, 0 0 ${8 * (options.glowIntensity || 1)}px currentColor`
                                    } : {})
                                }}
                            >
                                {(options.colorMode === 'color' || options.mode === 'neon' || options.mode === 'single-char') && asciiResult.colors ? (
                                    asciiResult.text.split('\n').map((line, y) => (
                                        <div key={y} className="flex leading-none">
                                            {line.split('').map((char, x) => (
                                                <span key={`${x}-${y}`} style={{ color: asciiResult.colors![y]?.[x] }}>
                                                    {char}
                                                </span>
                                            ))}
                                        </div>
                                    ))
                                ) : (
                                    asciiResult.text
                                )}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Floating Tooltips or Status */}
                <div className="absolute bottom-6 right-6 flex items-center gap-4 text-[10px] text-zinc-500 font-mono">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        READY
                    </div>
                    <div className="px-2 py-0.5 rounded bg-zinc-900 border border-white/5">
                        LUMINANCE: PERCEPTUAL
                    </div>
                </div>
            </main>
        </div>
    );
}

function ControlSlider({
    label,
    value,
    min,
    max,
    step,
    onChange,
    icon
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
    icon?: React.ReactNode;
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-400 flex items-center gap-2">
                    {icon} {label}
                </label>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 rounded border border-indigo-500/20">
                    {value.toFixed(step < 1 ? 2 : 0)}
                </span>
            </div>
            <input
                type="range"
                min={min} max={max} step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
            />
        </div>
    );
}
