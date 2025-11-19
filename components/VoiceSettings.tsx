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
    'Indian Cinematic', 'Deep Documentary', 'Viral Short-Form', 'Whisper Accent', 'Gentle Therapist'
];

const StudioSlider: React.FC<{ id: string; label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }> = ({ id, label, value, min, max, step, onChange }) => (
    <div className="mb-5 group">
        <div className="flex justify-between items-end mb-2">
            <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">{label}</label>
            <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded tabular-nums">{value.toFixed(2)}</span>
        </div>
        <input
            id={id}
            type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))}
            className="accent-blue-600 dark:accent-cyan-400"
        />
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
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">{label}</label>
            <button 
                onClick={() => setIsOpen(p => !p)} 
                className="w-full flex justify-between items-center bg-white dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10 p-3 transition-all duration-200 shadow-sm hover:border-blue-400 dark:hover:border-cyan-500/50 focus:ring-2 focus:ring-blue-100 dark:focus:ring-cyan-900/20"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={`${label}, Current value: ${value}`}
            >
                <span className="font-semibold text-sm truncate text-slate-800 dark:text-slate-200">{value}</span>
                <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full max-h-56 overflow-y-auto bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-20 custom-scrollbar">
                    {options.map(option => (
                        <button key={option} onClick={() => { onChange(option); setIsOpen(false); }} className={`w-full text-left px-4 py-2 text-sm transition-colors font-medium ${value === option ? 'bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'}`}>{option}</button>
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
                className="w-full flex justify-between items-center text-left group"
                aria-expanded={isOpen}
                aria-controls="voice-settings-panel"
                aria-label={`${isOpen ? 'Collapse' : 'Expand'} Voice Settings`}
            >
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">Parameters</h2>
                <div className={`p-1.5 rounded-lg bg-slate-50 dark:bg-white/5 group-hover:bg-slate-100 dark:group-hover:bg-white/10 transition-colors`}>
                    <ChevronDownIcon className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            
            <div id="voice-settings-panel" className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="pt-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <CustomSelect label="Language" value={settings.language} options={['EN', 'UR', 'DE', 'AR', 'HI', 'TR', 'ES', 'FR', 'JA', 'RU', 'ZH']} onChange={(v) => onUpdate({ language: v as VoiceSettingsType['language'] })} />
                            <CustomSelect label="Accent Preset" value={settings.accent} options={ACCENT_PRESETS} onChange={(v) => onUpdate({ accent: v })} />
                        </div>
                        
                        <div className="h-px bg-slate-100 dark:bg-white/5 my-2"></div>
                        
                        <div className="space-y-1">
                            <StudioSlider id="speed-slider" label="Speed" value={settings.speed} min={0.5} max={2.0} step={0.05} onChange={v => onUpdate({ speed: v })} />
                            <StudioSlider id="pitch-slider" label="Pitch" value={settings.pitch} min={0.5} max={1.5} step={0.05} onChange={v => onUpdate({ pitch: v })} />
                            <StudioSlider id="emotional-depth-slider" label="Emotion" value={settings.emotionalDepth} min={0} max={1} step={0.05} onChange={v => onUpdate({ emotionalDepth: v })} />
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