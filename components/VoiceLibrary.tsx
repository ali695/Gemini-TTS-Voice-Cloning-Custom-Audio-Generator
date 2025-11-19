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
import { SearchIcon } from './icons/SearchIcon';


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

    const combinedClassName = `px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group relative border
        ${isActive 
            ? 'bg-white dark:bg-slate-800 border-blue-500 dark:border-cyan-400 shadow-md ring-1 ring-blue-500/20 dark:ring-cyan-400/20 z-10' 
            : 'border-transparent hover:bg-slate-50 dark:hover:bg-white/5'
        } ${isDragged ? 'opacity-30 scale-95' : 'opacity-100'} 
          ${isDropTarget ? 'border-t-2 border-t-blue-500 dark:border-t-cyan-400 pt-3' : ''}`;

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
                        className="bg-white dark:bg-black text-slate-900 dark:text-white w-full text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 -ml-2"
                        autoFocus onClick={e => e.stopPropagation()}
                        aria-label={`Rename voice profile ${profile.name}`}
                    />
                ) : (
                    <h3 className={`text-sm font-semibold truncate pr-8 ${isActive ? 'text-blue-700 dark:text-cyan-100' : 'text-slate-700 dark:text-slate-300'}`} onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                        {profile.name}
                    </h3>
                )}
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-blue-50 dark:hover:bg-cyan-900/20" aria-label={`Rename ${profile.name}`}><EditIcon className="w-3.5 h-3.5" /></button>
                    <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" aria-label={`Delete ${profile.name}`}><DeleteIcon className="w-3.5 h-3.5" /></button>
                </div>
            </div>
            <p className={`text-xs mt-1 truncate font-medium ${isActive ? 'text-blue-600/70 dark:text-cyan-200/60' : 'text-slate-400 dark:text-slate-500'}`}>{profile.description}</p>
        </div>
    );
};

