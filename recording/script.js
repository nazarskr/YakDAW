let audioContext;
let mediaRecorder;
let audioChunks = [];
let recordedAudio;
let analyser;
let dataArray;
let source;
let audioBuffer;
let canvas = document.getElementById('waveform');
let canvasContext = canvas.getContext('2d');
let animationFrame;
let isRecording = false;
let isPlaying = false;
let audioPlaybackContext;
let audioBufferSource;

document.getElementById('startBtn').addEventListener('click', async () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks);
        recordedAudio = await audioBlob.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(recordedAudio);

        drawCompleteWaveform();
        document.getElementById('playBtn').disabled = false;
    };

    mediaRecorder.start();
    isRecording = true;

    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    document.getElementById('resetBtn').disabled = true;
    document.getElementById('playBtn').disabled = true;
    document.getElementById('stopPlaybackBtn').disabled = true;

    drawLiveWaveform();
});

document.getElementById('stopBtn').addEventListener('click', () => {
    mediaRecorder.stop();
    isRecording = false;
    cancelAnimationFrame(animationFrame);

    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('resetBtn').disabled = false;
});

document.getElementById('resetBtn').addEventListener('click', () => {
    audioChunks = [];
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('resetBtn').disabled = true;
    document.getElementById('playBtn').disabled = true;
    document.getElementById('stopPlaybackBtn').disabled = true;
});

document.getElementById('playBtn').addEventListener('click', () => {
    if (!isPlaying && audioBuffer) {
        audioPlaybackContext = new (window.AudioContext || window.webkitAudioContext)();
        audioBufferSource = audioPlaybackContext.createBufferSource();
        audioBufferSource.buffer = audioBuffer;
        audioBufferSource.connect(audioPlaybackContext.destination);
        audioBufferSource.start();
        isPlaying = true;

        document.getElementById('playBtn').disabled = true;
        document.getElementById('stopPlaybackBtn').disabled = false;

        audioBufferSource.onended = () => {
            isPlaying = false;
            document.getElementById('playBtn').disabled = false;
            document.getElementById('stopPlaybackBtn').disabled = true;
        };
    }
});

document.getElementById('stopPlaybackBtn').addEventListener('click', () => {
    if (isPlaying && audioBufferSource) {
        audioBufferSource.stop();
        isPlaying = false;

        document.getElementById('playBtn').disabled = false;
        document.getElementById('stopPlaybackBtn').disabled = true;
    }
});

function drawLiveWaveform() {
    if (isRecording) {
        animationFrame = requestAnimationFrame(drawLiveWaveform);
        analyser.getByteTimeDomainData(dataArray);

        canvasContext.fillStyle = '#f5f5f5';
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);

        canvasContext.lineWidth = 2;
        canvasContext.strokeStyle = '#333';

        canvasContext.beginPath();
        let sliceWidth = canvas.width * 1.0 / analyser.frequencyBinCount;
        let x = 0;

        for (let i = 0; i < analyser.frequencyBinCount; i++) {
            let v = dataArray[i] / 128.0;
            let y = v * canvas.height / 2;

            if (i === 0) {
                canvasContext.moveTo(x, y);
            } else {
                canvasContext.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasContext.lineTo(canvas.width, canvas.height / 2);
        canvasContext.stroke();
    }
}

function drawCompleteWaveform() {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    let buffer = audioBuffer.getChannelData(0);
    let sliceWidth = canvas.width / buffer.length;
    let x = 0;

    canvasContext.lineWidth = 2;
    canvasContext.strokeStyle = '#333';

    canvasContext.beginPath();
    for (let i = 0; i < buffer.length; i++) {
        let y = (buffer[i] * 0.5 + 0.5) * canvas.height;

        if (i === 0) {
            canvasContext.moveTo(x, y);
        } else {
            canvasContext.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasContext.lineTo(canvas.width, canvas.height / 2);
    canvasContext.stroke();
}
