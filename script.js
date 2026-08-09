const FRETPULSE_VERSION = 'v0.1';
const INSTRUMENTS = {
    acoustic: {
        name: 'Acoustic Guitar',
        strings: 6,
        type: 'acoustic',
        decay: 2.2,
        brightness: 3500,
        tunings: {
            'Standard': ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
            'Drop D': ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
            'Half-Step Down': ['D#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4'],
            'Full-Step Down': ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'],
            'Open D': ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'],
            'Open G': ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'],
            'Custom': []
        }
    },
    electric: {
        name: 'Electric Guitar',
        strings: 6,
        type: 'electric',
        decay: 2.8,
        brightness: 5000,
        tunings: {
            'Standard': ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
            'Drop D': ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
            'Drop C': ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'],
            'Half-Step Down': ['D#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4'],
            'Custom': []
        }
    },
    ukulele: {
        name: 'Ukulele',
        strings: 4,
        type: 'ukulele',
        decay: 1.4,
        brightness: 2800,
        tunings: {
            'Standard (High-G)': ['G4', 'C4', 'E4', 'A4'],
            'Low-G': ['G3', 'C4', 'E4', 'A4'],
            'D-Tuning (A DF# B)': ['A4', 'D4', 'F#4', 'B4'],
            'Custom': []
        }
    },
    bass: {
        name: 'Bass Guitar',
        strings: 4,
        type: 'bass',
        decay: 3.2,
        brightness: 1800,
        tunings: {
            'Standard': ['E1', 'A1', 'D2', 'G2'],
            'Drop D': ['D1', 'A1', 'D2', 'G2'],
            'Half-Step Down': ['D#1', 'G#1', 'C#2', 'F#2'],
            'Custom': []
        }
    }
};

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
let state = {
    version: FRETPULSE_VERSION,
    instrument: 'acoustic',
    tuning: 'Standard',
    customNotes: [],
    mode: 'auto',
    selectedStringIndex: 0,
    a4Freq: 440,
    isListening: false,
    audioCtx: null,
    analyser: null,
    micStream: null,
    animFrame: null
};

