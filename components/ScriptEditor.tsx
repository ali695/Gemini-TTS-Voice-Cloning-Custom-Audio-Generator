import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { VoiceProfile } from '../types';
import { generateSpeech } from '../services/geminiService';
import { createWavBlob, decode, decodeAudioData } from '../utils/audioUtils';
import { Waveform } from './Waveform';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { StopIcon } from './icons/StopIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { SparklesIcon } from './icons/SparklesIcon';

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

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ profile, addLog, generationLog, theme }) => {
    const [script, setScript] = useState('Hello, this is a test of my custom generated voice. With this new interface, creating high-quality audio is more intuitive than ever.');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [takes, setTakes] = useState<AudioTake[]>([]);
    const [activeTakeId, setActiveTakeId] = useState<string | null>(null);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('wav');
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [isFormatMenuOpen, setIsFormatMenuOpen] = useState(false);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const formatMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!audioContextRef.current) {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = context;
            analyserRef.current = context.createAnalyser();
            analyserRef.current.fftSize = 256;
        }
        return () => { if (audioSourceRef.current) audioSourceRef.current.stop(); };
    }, []);
    
    useEffect(() => { 
        stopPlayback(); 
        setAudioBuffer(null); 
        setTakes([]);
        setActiveTakeId(null);
    }, [profile.id]);

    useEffect(() => { if(logContainerRef.current) logContainerRef.current.scrollTop = 0; }, [generationLog]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (formatMenuRef.current && !formatMenuRef.current.contains(event.target as Node)) setIsFormatMenuOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const processAudioData = async (base64Audio: string | null): Promise<AudioBuffer> => {
        if (base64Audio && audioContextRef.current) {
            return await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
        }
        throw new Error("Received empty audio data or audio context is missing.");
    };

    const handleGenerate = async () => {
        if (!script.trim() || isGenerating) return;
        setIsGenerating(true); setIsPlaying(false); setAudioBuffer(null); setActiveTakeId(null);
        addLog(`Generating audio for "${profile.name}"...`); setIsLogOpen(true);
        
        try {
            const base64Audio = await generateSpeech(script, profile);
            addLog('Audio data received. Decoding...');
            const buffer = await processAudioData(base64Audio);
            
            const newTake: AudioTake = {
                id: `take_${Date.now()}`,
                label: 'Original',
                buffer: buffer,
                timestamp: Date.now()
            };
            
            setTakes([newTake]);
            setAudioBuffer(buffer);
            setActiveTakeId(newTake.id);
            addLog('Audio generated successfully.');
        } catch (error) {
            console.error('Generation failed:', error);
            addLog(`Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally { setIsGenerating(false); }
    };

    const handleGenerateVariations = async () => {
        if (!script.trim() || isGenerating) return;
        setIsGenerating(true); setIsPlaying(false); setAudioBuffer(null); setActiveTakeId(null);
        addLog(`Generating variations for "${profile.name}"...`); setIsLogOpen(true);

        try {
            // Define variations with unique settings modifications
            const variations = [
                { label: 'Original', settings: { ...profile.settings } },
                { label: 'Expressive', settings: { 
                    ...profile.settings, 
                    emotionalDepth: Math.min(1, profile.settings.emotionalDepth + 0.3),
                    speed: Math.max(0.5, profile.settings.speed * 0.9)
                }},
                { label: 'Energetic', settings: { 
                    ...profile.settings, 
                    speed: Math.min(2, profile.settings.speed * 1.15), 
                    pitch: Math.min(1.5, profile.settings.pitch * 1.1) 
                }}
            ];

            const newTakes: AudioTake[] = [];

            for (const variation of variations) {
                addLog(`Processing: ${variation.label}...`);
                const tempProfile = { ...profile, settings: variation.settings };
                try {
                    const base64Audio = await generateSpeech(script, tempProfile);
                    const buffer = await processAudioData(base64Audio);
                    newTakes.push({
                        id: `take_${Date.now()}_${variation.label}`,
                        label: variation.label,
                        buffer: buffer,
                        timestamp: Date.now()
                    });
                } catch (e) {
                    addLog(`Failed to generate ${variation.label}: ${e instanceof Error ? e.message : 'Unknown error'}`);
                }
            }

            if (newTakes.length > 0) {
                setTakes(newTakes);
                setAudioBuffer(newTakes[0].buffer);
                setActiveTakeId(newTakes[0].id);
                addLog(`Successfully generated ${newTakes.length} variations.`);
            } else {
                throw new Error("Failed to generate any variations.");
            }
        } catch (error) {
            console.error('Variation generation failed:', error);
            addLog(`Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally { setIsGenerating(false); }
    };

    const selectTake = (takeId: string) => {
        const take = takes.find(t => t.id === takeId);
        if (take) {
            stopPlayback();
            setAudioBuffer(take.buffer);
            setActiveTakeId(take.id);
        }
    };

    const stopPlayback = useCallback(() => {
        if (audioSourceRef.current) { audioSourceRef.current.stop(); audioSourceRef.current.disconnect(); audioSourceRef.current = null; }
        setIsPlaying(false);
    }, []);

    const playPlayback = useCallback(() => {
        if (audioBuffer && audioContextRef.current && analyserRef.current) {
            stopPlayback(); 
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(analyserRef.current);
            analyserRef.current.connect(audioContextRef.current.destination);
            source.onended = () => { setIsPlaying(false); if(source === audioSourceRef.current) audioSourceRef.current = null; };
            source.start(0); audioSourceRef.current = source;
            setIsPlaying(true);
        }
    }, [audioBuffer, stopPlayback]);

    const handlePlayPause = () => { if (isPlaying) stopPlayback(); else playPlayback(); };

    const handleDownload = async () => {
        if (!audioBuffer) return;
        addLog(`Preparing download for ${exportFormat.toUpperCase()} format...`); setIsLogOpen(true);
        const blob = createWavBlob(audioBuffer); 
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.style.display = 'none'; a.href = url;
        
        const takeLabel = takes.find(t => t.id === activeTakeId)?.label || 'audio';
        const cleanName = profile.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const cleanLabel = takeLabel.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        a.download = `${cleanName}_${cleanLabel}.${exportFormat}`;
        document.body.appendChild(a); a.click();
        window.URL.revokeObjectURL(url); document.body.removeChild(a);
        addLog(`Download started: ${a.download}`);
    };

    return (
        <div className="h-full flex flex-col space-y-6 p-6">
            <div className="flex-shrink-0">
                <div className="flex justify-between items-center mb-3">
                     <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Script Editor</h2>
                     <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">{script.length} chars</div>
                </div>
                <textarea rows={6} className="w-full bg-slate-50 dark:bg-black/20 font-mono rounded-2xl border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400/50 focus:border-blue-500 dark:focus:border-cyan-400 transition-all text-sm p-5 leading-relaxed shadow-inner resize-none placeholder:text-slate-400 text-slate-800 dark:text-slate-200" placeholder="Enter text here to generate speech..." value={script} onChange={(e) => setScript(e.target.value)} />
            </div>

            {/* Visualizer Area */}
            <div className="relative flex items-center justify-center bg-slate-900 dark:bg-black/60 p-0 rounded-2xl flex-shrink-0 shadow-inner border border-slate-200 dark:border-white/5 overflow-hidden h-24">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(59,130,246,0.1),_transparent_70%)]"></div>
                <Waveform isPlaying={isPlaying} analyserNode={analyserRef.current} theme={theme} />
            </div>

            {/* DAW Transport Bar */}
            <div className="flex flex-col gap-4 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-2 shadow-sm">
                <div className="flex items-center gap-2">
                    {/* Playback Controls */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/20 rounded-xl p-1 border border-slate-200 dark:border-white/5">
                         <button 
                            onClick={handlePlayPause} 
                            disabled={!audioBuffer || isGenerating} 
                            className={`p-3 rounded-lg transition-all duration-200 active:scale-95 ${isPlaying ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                            aria-label={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                        </button>
                        <button 
                            onClick={stopPlayback} 
                            disabled={!isPlaying} 
                            className="p-3 rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            aria-label="Stop"
                        >
                            <StopIcon className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Multi-take Selector */}
                    <div className="flex-grow flex items-center gap-1.5 px-2 overflow-x-auto custom-scrollbar h-12">
                         {takes.length > 0 ? (
                             takes.map((take) => (
                                <button
                                    key={take.id}
                                    onClick={() => selectTake(take.id)}
                                    className={`relative flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border group h-full
                                        ${activeTakeId === take.id
                                            ? 'bg-blue-50 dark:bg-cyan-900/20 text-blue-600 dark:text-cyan-400 border-blue-200 dark:border-cyan-500/30 shadow-sm'
                                            : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-white/10'
                                    }`}
                                >
                                    {take.label}
                                    {activeTakeId === take.id && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-cyan-400"></span>}
                                </button>
                            ))
                         ) : (
                             <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-lg">
                                <span className="text-xs font-semibold text-slate-300 dark:text-slate-600 uppercase tracking-wider">No takes generated</span>
                             </div>
                         )}
                    </div>

                    {/* Download Controls */}
                     <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/20 rounded-xl p-1 border border-slate-200 dark:border-white/5">
                         <div className="relative" ref={formatMenuRef}>
                            <button 
                                disabled={!audioBuffer}
                                onClick={() => setIsFormatMenuOpen(p => !p)} 
                                className="px-3 h-11 text-xs font-bold uppercase rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 disabled:opacity-50 transition-colors"
                            >
                                {exportFormat}
                            </button>
                            {isFormatMenuOpen && (<div className="absolute bottom-full right-0 mb-2 w-24 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-20">{([ 'wav', 'mp3', 'ogg'] as const).map(f => (<button key={f} onClick={() => { setExportFormat(f); setIsFormatMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold uppercase hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300">{f}</button>))}</div>)}
                        </div>
                         <button 
                            onClick={handleDownload} 
                            disabled={!audioBuffer}
                            className="h-11 w-11 flex items-center justify-center rounded-lg bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-700 dark:hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md" 
                            aria-label="Download"
                        >
                            <DownloadIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                 <button 
                    onClick={handleGenerate} 
                    disabled={isGenerating || !script.trim()} 
                    className={`sm:col-span-8 relative overflow-hidden py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-black font-bold text-lg tracking-tight transition-all duration-200 shadow-lg shadow-blue-500/20 dark:shadow-cyan-400/20 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none group`}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1s_ease-in-out]"></div>
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        {isGenerating ? (
                            <>
                                <div className="w-5 h-5 border-3 border-current border-t-transparent rounded-full animate-spin"></div>
                                <span>Rendering Audio...</span>
                            </>
                        ) : (
                            <span>Generate Audio</span>
                        )}
                    </span>
                </button>

                <button 
                    onClick={handleGenerateVariations} 
                    disabled={isGenerating || !script.trim()} 
                    className="sm:col-span-4 relative flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-xl bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 font-semibold text-sm transition-all duration-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-500/50 disabled:opacity-50 shadow-sm"
                >
                    <SparklesIcon className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wide">Generate Variations</span>
                </button>
            </div>
            
            <div className="flex-grow bg-slate-50 dark:bg-black/40 rounded-xl overflow-hidden flex flex-col border border-slate-200 dark:border-white/5">
                <button 
                    onClick={() => setIsLogOpen(p => !p)} 
                    className="w-full flex justify-between items-center text-left px-4 py-3 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors border-b border-slate-200 dark:border-white/5"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">System Output</span>
                    </div>
                    <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isLogOpen ? 'rotate-180' : ''}`} />
                </button>
                {isLogOpen && (<div id="generation-log-panel" ref={logContainerRef} className="flex-grow overflow-y-auto p-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 space-y-2 custom-scrollbar h-32 bg-slate-50/50 dark:bg-transparent">{generationLog.map((log, i) => (<div key={i} className="border-l-2 border-slate-300 dark:border-slate-700 pl-3 py-0.5 leading-relaxed opacity-90 hover:opacity-100 transition-opacity">{log}</div>))}</div>)}
            </div>
        </div>
    );
};