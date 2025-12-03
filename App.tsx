
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { VoiceBuilder } from './components/VoiceBuilder';
import { VoiceSettings } from './components/VoiceSettings';
import { ScriptEditor } from './components/ScriptEditor';
import { VoiceLibrary } from './components/VoiceLibrary';
import { ChatInterface } from './components/ChatInterface';
import { defaultVoiceProfiles } from './data/voiceProfiles';
import type { VoiceProfile, VoiceSettings as VoiceSettingsType } from './types';

type Theme = 'light' | 'dark';
type ActiveTab = 'audio' | 'chat';

const GlassCard: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
    <div className={`
        bg-[var(--card-bg-light)] dark:bg-[var(--card-bg-dark)] 
        backdrop-blur-xl dark:backdrop-blur-2xl rounded-3xl
        border border-[var(--card-border-light)] dark:border-[var(--card-border-dark)]
        shadow-[var(--card-shadow-light)] dark:shadow-[var(--card-shadow-dark)] 
        flex flex-col overflow-hidden transition-all duration-300
        ${className}`}>
        {children}
    </div>
);


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
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const [activeTab, setActiveTab] = useState<ActiveTab>('audio');
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

    const memoizedOnSettingsUpdate = useCallback((newSettings: Partial<VoiceSettingsType>) => {
        if (activeProfile) {
            handleUpdateSettings(activeProfile.id, newSettings);
        }
    }, [activeProfile, handleUpdateSettings]);


    const handleReorderProfiles = useCallback((reorderedProfiles: VoiceProfile[]) => {
        setVoiceProfiles(reorderedProfiles);
        addLog("Reordered voices in the library.");
    }, [addLog]);

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
        let newProfile: VoiceProfile | null = null;
        
        setVoiceProfiles(prevProfiles => {
            const newProfileName = `New Voice ${prevProfiles.filter(p => p.category === 'My Voices').length + 1}`;
            newProfile = {
                id: newId,
                name: newProfileName,
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
                    accent: 'Neutral EN',
                    reverb: 0,
                    creepiness: 0,
                },
                vibe: 'Friendly',
            };
            addLog(`Created new voice profile: ${newProfile.name}`);
            return [...prevProfiles, newProfile];
        });
        
        setActiveProfileId(newId);
    }, [addLog]);

    const handleDeleteProfile = useCallback((id: string) => {
        const profileToDelete = voiceProfiles.find(p => p.id === id);
        
        setVoiceProfiles(prevProfiles => prevProfiles.filter(p => p.id !== id));

        if (profileToDelete) {
            addLog(`Deleted voice profile: ${profileToDelete.name}`);
        }
        // Let the useEffect handle re-selecting a profile.
        // This prevents race conditions and stale state issues.
    }, [voiceProfiles, addLog]);
    
    useEffect(() => {
        // This effect ensures that if the active profile is deleted or doesn't exist,
        // a new valid one is selected gracefully.
        const profileExists = voiceProfiles.some(p => p.id === activeProfileId);
        if (!profileExists && voiceProfiles.length > 0) {
            setActiveProfileId(voiceProfiles[0].id);
        } else if (voiceProfiles.length === 0) {
            setActiveProfileId('');
        }
    }, [voiceProfiles, activeProfileId]);

    return (
        <div className="min-h-screen text-[var(--text-light-primary)] dark:text-[var(--text-dark-primary)] flex flex-col">
             <main className="flex-grow p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
                <Header theme={theme} toggleTheme={toggleTheme} activeTab={activeTab} setActiveTab={setActiveTab} />
                {activeTab === 'audio' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
                        <GlassCard className="lg:col-span-3">
                            <VoiceLibrary
                                profiles={voiceProfiles}
                                activeProfileId={activeProfileId}
                                customFolders={customFolders}
                                onSelectProfile={setActiveProfileId}
                                onCreateProfile={handleCreateNewProfile}
                                onCreateFolder={handleCreateFolder}
                                onDeleteProfile={handleDeleteProfile}
                                onUpdateProfile={handleUpdateProfile}
                                onReorderProfiles={handleReorderProfiles}
                            />
                        </GlassCard>

                        <div className="lg:col-span-5 flex flex-col gap-6">
                            {activeProfile ? (
                                <>
                                    <GlassCard><VoiceBuilder profile={activeProfile} onUpdate={handleUpdateProfile} addLog={addLog} /></GlassCard>
                                    <GlassCard><VoiceSettings settings={activeProfile.settings} onUpdate={memoizedOnSettingsUpdate} /></GlassCard>
                                </>
                            ) : (
                                <GlassCard className="h-full flex-grow">
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-center text-[var(--text-light-secondary)] dark:text-[var(--text-dark-secondary)]">Select or create a voice profile to begin.</p>
                                    </div>
                                </GlassCard>
                            )}
                        </div>

                        <GlassCard className="lg:col-span-4">
                            {activeProfile ? (
                                <ScriptEditor profile={activeProfile} addLog={addLog} generationLog={generationLog} theme={theme} />
                            ) : (
                                <div className="h-full flex-grow flex items-center justify-center p-6">
                                    <p className="text-center text-[var(--text-light-secondary)] dark:text-[var(--text-dark-secondary)]">Select a profile to use the script editor.</p>
                                </div>
                            )}
                        </GlassCard>
                    </div>
                )}
                 {activeTab === 'chat' && (
                    <GlassCard className="flex-grow max-w-5xl mx-auto w-full">
                         <ChatInterface />
                    </GlassCard>
                )}
            </main>
        </div>
    );
};

export default App;
