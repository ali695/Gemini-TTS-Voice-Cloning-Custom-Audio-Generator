import React, { useState, useMemo, useEffect } from 'react';
import type { VoiceProfile } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { EditIcon } from './icons/EditIcon';
import { FolderPlusIcon } from './icons/FolderPlusIcon';

interface VoiceLibraryProps {
    profiles: VoiceProfile[];
    activeProfileId: string;
    customFolders: string[];
    onSelectProfile: (id: string) => void;
    onCreateProfile: () => void;
    onCreateFolder: (name: string) => boolean;
    onDeleteProfile: (id: string) => void;
    onUpdateProfile: (id: string, updates: Partial<VoiceProfile>) => void;
}

const VoiceItem: React.FC<{
    profile: VoiceProfile;
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onUpdate: (updates: Partial<VoiceProfile>) => void;
}> = ({ profile, isActive, onSelect, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(profile.name);

    const handleSave = () => {
        if (name.trim() && name.trim() !== profile.name) {
            onUpdate({ name: name.trim() });
        }
        setIsEditing(false);
    };

    return (
        <div
            onClick={onSelect}
            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 group relative border ${isActive ? 'bg-sky-100 dark:bg-sky-900/50 border-sky-400 dark:border-sky-500' : 'bg-slate-100 dark:bg-slate-700/40 border-transparent hover:bg-slate-200/70 dark:hover:bg-slate-700/80'}`}
        >
            <div className="flex justify-between items-start">
                {isEditing ? (
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400 rounded px-2 py-1 -m-2"
                        autoFocus
                        onClick={e => e.stopPropagation()}
                    />
                ) : (
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate pr-16" onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                        {profile.name}
                    </h3>
                )}
                <div className="absolute top-2 right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                        className="p-1.5 rounded-md text-slate-500 hover:text-sky-500 hover:bg-sky-500/10 dark:hover:bg-sky-500/20"
                        title="Rename Voice"
                    >
                        <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20"
                        title="Delete Voice"
                    >
                        <DeleteIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{profile.description}</p>
        </div>
    );
};

export const VoiceLibrary: React.FC<VoiceLibraryProps> = ({
    profiles,
    activeProfileId,
    customFolders,
    onSelectProfile,
    onCreateProfile,
    onCreateFolder,
    onDeleteProfile,
    onUpdateProfile
}) => {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['My Voices']));
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const groupedProfiles = useMemo(() => {
        const groups = profiles.reduce((acc, profile) => {
            const category = profile.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(profile);
            return acc;
        }, {} as Record<string, VoiceProfile[]>);

        // Ensure all custom folders are present, even if empty
        customFolders.forEach(folder => {
            if (!groups[folder]) {
                groups[folder] = [];
            }
        });

        // Create a specific order for display
        const order = ['My Voices', ...customFolders];
        const orderedGroups: Record<string, VoiceProfile[]> = {};
        
        // Add explicitly ordered categories first
        order.forEach(category => {
            if (groups[category]) {
                orderedGroups[category] = groups[category];
            }
        });

        // Add remaining categories from profiles, sorted alphabetically
        Object.keys(groups)
            .filter(category => !order.includes(category))
            .sort()
            .forEach(category => {
                orderedGroups[category] = groups[category];
            });

        return orderedGroups;
    }, [profiles, customFolders]);
    
    // Auto-expand folder when a new voice is created in it
    useEffect(() => {
        const activeProfile = profiles.find(p => p.id === activeProfileId);
        if (activeProfile?.category && !expandedFolders.has(activeProfile.category)) {
            toggleFolder(activeProfile.category);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeProfileId, profiles.length]);

    const toggleFolder = (category: string) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    const handleSaveFolder = () => {
        if (newFolderName.trim()) {
            const success = onCreateFolder(newFolderName);
            if (success) {
                setExpandedFolders(prev => new Set(prev).add(newFolderName.trim()));
                setIsCreatingFolder(false);
                setNewFolderName('');
            }
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex justify-between items-center mb-4 px-6 pt-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Voice Library</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsCreatingFolder(prev => !prev)}
                            className={`flex items-center justify-center p-2 rounded-lg transition-all duration-300 ${isCreatingFolder ? 'bg-sky-200 dark:bg-sky-800/80 text-sky-600 dark:text-sky-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                            title="Create New Folder"
                        >
                            <FolderPlusIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onCreateProfile}
                            className="flex items-center justify-center p-2 rounded-lg bg-gradient-to-r from-teal-500/80 to-sky-500/80 text-white shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 hover:scale-105 transition-all duration-300"
                            title="Create New Voice"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                {isCreatingFolder && (
                    <div className="px-6 pb-4 flex gap-2 items-center border-b border-slate-200 dark:border-slate-700">
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveFolder()}
                            placeholder="New folder name..."
                            className="flex-grow bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition text-sm px-3 py-1.5 w-full"
                            autoFocus
                        />
                        <button
                            onClick={handleSaveFolder}
                            className="px-3 py-1.5 text-sm rounded-lg bg-sky-500 text-white font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50"
                            disabled={!newFolderName.trim()}
                        >
                            Save
                        </button>
                    </div>
                )}
            </div>
            <div className="flex-grow overflow-y-auto px-6 pb-6 pt-2">
                <div className="space-y-2">
                    {Object.entries(groupedProfiles).map(([category, voices]: [string, VoiceProfile[]]) => {
                        const isExpanded = expandedFolders.has(category);
                        return (
                            <div key={category} className="bg-slate-100/50 dark:bg-slate-700/20 rounded-xl">
                                <button
                                    onClick={() => toggleFolder(category)}
                                    className="w-full flex justify-between items-center p-3 text-left font-semibold text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/40 transition-colors"
                                >
                                    <span>{category} <span className="text-xs font-normal text-slate-500">({voices.length})</span></span>
                                    <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                                {isExpanded && (
                                    <div className="p-3 pt-1 space-y-2">
                                        {voices.map(profile => (
                                            <VoiceItem
                                                key={profile.id}
                                                profile={profile}
                                                isActive={activeProfileId === profile.id}
                                                onSelect={() => onSelectProfile(profile.id)}
                                                onDelete={() => onDeleteProfile(profile.id)}
                                                onUpdate={(updates) => onUpdateProfile(profile.id, updates)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                {profiles.length === 0 && (
                    <div className="text-center py-10 text-slate-500 dark:text-slate-500 h-full flex flex-col items-center justify-center">
                        <p>No voice profiles found.</p>
                        <p>Click the '+' button to create one.</p>
                    </div>
                )}
            </div>
        </div>
    );
};