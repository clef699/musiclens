"""Unit tests for analyzer.py"""
import pytest
import sys
import os
import numpy as np
import soundfile as sf
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from analyzer import (
    analyze_audio,
    detect_key_and_scale,
    detect_chords,
    identify_chord,
    calculate_performance_score,
    midi_to_note_name,
    transpose_notes_for_instrument,
    INSTRUMENT_TRANSPOSITIONS,
    generate_sample_notes,
)


# ── fixtures ──────────────────────────────────────────────────────────────────

def make_wav(path: str, freqs: list[float], duration: float = 0.3, sr: int = 22050):
    """Write a WAV file containing sine-wave tones for each frequency."""
    audio = []
    for freq in freqs:
        t = np.linspace(0, duration, int(sr * duration), endpoint=False)
        wave = 0.5 * np.sin(2 * np.pi * freq * t)
        audio.append(wave)
    combined = np.concatenate(audio).astype(np.float32)
    sf.write(path, combined, sr)


@pytest.fixture(scope="module")
def sample_wav(tmp_path_factory):
    p = tmp_path_factory.mktemp("audio") / "c_major.wav"
    # C4 D4 E4 F4 G4 A4 B4 C5
    freqs = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]
    make_wav(str(p), freqs, duration=0.4)
    return str(p)


@pytest.fixture(scope="module")
def silent_wav(tmp_path_factory):
    p = tmp_path_factory.mktemp("audio") / "silent.wav"
    sf.write(str(p), np.zeros(22050, dtype=np.float32), 22050)
    return str(p)


# ── midi_to_note_name ─────────────────────────────────────────────────────────

def test_midi_to_note_name_middle_c():
    assert midi_to_note_name(60) == "C4"

def test_midi_to_note_name_a4():
    assert midi_to_note_name(69) == "A4"

def test_midi_to_note_name_c5():
    assert midi_to_note_name(72) == "C5"

def test_midi_to_note_name_sharp():
    assert midi_to_note_name(61) == "C#4"


# ── identify_chord ────────────────────────────────────────────────────────────

def test_identify_c_major():
    # C=0, E=4, G=7
    assert identify_chord([0, 4, 7]) == "C"

def test_identify_a_minor():
    # A=9, C=0, E=4
    assert identify_chord([9, 0, 4]) == "Amin"

def test_identify_g_dominant_7():
    # G=7, B=11, D=2, F=5
    assert identify_chord([7, 11, 2, 5]) == "Gdom7"

def test_identify_too_few_notes():
    assert identify_chord([0]) is None

def test_identify_empty():
    assert identify_chord([]) is None


# ── detect_key_and_scale ──────────────────────────────────────────────────────

def test_detect_c_major_key():
    # All pitches from C major scale
    notes = [{"pitch": p} for p in [60, 62, 64, 65, 67, 69, 71, 72] * 3]
    key, scale = detect_key_and_scale(notes)
    assert key == "C"
    assert "major" in scale

def test_detect_a_minor_key():
    notes = [{"pitch": p} for p in [69, 71, 72, 74, 76, 77, 79, 81] * 3]
    key, scale = detect_key_and_scale(notes)
    assert key == "A"
    assert "minor" in scale or "major" in scale  # relative major sharing same pitches

def test_detect_key_empty_notes():
    key, scale = detect_key_and_scale([])
    assert key == "C"
    assert scale == "major"


# ── detect_chords ─────────────────────────────────────────────────────────────

def test_detect_chords_finds_c_major():
    notes = [
        {"pitch": 60, "start_time": 0.0, "end_time": 0.6, "duration": 0.6},
        {"pitch": 64, "start_time": 0.0, "end_time": 0.6, "duration": 0.6},
        {"pitch": 67, "start_time": 0.0, "end_time": 0.6, "duration": 0.6},
    ]
    chords = detect_chords(notes, time_window=0.5)
    assert len(chords) >= 1
    assert any("C" in c["chord"] for c in chords)

def test_detect_chords_empty():
    assert detect_chords([]) == []

def test_detect_chords_single_note():
    notes = [{"pitch": 60, "start_time": 0.0, "end_time": 0.5, "duration": 0.5}]
    # Single note cannot form a chord
    chords = detect_chords(notes)
    assert isinstance(chords, list)


# ── calculate_performance_score ───────────────────────────────────────────────

def test_score_valid_notes():
    notes = generate_sample_notes(duration=4.0)
    result = calculate_performance_score(notes, duration=4.0)
    assert 0 <= result["total"] <= 100
    assert "pitch_accuracy" in result
    assert "rhythm" in result
    assert "note_density" in result

def test_score_empty_notes():
    result = calculate_performance_score([], duration=5.0)
    assert result["total"] == 0

def test_score_zero_duration():
    notes = generate_sample_notes(1.0)
    result = calculate_performance_score(notes, duration=0)
    assert result["total"] == 0


# ── transpose_notes_for_instrument ────────────────────────────────────────────

def test_no_transpose_for_piano():
    notes = [{"pitch": 60, "note_name": "C4", "start_time": 0.0, "end_time": 0.5, "duration": 0.5, "velocity": 80}]
    result = transpose_notes_for_instrument(notes, "piano")
    assert result[0]["pitch"] == 60

def test_transpose_alto_sax():
    # alto_sax: concert + 9 semitones
    notes = [{"pitch": 60, "note_name": "C4", "start_time": 0.0, "end_time": 0.5, "duration": 0.5, "velocity": 80}]
    result = transpose_notes_for_instrument(notes, "alto_saxophone")
    assert result[0]["pitch"] == 69  # A4

def test_transpose_tenor_sax():
    # tenor_sax / trumpet: concert + 2 semitones
    notes = [{"pitch": 60, "note_name": "C4", "start_time": 0.0, "end_time": 0.5, "duration": 0.5, "velocity": 80}]
    result = transpose_notes_for_instrument(notes, "tenor_saxophone")
    assert result[0]["pitch"] == 62  # D4


# ── analyze_audio (integration, uses fallback) ────────────────────────────────

def test_analyze_audio_c_major(sample_wav):
    result = analyze_audio(sample_wav, "piano")
    assert result["key"] is not None
    assert result["scale"] is not None
    assert isinstance(result["notes"], list)
    assert isinstance(result["chords"], list)
    assert 0 <= result["score"]["total"] <= 100
    assert result["duration"] > 0
    assert result["note_count"] >= 0

def test_analyze_audio_guitar(sample_wav):
    result = analyze_audio(sample_wav, "lead_guitar")
    assert result["instrument"] == "lead_guitar"
    assert result["note_count"] >= 0

def test_analyze_audio_silent_file(silent_wav):
    result = analyze_audio(silent_wav, "piano")
    # Should not crash; uses fallback notes
    assert "key" in result
    assert isinstance(result["notes"], list)

def test_analyze_audio_all_instruments(sample_wav):
    for instr in INSTRUMENT_TRANSPOSITIONS.keys():
        result = analyze_audio(sample_wav, instr)
        assert result["instrument"] == instr

def test_analyze_audio_file_not_found():
    with pytest.raises(FileNotFoundError):
        analyze_audio("/nonexistent/file.wav", "piano")

def test_analyze_audio_invalid_instrument(sample_wav):
    with pytest.raises(ValueError, match="Unsupported instrument"):
        analyze_audio(sample_wav, "kazoo")