function noteToFreq(note, baseA4 = state.a4Freq) {
    const regex = /^([A-G]#?)(-?\d+)$/;
    const match = note.match(regex);
    if (!match) return baseA4;
    const noteName = match[1];
    const octave = parseInt(match[2]);
    const semitoneIndex = NOTES.indexOf(noteName);
    const noteIndex = octave * 12 + semitoneIndex;
    return baseA4 * Math.pow(2, (noteIndex - 57) / 12);
}

function freqToNoteAndCents(freq, baseA4 = state.a4Freq) {
    if (freq < 20 || freq > 4000) return null;
    const noteNum = 12 * (Math.log(freq / baseA4) / Math.log(2)) + 57;
    const nearestNoteNum = Math.round(noteNum);
    const cents = Math.round((noteNum - nearestNoteNum) * 100);
    
    const octave = Math.floor(nearestNoteNum / 12);
    const noteName = NOTES[(nearestNoteNum % 12 + 12) % 12];
    const targetFreq = baseA4 * Math.pow(2, (nearestNoteNum - 57) / 12);

    return {
        note: `${noteName}${octave}`,
        cents: cents,
        freq: freq,
        targetFreq: targetFreq
    };
}
const instrumentSelect = document.getElementById('instrumentSelect');
const tuningSelect = document.getElementById('tuningSelect');
const a4Slider = document.getElementById('a4Slider');
const a4ValDisplay = document.getElementById('a4ValDisplay');
const btnAuto = document.getElementById('btnAuto');
const btnManual = document.getElementById('btnManual');
const customEditor = document.getElementById('customEditor');
const stringsContainer = document.getElementById('stringsContainer');
const noteDisplay = document.getElementById('noteDisplay');
const centsDisplay = document.getElementById('centsDisplay');
const freqDisplay = document.getElementById('freqDisplay');
const statusBadge = document.getElementById('statusBadge');
const needle = document.getElementById('needle');
const micBtn = document.getElementById('micBtn');
const manualHint = document.getElementById('manualHint');
const appVersionEl = document.getElementById('appVersion');

function init() {
    appVersionEl.textContent = state.version;
    updateTuningOptions();
    renderFretboard();
    setupEventListeners();
    syncUIWithMode();
}

function setupEventListeners() {
    instrumentSelect.addEventListener('change', (e) => {
        state.instrument = e.target.value;
        state.selectedStringIndex = 0;
        state.customNotes = [];
        updateTuningOptions();
        renderFretboard();
        syncUIWithMode();
    });

    tuningSelect.addEventListener('change', (e) => {
        state.tuning = e.target.value;
        state.selectedStringIndex = 0;
        
        if (state.tuning === 'Custom') {
            setupCustomEditor();
        } else {
            customEditor.classList.remove('visible');
        }
        renderFretboard();
        syncUIWithMode();
    });

    a4Slider.addEventListener('input', (e) => {
        state.a4Freq = parseInt(e.target.value);
        a4ValDisplay.textContent = `${state.a4Freq} Hz`;
        renderFretboard();
        if (state.mode === 'manual') {
            const notes = getCurrentTuningNotes();
            updateTargetDisplay(notes[state.selectedStringIndex]);
        } else if (!state.isListening) {
            statusBadge.textContent = `Reference A4 = ${state.a4Freq} Hz`;
        }
    });

    btnAuto.addEventListener('click', () => {
        setMode('auto');
    });

    btnManual.addEventListener('click', () => {
        setMode('manual');
    });

    micBtn.addEventListener('click', toggleMicrophone);
}

function setMode(newMode) {
    state.mode = newMode;
    btnAuto.classList.toggle('active', newMode === 'auto');
    btnManual.classList.toggle('active', newMode === 'manual');
    manualHint.style.display = newMode === 'manual' ? 'inline' : 'none';

    renderFretboard();
    syncUIWithMode();
}

function syncUIWithMode() {
    const notes = getCurrentTuningNotes();
    
    if (state.mode === 'manual') {
        if (state.selectedStringIndex >= notes.length) {
            state.selectedStringIndex = 0;
        }
        updateTargetDisplay(notes[state.selectedStringIndex]);
    } else {
        if (!state.isListening) {
            noteDisplay.textContent = '--';
            centsDisplay.textContent = '0 Cents';
            freqDisplay.textContent = '0.0 Hz';
            needle.style.transform = 'rotate(0deg)';
            statusBadge.textContent = `Reference A4 = ${state.a4Freq} Hz`;
            statusBadge.className = 'status-badge';
        } else {
            statusBadge.textContent = 'Listening for instrument...';
            statusBadge.className = 'status-badge';
        }
    }
}

function getCurrentTuningNotes() {
    const inst = INSTRUMENTS[state.instrument];
    if (state.tuning === 'Custom') {
        const defaultNotes = Object.values(inst.tunings)[0];
        if (!state.customNotes || state.customNotes.length !== inst.strings) {
            state.customNotes = [...defaultNotes];
        }
        return state.customNotes;
    }
    return inst.tunings[state.tuning] || Object.values(inst.tunings)[0];
}

function updateTuningOptions() {
    const inst = INSTRUMENTS[state.instrument];
    tuningSelect.innerHTML = '';
    
    const tuningKeys = Object.keys(inst.tunings);
    tuningKeys.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        tuningSelect.appendChild(opt);
    });
    
    state.tuning = tuningKeys[0];
    tuningSelect.value = state.tuning;
    customEditor.classList.remove('visible');
}

function setupCustomEditor() {
    const currentNotes = getCurrentTuningNotes();
    customEditor.innerHTML = '';
    customEditor.classList.add('visible');

    currentNotes.forEach((note, idx) => {
        const div = document.createElement('div');
        div.className = 'custom-string-select';
        
        const label = document.createElement('label');
        label.textContent = `String ${idx + 1}`;

        const select = document.createElement('select');
        
        for (let oct = 1; oct <= 5; oct++) {
            NOTES.forEach(n => {
                const noteStr = `${n}${oct}`;
                const opt = document.createElement('option');
                opt.value = noteStr;
                opt.textContent = noteStr;
                if (noteStr === note) opt.selected = true;
                select.appendChild(opt);
            });
        }

        select.addEventListener('change', (e) => {
            state.customNotes[idx] = e.target.value;
            renderFretboard();
            if (state.mode === 'manual' && state.selectedStringIndex === idx) {
                updateTargetDisplay(e.target.value);
            }
        });

        div.appendChild(label);
        div.appendChild(select);
        customEditor.appendChild(div);
    });
}

