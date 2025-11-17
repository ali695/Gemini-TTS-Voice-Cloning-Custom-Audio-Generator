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

interface ScriptEditorProps {
    profile: VoiceProfile;
    addLog: (message: string) => void;
    generationLog: string[];
}

type ExportFormat = 'wav' | 'mp3' | 'ogg';

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ profile, addLog, generationLog }) => {
    const [script, setScript] = useState('Hello, this is a test of my custom generated voice. With this new interface, creating high-quality audio is more intuitive than ever.');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('wav');
    const [isLogOpen, setIsLogOpen] = useState(false);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        return () => {
            if (audioSourceRef.current) {
                audioSourceRef.current.stop();
            }
        };
    }, []);
    
    useEffect(() => {
        stopPlayback();
        setAudioBuffer(null);
    }, [profile.id]);

    useEffect(() => {
        if(logContainerRef.current) {
            logContainerRef.current.scrollTop = 0;
        }
    }, [generationLog]);

    const handleGenerate = async () => {
        if (!script.trim() || isGenerating) return;

        setIsGenerating(true);
        setIsPlaying(false);
        setAudioBuffer(null);
        addLog(`Generating audio for "${profile.name}"...`);
        setIsLogOpen(true);

        try {
            const base64Audio = await generateSpeech(script, profile);
            addLog('Audio data received. Decoding...');

            if (base64Audio && audioContextRef.current) {
                const audioData = decode(base64Audio);
                const buffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
                setAudioBuffer(buffer);
                addLog('Audio generated and decoded successfully.');
            } else {
                throw new Error("Received empty audio data from API.");
            }
        } catch (error) {
            console.error('Generation failed:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`Error generating audio: ${errorMessage}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const stopPlayback = useCallback(() => {
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
            audioSourceRef.current.disconnect();
            audioSourceRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    const playPlayback = useCallback(() => {
        if (audioBuffer && audioContextRef.current) {
            stopPlayback(); 
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => {
                setIsPlaying(false);
                audioSourceRef.current = null;
            };
            source.start(0);
            audioSourceRef.current = source;
            setIsPlaying(true);
        }
    }, [audioBuffer, stopPlayback]);

    const handlePlayPause = () => {
        if (isPlaying) {
            stopPlayback();
        } else {
            playPlayback();
        }
    };

    const handleDownload = async () => {
        if (!audioBuffer) {
            addLog("Error: No audio data available to download.");
            return;
        }

        addLog(`Preparing download for ${exportFormat.toUpperCase()} format...`);
        setIsLogOpen(true);

        let blob: Blob;
        const mimeType = exportFormat === 'mp3' ? 'audio/mpeg' : `audio/${exportFormat}`;

        if (exportFormat === 'wav') {
            blob = createWavBlob(audioBuffer);
        } else {
            addLog(`Simulating ${exportFormat.toUpperCase()} encoding. File will be a WAV container.`);
            blob = createWavBlob(audioBuffer);
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const fileName = `${profile.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
        a.download = fileName;
        
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        addLog(`Download started for: ${fileName}`);
    };


    return (
        <div className="h-full flex flex-col space-y-4 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex-shrink-0">Script & Preview</h2>
            <div className="flex-shrink-0">
                <textarea
                    rows={5}
                    className="w-full bg-slate-200/50 dark:bg-slate-900/70 font-mono rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 focus:ring-sky-500 focus:border-transparent transition text-slate-800 dark:text-slate-200 p-4 leading-relaxed"
                    placeholder="Enter text to be spoken..."
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                />
            </div>

            <div className="flex items-center justify-center bg-gradient-to-t from-slate-200 to-white dark:from-slate-900 dark:to-slate-800/50 p-4 rounded-xl flex-shrink-0">
                <Waveform playing={isPlaying} />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 flex-shrink-0">
                <div className="flex items-center space-x-2">
                     <button
                        onClick={handlePlayPause}
                        disabled={!audioBuffer || isGenerating}
                        className="p-3 rounded-full bg-sky-600 hover:bg-sky-500 text-white transition disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed flex-shrink-0"
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                    </button>
                    <button
                        onClick={stopPlayback}
                        disabled={!isPlaying}
                        className="p-3 rounded-full bg-slate-300 dark:bg-slate-700 hover:bg-slate-400/80 dark:hover:bg-slate-600 text-slate-800 dark:text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        title="Stop"
                    >
                        <StopIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-grow w-full sm:w-auto"></div>
                {audioBuffer && !isGenerating && (
                     <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg bg-slate-200 dark:bg-slate-700/50 p-1">
                            {(['wav', 'mp3', 'ogg'] as const).map(format => (
                                <button
                                    key={format}
                                    onClick={() => setExportFormat(format)}
                                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200 ${
                                        exportFormat === format 
                                        ? 'bg-white dark:bg-slate-900 text-sky-500 dark:text-sky-300' 
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-600/50'
                                    }`}
                                >
                                    {format.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleDownload}
                            className="p-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition"
                            title={`Download ${exportFormat.toUpperCase()}`}
                        >
                            <DownloadIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            <button
                onClick={handleGenerate}
                disabled={isGenerating || !script.trim()}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-teal-500 to-sky-600 text-white font-bold text-lg shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-wait disabled:scale-100 disabled:shadow-none flex-shrink-0"
            >
                {isGenerating ? 'Generating...' : 'Generate Audio'}
            </button>
            
            <div className="flex-grow bg-slate-200/50 dark:bg-slate-900/50 rounded-lg overflow-hidden flex flex-col">
                <button
                    onClick={() => setIsLogOpen(prev => !prev)}
                    className="w-full flex justify-between items-center text-left p-3 flex-shrink-0"
                >
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Generation Log</h3>
                    <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isLogOpen ? 'rotate-180' : ''}`} />
                </button>
                {isLogOpen && (
                    <div ref={logContainerRef} className="flex-grow overflow-y-auto space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono pr-1 px-3 pb-3 animate-fade-in">
                        {generationLog.map((log, index) => (
                            <p key={index} className="whitespace-pre-wrap break-words leading-relaxed">{log}</p>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};