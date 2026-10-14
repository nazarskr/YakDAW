const dropZone = document.getElementById('drop-zone');
const canvas = document.getElementById('waveform');
const playButton = document.getElementById('play');
const pauseButton = document.getElementById('pause');
const stopButton = document.getElementById('stop');
const resetButton = document.getElementById('reset');
const lfoRateControl = document.getElementById('lfo-rate');
const lfoDepthControl = document.getElementById('lfo-depth');
const lfoWaveformControl = document.getElementById('lfo-waveform');

let audioContext, source, analyser, gainNode, lfo, lfoGain, isPlaying = false, audioBufferSourceNode, buffer;

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
    lfoGain = audioContext.createGain();

    lfo = audioContext.createOscillator();
    lfo.type = lfoWaveformControl.value;
    lfo.frequency.value = lfoRateControl.value;

    audioContext.decodeAudioData(arrayBuffer, decodedBuffer => {
        buffer = decodedBuffer;
        drawWaveform(decodedBuffer);
        connectNodes();
    });

    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);
    lfo.start();
}

function connectNodes() {
    audioBufferSourceNode = audioContext.createBufferSource();
    audioBufferSourceNode.buffer = buffer;

    audioBufferSourceNode.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(audioContext.destination);

    updateLFO();
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

function updateLFO() {
    lfo.frequency.value = lfoRateControl.value;
    lfoGain.gain.value = lfoDepthControl.value / 100;
    lfo.type = lfoWaveformControl.value;
}

lfoRateControl.addEventListener('input', updateLFO);
lfoDepthControl.addEventListener('input', updateLFO);
lfoWaveformControl.addEventListener('change', updateLFO);

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