function renderFretboard() {
    stringsContainer.innerHTML = '';
    const notes = getCurrentTuningNotes();

    if (state.selectedStringIndex >= notes.length) {
        state.selectedStringIndex = 0;
    }

    notes.forEach((note, idx) => {
        const stringWrap = document.createElement('div');
        stringWrap.className = `string-wrapper ${idx === state.selectedStringIndex && state.mode === 'manual' ? 'active' : ''}`;
        
        const stringLine = document.createElement('div');
        stringLine.className = 'string-line';
        const freq = noteToFreq(note);
        const thickness = Math.max(1.5, Math.min(6, 600 / freq));
        stringLine.style.width = `${thickness}px`;

        const peg = document.createElement('div');
        peg.className = 'string-peg';
        peg.textContent = note;

        stringWrap.appendChild(stringLine);
        stringWrap.appendChild(peg);

        stringWrap.addEventListener('click', () => {
            state.selectedStringIndex = idx;
            document.querySelectorAll('.string-wrapper').forEach((sw, i) => {
                sw.classList.toggle('active', i === idx);
            });
            
            pluckString(noteToFreq(note));

            if (state.mode === 'manual') {
                updateTargetDisplay(note);
            }
        });

        stringsContainer.appendChild(stringWrap);
    });
}

function updateTargetDisplay(targetNote) {
    noteDisplay.textContent = targetNote;
    centsDisplay.textContent = 'Reference Pitch';
    freqDisplay.textContent = `${noteToFreq(targetNote).toFixed(1)} Hz`;
    needle.style.transform = `rotate(0deg)`;
    needle.style.backgroundColor = 'var(--accent-blue)';
    statusBadge.textContent = state.isListening ? `Listening for target: ${targetNote}` : `Reference A4 = ${state.a4Freq} Hz`;
    statusBadge.className = 'status-badge';
}


function pluckString(freq) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const instConfig = INSTRUMENTS[state.instrument];
    const duration = instConfig.decay;

    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0.001, now);
    mainGain.gain.exponentialRampToValueAtTime(0.35, now + 0.015);
    mainGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(instConfig.brightness, now);
    lowpass.frequency.exponentialRampToValueAtTime(Math.max(120, freq * 1.5), now + (duration * 0.7));

    const bodyResonance = ctx.createBiquadFilter();
    bodyResonance.type = 'peaking';
    bodyResonance.frequency.value = 210;
    bodyResonance.Q.value = 1.5;
    bodyResonance.gain.value = 4.0;

    const harmonics = [
        { ratio: 1.00, type: 'triangle', gain: 0.50 }, 
        { ratio: 2.00, type: 'sine',     gain: 0.25 }, 
        { ratio: 3.00, type: 'sine',     gain: 0.12 }, 
        { ratio: 4.00, type: 'sine',     gain: 0.06 }  
    ];

    harmonics.forEach(h => {
        const osc = ctx.createOscillator();
        const hGain = ctx.createGain();

        osc.type = h.type;
        osc.frequency.setValueAtTime(freq * h.ratio, now);

        const hDecay = duration / (h.ratio * 0.6);
        hGain.gain.setValueAtTime(h.gain, now);
        hGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.min(duration, hDecay));

        osc.connect(hGain);
        hGain.connect(lowpass);
        osc.start(now);
        osc.stop(now + duration);
    });

    const bufferSize = ctx.sampleRate * 0.008;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 2500;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.008);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(lowpass);

    noiseNode.start(now);

    lowpass.connect(bodyResonance);
    bodyResonance.connect(mainGain);
    mainGain.connect(ctx.destination);

    setTimeout(() => {
        ctx.close();
    }, duration * 1000 + 100);
}

async function toggleMicrophone() {
    if (state.isListening) {
        stopMicrophone();
    } else {
        await startMicrophone();
    }
}

