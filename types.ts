
export type ViralAccent = 
    'Neutral EN' | 'British Warm' | 'American Reels Style' | 'German Soft' | 
    'Turkish Soft Emotional' | 'Urdu Emotional' | 'Arabic Velvet' | 
    'Indian Cinematic' | 'Deep Documentary' | 'Viral Short-Form' | 'Whisper Accent' | 'Gentle Therapist' |
    'Horror Whisper' | 'Ghostly Echo' | 'Demonic Distortion' |
    'Quranic Tajweed' | 'Egyptian Qari' | 'Saudi Qari' |
    'Transatlantic (1920s)' | 'Nature Documentary' | 'Robotic Filter' | 'Heavy Distortion';

export interface VoiceSettings {
    language: 'EN' | 'UR' | 'DE' | 'AR' | 'HI' | 'TR' | 'ES' | 'FR' | 'JA' | 'RU' | 'ZH';
    speed: number;
    pitch: number;
    temperature: number;
    emotionalDepth: number;
    clarity: number;
    breathingLevel: number;
    stability: number;
    accent: ViralAccent | string;
    reverb?: number; // New parameter for horror ambience
    creepiness?: number; // New parameter for unsettling tone
}

export type Vibe = 
    'Dramatic' | 'Friendly' | 'Sincere' | 'Pirate' | 'Smooth Jazz DJ' | 
    'Whispering' | 'Emotional' | 'Documentary' | 'Motivational' | 'Villain' | 
    'News Anchor' | 'Calm Therapist' | 'Soft ASMR' | 'Horror Narrator' |
    'Fairytale Teller' | 'Action Narrator' | 'Bedtime Story' |
    'Terrified' | 'Demonic' | 'Eerie' | 'Ghostly' | 'Poltergeist' |
    'Islamic Recitation' | 'Spiritual' | 'Murattal' |
    'Philosophical' | 'Cybernetic' | 'Divine' | 'Hysterical' | 'Grumpy' |
    'Hypnotic' | 'Sleep Learning';

export interface VoiceProfile {
    id: string;
    name: string;
    description: string;
    settings: VoiceSettings;
    vibe: Vibe;
    category?: string;
    audioSampleUrl?: string; // For cloned voices
}
