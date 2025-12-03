
import { GoogleGenAI, Chat } from "@google/genai";
import type { VoiceProfile } from '../types';

// IMPORTANT: This key is managed externally and will be provided in the execution environment.
// Do not modify this line or add any UI for key management.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

async function retryOperation<T>(operation: () => Promise<T>, retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        // Check for retryable errors (500, 503, 429, or XHR errors which often manifest as generic errors or code 6)
        const isRetryable = 
            error.status === 500 || 
            error.status === 503 || 
            error.status === 429 ||
            (error.message && error.message.includes('xhr error')) ||
            (error.message && error.message.includes('fetch failed'));

        if (retries > 0 && isRetryable) {
            console.warn(`API attempt failed. Retrying in ${delay}ms... (Retries left: ${retries})`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
            // Exponential backoff
            return retryOperation(operation, retries - 1, delay * 2);
        }
        throw error;
    }
}

function constructPrompt(script: string, profile: VoiceProfile): string {
    const { name, category, settings, vibe, audioSampleUrl } = profile;

    // Handle Horror Atmosphere Modifiers
    let atmosphereInstruction = "";
    if (settings.reverb && settings.reverb > 0.1) {
        if (settings.reverb > 0.8) atmosphereInstruction += " with a heavy, cavernous reverb and echo as if in a large, empty hall, ";
        else if (settings.reverb > 0.4) atmosphereInstruction += " with a distinct, noticeable reverb, ";
        else atmosphereInstruction += " with a slight, subtle echo, ";
    }

    if (settings.creepiness && settings.creepiness > 0.1) {
        if (settings.creepiness > 0.8) atmosphereInstruction += " in a terrifying, nightmarish tone filled with dread, ";
        else if (settings.creepiness > 0.5) atmosphereInstruction += " in an unsettling, creepy, and disturbing tone, ";
        else atmosphereInstruction += " with a subtle, eerie undertone, ";
    }

    if (audioSampleUrl) {
        const cloningInstruction = `CRITICAL: Strict voice cloning required. Replicate the user's reference audio identity exactly. Match tone, timbre, accent, pacing, pitch, warmth, and breathiness.`;
        const stylingInstruction = `The vibe '${vibe}' should only influence emotion, not identity. ${atmosphereInstruction}`;
        return `${cloningInstruction} ${stylingInstruction}\n\nContent to read: "${script}"`;
    }

    let mainInstruction = '';
    const nameLower = name.toLowerCase();

    // Category-specific instructions
    if (category === 'Quranic Recitation') {
        const quranPreamble = "Perform a respectful, authentic male Islamic vocal performance (Murattal style). Use a warm, breath-controlled voice with precise articulation. No music. Light room ambience.";
        if (nameLower.includes('mishary')) mainInstruction = `${quranPreamble} Style: Mishary Alafasy - smooth, emotional, gentle baritone.`;
        else if (nameLower.includes('sudais')) mainInstruction = `${quranPreamble} Style: Sudais - deep chest voice, powerful, fast-paced Hadr.`;
        else if (nameLower.includes('hussary')) mainInstruction = `${quranPreamble} Style: Hussary - very slow, precise, academic Tajwīd.`;
        else if (nameLower.includes('minshawi')) mainInstruction = `${quranPreamble} Style: Minshawi - sad (Nahawand), emotional, gentle vibrato.`;
        else if (nameLower.includes('abdul basit')) mainInstruction = `${quranPreamble} Style: Abdul Basit - powerful, resonant, long breath, Egyptian Mujawwad.`;
        else mainInstruction = `${quranPreamble} Style: Authentic Male Qari.`;
    
    } else if (category === 'Sleep Learning & Long Form') {
        const sleepPreamble = "Perform in a slow, steady, and incredibly stable voice suitable for long-form listening and subconscious learning. Maintain perfectly consistent volume and pacing.";
        
        if (nameLower.includes('night drive')) {
            mainInstruction = `${sleepPreamble} Style: 'Night Drive' Radio Host. Deep, soft-spoken male voice. Very calm, reassuring, and intimate. Clear articulation for English learning, but relaxed.`;
        } else if (nameLower.includes('subconscious')) {
            mainInstruction = `${sleepPreamble} Style: Hypnotic Learning. Gentle, rhythmic female voice. Clear pauses between phrases to allow for mental processing. Soft, non-intrusive.`;
        } else if (nameLower.includes('hypnosis')) {
            mainInstruction = `${sleepPreamble} Style: Deep Hypnosis. Extremely slow, resonant, monophonic male voice. Bore into the subconscious.`;
        } else {
            mainInstruction = `${sleepPreamble} Style: Gentle Bedtime Reader. Soft and soothing.`;
        }

    } else if (category === 'Background Horror') {
        const bgHorror = `Generate a soundscape-like vocal performance ${atmosphereInstruction}`;
        if (nameLower.includes('poltergeist')) mainInstruction = bgHorror + 'of a noisy poltergeist: vocal fry, sudden shifts, echoing.';
        else if (nameLower.includes('cult')) mainInstruction = bgHorror + 'of a low, monotonic, rhythmic cult chant.';
        else if (nameLower.includes('demon')) mainInstruction = bgHorror + 'of a basement demon: low pitch, guttural, growling.';
        else mainInstruction = bgHorror + 'that is ambient and scary.';
        
    } else if (category === 'Ultra-Horror') {
        const horror = `Sound-designed horror voice ${atmosphereInstruction}. `;
        if (nameLower.includes('demonic')) mainInstruction = horror + 'Deep, layered, distorted demon voice with low harmonics and growls.';
        else if (nameLower.includes('witch')) mainInstruction = horror + 'High-pitched, cackling, sinister witch voice.';
        else if (nameLower.includes('ghost')) mainInstruction = horror + 'Ethereal, airy, cold ghost voice with echo.';
        else mainInstruction = horror + 'Creepy, slow, suspenseful narrator.';

    } else if (category === 'Soft Intimate Whisper') {
        const asmr = `Close-mic ASMR whisper ${atmosphereInstruction}. `;
        if (nameLower.includes('soft girl')) mainInstruction = asmr + 'Extremely soft, breathy, airy female whisper.';
        else if (nameLower.includes('deep')) mainInstruction = asmr + 'Deep, resonant, smooth whisper.';
        else mainInstruction = asmr + 'Warm, gentle, comforting whisper.';

    } else if (category === 'Motivational & Deep') {
        if (nameLower.includes('deep') || nameLower.includes('epic')) mainInstruction = `Powerful, deep, resonant, cinematic male voice ${atmosphereInstruction}.`;
        else mainInstruction = `Calm, reassuring, professional motivational voice ${atmosphereInstruction}.`;

    } else if (settings.accent === 'Transatlantic (1920s)') {
        mainInstruction = `Speak with a fast, clipped, sharp 1920s Transatlantic radio announcer accent. ${atmosphereInstruction}`;

    } else if (settings.accent === 'Nature Documentary') {
        mainInstruction = `Speak in a breathy, hushed, reverent, and highly articulate British accent, exactly like David Attenborough observing nature. ${atmosphereInstruction}`;

    } else if (vibe === 'Cybernetic' || settings.accent === 'Robotic Filter') {
        mainInstruction = `Speak in a precise, staccato, slightly metallic and emotionless cybernetic tone. ${atmosphereInstruction}`;

    } else {
        // General fallback
        mainInstruction = `Speak in a ${vibe.toLowerCase()} tone as ${name}. ${atmosphereInstruction}`;
        if (settings.accent && settings.accent !== 'Neutral EN') {
            mainInstruction += ` Use a ${settings.accent} accent.`;
        }
    }
    
    // Put instructions FIRST to ensure they are processed as context, not content.
    return `Voice Style Instruction: ${mainInstruction}\n\nContent to read: "${script}"`;
}