async function startMicrophone() {
    try {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        state.analyser = state.audioCtx.createAnalyser();
        state.analyser.fftSize = 2048;

        state.micStream = await navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: true, noiseSuppression: true } 
        });
        
        const source = state.audioCtx.createMediaStreamSource(state.micStream);
        source.connect(state.analyser);

        state.isListening = true;
        micBtn.textContent = 'Stop Microphone';
        micBtn.classList.add('listening');

        syncUIWithMode();
        processAudio();
    } catch (err) {
        alert('Microphone access is required for pitch detection: ' + err.message);
    }
}

function stopMicrophone() {
    if (state.micStream) {
        state.micStream.getTracks().forEach(track => track.stop());
    }
    if (state.audioCtx) {
        state.audioCtx.close();
    }
    if (state.animFrame) {
        cancelAnimationFrame(state.animFrame);
    }
    state.isListening = false;
    micBtn.textContent = 'Start Microphone';
    micBtn.classList.remove('listening');
    
    syncUIWithMode();
}

function autoCorrelate(buf, sampleRate) {
    let SIZE = buf.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
        const val = buf[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
        if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
        if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }

    buf = buf.slice(r1, r2);
    SIZE = buf.length;

    const c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE - i; j++) {
            c[i] = c[i] + buf[j] * buf[j + i];
        }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
        if (c[i] > maxval) {
            maxval = c[i];
            maxpos = i;
        }
    }
    let T0 = maxpos;

    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
}

function processAudio() {
    const buffer = new Float32Array(state.analyser.fftSize);
    state.analyser.getFloatTimeDomainData(buffer);
    const pitch = autoCorrelate(buffer, state.audioCtx.sampleRate);

    if (pitch !== -1 && state.mode === 'auto') {
        const result = freqToNoteAndCents(pitch, state.a4Freq);
        if (result) {
            updateDisplay(result);
        }
    } else if (pitch !== -1 && state.mode === 'manual') {
        const targetNotes = getCurrentTuningNotes();
        const targetNote = targetNotes[state.selectedStringIndex];
        if (targetNote) {
            const targetFreq = noteToFreq(targetNote, state.a4Freq);
            const cents = Math.round(1200 * Math.log2(pitch / targetFreq));
            updateDisplay({
                note: targetNote,
                cents: cents,
                freq: pitch,
                targetFreq: targetFreq
            });
        }
    }

    if (state.isListening) {
        state.animFrame = requestAnimationFrame(processAudio);
    }
}

function updateDisplay(data) {
    noteDisplay.textContent = data.note;
    freqDisplay.textContent = `${data.freq.toFixed(1)} Hz`;

    const clampedCents = Math.max(-50, Math.min(50, data.cents));
    const angle = (clampedCents / 50) * 60;
    needle.style.transform = `rotate(${angle}deg)`;

    const absCents = Math.abs(data.cents);

    if (absCents <= 5) {
        centsDisplay.textContent = 'In Tune!';
        centsDisplay.style.color = 'var(--accent-green)';
        needle.style.backgroundColor = 'var(--accent-green)';
        statusBadge.textContent = 'PERFECT!';
        statusBadge.className = 'status-badge in-tune';
    } else if (data.cents < 0) {
        centsDisplay.textContent = `${data.cents} Cents (Flat)`;
        centsDisplay.style.color = 'var(--accent-yellow)';
        needle.style.backgroundColor = 'var(--accent-yellow)';
        statusBadge.textContent = 'TUNE UP ↑';
        statusBadge.className = 'status-badge';
    } else {
        centsDisplay.textContent = `+${data.cents} Cents (Sharp)`;
        centsDisplay.style.color = 'var(--accent-red)';
        needle.style.backgroundColor = 'var(--accent-red)';
        statusBadge.textContent = 'TUNE DOWN ↓';
        statusBadge.className = 'status-badge';
    }

    if (state.mode === 'auto') {
        const notes = getCurrentTuningNotes();
        const matchIndex = notes.findIndex(n => n === data.note);
        document.querySelectorAll('.string-wrapper').forEach((sw, idx) => {
            sw.classList.toggle('active', idx === matchIndex);
        });
    }
}

init();