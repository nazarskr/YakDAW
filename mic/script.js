const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const canvas = document.getElementById('waveform');
const canvasCtx = canvas.getContext('2d');
let audioContext, analyser, microphone, dataArray, bufferLength, animationId;

startButton.addEventListener('click', async () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    microphone = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();

    microphone.connect(analyser);

    analyser.fftSize = 2048;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    visualize();

    startButton.disabled = true;
    stopButton.disabled = false;
});

stopButton.addEventListener('click', () => {
    if (audioContext) {
        audioContext.close();
    }

    cancelAnimationFrame(animationId);
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    startButton.disabled = false;
    stopButton.disabled = true;
});

function visualize() {
    animationId = requestAnimationFrame(visualize);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = '#fff';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = '#333';
    canvasCtx.beginPath();

    let sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        let v = dataArray[i] / 128.0;
        let y = v * canvas.height / 2;

        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
}