export async function generateSpeech(
    script: string,
    profile: VoiceProfile
): Promise<string> {
    const fullPrompt = constructPrompt(script, profile);
    
    // INTELLIGENT GENDER & MODEL SELECTION
    let selectedVoice = 'Kore'; // Default Female
    
    const descriptionLower = profile.description.toLowerCase();
    const nameLower = profile.name.toLowerCase();
    
    // Keywords that strongly suggest a male voice
    const isMale = /\b(male|man|boy|guy|brother|father|king|wizard|pirate|lord|sir|actor|hero|soldier|monk|narrator|detective|general|chef|baritone|chest voice|attenborough|philosopher|gangster|cyborg|warlord|gentleman)\b/.test(descriptionLower) || 
                   /\b(male|man|boy|guy|mr|david|arthur|chris|callum|daniel)\b/.test(nameLower);

    // Keywords that strongly suggest a deep/rough male voice
    const isDeepMale = /\b(deep|gruff|powerful|low|rough|monster|demon|giant|viking|god|sage|ancient|warlord)\b/.test(descriptionLower);
    
    // Keywords for specific rough male archetypes
    const isRoughMale = /\b(orc|growl|distorted|cybernetic|robot|glitch)\b/.test(descriptionLower);


    if (profile.category === 'Quranic Recitation') {
        selectedVoice = 'Charon'; // Best for Recitation
    } else if (profile.category === 'Background Horror' || profile.category === 'Ultra-Horror') {
         if (nameLower.includes('witch') || nameLower.includes('girl') || nameLower.includes('woman')) {
             selectedVoice = 'Kore';
         } else if (nameLower.includes('demon') || nameLower.includes('monster') || nameLower.includes('growl')) {
             selectedVoice = 'Fenrir';
         } else {
             selectedVoice = 'Charon';
         }
    } else if (isRoughMale) {
        selectedVoice = 'Fenrir';
    } else if (isMale) {
        selectedVoice = isDeepMale ? 'Charon' : 'Puck';
    }

    const callApi = async () => {
        // Using the dedicated TTS model
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: fullPrompt }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: selectedVoice }, 
                    },
                },
                // CRITICAL: Relax safety settings for Horror/Thriller/Creative content
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                ],
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        // Check if we got a refusal (text instead of audio)
        const textPart = response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!base64Audio && textPart) {
            console.error("Model refused generation:", textPart);
            throw new Error(`Model Refusal: ${textPart}`);
        }

        if (!base64Audio) {
             throw new Error("Gemini API returned no audio data. The request might have been blocked by safety filters.");
        }

        return base64Audio;
    };

    try {
        return await retryOperation(callApi);
    } catch (error: any) {
        console.error("Error calling Gemini API:", error);
        if (error.message && error.message.includes('SAFETY')) {
             throw new Error("Safety Block: Please adjust the script or settings.");
        }
        if (error.message && error.message.includes('Refusal')) {
            throw new Error(error.message);
        }
        throw new Error(`Generation Failed: ${error.message || "Unknown error"}`);
    }
}

// --- Chatbot Capability ---

export function createChatSession(): Chat {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "You are VoiceGen Assistant, an expert in audio synthesis. Help users write scripts, choose voice settings, and debug audio issues. Keep answers concise.",
        }
    });
}
