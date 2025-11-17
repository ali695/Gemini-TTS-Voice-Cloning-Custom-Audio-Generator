import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { VoiceBuilder } from './components/VoiceBuilder';
import { VoiceSettings } from './components/VoiceSettings';
import { ScriptEditor } from './components/ScriptEditor';
import { VoiceLibrary } from './components/VoiceLibrary';
import { defaultVoiceProfiles } from './data/voiceProfiles';
import type { VoiceProfile, VoiceSettings as VoiceSettingsType } from './types';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = window.localStorage.getItem('theme') as Theme;
            if (savedTheme) return savedTheme;
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'dark';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>(defaultVoiceProfiles);
    const [activeProfileId, setActiveProfileId] = useState<string>(defaultVoiceProfiles[0]?.id || '');
    const [generationLog, setGenerationLog] = useState<string[]>(['[System] Welcome to VoiceGen Studio.']);
    const [customFolders, setCustomFolders] = useState<string[]>([]);

    const activeProfile = voiceProfiles.find(p => p.id === activeProfileId);

    const addLog = useCallback((message: string) => {
        setGenerationLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 100));
    }, []);

    const handleUpdateProfile = useCallback((id: string, updates: Partial<VoiceProfile>) => {
        setVoiceProfiles(prevProfiles =>
            prevProfiles.map(p => p.id === id ? { ...p, ...updates } : p)
        );
    }, []);
    
    const handleUpdateSettings = useCallback((id: string, newSettings: Partial<VoiceSettingsType>) => {
        setVoiceProfiles(prevProfiles =>
            prevProfiles.map(p =>
                p.id === id ? { ...p, settings: { ...p.settings, ...newSettings } } : p
            )
        );
    }, []);

    const handleCreateFolder = useCallback((folderName: string): boolean => {
        const trimmedName = folderName.trim();
        if (trimmedName === '') {
            addLog('Error: Folder name cannot be empty.');
            return false;
        }

        const allCategoryNames = new Set([
            ...customFolders.map(f => f.toLowerCase()),
            ...voiceProfiles.map(p => p.category?.toLowerCase()).filter(Boolean)
        ]);
        
        if (allCategoryNames.has(trimmedName.toLowerCase())) {
            addLog(`Error: Folder "${trimmedName}" already exists.`);
            return false;
        }
    
        setCustomFolders(prev => [...prev, trimmedName]);
        addLog(`Created new folder: ${trimmedName}`);
        return true;
    }, [voiceProfiles, customFolders, addLog]);

    const handleCreateNewProfile = useCallback(() => {
        const newId = `vp_${Date.now()}`;
        const newProfile: VoiceProfile = {
            id: newId,
            name: `New Voice ${voiceProfiles.filter(p => p.category === 'My Voices').length + 1}`,
            description: 'A new custom voice, ready for your creative touch.',
            category: 'My Voices',
            settings: {
                language: 'EN',
                speed: 1.0,
                pitch: 1.0,
                temperature: 0.5,
                emotionalDepth: 0.5,
                clarity: 0.75,
                breathingLevel: 0.1,
                stability: 0.75,
                accent: 'None',
            },
            vibe: 'Friendly',
        };
        setVoiceProfiles(prev => [...prev, newProfile]);
        setActiveProfileId(newId);
        addLog(`Created new voice profile: ${newProfile.name}`);
    }, [voiceProfiles, addLog]);

    const handleDeleteProfile = useCallback((id: string) => {
        setVoiceProfiles(prevProfiles => {
            const profileToDelete = prevProfiles.find(p => p.id === id);
            if (!profileToDelete) {
                return prevProfiles; 
            }
            
            addLog(`Deleted voice profile: ${profileToDelete.name}`);
            
            const remainingProfiles = prevProfiles.filter(p => p.id !== id);
            
            if (activeProfileId === id) {
                setActiveProfileId(remainingProfiles.length > 0 ? remainingProfiles[0].id : '');
            }
            
            return remainingProfiles;
        });
    }, [activeProfileId, addLog]);

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col transition-colors duration-300">
            <Header theme={theme} toggleTheme={toggleTheme} />
            <main className="flex-grow p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-3 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col overflow-hidden">
                    <VoiceLibrary
                        profiles={voiceProfiles}
                        activeProfileId={activeProfileId}
                        customFolders={customFolders}
                        onSelectProfile={setActiveProfileId}
                        onCreateProfile={handleCreateNewProfile}
                        onCreateFolder={handleCreateFolder}
                        onDeleteProfile={handleDeleteProfile}
                        onUpdateProfile={handleUpdateProfile}
                    />
                </div>

                <div className="lg:col-span-5 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col overflow-hidden">
                     <div className="p-6 overflow-y-auto">
                        {activeProfile ? (
                            <div className="flex flex-col gap-6">
                                <VoiceBuilder profile={activeProfile} onUpdate={handleUpdateProfile} addLog={addLog} />
                                <VoiceSettings settings={activeProfile.settings} onUpdate={(newSettings) => handleUpdateSettings(activeProfile.id, newSettings)} />
                            </div>
                        ) : (
                            <div className="h-full flex-grow flex items-center justify-center">
                                <p className="text-slate-500 dark:text-slate-400 text-center">Select or create a voice profile to begin.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-4 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col overflow-hidden">
                    {activeProfile ? (
                        <ScriptEditor profile={activeProfile} addLog={addLog} generationLog={generationLog} />
                    ) : (
                        <div className="h-full flex-grow flex items-center justify-center p-6">
                            <p className="text-slate-500 dark:text-slate-400 text-center">Select a profile to use the script editor.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;