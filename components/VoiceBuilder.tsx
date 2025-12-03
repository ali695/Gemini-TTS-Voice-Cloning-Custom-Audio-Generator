
import React, { useCallback, useState, useRef, useEffect } from 'react';
import type { VoiceProfile, Vibe } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { SaveIcon } from './icons/SaveIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface VoiceBuilderProps {
    profile: VoiceProfile;
    onUpdate: (id: string, updates: Partial<VoiceProfile>) => void;
    addLog: (message: string) => void;
}

const VIBES: Vibe[] = [
    'Friendly', 'Sincere', 'Dramatic', 'Emotional', 'Motivational', 'Whispering', 
    'Soft ASMR', 'Documentary', 'News Anchor', 'Calm Therapist', 'Smooth Jazz DJ',
    'Horror Narrator', 'Fairytale Teller', 'Action Narrator', 'Bedtime Story',
    'Villain', 'Pirate', 'Terrified', 'Demonic', 'Eerie', 'Ghostly', 'Poltergeist',
    'Islamic Recitation', 'Spiritual', 'Murattal',
    'Philosophical', 'Cybernetic', 'Divine', 'Hysterical', 'Grumpy',
    'Hypnotic', 'Sleep Learning'
];

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3.75 3.75M12 9.75L8.25 13.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 17.25v2.25c0 1.518 1.232 2.75 2.75 2.75h13.5A2.75 2.75 0 0021 19.5V17.25" />
    </svg>
);

const AudioFileIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);


const FineTuneSlider: React.FC<{ id: string; label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }> = ({ id, label, value, min, max, step, onChange }) => (
    <div className="mb-6 group">
        <div className="flex justify-between items-center mb-3">
            <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{label}</label>
            <span className="font-mono text-[10px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-md tabular-nums min-w-[36px] text-center">
                {label === 'Estimated Age' ? Math.round(value) : value.toFixed(2)}
            </span>
        </div>
        <div className="relative h-6 flex items-center">
            <input
                id={id}
                type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 dark:accent-indigo-400 cursor-pointer"
            />
        </div>
    </div>
);


