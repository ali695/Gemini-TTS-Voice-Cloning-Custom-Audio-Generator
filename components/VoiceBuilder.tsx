import React, { useCallback } from 'react';
import type { VoiceProfile, Vibe } from '../types';

interface VoiceBuilderProps {
    profile: VoiceProfile;
    onUpdate: (id: string, updates: Partial<VoiceProfile>) => void;
    addLog: (message: string) => void;
}

const VIBES: Vibe[] = [
    'Dramatic', 'Friendly', 'Sincere', 'Pirate', 'Smooth Jazz DJ', 'Whispering', 
    'Emotional', 'Documentary', 'Motivational', 'Villain', 'News Anchor', 'Calm Therapist', 'Soft ASMR',
    'Horror Narrator', 'Fairytale Teller', 'Action Narrator', 'Bedtime Story'
];

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3.75 3.75M12 9.75L8.25 13.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 17.25v2.25c0 1.518 1.232 2.75 2.75 2.75h13.5A2.75 2.75 0 0021 19.5V17.25" />
    </svg>
);


export const VoiceBuilder: React.FC<VoiceBuilderProps> = ({ profile, onUpdate, addLog }) => {
    
    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onUpdate(profile.id, { description: e.target.value });
    };

    const handleVibeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newVibe = e.target.value as Vibe;
        onUpdate(profile.id, { vibe: newVibe });
        addLog(`Vibe set to: ${newVibe}`);
    };
    
    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size / 1024 / 1024 > 10) { // Increased limit
                addLog('Error: File size should not exceed 10MB.');
                return;
            }
            addLog(`Uploaded ${file.name} for voice cloning. (Feature is a demonstration)`);
        }
    }, [addLog]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold mb-3 text-slate-900 dark:text-slate-100">Voice Builder</h2>
                <label htmlFor="voice-description" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Describe the voice you want to create:</label>
                <textarea
                    id="voice-description"
                    rows={3}
                    className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 focus:ring-sky-500 focus:border-transparent transition text-slate-800 dark:text-slate-200 p-3"
                    placeholder="e.g., A deep, calm male monk for meditation guides"
                    value={profile.description}
                    onChange={handleDescriptionChange}
                />
            </div>

            <div>
                <h3 className="text-md font-semibold text-slate-800 dark:text-slate-200 mb-2">Personality & Vibe</h3>
                <select 
                    value={profile.vibe} 
                    onChange={handleVibeChange}
                    className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 focus:ring-sky-500 focus:border-transparent transition text-slate-800 dark:text-slate-200 p-2.5"
                >
                    {VIBES.map(vibe => (
                        <option key={vibe} value={vibe}>{vibe}</option>
                    ))}
                </select>
            </div>

            <div>
                <h3 className="text-md font-semibold text-slate-800 dark:text-slate-200 mb-3">Voice-to-Voice Cloning</h3>
                 <label
                    htmlFor="audio-upload"
                    className="group cursor-pointer p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-sky-500 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg text-center transition-colors duration-300 flex flex-col items-center justify-center"
                 >
                    <UploadIcon className="w-10 h-10 text-slate-400 dark:text-slate-500 group-hover:text-sky-400 transition-colors mb-3" />
                    <p className="text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                       <span className="text-sky-500 dark:text-sky-400">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Upload a 5-60 second audio sample (.mp3, .wav)</p>
                    <input
                        type="file"
                        id="audio-upload"
                        className="hidden"
                        accept=".mp3,.wav,.ogg"
                        onChange={handleFileUpload}
                    />
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 text-center">Note: This is a UI demonstration. Voice cloning requires a dedicated backend.</p>
            </div>
        </div>
    );
};