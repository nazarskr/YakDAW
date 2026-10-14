const dropArea = document.getElementById('drop-area');
const playButton = document.getElementById('play');
const pauseButton = document.getElementById('pause');
const stopButton = document.getElementById('stop');
const resetButton = document.getElementById('reset');
const waveformCanvas = document.getElementById('waveform-canvas');
const progressLine = document.getElementById('progress-line');
const ctx = waveformCanvas.getContext('2d');

let audioContext;
let source;
let analyser;
let buffer;
let isPlaying = false;
let pausedAt = 0;
let startedAt = 0;
let animationFrameId;

waveformCanvas.width = 600;
waveformCanvas.height = 150;

// Handle file drag and drop
dropArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropArea.style.backgroundColor = '#ccc';
});

dropArea.addEventListener('dragleave', () => {
    dropArea.style.backgroundColor = '#fff';
});

dropArea.addEventListener('drop', (event) => {
    event.preventDefault();
    dropArea.style.backgroundColor = '#fff';
    const file = event.dataTransfer.files[0];
    if (file && (file.type === 'audio/wav' || file.type === 'audio/mp3')) {
        loadAudioFile(file);
    }
});

function loadAudioFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        document.getElementById('waveform').style.display = 'block';
        progressLine.style.display = 'block';
        audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
            buffer = audioBuffer;
            drawWaveform();
        });
    };
    reader.readAsArrayBuffer(file);
}

function playAudio() {
    if (isPlaying) return;
    isPlaying = true;

    source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0, pausedAt);

    startedAt = audioContext.currentTime - pausedAt;
    source.onended = () => stopAudio();
    animateProgressLine();
}

function pauseAudio() {
    if (!isPlaying) return;
    isPlaying = false;
    pausedAt = audioContext.currentTime - startedAt;
    source.stop();
    cancelAnimationFrame(animationFrameId);
}

function stopAudio() {
    if (!isPlaying) return;
    isPlaying = false;
    pausedAt = 0;
    source.stop();
    cancelAnimationFrame(animationFrameId);
    progressLine.style.left = '0px';
}

function resetAudio() {
    document.getElementById('waveform').style.display = 'none';
    progressLine.style.display = 'none';
    if (isPlaying) stopAudio();
    audioContext.close();
    buffer = null;
    pausedAt = 0;
    isPlaying = false;
}

function drawWaveform() {
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / waveformCanvas.width);
    const amp = waveformCanvas.height / 2;

    ctx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, waveformCanvas.width, waveformCanvas.height);
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(0, amp);

    for (let i = 0; i < waveformCanvas.width; i++) {
        const min = Math.min(...data.slice(i * step, (i + 1) * step));
        const max = Math.max(...data.slice(i * step, (i + 1) * step));
        ctx.lineTo(i, (1 + min) * amp);
        ctx.lineTo(i, (1 + max) * amp);
    }
    ctx.stroke();
}

function animateProgressLine() {
    const duration = buffer.duration;
    const canvasWidth = waveformCanvas.getBoundingClientRect().width; // Get actual width of the canvas

    function updateProgress() {
        const currentTime = audioContext.currentTime - startedAt;
        const progressPercentage = currentTime / duration;
        const progressPosition = progressPercentage * canvasWidth;

        progressLine.style.left = `${progressPosition}px`;

        if (currentTime < duration && isPlaying) {
            animationFrameId = requestAnimationFrame(updateProgress);
        }
    }

    updateProgress();
}

playButton.addEventListener('click', playAudio);
pauseButton.addEventListener('click', pauseAudio);
stopButton.addEventListener('click', stopAudio);
resetButton.addEventListener('click', resetAudio);

waveformCanvas.addEventListener('click', (event) => {
    if (!buffer) return;

    const canvasWidth = waveformCanvas.getBoundingClientRect().width;
    const clickX = event.offsetX;
    const clickPercentage = clickX / canvasWidth;
    const newTime = buffer.duration * clickPercentage;

    if (isPlaying) {
        stopAudio();
    }

    pausedAt = newTime;
    playAudio();
});
