
import React, { useState, useRef, useEffect } from 'react';
import type { VoiceSettings as VoiceSettingsType, ViralAccent } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface VoiceSettingsProps {
    settings: VoiceSettingsType;
    onUpdate: (newSettings: Partial<VoiceSettingsType>) => void;
}

const ACCENT_PRESETS: ViralAccent[] = [
    'Neutral EN', 'British Warm', 'American Reels Style', 'German Soft', 
    'Turkish Soft Emotional', 'Urdu Emotional', 'Arabic Velvet', 
    'Indian Cinematic', 'Deep Documentary', 'Viral Short-Form', 'Whisper Accent', 'Gentle Therapist',
    'Horror Whisper', 'Ghostly Echo', 'Demonic Distortion',
    'Quranic Tajweed', 'Egyptian Qari', 'Saudi Qari',
    'Transatlantic (1920s)', 'Nature Documentary', 'Robotic Filter', 'Heavy Distortion'
];

const StudioSlider: React.FC<{ id: string; label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }> = ({ id, label, value, min, max, step, onChange }) => (
    <div className="mb-6 group">
        <div className="flex justify-between items-center mb-3">
            <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{label}</label>
            <span className="font-mono text-[10px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-md tabular-nums min-w-[36px] text-center">{value.toFixed(2)}</span>
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


const CustomSelect: React.FC<{
    label: string;
    value: string;
    options: string[];
    onChange: (value: any) => void;
}> = ({ label, value, options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">{label}</label>
            <button 
                onClick={() => setIsOpen(p => !p)} 
                className="w-full flex justify-between items-center bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10 p-3.5 transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 dark:focus:ring-indigo-400/20"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={`${label}, Current value: ${value}`}
            >
                <span className="font-semibold text-sm truncate text-slate-700 dark:text-slate-200">{value}</span>
                <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-full max-h-56 overflow-y-auto bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-20 custom-scrollbar animate-fade-in">
                    {options.map(option => (
                        <button key={option} onClick={() => { onChange(option); setIsOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${value === option ? 'bg-indigo-50 dark:bg-white/5 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}>{option}</button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({ settings, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="p-6 h-full custom-scrollbar">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex justify-between items-center text-left group mb-2 outline-none"
                aria-expanded={isOpen}
                aria-controls="voice-settings-panel"
            >
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">Parameters</h2>
                <div className={`p-1.5 rounded-md text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-white/5 transition-all`}>
                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            
            <div id="voice-settings-panel" className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="pt-6 space-y-10">
                        <div className="grid grid-cols-2 gap-5">
                            <CustomSelect label="Language" value={settings.language} options={['EN', 'UR', 'DE', 'AR', 'HI', 'TR', 'ES', 'FR', 'JA', 'RU', 'ZH']} onChange={(v) => onUpdate({ language: v as VoiceSettingsType['language'] })} />
                            <CustomSelect label="Accent Preset" value={settings.accent} options={ACCENT_PRESETS} onChange={(v) => onUpdate({ accent: v })} />
                        </div>
                        
                        <div className="h-px bg-slate-100 dark:bg-white/5"></div>
                        
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6">Performance</h3>
                            <StudioSlider id="speed-slider" label="Speed" value={settings.speed} min={0.5} max={2.0} step={0.05} onChange={v => onUpdate({ speed: v })} />
                            <StudioSlider id="pitch-slider" label="Pitch" value={settings.pitch} min={0.5} max={1.5} step={0.05} onChange={v => onUpdate({ pitch: v })} />
                            <StudioSlider id="emotional-depth-slider" label="Emotion" value={settings.emotionalDepth} min={0} max={1} step={0.05} onChange={v => onUpdate({ emotionalDepth: v })} />
                        </div>

                        <div className="rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-6 space-y-2">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-2">
                                Atmosphere
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/30 font-bold tracking-wide">FX</span>
                            </h3>
                            <StudioSlider id="reverb-slider" label="Reverb (Echo)" value={settings.reverb || 0} min={0} max={1} step={0.05} onChange={v => onUpdate({ reverb: v })} />
                            <StudioSlider id="creepiness-slider" label="Creepiness" value={settings.creepiness || 0} min={0} max={1} step={0.05} onChange={v => onUpdate({ creepiness: v })} />
                        </div>
                        
                        <div className="space-y-2">
                             <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6">Quality</h3>
                            <StudioSlider id="stability-slider" label="Stability" value={settings.stability} min={0} max={1} step={0.05} onChange={v => onUpdate({ stability: v })} />
                            <StudioSlider id="clarity-slider" label="Clarity" value={settings.clarity} min={0} max={1} step={0.05} onChange={v => onUpdate({ clarity: v })} />
                            <StudioSlider id="breathing-level-slider" label="Breathing" value={settings.breathingLevel} min={0} max={1} step={0.05} onChange={v => onUpdate({ breathingLevel: v })} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
