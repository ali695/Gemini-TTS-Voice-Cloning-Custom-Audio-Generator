
export interface VoiceSettings {
    language: 'EN' | 'UR' | 'DE' | 'AR' | 'HI' | 'TR' | 'ES' | 'FR' | 'JA' | 'RU' | 'ZH';
    speed: number;
    pitch: number;
    temperature: number;
    emotionalDepth: number;
    clarity: number;
    breathingLevel: number;
    stability: number;
    accent: string;
}

export type Vibe = 
    'Dramatic' | 'Friendly' | 'Sincere' | 'Pirate' | 'Smooth Jazz DJ' | 
    'Whispering' | 'Emotional' | 'Documentary' | 'Motivational' | 'Villain' | 
    'News Anchor' | 'Calm Therapist' | 'Soft ASMR' | 'Horror Narrator' |
    'Fairytale Teller' | 'Action Narrator' | 'Bedtime Story';

export interface VoiceProfile {
    id: string;
    name: string;
    description: string;
    settings: VoiceSettings;
    vibe: Vibe;
    category?: string;
    audioSampleUrl?: string; // For cloned voices
}