export const VoiceLibrary: React.FC<VoiceLibraryProps> = ({
    profiles, activeProfileId, customFolders, onSelectProfile, onCreateProfile,
    onCreateFolder, onDeleteProfile, onUpdateProfile, onReorderProfiles
}) => {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['My Voices']));
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

        const builtInOrder = ['My Voices', ...customFolders.sort(), 'Narration', 'Storytelling', 'Motivational & Deep', 'Social Media', 'Relaxation', 'Soft Intimate Whisper', 'Ultra-Horror', 'Characters', 'Accents', 'Languages'];
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

        // Move logic + Reorder
        const reorderedProfiles = [...profiles];
        const [movedProfile] = reorderedProfiles.splice(fromIndex, 1);
        movedProfile.category = dropTargetProfile.category; // Update category!

        const newToIndex = reorderedProfiles.findIndex(p => p.id === dropTargetProfile.id);
        // Insert before the drop target
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
        movedProfile.category = targetCategory; // Move to new folder
        
        // Add to end of list (effectively end of that folder since we sort/group in view)
        reorderedProfiles.push(movedProfile); 

        onReorderProfiles(reorderedProfiles);
        handleDragEnd();
        // Auto-expand the target folder
        if (!expandedFolders.has(targetCategory)) toggleFolder(targetCategory);
    };

    return (
        <div className="h-full flex flex-col bg-white/30 dark:bg-black/20">
            <div className="flex-shrink-0 p-5 border-b border-slate-200 dark:border-white/5 bg-white/60 dark:bg-black/40 backdrop-blur-md sticky top-0 z-20">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Library</h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsCreatingFolder(p => !p)} 
                            className="p-2 rounded-lg text-slate-500 hover:bg-white dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-cyan-400 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10" 
                            aria-label="Create new folder" title="New Folder"
                        >
                            <FolderPlusIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={onCreateProfile} 
                            className="flex items-center gap-2 px-3 py-2 text-xs font-bold tracking-wide uppercase rounded-lg shadow-lg shadow-blue-500/20 text-white bg-blue-600 hover:bg-blue-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-black transition-all active:scale-95" 
                            aria-label="Create new voice profile"
                        >
                            <PlusIcon className="w-3.5 h-3.5" />
                            <span>New Voice</span>
                        </button>
                    </div>
                </div>
                 <div className="relative group">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><SearchIcon className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 dark:group-focus-within:text-cyan-400 transition-colors" /></span>
                    <input 
                        type="text" 
                        placeholder="Filter voices..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        className="w-full bg-white dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400/50 focus:border-blue-500 dark:focus:border-cyan-400 transition-all text-sm py-2.5 pl-10 pr-3 shadow-sm placeholder:text-slate-400 font-medium" 
                    />
                </div>
                {isCreatingFolder && (
                    <div className="flex flex-col gap-2 pt-3 animate-fade-in">
                         <div className="flex gap-2 items-center">
                            <input type="text" value={newFolderName} onChange={(e) => {setNewFolderName(e.target.value); setFolderError('')}} onKeyDown={(e) => e.key === 'Enter' && handleSaveFolder()} placeholder="Folder Name" className={`flex-grow bg-white dark:bg-black/40 rounded-lg border text-sm px-3 py-2 w-full ${folderError ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500'}`} autoFocus />
                            <button onClick={handleSaveFolder} className="px-3 py-2 text-xs font-bold uppercase rounded-lg bg-slate-900 dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity" disabled={!newFolderName.trim()}>Add</button>
                        </div>
                        {folderError && <p className="text-xs text-red-500 mt-1">{folderError}</p>}
                    </div>
                )}
            </div>
            <div className="flex-grow overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {Object.keys(groupedProfiles).length > 0 ? (
                    Object.entries(groupedProfiles).map(([category, voices]: [string, VoiceProfile[]]) => {
                        const isExpanded = expandedFolders.has(category);
                        const CategoryIcon = categoryIcons[category] || MyVoicesIcon;
                        const isFolderDropTarget = dropTargetId === `folder-${category}`;
                        
                        return (
                            <div 
                                key={category} 
                                className={`transition-all duration-300 rounded-xl border ${isFolderDropTarget ? 'border-blue-500 dark:border-cyan-400 bg-blue-50 dark:bg-cyan-900/20 shadow-md scale-[1.02]' : 'border-transparent'}`}
                                onDragOver={(e) => handleFolderDragOver(e, category)}
                                onDragLeave={handleFolderDragLeave}
                                onDrop={(e) => handleFolderDrop(e, category)}
                            >
                                <button 
                                    onClick={() => toggleFolder(category)} 
                                    className="w-full flex justify-between items-center py-2.5 px-3 text-left group hover:bg-slate-100 dark:hover:bg-white/5 transition-colors rounded-lg"
                                    aria-expanded={isExpanded}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`transition-colors ${isExpanded ? 'text-blue-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                                            <CategoryIcon className="w-5 h-5" />
                                        </div>
                                        <span className={`font-bold text-xs tracking-wide uppercase transition-colors ${isExpanded ? 'text-blue-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'}`}>{category}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">{voices.length}</span>
                                        <ChevronDownIcon className={`w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                
                                {isExpanded && (
                                    <div className="pl-3 pr-1 pt-1 pb-3 space-y-1.5 animate-fade-in">
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
                                            <div className={`
                                                py-8 rounded-lg border-2 border-dashed text-center transition-all duration-300
                                                ${isFolderDropTarget 
                                                    ? 'border-blue-400 dark:border-cyan-400 bg-blue-50/50 dark:bg-cyan-900/10 text-blue-600 dark:text-cyan-400 scale-100 opacity-100' 
                                                    : 'border-slate-200 dark:border-white/5 text-slate-400 scale-95 opacity-50'}
                                            `}>
                                                <p className="text-xs font-semibold uppercase tracking-wide pointer-events-none">Drop to Move Here</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : profiles.length > 0 && searchQuery.trim() ? (
                    <div className="text-center py-12 text-slate-400"><p>No voices match "{searchQuery}"</p></div>
                ) : profiles.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-4">
                        <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-full">
                            <MyVoicesIcon className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-sm font-medium">Library is empty.</p>
                        <button onClick={onCreateProfile} className="text-blue-500 dark:text-cyan-400 text-xs font-bold uppercase hover:underline">Create your first voice</button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};