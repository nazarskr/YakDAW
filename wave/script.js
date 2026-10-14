const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let oscillator = null;
let gainNode = audioContext.createGain();
let analyser = audioContext.createAnalyser();
const canvas = document.getElementById('waveform-canvas');
const canvasCtx = canvas.getContext('2d');
const frequencySlider = document.getElementById('frequency-slider');
const frequencyValue = document.getElementById('frequency-value');
const waveformName = document.getElementById('waveform-name');
const stopButton = document.getElementById('stop-button');
const volumeSlider = document.getElementById('volume-slider');
const volumeValue = document.getElementById('volume-value');

// Update frequency value display and oscillator frequency
frequencySlider.addEventListener('input', (event) => {
    frequencyValue.textContent = `${event.target.value} Hz`;
    if (oscillator) {
        oscillator.frequency.setValueAtTime(event.target.value, audioContext.currentTime);
    }
});

// Update volume value display and gain node value
volumeSlider.addEventListener('input', (event) => {
    volumeValue.textContent = `${Math.round(event.target.value * 100)}%`;
    if (gainNode) {
        gainNode.gain.setValueAtTime(event.target.value, audioContext.currentTime);
    }
});

// Handle waveform and stop button clicks
document.querySelectorAll('.wave-buttons button').forEach(button => {
    button.addEventListener('click', () => {
        if (button.id === 'stop-button') {
            stopSound();
        } else {
            const waveformType = button.dataset.waveform;
            if (oscillator) {
                oscillator.stop();
                oscillator.disconnect();
            }
            oscillator = audioContext.createOscillator();
            oscillator.type = waveformType;
            oscillator.frequency.setValueAtTime(frequencySlider.value, audioContext.currentTime);
            oscillator.connect(gainNode);
            gainNode.connect(analyser);
            analyser.connect(audioContext.destination);
            oscillator.start();
            waveformName.textContent = `Current waveform: ${waveformType.charAt(0).toUpperCase() + waveformType.slice(1)}`;
            drawWaveform();
        }
    });
});

function drawWaveform() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function renderFrame() {
        analyser.getByteTimeDomainData(dataArray);
        canvasCtx.fillStyle = '#eee';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = '#333';
        canvasCtx.beginPath();

        const sliceWidth = canvas.width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0; // byte range is 0-255, normalize to 0-1
            const y = v * canvas.height / 2;
            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
        requestAnimationFrame(renderFrame);
    }
    renderFrame();
}

function stopSound() {
    if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
        oscillator = null;
        waveformName.textContent = 'Select a waveform';
    }
}
