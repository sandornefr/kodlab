// Apró, szintetizált hangeffektek Web Audio API-val. Nincs külső fájl/könyvtár,
// így offline standon is megbízhatóan működik.
(function () {
  let ctx;

  function getCtx() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(c, freq, startTime, duration, type, gainPeak) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain).connect(c.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  function playSuccess() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    tone(c, 880, now, 0.12, 'triangle', 0.18);
    tone(c, 1318.5, now + 0.07, 0.16, 'triangle', 0.16);
  }

  function playMiss() {
    const c = getCtx();
    if (!c) return;
    tone(c, 170, c.currentTime, 0.13, 'sine', 0.08);
  }

  function playFanfare() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => tone(c, freq, now + i * 0.11, 0.3, 'triangle', 0.2));
    tone(c, 1046.5, now + 0.46, 0.55, 'triangle', 0.14);
    tone(c, 1318.5, now + 0.46, 0.55, 'triangle', 0.11);
  }

  function playJingle() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25];
    melody.forEach((freq, i) => tone(c, freq, now + i * 0.16, 0.22, 'sine', 0.1));
  }

  // Egyszerű, ének nélküli, "deep house"-hangulatú aláfestés: ismétlődő halk basszus-lüktetés
  // + hosszan kitartott akkord-pad. setTimeout-alapú hurok, addig szól, amíg le nem állítják.
  let ambientTimer = null;
  let ambientActive = false;
  let ambientStep = 0;

  function playAmbientLoop() {
    const c = getCtx();
    if (!c) return;
    if (ambientActive) return;
    ambientActive = true;
    ambientStep = 0;
    const bass = [130.81, 130.81, 146.83, 130.81];
    const pad = [261.63, 329.63, 392.0];

    function loopStep() {
      if (!ambientActive) return;
      const c2 = getCtx();
      if (!c2) return;
      const now = c2.currentTime;
      tone(c2, bass[ambientStep % bass.length], now, 0.35, 'sine', 0.09);
      if (ambientStep % 4 === 0) {
        pad.forEach((freq) => tone(c2, freq, now, 1.1, 'sine', 0.03));
      }
      ambientStep += 1;
      ambientTimer = setTimeout(loopStep, 420);
    }
    loopStep();
  }

  function stopAmbientLoop() {
    ambientActive = false;
    clearTimeout(ambientTimer);
  }

  function playGlitch() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    for (let i = 0; i < 5; i += 1) {
      const freq = 180 + Math.random() * 500;
      tone(c, freq, now + i * 0.06, 0.05, 'sawtooth', 0.07);
    }
  }

  window.playSuccess = playSuccess;
  window.playMiss = playMiss;
  window.playFanfare = playFanfare;
  window.playJingle = playJingle;
  window.playAmbientLoop = playAmbientLoop;
  window.stopAmbientLoop = stopAmbientLoop;
  window.playGlitch = playGlitch;
})();
