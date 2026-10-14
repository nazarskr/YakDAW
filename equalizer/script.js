const dropZone = document.getElementById('drop-zone');
const canvas = document.getElementById('waveform');
const playButton = document.getElementById('play');
const pauseButton = document.getElementById('pause');
const stopButton = document.getElementById('stop');
const resetButton = document.getElementById('reset');
const lowControl = document.getElementById('low');
const midControl = document.getElementById('mid');
const highControl = document.getElementById('high');

let audioContext, source, analyser, gainNode, lowFilter, midFilter, highFilter;
let buffer, isPlaying = false, audioBufferSourceNode;

dropZone.addEventListener('dragover', event => {
    event.preventDefault();
});

dropZone.addEventListener('drop', async event => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    // if (file && (file.type === 'audio/wav' || file.type === 'audio/mp3')) {
    if (file) {
        const arrayBuffer = await file.arrayBuffer();
        setupAudio(arrayBuffer);
    }
});

function setupAudio(arrayBuffer) {
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    gainNode = audioContext.createGain();

    lowFilter = audioContext.createBiquadFilter();
    lowFilter.type = 'lowshelf';

    midFilter = audioContext.createBiquadFilter();
    midFilter.type = 'peaking';

    highFilter = audioContext.createBiquadFilter();
    highFilter.type = 'highshelf';

    audioContext.decodeAudioData(arrayBuffer, decodedBuffer => {
        buffer = decodedBuffer;
        drawWaveform(decodedBuffer);
        connectNodes();
    });
}

function connectNodes() {
    audioBufferSourceNode = audioContext.createBufferSource();
    audioBufferSourceNode.buffer = buffer;

    audioBufferSourceNode.connect(lowFilter);
    lowFilter.connect(midFilter);
    midFilter.connect(highFilter);
    highFilter.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(audioContext.destination);

    lowControl.addEventListener('input', () => {
        lowFilter.gain.value = lowControl.value;
    });

    midControl.addEventListener('input', () => {
        midFilter.gain.value = midControl.value;
    });

    highControl.addEventListener('input', () => {
        highFilter.gain.value = highControl.value;
    });
}

function drawWaveform(buffer) {
    const canvasContext = canvas.getContext('2d');
    const data = buffer.getChannelData(0);
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);

    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;

    for (let i = 0; i < canvas.width; i++) {
        const min = Math.min(...data.slice(i * step, (i + 1) * step));
        const max = Math.max(...data.slice(i * step, (i + 1) * step));
        canvasContext.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }
}

playButton.addEventListener('click', () => {
    if (!isPlaying && buffer) {
        connectNodes();
        audioBufferSourceNode.start();
        isPlaying = true;
    }
});

pauseButton.addEventListener('click', () => {
    if (isPlaying) {
        audioBufferSourceNode.stop();
        isPlaying = false;
    }
});

stopButton.addEventListener('click', () => {
    if (isPlaying) {
        audioBufferSourceNode.stop();
        isPlaying = false;
        connectNodes();
    }
});

resetButton.addEventListener('click', () => {
    location.reload();
});
