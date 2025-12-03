
import React from 'react';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { ChatIcon } from './icons/ChatIcon';

const AudioIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M4 12H5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7.5 12H8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.5 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12.5 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14.5 9V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16.5 12H17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19.5 12H20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    activeTab: 'audio' | 'chat';
    setActiveTab: (tab: 'audio' | 'chat') => void;
}

const TabButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    ariaLabel: string;
}> = ({ isActive, onClick, icon, label, ariaLabel }) => (
    <button
        onClick={onClick}
        aria-label={ariaLabel}
        className={`relative flex items-center gap-2 px-6 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-300 rounded-lg outline-none
            ${isActive
                ? 'text-slate-900 dark:text-white bg-white dark:bg-white/10 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/5'
            }`}
    >
        <div className="flex items-center gap-2 z-10">
            {icon}
            <span>{label}</span>
        </div>
    </button>
);


export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, activeTab, setActiveTab }) => {
    return (
        <header className="flex-shrink-0 z-20 mb-2 pt-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                     <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 dark:from-indigo-400 dark:to-blue-500 rounded-full shadow-lg shadow-indigo-500/20"></div>
                        <span className="tracking-tight">VOICEGEN <span className="font-medium opacity-50 text-slate-500 dark:text-slate-400">STUDIO</span></span>
                    </h1>

                    <div className="flex items-center p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/5">
                        <TabButton 
                            isActive={activeTab === 'audio'}
                            onClick={() => setActiveTab('audio')}
                            icon={<AudioIcon className={`w-3.5 h-3.5 transition-colors duration-200 ${activeTab === 'audio' ? 'text-indigo-600 dark:text-indigo-400' : 'opacity-70'}`} />}
                            label="Generator"
                            ariaLabel="Switch to Audio Generator"
                        />
                        <TabButton 
                            isActive={activeTab === 'chat'}
                            onClick={() => setActiveTab('chat')}
                            icon={<ChatIcon className={`w-3.5 h-3.5 transition-colors duration-200 ${activeTab === 'chat' ? 'text-purple-600 dark:text-purple-400' : 'opacity-70'}`} />}
                            label="Chat"
                            ariaLabel="Switch to Chatbot"
                        />
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50">
                        Pro Plan
                    </span>
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200/50 dark:border-white/5 active:scale-95 shadow-sm"
                        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </header>
    );
};
