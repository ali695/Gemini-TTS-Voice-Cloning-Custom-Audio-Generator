import React, { useState } from 'react';
import type { VoiceSettings as VoiceSettingsType } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface VoiceSettingsProps {
    settings: VoiceSettingsType;
    onUpdate: (newSettings: Partial<VoiceSettingsType>) => void;
}

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }> = ({ label, value, min, max, step, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2 flex justify-between">
            <span>{label}</span>
            <span className="font-mono text-slate-500 dark:text-slate-400">{value.toFixed(2)}</span>
        </label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-sky-500 dark:accent-sky-400"
        />
    </div>
);

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({ settings, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left"
            >
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Voice Settings</h2>
                <ChevronDownIcon className={`w-6 h-6 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
                <div className="mt-4 space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Language</label>
                            <select 
                                value={settings.language} 
                                onChange={(e) => onUpdate({ language: e.target.value as VoiceSettingsType['language'] })}
                                className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 focus:ring-sky-500 focus:border-transparent transition text-slate-800 dark:text-slate-200 p-2.5"
                            >
                                <option>EN</option>
                                <option>UR</option>
                                <option>DE</option>
                                <option>AR</option>
                                <option>HI</option>
                                <option>TR</option>
                                <option>ES</option>
                                <option>FR</option>
                                <option>JA</option>
                                <option>RU</option>
                                <option>ZH</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Accent (Informational)</label>
                            <input 
                                type="text"
                                value={settings.accent}
                                onChange={(e) => onUpdate({ accent: e.target.value })}
                                placeholder="e.g., British, Australian"
                                className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 focus:ring-sky-500 focus:border-transparent transition text-slate-800 dark:text-slate-200 p-2.5"
                            />
                        </div>
                    </div>
                    <Slider label="Speed" value={settings.speed} min={0.5} max={2.0} step={0.05} onChange={v => onUpdate({ speed: v })} />
                    <Slider label="Pitch" value={settings.pitch} min={0.5} max={1.5} step={0.05} onChange={v => onUpdate({ pitch: v })} />
                    <Slider label="Stability" value={settings.stability} min={0} max={1} step={0.05} onChange={v => onUpdate({ stability: v })} />
                    <Slider label="Clarity + Articulation" value={settings.clarity} min={0} max={1} step={0.05} onChange={v => onUpdate({ clarity: v })} />
                    <Slider label="Emotional Depth" value={settings.emotionalDepth} min={0} max={1} step={0.05} onChange={v => onUpdate({ emotionalDepth: v })} />
                    <Slider label="Breathing Level" value={settings.breathingLevel} min={0} max={1} step={0.05} onChange={v => onUpdate({ breathingLevel: v })} />
                </div>
            )}
        </div>
    );
};