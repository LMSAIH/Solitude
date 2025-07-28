import { SpeechifyClient } from "@speechify/api";

interface SpeechifyAudioResponse {
  audioData: string;
  audioFormat: string;
  billableCharactersCount: number;
  speechMarks: any;
}

export const client = new SpeechifyClient({ token: import.meta.env.VITE_SPEECHIFY_API_KEY });

export class SpeechifyPlayer {
  private currentAudio: HTMLAudioElement | null = null;

  async playAudio(response: SpeechifyAudioResponse): Promise<void> {
    try {
      // Stop any currently playing audio
      this.stop();

      if (!response.audioData) {
        throw new Error('No audio data provided');
      }

      // Decode base64 audio data
      const audioBytes = atob(response.audioData);
      const audioArray = new Uint8Array(audioBytes.length);
      
      for (let i = 0; i < audioBytes.length; i++) {
        audioArray[i] = audioBytes.charCodeAt(i);
      }
      
      // Create blob from audio data
      const audioBlob = new Blob([audioArray], { 
        type: `audio/${response.audioFormat || 'wav'}` 
      });
      
      // Create audio URL and play
      const audioUrl = URL.createObjectURL(audioBlob);
      this.currentAudio = new Audio(audioUrl);
      
      return new Promise((resolve, reject) => {
        if (!this.currentAudio) return reject(new Error('Failed to create audio'));

        this.currentAudio.onloadeddata = () => {
          console.log('Speechify audio loaded and ready to play');
        };
        
        this.currentAudio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          console.log('Speechify audio playback finished');
          resolve();
        };
        
        this.currentAudio.onerror = (error) => {
          console.error('Speechify audio playback error:', error);
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          reject(error);
        };
        
        // Play the audio
        this.currentAudio.play().catch(reject);
      });
      
    } catch (error) {
      console.error('Error playing Speechify audio:', error);
      throw error;
    }
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
  }

  isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}

export const speechifyPlayer = new SpeechifyPlayer();
