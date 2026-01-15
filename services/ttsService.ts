// services/ttsService.ts

let voices: SpeechSynthesisVoice[] = [];
let selectedVoice: SpeechSynthesisVoice | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

const preferredVoiceNames = [
    // High-quality, natural-sounding voices across platforms
    'Google UK English Female',
    'Google US English',
    'Microsoft Zira - English (United States)',
    'Microsoft David - English (United States)',
    'Samantha', // Apple (macOS/iOS)
    'Daniel', // Apple (macOS/iOS)
    'Tessa', // Nuance
    // Fallbacks
    'Google UK English Male',
    'Microsoft Mark - English (United States)',
    'Alex', // Apple
];

function loadAndSelectVoices() {
    if (!('speechSynthesis' in window)) {
        console.warn("Speech Synthesis not supported by this browser.");
        return;
    }

    const allVoices = window.speechSynthesis.getVoices()
        .filter(v => v.lang.startsWith('en'));

    const sortedVoices = allVoices.sort((a, b) => {
        const aIndex = preferredVoiceNames.indexOf(a.name);
        const bIndex = preferredVoiceNames.indexOf(b.name);

        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        if (a.localService && !b.localService) return -1;
        if (!a.localService && b.localService) return 1;
        
        return a.name.localeCompare(b.name);
    });
    
    voices = sortedVoices;
    if (!selectedVoice || !voices.find(v => v.voiceURI === selectedVoice?.voiceURI)) {
        selectedVoice = voices.length > 0 ? voices[0] : null;
    }

    // Dispatch an event to let components know that voices are updated
    window.dispatchEvent(new CustomEvent('voicesloaded'));
}

// Initial load & event listener
loadAndSelectVoices();
if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadAndSelectVoices;
}

export const getVoices = (): SpeechSynthesisVoice[] => voices;

export const getSelectedVoice = (): SpeechSynthesisVoice | null => selectedVoice;

export const setSelectedVoice = (voiceURI: string) => {
    const voice = voices.find(v => v.voiceURI === voiceURI);
    if (voice) {
        selectedVoice = voice;
    }
};

export const speak = (text: string, options?: { volume?: number, onEnd?: () => void, onStart?: () => void }): SpeechSynthesisUtterance | null => {
    if (!('speechSynthesis' in window)) {
        console.error("TTS not available.");
        if(options?.onEnd) options.onEnd();
        return null;
    }

    cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = options?.volume ?? 1.0;
    
    const handleEnd = () => {
        currentUtterance = null;
        if (options?.onEnd) options.onEnd();
    };

    if (options?.onStart) utterance.onstart = options.onStart;
    utterance.onend = handleEnd;

    utterance.onerror = (e) => {
        console.error("Speech synthesis error", e);
        handleEnd(); // Ensure state is cleaned up on error
    };
    
    window.speechSynthesis.speak(utterance);
    return utterance;
};

export const cancel = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
};
export const pause = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.pause();
};
export const resume = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.resume();
};
export const isSpeaking = (): boolean => {
    return 'speechSynthesis' in window && window.speechSynthesis.speaking;
};
export const isPaused = (): boolean => {
    return 'speechSynthesis' in window && window.speechSynthesis.paused;
};