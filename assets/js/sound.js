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

  window.playSuccess = playSuccess;
  window.playMiss = playMiss;
  window.playFanfare = playFanfare;
})();
