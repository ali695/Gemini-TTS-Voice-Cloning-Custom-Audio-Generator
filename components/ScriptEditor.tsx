
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { VoiceProfile } from '../types';
import { generateSpeech } from '../services/geminiService';
import { createWavBlob, decode, decodeAudioData, sliceAudioBuffer } from '../utils/audioUtils';
import { Waveform } from './Waveform';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { StopIcon } from './icons/StopIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ScissorsIcon } from './icons/ScissorsIcon';
import { DeleteIcon } from './icons/DeleteIcon';

interface ScriptEditorProps {
    profile: VoiceProfile;
    addLog: (message: string) => void;
    generationLog: string[];
    theme: 'light' | 'dark';
}

type ExportFormat = 'wav' | 'mp3' | 'ogg';

interface AudioTake {
    id: string;
    label: string;
    buffer: AudioBuffer;
    timestamp: number;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
};

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ profile, addLog, generationLog, theme }) => {
    const [script, setScript] = useState('Hello, this is a test of my custom generated voice. With this new interface, creating high-quality audio is more intuitive than ever.');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [takes, setTakes] = useState<AudioTake[]>([]);
    const [activeTakeId, setActiveTakeId] = useState<string | null>(null);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('wav');
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [isFormatMenuOpen, setIsFormatMenuOpen] = useState(false);
    
    const [selection, setSelection] = useState<{ start: number, end: number } | null>(null);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const rafRef = useRef<number>();
    const startTimeRef = useRef<number>(0);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const formatMenuRef = useRef<HTMLDivElement>(null);

    const ensureAudioContext = async () => {
        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                const context = new AudioContextClass({ sampleRate: 24000 });
                audioContextRef.current = context;
            }
        }
        if (audioContextRef.current?.state === 'suspended') {
            await audioContextRef.current.resume();
        }
        if (!audioContextRef.current) {
             throw new Error("Audio Context is unavailable in this browser.");
        }
        return audioContextRef.current;
    };
    
    useEffect(() => { 
        stopPlayback(); 
        setAudioBuffer(null); 
        setTakes([]);
        setActiveTakeId(null);
        setCurrentTime(0);
        setSelection(null);
    }, [profile.id]);

    useEffect(() => { if(logContainerRef.current) logContainerRef.current.scrollTop = 0; }, [generationLog]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (formatMenuRef.current && !formatMenuRef.current.contains(event.target as Node)) setIsFormatMenuOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const processAudioData = async (base64Audio: string): Promise<AudioBuffer> => {
        const context = await ensureAudioContext();
        if (base64Audio && context) {
            return await decodeAudioData(decode(base64Audio), context, 24000, 1);
        }
        throw new Error("Received empty audio data or audio context is missing.");
    };

    const handleGenerate = async () => {
        if (!script.trim() || isGenerating) return;
        try { await ensureAudioContext(); } catch (e) { addLog("Error starting audio engine."); return; }

        setIsGenerating(true); stopPlayback(); setAudioBuffer(null); setActiveTakeId(null); setCurrentTime(0); setSelection(null);
        addLog(`Generating audio for "${profile.name}"...`); setIsLogOpen(true);
        
        try {
            const base64Audio = await generateSpeech(script, profile);
            if (!base64Audio) throw new Error("API returned empty audio data.");
            
            const buffer = await processAudioData(base64Audio);
            const newTake: AudioTake = { id: `take_${Date.now()}`, label: 'Original', buffer: buffer, timestamp: Date.now() };
            
            setTakes([newTake]); setAudioBuffer(buffer); setActiveTakeId(newTake.id);
            addLog('Audio generated successfully.');
        } catch (error) { console.error('Generation failed:', error); addLog(`Error: ${error instanceof Error ? error.message : String(error)}`); } finally { setIsGenerating(false); }
    };

    const handleGenerateVariations = async () => {
        if (!script.trim() || isGenerating) return;
        try { await ensureAudioContext(); } catch(e) { return; }

        setIsGenerating(true); stopPlayback(); setAudioBuffer(null); setActiveTakeId(null); setCurrentTime(0);
        addLog(`Generating variations for "${profile.name}"...`); setIsLogOpen(true);

        try {
            const variations = [
                { label: 'Original', settings: { ...profile.settings } },
                { label: 'Expressive', settings: { ...profile.settings, emotionalDepth: Math.min(1, profile.settings.emotionalDepth + 0.3), speed: Math.max(0.5, profile.settings.speed * 0.9) } },
                { label: 'Energetic', settings: { ...profile.settings, speed: Math.min(2, profile.settings.speed * 1.15), pitch: Math.min(1.5, profile.settings.pitch * 1.1) } }
            ];

            const newTakes: AudioTake[] = [];
            for (const variation of variations) {
                addLog(`Processing: ${variation.label}...`);
                const tempProfile = { ...profile, settings: variation.settings };
                try {
                    const base64Audio = await generateSpeech(script, tempProfile);
                    const buffer = await processAudioData(base64Audio);
                    newTakes.push({ id: `take_${Date.now()}_${variation.label}`, label: variation.label, buffer: buffer, timestamp: Date.now() });
                } catch (e) { addLog(`Failed to generate ${variation.label}`); }
            }

            if (newTakes.length > 0) { setTakes(newTakes); setAudioBuffer(newTakes[0].buffer); setActiveTakeId(newTakes[0].id); addLog(`Successfully generated ${newTakes.length} variations.`); } 
            else { throw new Error("Failed to generate any variations."); }
        } catch (error) { addLog(`Error: ${error instanceof Error ? error.message : String(error)}`); } finally { setIsGenerating(false); }
    };

    const handleGenerateHighPitch = async () => {
        if (!script.trim() || isGenerating) return;
        try { await ensureAudioContext(); } catch(e) { return; }

        setIsGenerating(true); stopPlayback();
        addLog(`Generating high pitch take for "${profile.name}"...`); setIsLogOpen(true);

        try {
            const tempProfile = { ...profile, settings: { ...profile.settings, pitch: profile.settings.pitch * 1.1 } };
            const base64Audio = await generateSpeech(script, tempProfile);
            const buffer = await processAudioData(base64Audio);
            const newTake: AudioTake = { id: `take_${Date.now()}_high_pitch`, label: 'High Pitch', buffer: buffer, timestamp: Date.now() };

            setTakes(prev => [...prev, newTake]); setAudioBuffer(buffer); setActiveTakeId(newTake.id); setCurrentTime(0);
            addLog('High pitch audio generated successfully.');
        } catch (error) { addLog(`Error: ${error instanceof Error ? error.message : String(error)}`); } finally { setIsGenerating(false); }
    };

    const selectTake = (takeId: string) => {
        const take = takes.find(t => t.id === takeId);
        if (take) { 
            stopPlayback(); 
            setAudioBuffer(take.buffer); 
            setActiveTakeId(take.id); 
            setCurrentTime(0); 
            setSelection(null);
        }
    };

    const stopPlayback = useCallback((resetTime = false) => {
        if (audioSourceRef.current) { try { audioSourceRef.current.stop(); } catch(e) {} audioSourceRef.current.disconnect(); audioSourceRef.current = null; }
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setIsPlaying(false);
        if (resetTime) setCurrentTime(0);
    }, []);

    const playPlayback = useCallback(async (startTimeOffset = 0) => {
        try { await ensureAudioContext(); } catch(e) { return; }
        if (audioBuffer && audioContextRef.current) {
            if (audioSourceRef.current) { try { audioSourceRef.current.stop(); } catch(e) {} audioSourceRef.current.disconnect(); }
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            
            // Handle looping if selection exists
            const offset = Math.min(startTimeOffset, audioBuffer.duration);
            
            source.start(0, offset);
            audioSourceRef.current = source;
            setIsPlaying(true);
            const contextStartTime = audioContextRef.current.currentTime;
            const trackStartTime = contextStartTime - offset;
            startTimeRef.current = trackStartTime;
            
            const tick = () => {
                if (!audioContextRef.current) return;
                const now = audioContextRef.current.currentTime;
                const elapsed = now - startTimeRef.current;
                
                // If there's a selection and we passed it, stop or loop (just stop for now)
                if (selection && elapsed >= selection.end) {
                     setIsPlaying(false); setCurrentTime(selection.end); stopPlayback(false);
                     return;
                }

                if (elapsed >= audioBuffer.duration) { setIsPlaying(false); setCurrentTime(audioBuffer.duration); stopPlayback(false); } 
                else { setCurrentTime(elapsed); rafRef.current = requestAnimationFrame(tick); }
            };
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(tick);
        }
    }, [audioBuffer, stopPlayback, selection]);

    const handlePlayPause = () => { if (isPlaying) { stopPlayback(false); } else { const resumeTime = (currentTime >= (audioBuffer?.duration || 0)) ? (selection ? selection.start : 0) : currentTime; playPlayback(resumeTime); } };
    const handleSeek = (time: number) => { setCurrentTime(time); if (isPlaying) { playPlayback(time); } };

    const handleDownload = async () => {
        if (!audioBuffer) return;
        addLog(`Preparing download for ${exportFormat.toUpperCase()} format...`); setIsLogOpen(true);
        const blob = createWavBlob(audioBuffer); 
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.style.display = 'none'; a.href = url;
        const takeLabel = takes.find(t => t.id === activeTakeId)?.label || 'audio';
        const cleanName = profile.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `${cleanName}_${takeLabel.toLowerCase()}.${exportFormat}`;
        document.body.appendChild(a); a.click();
        window.URL.revokeObjectURL(url); document.body.removeChild(a);
        addLog(`Download started: ${a.download}`);
    };

    return (
        <div className="h-full flex flex-col space-y-6 p-6 md:p-8">
            <div className="flex-shrink-0">
                <div className="flex justify-between items-center mb-4">
                     <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Script Editor</h2>
                     <div className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium tracking-tight">{script.length} chars</div>
                </div>
                <div className="relative group">
                    <textarea 
                        rows={6} 
                        className="w-full bg-white dark:bg-black/20 rounded-3xl border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm p-6 leading-relaxed resize-none placeholder:text-slate-400 text-slate-800 dark:text-slate-100 font-normal shadow-sm group-hover:shadow-md duration-300 custom-scrollbar" 
                        placeholder="Enter text here to generate speech..." 
                        value={script} 
                        onChange={(e) => setScript(e.target.value)} 
                    />
                    <div className="absolute bottom-4 right-4 text-[10px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-wider pointer-events-none transition-opacity duration-300 group-hover:opacity-50">Ready to Edit</div>
                </div>
            </div>

            <div className="flex-shrink-0 space-y-2">
                <Waveform 
                    buffer={audioBuffer} 
                    currentTime={currentTime} 
                    isPlaying={isPlaying} 
                    onSeek={handleSeek} 
                    selection={selection}
                    onSelectionChange={setSelection}
                    theme={theme} 
                />
                <div className="flex justify-between items-center px-1">
                    <span className="font-mono text-[10px] font-medium text-slate-400 dark:text-slate-500">{formatTime(currentTime)}</span>
                    <span className="font-mono text-[10px] font-medium text-slate-400 dark:text-slate-500">{formatTime(audioBuffer?.duration || 0)}</span>
                </div>
            </div>

            {/* Transport Bar */}
            <div className="flex flex-col md:flex-row gap-4 flex-shrink-0 bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm items-stretch md:items-center min-h-[64px]">
                {/* Playback */}
                <div className="flex items-center gap-2 flex-shrink-0">
                     <button onClick={handlePlayPause} disabled={!audioBuffer || isGenerating} 
                        className={`h-10 w-12 flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                        ${isPlaying 
                            ? 'bg-slate-100 dark:bg-white/10 text-indigo-600 dark:text-indigo-400' 
                            : 'bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200'}`}
                        aria-label={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? <PauseIcon className="w-4 h-4 fill-current" /> : <PlayIcon className="w-4 h-4 ml-0.5 fill-current" />}
                    </button>
                    <button onClick={() => stopPlayback(true)} disabled={!audioBuffer} 
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-white/5 border border-transparent hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Stop"
                    >
                        <StopIcon className="w-4 h-4 fill-current" />
                    </button>
                </div>
                
                {/* Separator */}
                <div className="hidden md:block w-px h-6 bg-slate-200 dark:bg-white/10 mx-2"></div>

                {/* Takes Scroller (Middle) */}
                <div className="flex-grow overflow-x-auto custom-scrollbar h-10 flex items-center gap-2 px-1">
                     {takes.length > 0 ? takes.map(take => (
                        <button key={take.id} onClick={() => selectTake(take.id)} 
                            className={`flex-shrink-0 h-8 px-3.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all duration-200 whitespace-nowrap
                            ${activeTakeId === take.id 
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20 shadow-sm' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                        >
                            {take.label}
                        </button>
                     )) : <span className="text-[10px] font-medium text-slate-400 dark:text-slate-600 uppercase tracking-widest px-2">Ready to generate</span>}
                </div>

                {/* Separator */}
                <div className="hidden md:block w-px h-6 bg-slate-200 dark:bg-white/10 mx-2"></div>

                {/* Export Actions */}
                 <div className="flex items-center gap-2 flex-shrink-0 justify-end">
                     <div className="relative h-10" ref={formatMenuRef}>
                        <button onClick={() => setIsFormatMenuOpen(p => !p)} disabled={!audioBuffer} 
                            className="h-full px-4 text-[10px] font-bold uppercase rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-all border border-slate-200 dark:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {exportFormat} <ChevronDownIcon className="w-3 h-3 opacity-50" />
                        </button>
                        {isFormatMenuOpen && (
                            <div className="absolute bottom-full right-0 mb-2 w-28 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-20 animate-fade-in overflow-hidden">
                                {(['wav', 'mp3', 'ogg'] as const).map(f => (
                                    <button key={f} onClick={() => { setExportFormat(f); setIsFormatMenuOpen(false); }} className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-slate-50 dark:hover:bg-white/5 ${exportFormat === f ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10' : 'text-slate-600 dark:text-slate-300'}`}>{f}</button>
                                ))}
                            </div>
                        )}
                    </div>
                     <button onClick={handleDownload} disabled={!audioBuffer} 
                        className="h-10 px-6 flex items-center gap-2 rounded-xl bg-[#6B7280] hover:bg-[#4B5563] dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black shadow-lg shadow-slate-900/5 dark:shadow-white/5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-[10px] font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    >
                        <span>Export</span> 
                    </button>
                </div>
            </div>

            {/* Main Action Grid */}
            <div className="grid grid-cols-12 gap-4">
                 <button 
                    onClick={handleGenerate} 
                    disabled={isGenerating || !script.trim()} 
                    className={`col-span-12 md:col-span-6 h-16 rounded-2xl 
                    bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                    text-white font-bold text-xs tracking-widest uppercase
                    transition-all duration-300 shadow-xl shadow-indigo-500/30
                    hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]
                    disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none group border border-transparent flex items-center justify-center gap-3`}
                >
                    {isGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <SparklesIcon className="w-5 h-5 text-white/90" />}
                    <span>{isGenerating ? 'Rendering...' : 'Generate Audio'}</span>
                </button>

                <button onClick={handleGenerateVariations} disabled={isGenerating || !script.trim()} 
                    className="col-span-6 md:col-span-3 h-16 flex flex-col items-center justify-center gap-1 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-500/50 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    <span className="text-[10px] font-bold uppercase tracking-wide">Variations</span>
                </button>

                <button onClick={handleGenerateHighPitch} disabled={isGenerating || !script.trim()} 
                    className="col-span-6 md:col-span-3 h-16 flex flex-col items-center justify-center gap-1 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wide">High Pitch</span>
                        <ArrowUpIcon className="w-3 h-3" />
                    </div>
                </button>
            </div>
            
            <div className="flex-grow bg-white dark:bg-[#18181B] rounded-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 transition-all duration-300 shadow-sm">
                <button onClick={() => setIsLogOpen(p => !p)} className="w-full flex justify-between items-center px-5 py-3 bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">System Output</span>
                    </div>
                    <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isLogOpen ? 'rotate-180' : ''}`} />
                </button>
                {isLogOpen && (<div ref={logContainerRef} className="flex-grow overflow-y-auto p-4 font-mono text-[10px] text-slate-600 dark:text-slate-400 space-y-2 custom-scrollbar h-32 bg-white dark:bg-transparent">{generationLog.map((log, i) => (<div key={i} className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 py-0.5 leading-relaxed opacity-90 hover:opacity-100 transition-opacity">{log}</div>))}</div>)}
            </div>
        </div>
    );
};
