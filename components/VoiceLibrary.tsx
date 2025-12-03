
import React, { useState, useMemo, useEffect } from 'react';
import type { VoiceProfile } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { EditIcon } from './icons/EditIcon';
import { FolderPlusIcon } from './icons/FolderPlusIcon';
import { AccentIcon } from './icons/AccentIcon';
import { CharacterIcon } from './icons/CharacterIcon';
import { LanguageIcon } from './icons/LanguageIcon';
import { MotivationIcon } from './icons/MotivationIcon';
import { NarrationIcon } from './icons/NarrationIcon';
import { RelaxationIcon } from './icons/RelaxationIcon';
import { SocialMediaIcon } from './icons/SocialMediaIcon';
import { WhisperIcon } from './icons/WhisperIcon';
import { StorytellingIcon } from './icons/StorytellingIcon';
import { MyVoicesIcon } from './icons/MyVoicesIcon';
import { UltraHorrorIcon } from './icons/UltraHorrorIcon';
import { QuranIcon } from './icons/QuranIcon';
import { SearchIcon } from './icons/SearchIcon';
import { SleepIcon } from './icons/SleepIcon';


interface VoiceLibraryProps {
    profiles: VoiceProfile[];
    activeProfileId: string;
    customFolders: string[];
    onSelectProfile: (id: string) => void;
    onCreateProfile: () => void;
    onCreateFolder: (name: string) => boolean;
    onDeleteProfile: (id: string) => void;
    onUpdateProfile: (id: string, updates: Partial<VoiceProfile>) => void;
    onReorderProfiles: (reorderedProfiles: VoiceProfile[]) => void;
}

const categoryIcons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    'Accents': AccentIcon,
    'Characters': CharacterIcon,
    'Languages': LanguageIcon,
    'Motivational & Deep': MotivationIcon,
    'Narration': NarrationIcon,
    'Relaxation': RelaxationIcon,
    'Social Media': SocialMediaIcon,
    'Soft Intimate Whisper': WhisperIcon,
    'Storytelling': StorytellingIcon,
    'Ultra-Horror': UltraHorrorIcon,
    'Quranic Recitation': QuranIcon,
    'Sleep Learning & Long Form': SleepIcon,
    'My Voices': MyVoicesIcon,
};

