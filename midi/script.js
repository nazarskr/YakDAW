// Ініціалізація AudioContext
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Змінна для sustain (затримка звуку)
let sustainEnabled = false;
document.getElementById('sustain').addEventListener('change', function() {
    sustainEnabled = this.checked;
});

// Мапа нот для відповідності з MIDI нотами
const noteFrequencyMap = {
    48: 130.81, // C3
    49: 138.59, // C#3
    50: 146.83, // D3
    51: 155.56, // D#3
    52: 164.81, // E3
    53: 174.61, // F3
    54: 185.00, // F#3
    55: 196.00, // G3
    56: 207.65, // G#3
    57: 220.00, // A3
    58: 233.08, // A#3
    59: 246.94, // B3
    60: 261.63, // C4
    61: 277.18, // C#4
    62: 293.66, // D4
    63: 311.13, // D#4
    64: 329.63, // E4
    65: 349.23, // F4
    66: 369.99, // F#4
    67: 392.00, // G4
    68: 415.30, // G#4
    69: 440.00, // A4
    70: 466.16, // A#4
    71: 493.88  // B4
};

// Мапа для активних осциляторів, щоб зупиняти звук при відпусканні клавіші
const activeOscillators = {};

// Функція для створення звуку
function playNote(frequency, note) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime); // Початкова гучність

    oscillator.start(audioCtx.currentTime);

    // Якщо sustain увімкнено
    if (sustainEnabled) {
        // Зменшуємо гучність з 8-ї секунди і вимикаємо звук через 10 секунд
        gainNode.gain.setTargetAtTime(0.0, audioCtx.currentTime + 8, 2);
        oscillator.stop(audioCtx.currentTime + 10);
    }

    // Зберігаємо активний осцилятор для можливості його зупинки
    activeOscillators[note] = { oscillator, gainNode };
}

// Функція для зупинки звуку (без sustain)
function stopNote(note) {
    if (!sustainEnabled && activeOscillators[note]) {
        const { oscillator, gainNode } = activeOscillators[note];
        // Плавно зменшуємо гучність перед зупинкою
        gainNode.gain.setTargetAtTime(0.0, audioCtx.currentTime, 0.05);
        oscillator.stop(audioCtx.currentTime + 0.05); // Трохи часу на затухання
        delete activeOscillators[note]; // Видаляємо осцилятор із мапи
    }
}

// Натискання на клавішу
document.querySelectorAll('.key').forEach(key => {
    key.addEventListener('mousedown', () => {
        const note = key.dataset.note;
        if (!activeOscillators[note]) { // Щоб не запускати звук повторно, якщо він вже активний
            playNote(noteFrequencyMap[note], note);
            key.classList.add('active');
        }
    });

    key.addEventListener('mouseup', () => {
        const note = key.dataset.note;
        stopNote(note);
        key.classList.remove('active');
    });
});

// Підключення MIDI
if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
}

function onMIDISuccess(midiAccess) {
    for (let input of midiAccess.inputs.values()) {
        input.onmidimessage = getMIDIMessage;
    }
}

function onMIDIFailure() {
    console.log('Could not access your MIDI devices.');
}

function getMIDIMessage(message) {
    const [command, note, velocity] = message.data;

    const key = document.querySelector(`.key[data-note="${note}"]`);

    if (command === 144 && velocity > 0) { // Note On
        if (key && !activeOscillators[note]) {
            playNote(noteFrequencyMap[note], note);
            key.classList.add('active');
        }
    } else if ((command === 128 || (command === 144 && velocity === 0)) && key) { // Note Off
        stopNote(note);
        key.classList.remove('active');
    }
}
