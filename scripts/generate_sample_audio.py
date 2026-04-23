"""Generate a sample C major scale WAV file for testing."""
import numpy as np
import soundfile as sf
import os

def generate_c_major_scale(output_path: str, sample_rate: int = 22050, note_duration: float = 0.4):
    """Generate a C major scale as a WAV file."""
    # MIDI notes for C major scale (two octaves)
    midi_notes = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84]

    def midi_to_freq(midi: int) -> float:
        return 440.0 * (2.0 ** ((midi - 69) / 12.0))

    samples_per_note = int(sample_rate * note_duration)
    audio = []

    for midi in midi_notes:
        freq = midi_to_freq(midi)
        t = np.linspace(0, note_duration, samples_per_note, endpoint=False)
        # Add harmonics for richer sound
        wave = (
            0.6 * np.sin(2 * np.pi * freq * t) +
            0.3 * np.sin(2 * np.pi * 2 * freq * t) +
            0.1 * np.sin(2 * np.pi * 3 * freq * t)
        )
        # Apply envelope
        envelope = np.ones(samples_per_note)
        attack = int(0.01 * sample_rate)
        release = int(0.05 * sample_rate)
        envelope[:attack] = np.linspace(0, 1, attack)
        envelope[-release:] = np.linspace(1, 0, release)
        wave *= envelope * 0.5
        audio.extend(wave.tolist())

    audio_array = np.array(audio, dtype=np.float32)
    sf.write(output_path, audio_array, sample_rate)
    print(f"Generated sample audio: {output_path} ({len(audio_array)/sample_rate:.1f}s)")
    return output_path


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(os.path.dirname(__file__)), "sample_audio", "c_major_scale.wav")
    generate_c_major_scale(out)