const VoiceItem: React.FC<{
    profile: VoiceProfile;
    isActive: boolean;
    isDragged: boolean;
    isDropTarget: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onUpdate: (updates: Partial<VoiceProfile>) => void;
    dragAndDropProps: {
        draggable: boolean;
        onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
        onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
        onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
        onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    };
}> = ({ profile, isActive, isDragged, isDropTarget, onSelect, onDelete, onUpdate, dragAndDropProps }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(profile.name);

    const handleSave = () => {
        if (name.trim() && name.trim() !== profile.name) {
            onUpdate({ name: name.trim() });
        }
        setIsEditing(false);
    };

    const combinedClassName = `relative px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200 group border
        ${isActive 
            ? 'bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 shadow-sm z-10 ring-1 ring-black/5 dark:ring-white/5' 
            : 'border-transparent hover:bg-slate-100/50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
        } ${isDragged ? 'opacity-40 scale-95' : 'opacity-100'} 
          ${isDropTarget ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : ''}`;

    return (
        <div 
            onClick={onSelect} 
            className={combinedClassName} 
            role="button"
            aria-label={`Select voice profile: ${profile.name}`}
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
            {...dragAndDropProps}
        >
            <div className="flex justify-between items-center min-w-0">
                {isEditing ? (
                    <input
                        type="text" value={name} onChange={(e) => setName(e.target.value)} onBlur={handleSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        className="bg-transparent text-slate-900 dark:text-white w-full text-sm font-semibold focus:outline-none border-b border-indigo-500 pb-0.5"
                        autoFocus onClick={e => e.stopPropagation()}
                    />
                ) : (
                    <h3 className={`text-sm font-semibold truncate pr-8 tracking-tight ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`} onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                        {profile.name}
                    </h3>
                )}
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden scale-90">
                    <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"><EditIcon className="w-3.5 h-3.5" /></button>
                    <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"><DeleteIcon className="w-3.5 h-3.5" /></button>
                </div>
            </div>
            <p className={`text-[11px] mt-1 truncate font-medium ${isActive ? 'text-indigo-600/80 dark:text-indigo-300/80' : 'text-slate-400 dark:text-slate-500'}`}>{profile.description}</p>
        </div>
    );
};

export const VoiceLibrary: React.FC<VoiceLibraryProps> = ({
    profiles, activeProfileId, customFolders, onSelectProfile, onCreateProfile,
    onCreateFolder, onDeleteProfile, onUpdateProfile, onReorderProfiles
}) => {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['My Voices', 'Sleep Learning & Long Form']));
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [folderError, setFolderError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);

    const filteredProfiles = useMemo(() => {
        if (!searchQuery.trim()) return profiles;
        const lowercasedQuery = searchQuery.toLowerCase();
        return profiles.filter(p =>
            p.name.toLowerCase().includes(lowercasedQuery) ||
            p.description.toLowerCase().includes(lowercasedQuery)
        );
    }, [profiles, searchQuery]);

    const groupedProfiles = useMemo(() => {
        const groups = filteredProfiles.reduce((acc, profile) => {
            const category = profile.category || 'Uncategorized';
            if (!acc[category]) acc[category] = [];
            acc[category].push(profile);
            return acc;
        }, {} as Record<string, VoiceProfile[]>);

        if (!searchQuery.trim()) { customFolders.forEach(folder => { if (!groups[folder]) groups[folder] = []; }); }

        const builtInOrder = ['My Voices', ...customFolders.sort(), 'Sleep Learning & Long Form', 'Quranic Recitation', 'Narration', 'Storytelling', 'Motivational & Deep', 'Social Media', 'Relaxation', 'Soft Intimate Whisper', 'Ultra-Horror', 'Background Horror', 'Characters', 'Accents', 'Languages'];
        const orderedGroups: Record<string, VoiceProfile[]> = {};
        builtInOrder.forEach(category => { if (groups[category] !== undefined) orderedGroups[category] = groups[category]; });
        Object.keys(groups).filter(cat => !orderedGroups[cat]).sort().forEach(cat => { orderedGroups[cat] = groups[cat]; });
        return orderedGroups;
    }, [filteredProfiles, customFolders, searchQuery]);
    
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
            if (newSet.has(category)) newSet.delete(category); else newSet.add(category);
            return newSet;
        });
    };

    const handleSaveFolder = () => {
        setFolderError('');
        if (newFolderName.trim()) {
            const success = onCreateFolder(newFolderName);
            if (success) {
                setExpandedFolders(prev => new Set(prev).add(newFolderName.trim())); setIsCreatingFolder(false); setNewFolderName('');
            } else { setFolderError(`Folder "${newFolderName.trim()}" already exists.`); }
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, profileId: string) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', profileId); setDraggedItemId(profileId); };
    const handleDragEnd = () => { setDraggedItemId(null); setDropTargetId(null); };

    const handleItemDragOver = (e: React.DragEvent<HTMLDivElement>, profileId: string) => {
        e.preventDefault(); e.stopPropagation();
        if (draggedItemId && draggedItemId !== profileId) setDropTargetId(profileId);
    };

    const handleFolderDragOver = (e: React.DragEvent<HTMLDivElement>, category: string) => {
        e.preventDefault();
        setDropTargetId(`folder-${category}`);
    };

    const handleFolderDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDropTargetId(null);
        }
    };

    const handleItemDrop = (e: React.DragEvent<HTMLDivElement>, dropTargetProfile: VoiceProfile) => {
        e.preventDefault(); e.stopPropagation();
        const draggedProfileId = e.dataTransfer.getData('text/plain');
        if (!draggedProfileId || draggedProfileId === dropTargetProfile.id) { handleDragEnd(); return; }

        const fromIndex = profiles.findIndex(p => p.id === draggedProfileId);
        if (fromIndex === -1) { handleDragEnd(); return; }

        const reorderedProfiles = [...profiles];
        const [movedProfile] = reorderedProfiles.splice(fromIndex, 1);
        movedProfile.category = dropTargetProfile.category;

        const newToIndex = reorderedProfiles.findIndex(p => p.id === dropTargetProfile.id);
        reorderedProfiles.splice(newToIndex, 0, movedProfile);

        onReorderProfiles(reorderedProfiles);
        handleDragEnd();
    };

    const handleFolderDrop = (e: React.DragEvent<HTMLDivElement>, targetCategory: string) => {
        e.preventDefault(); e.stopPropagation();
        const draggedProfileId = e.dataTransfer.getData('text/plain');
        const draggedProfile = profiles.find(p => p.id === draggedProfileId);

        if (!draggedProfile || draggedProfile.category === targetCategory) { handleDragEnd(); return; }

        const fromIndex = profiles.findIndex(p => p.id === draggedProfileId);
        const reorderedProfiles = [...profiles];
        const [movedProfile] = reorderedProfiles.splice(fromIndex, 1);
        movedProfile.category = targetCategory; 
        
        reorderedProfiles.push(movedProfile); 

        onReorderProfiles(reorderedProfiles);
        handleDragEnd();
        if (!expandedFolders.has(targetCategory)) toggleFolder(targetCategory);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50/50 dark:bg-black/20">
            <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] backdrop-blur-md sticky top-0 z-20">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Library</h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsCreatingFolder(p => !p)} 
                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-white/10 transition-colors" 
                            aria-label="Create new folder" title="New Folder"
                        >
                            <FolderPlusIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={onCreateProfile} 
                            className="flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-lg
                            bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black
                            shadow-sm transition-all duration-200 active:scale-95 hover:shadow-md border border-transparent" 
                            aria-label="Create new voice profile"
                        >
                            <PlusIcon className="w-3 h-3" />
                            <span>New</span>
                        </button>
                    </div>
                </div>
                 <div className="relative group">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><SearchIcon className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" /></span>
                    <input 
                        type="text" 
                        placeholder="Search voices..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        className="w-full bg-white dark:bg-black/30 rounded-xl border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm py-2.5 pl-9 pr-3 placeholder:text-slate-400 text-slate-700 dark:text-slate-200 font-medium shadow-sm" 
                    />
                </div>
                {isCreatingFolder && (
                    <div className="flex flex-col gap-2 pt-4 animate-fade-in">
                         <div className="flex gap-2 items-center">
                            <input type="text" value={newFolderName} onChange={(e) => {setNewFolderName(e.target.value); setFolderError('')}} onKeyDown={(e) => e.key === 'Enter' && handleSaveFolder()} placeholder="Folder Name" className={`flex-grow bg-white dark:bg-black/40 rounded-lg border text-xs px-3 py-2 w-full ${folderError ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500'}`} autoFocus />
                            <button onClick={handleSaveFolder} className="px-3 py-2 text-[10px] font-bold uppercase rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors" disabled={!newFolderName.trim()}>Add</button>
                        </div>
                        {folderError && <p className="text-[10px] text-red-500 mt-1">{folderError}</p>}
                    </div>
                )}
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
                {Object.keys(groupedProfiles).length > 0 ? (
                    Object.entries(groupedProfiles).map(([category, voices]: [string, VoiceProfile[]]) => {
                        const isExpanded = expandedFolders.has(category);
                        const CategoryIcon = categoryIcons[category] || MyVoicesIcon;
                        const isFolderDropTarget = dropTargetId === `folder-${category}`;
                        
                        return (
                            <div 
                                key={category} 
                                className={`transition-all duration-200 rounded-xl ${isFolderDropTarget ? 'ring-2 ring-indigo-400 dark:ring-indigo-400 bg-indigo-50 dark:bg-white/5' : ''}`}
                                onDragOver={(e) => handleFolderDragOver(e, category)}
                                onDragLeave={handleFolderDragLeave}
                                onDrop={(e) => handleFolderDrop(e, category)}
                            >
                                <button 
                                    onClick={() => toggleFolder(category)} 
                                    className="w-full flex justify-between items-center py-2.5 px-3 text-left group hover:bg-white dark:hover:bg-white/5 transition-colors rounded-xl select-none"
                                    aria-expanded={isExpanded}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`transition-colors ${isExpanded ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                                            <CategoryIcon className="w-4 h-4" />
                                        </div>
                                        <span className={`font-bold text-[11px] tracking-widest uppercase transition-colors ${isExpanded ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`}>{category}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">{voices.length}</span>
                                        <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                
                                {isExpanded && (
                                    <div className="pl-3 pr-1 pt-1 pb-2 space-y-1 animate-fade-in">
                                        {voices.map(profile => (
                                            <VoiceItem 
                                                key={profile.id} 
                                                profile={profile} 
                                                isActive={activeProfileId === profile.id} 
                                                isDragged={draggedItemId === profile.id} 
                                                isDropTarget={dropTargetId === profile.id} 
                                                onSelect={() => onSelectProfile(profile.id)} 
                                                onDelete={() => onDeleteProfile(profile.id)} 
                                                onUpdate={(updates) => onUpdateProfile(profile.id, updates)}
                                                dragAndDropProps={{ 
                                                    draggable: true, 
                                                    onDragStart: (e) => handleDragStart(e, profile.id), 
                                                    onDragEnd: handleDragEnd, 
                                                    onDragOver: (e) => handleItemDragOver(e, profile.id), 
                                                    onDrop: (e) => handleItemDrop(e, profile), 
                                                }}
                                            />
                                        ))}
                                        {(voices.length === 0 || (draggedItemId && !voices.some(v => v.id === draggedItemId))) && (
                                            <div className="py-6 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center mx-2">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 pointer-events-none">Empty Folder</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : profiles.length > 0 && searchQuery.trim() ? (
                    <div className="text-center py-10 text-slate-400 text-xs font-medium"><p>No voices matching "{searchQuery}"</p></div>
                ) : profiles.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-4">
                        <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-full">
                            <MyVoicesIcon className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="text-sm font-medium">Library is empty.</p>
                        <button onClick={onCreateProfile} className="text-indigo-500 dark:text-indigo-400 text-[10px] font-bold uppercase hover:underline tracking-wide">Create First Voice</button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};
