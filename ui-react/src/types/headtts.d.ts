/**
 * Type declarations for @met4citizen/headtts
 * This package may not be installed - AIAvatar has Web Speech API fallback
 */
declare module '@met4citizen/headtts' {
  interface HeadTTSOptions {
    audioContext?: AudioContext;
  }

  interface SpeakOptions {
    voice?: string;
    rate?: number;
    pitch?: number;
  }

  export default class HeadTTS {
    constructor(options?: HeadTTSOptions);
    speak(text: string, options?: SpeakOptions): Promise<void>;
    stop(): void;
    getAudioContext(): AudioContext | null;
  }
}
