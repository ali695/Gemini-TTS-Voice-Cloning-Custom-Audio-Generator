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
        className={`relative flex items-center gap-2 px-6 py-2 text-sm font-semibold transition-all duration-300 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
            ${isActive
                ? 'text-blue-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
    >
         {isActive && (
            <div className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-white/10" style={{ zIndex: -1 }}></div>
        )}
        <div className="flex items-center gap-2 z-10">
            {icon}
            <span>{label}</span>
        </div>
    </button>
);


export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, activeTab, setActiveTab }) => {
    return (
        <header className="flex-shrink-0 z-20 mb-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                     <h1 className="text-base font-bold tracking-wide uppercase text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="w-2 h-8 bg-blue-600 dark:bg-cyan-400 rounded-full"></div>
                        VoiceGen <span className="font-light opacity-70">Studio</span>
                    </h1>

                    <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>

                    <div className="flex items-center p-1 bg-slate-100 dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/5 shadow-inner">
                        <TabButton 
                            isActive={activeTab === 'audio'}
                            onClick={() => setActiveTab('audio')}
                            icon={<AudioIcon className={`w-4 h-4 transition-colors duration-300 ${activeTab === 'audio' ? 'text-blue-600 dark:text-cyan-400' : 'text-slate-400'}`} />}
                            label="Generator"
                            ariaLabel="Switch to Audio Generator"
                        />
                        <TabButton 
                            isActive={activeTab === 'chat'}
                            onClick={() => setActiveTab('chat')}
                            icon={<ChatIcon className={`w-4 h-4 transition-colors duration-300 ${activeTab === 'chat' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />}
                            label="Chat"
                            ariaLabel="Switch to Chatbot"
                        />
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20">
                        PRO
                    </span>
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10 shadow-none hover:shadow-sm"
                        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </header>
    );
};