export const VoiceBuilder: React.FC<VoiceBuilderProps> = ({ profile, onUpdate, addLog }) => {
    const [localDescription, setLocalDescription] = useState(profile.description);
    const [localVibe, setLocalVibe] = useState(profile.vibe);
    const [localBreathingLevel, setLocalBreathingLevel] = useState(profile.settings.breathingLevel ?? 0.1);
    const [isSaved, setIsSaved] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [fileAnalysis, setFileAnalysis] = useState<{
        quality: 'Excellent' | 'Good' | 'Fair';
        duration: number | null;
        warnings: string[];
        fileName: string;
    } | null>(null);

    const [cloneSettings, setCloneSettings] = useState({ timbre: 0.75, accent: 0.50, age: 35 });
    const [isVibeOpen, setIsVibeOpen] = useState(false);
    const vibeMenuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getAudioDuration = (file: File): Promise<number> => new Promise((resolve) => {
        const audio = document.createElement('audio'); audio.src = URL.createObjectURL(file);
        audio.addEventListener('loadedmetadata', () => { URL.revokeObjectURL(audio.src); resolve(audio.duration); });
    });

    const analyzeFile = useCallback(async (file: File) => {
        const duration = await getAudioDuration(file);
        const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';
        const warnings: string[] = []; let quality: 'Excellent' | 'Good' | 'Fair' = 'Good';

        if (['wav', 'flac'].includes(fileType)) quality = 'Excellent';
        else if (['mp3', 'm4a', 'aac', 'ogg'].includes(fileType)) { quality = 'Good'; warnings.push(`Compressed format (${fileType.toUpperCase()}) detected. Use WAV or FLAC for best quality.`); } 
        else { quality = 'Fair'; warnings.push(`Uncommon format (.${fileType}) may produce unpredictable results.`); }
        if (duration < 5) warnings.push('Sample is too short (< 5s). Longer samples provide better cloning accuracy.');
        if (duration > 300) warnings.push('Sample is very long (> 5min). The first minute is typically sufficient.');
        setFileAnalysis({ quality, duration, warnings, fileName: file.name });
    }, []);
    
    useEffect(() => {
        setLocalDescription(profile.description); setLocalVibe(profile.vibe);
        setLocalBreathingLevel(profile.settings.breathingLevel ?? 0.1);
        setIsUploading(false); setUploadProgress(0);
        if (!profile.audioSampleUrl) { setFileAnalysis(null); if (fileInputRef.current) fileInputRef.current.value = ''; } 
        else { setFileAnalysis({ quality: 'Good', duration: null, warnings: [], fileName: profile.audioSampleUrl }); }
    }, [profile]);

    useEffect(() => { if (isSaved) { const timer = setTimeout(() => setIsSaved(false), 2000); return () => clearTimeout(timer); } }, [isSaved]);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (vibeMenuRef.current && !vibeMenuRef.current.contains(event.target as Node)) setIsVibeOpen(false); };
        document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSave = () => { 
        onUpdate(profile.id, { 
            description: localDescription, 
            vibe: localVibe,
            settings: {
                ...profile.settings,
                breathingLevel: localBreathingLevel
            }
        }); 
        setIsSaved(true); 
        addLog(`Saved changes to "${profile.name}"`); 
    };
    
    const hasUnsavedChanges = 
        localDescription !== profile.description || 
        localVibe !== profile.vibe ||
        localBreathingLevel !== (profile.settings.breathingLevel ?? 0.1);

    const handleVibeChange = (newVibe: Vibe) => { setLocalVibe(newVibe); setIsVibeOpen(false); };
    
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size / 1024 / 1024 > 50) { addLog('Error: File size should not exceed 50MB.'); e.target.value = ''; return; }
            setIsUploading(true); setUploadProgress(0); setFileAnalysis(null);
            
            const steps = 20;
            for(let i = 0; i <= steps; i++) {
                 setUploadProgress(i * (100/steps));
                 await new Promise(res => setTimeout(res, 50));
            }

            await analyzeFile(file); 
            onUpdate(profile.id, { audioSampleUrl: file.name }); 
            addLog(`Uploaded ${file.name} for voice cloning.`);
            setIsUploading(false);
        }
    }, [addLog, onUpdate, profile.id, analyzeFile]);

    const handleRemoveFile = () => { setFileAnalysis(null); onUpdate(profile.id, { audioSampleUrl: undefined }); addLog('Removed uploaded file.'); if (fileInputRef.current) fileInputRef.current.value = ''; };
    const isFileActive = !!profile.audioSampleUrl;

    return (
        <div className="p-6 space-y-8 overflow-y-auto h-full custom-scrollbar">
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Voice Builder</h2>
                    <button onClick={handleSave} disabled={!hasUnsavedChanges || isSaved} 
                        aria-label={isSaved ? 'Changes saved successfully' : 'Save changes to voice profile'}
                        className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wide rounded-xl transition-all duration-200 border
                        ${isSaved 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' 
                            : hasUnsavedChanges 
                                ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-500 shadow-sm active:scale-95' 
                                : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/10 cursor-not-allowed'
                        }`}>
                        {isSaved ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <SaveIcon className="w-3.5 h-3.5" />}
                        <span>{isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                </div>
                
                <label htmlFor="voice-description" className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Description</label>
                <textarea 
                    id="voice-description" 
                    rows={3} 
                    className="w-full bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm p-4 placeholder:text-slate-400 resize-none text-slate-700 dark:text-slate-200 leading-relaxed font-medium" 
                    placeholder="E.g., A deep, calm male monk for meditation guides" 
                    value={localDescription} 
                    onChange={(e) => setLocalDescription(e.target.value)} 
                />
            </div>

            <div className="relative" ref={vibeMenuRef}>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Personality / Vibe</label>
                <button 
                    onClick={() => setIsVibeOpen(p => !p)} 
                    className="w-full flex justify-between items-center bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10 p-3.5 transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20"
                    aria-haspopup="true"
                    aria-expanded={isVibeOpen}
                >
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{localVibe}</span>
                    <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isVibeOpen ? 'rotate-180' : ''}`} />
                </button>
                {isVibeOpen && (
                    <div className="absolute top-full mt-2 w-full max-h-56 overflow-y-auto bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-20 animate-fade-in custom-scrollbar">
                        {VIBES.map(vibe => (<button key={vibe} onClick={() => handleVibeChange(vibe)} className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${localVibe === vibe ? 'bg-indigo-50 dark:bg-white/5 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}>
                           <span>{vibe}</span>
                        </button>))}
                    </div>
                )}
            </div>

            <div className="pt-2">
                 <FineTuneSlider
                    id="breathing-level"
                    label="Breathing Level"
                    value={localBreathingLevel}
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={setLocalBreathingLevel}
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                     <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Voice Cloning</h3>
                     <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 px-2 py-0.5 rounded-full">Pro Feature</span>
                </div>
               
                {!isFileActive && !isUploading && (
                    <label htmlFor="audio-upload" className="group cursor-pointer p-8 border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50/50 dark:bg-white/5 hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 rounded-2xl text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[160px]">
                        <div className="p-4 rounded-full bg-white dark:bg-slate-800 shadow-sm mb-4 group-hover:scale-110 group-hover:shadow-md transition-all duration-300 text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 border border-slate-100 dark:border-white/5">
                            <UploadIcon className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Click to upload audio</p>
                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-wide">WAV, MP3, FLAC (Max 50MB)</p>
                        <input ref={fileInputRef} type="file" id="audio-upload" className="hidden" accept=".mp3,.wav,.ogg,.m4a,.flac,.aac" onChange={handleFileUpload} />
                    </label>
                )}
                
                {isUploading && (
                    <div className="p-6 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 rounded-2xl animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Processing Audio...</span>
                            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div 
                                className="bg-indigo-500 dark:bg-indigo-400 h-full rounded-full relative" 
                                style={{ width: `${uploadProgress}%`, transition: 'width 0.1s ease-out' }}
                            >
                                <div className="absolute inset-0 bg-white/30 animate-[shine_1.5s_infinite] skew-x-12"></div>
                            </div>
                        </div>
                    </div>
                )}

                {isFileActive && fileAnalysis && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm animate-fade-in group">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-100 dark:border-indigo-800/30">
                                    <AudioFileIcon className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-semibold text-slate-800 dark:text-white text-sm truncate max-w-[150px]" title={fileAnalysis.fileName}>{fileAnalysis.fileName}</h4>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 block mt-0.5">Ready for Synthesis</span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={handleRemoveFile}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Remove File"
                            >
                                <DeleteIcon className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-700">
                            <div className="p-3 flex flex-col items-center justify-center text-center">
                                <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1">Signal Quality</span>
                                <div className={`text-sm font-bold ${
                                    fileAnalysis.quality === 'Excellent' ? 'text-emerald-500' : 
                                    fileAnalysis.quality === 'Good' ? 'text-blue-500' : 'text-amber-500'
                                }`}>
                                    {fileAnalysis.quality}
                                </div>
                            </div>
                            <div className="p-3 flex flex-col items-center justify-center text-center">
                                <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1">Duration</span>
                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                                    {fileAnalysis.duration ? `${fileAnalysis.duration.toFixed(1)}s` : 'N/A'}
                                </div>
                            </div>
                        </div>

                        {fileAnalysis.warnings.length > 0 && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border-t border-amber-100 dark:border-amber-900/20">
                                {fileAnalysis.warnings.map((w, i) => (
                                    <div key={i} className="flex items-start gap-2 text-[10px] font-medium text-amber-700 dark:text-amber-400 leading-tight">
                                        <ExclamationTriangleIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>{w}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isFileActive && (
                <div className="pt-6 mt-2 border-t border-slate-100 dark:border-white/5 animate-fade-in">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6">Fine-Tune Clone</h4>
                    <FineTuneSlider id="timbre-slider" label="Timbre Match" value={cloneSettings.timbre} min={0} max={1} step={0.05} onChange={v => setCloneSettings(s => ({...s, timbre: v}))} />
                    <FineTuneSlider id="accent-slider" label="Accent Strength" value={cloneSettings.accent} min={0} max={1} step={0.05} onChange={v => setCloneSettings(s => ({...s, accent: v}))} />
                    <FineTuneSlider id="age-slider" label="Estimated Age" value={cloneSettings.age} min={10} max={80} step={1} onChange={v => setCloneSettings(s => ({...s, age: v}))} />
                </div>
            )}
        </div>
    );
};
