import { Audio } from 'expo-av';
import { Vibration } from 'react-native';

class SoundService {
    private sounds: { [key: string]: Audio.Sound | null } = {
        success: null,
        error: null,
        warning: null,
        info: null,
    };

    constructor() {
        // Auto-load sounds when service is instantiated
        this.loadSounds();
    }

    /**
     * Preload sounds using remote URIs as defaults.
     * User can replace these with local require() if they eject or configure assets.
     */
    async loadSounds() {
        try {
            // Success: Short Beep
            const { sound: successSound } = await Audio.Sound.createAsync(
                { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' },
                { shouldPlay: false }
            );
            this.sounds.success = successSound;

            // Error: Computer Error / Clank
            const { sound: errorSound } = await Audio.Sound.createAsync(
                { uri: 'https://actions.google.com/sounds/v1/alarms/mechanical_clock_ring.ogg' }, // Or similar distinct sound
                { shouldPlay: false }
            );
            this.sounds.error = errorSound;

        } catch (error) {
            console.log('Error loading remote sounds, falling back to vibration:', error);
        }
    }

    async playSuccess() {
        try {
            if (this.sounds.success) {
                await this.sounds.success.replayAsync();
            } else {
                Vibration.vibrate(50);
            }
        } catch (error) {
            Vibration.vibrate(50);
        }
    }

    async playError() {
        try {
            if (this.sounds.error) {
                await this.sounds.error.replayAsync();
            } else {
                Vibration.vibrate([0, 500]);
            }
        } catch (error) {
            Vibration.vibrate([0, 500]);
        }
    }

    async playWarning() {
        try {
            // Re-use error sound or just vibrate
            Vibration.vibrate([0, 100, 100, 100]);
        } catch (error) {
            Vibration.vibrate([0, 100, 100, 100]);
        }
    }
}

export const soundService = new SoundService();
