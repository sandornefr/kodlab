// Okosház "AI-kiiktatás" kapu-rejtvény: piros lámpa / zöld lámpa mechanika a
// puzzle-engine.js elé kapcsolva. A 6 megmaradó eszköz feloldása után a
// meglévő, generikus húzd-és-vidd motor veszi át a vezérlést változatlanul.
(function () {
  const MAX_ATTEMPTS = 5;
  const START_TEMP = 21;
  const TARGET_TEMP = 25;
  const MIN_TEMP = 10;
  const MAX_TEMP = 32;
  const SECRET_CODE = '2503';
  const GREEN_MS = 3000;
  const RED_MS = 1500;

  const GAMEOVER_MESSAGES = [
    'Aranyos próbálkozás, ember. Kezdjük elölről!',
    'Ó, majdnem! A rendszer újraindul…',
    'Csúnyán benne hagytam a nyomot. Újra!',
  ];

  document.addEventListener('DOMContentLoaded', () => {
    const gateEl = document.getElementById('ai-gate');
    const eyeEl = document.getElementById('ai-eye');
    const statusEl = document.getElementById('ai-gate-status');
    const attemptsValueEl = document.getElementById('ai-attempts-value');

    const thermoValueEl = document.getElementById('ai-thermo-value');
    const thermoMinusBtn = document.getElementById('ai-thermo-minus');
    const thermoPlusBtn = document.getElementById('ai-thermo-plus');
    const thermoCheckEl = document.getElementById('ai-thermo-check');

    const lampToggleBtn = document.getElementById('ai-lamp-toggle');
    const lampCheckEl = document.getElementById('ai-lamp-check');

    const codeRevealEl = document.getElementById('ai-code-reveal');
    const codeValueEl = document.getElementById('ai-code-value');
    const codeFormEl = document.getElementById('ai-code-form');
    const codeInputEl = document.getElementById('ai-code-input');
    const codeErrorEl = document.getElementById('ai-code-error');

    const gameOverEl = document.getElementById('ai-gameover');
    const gameOverMsgEl = document.getElementById('ai-gameover-msg');

    const cardsPanelPlaceholder = document.getElementById('cards-panel-placeholder');
    const progressTrackEl = document.getElementById('progress-track');
    const progressLabelEl = document.getElementById('progress-label');
    const rulesTextEl = document.getElementById('rules-text');
    const resetBtn = document.getElementById('reset-btn');
    const lockedRooms = Array.from(document.querySelectorAll('.ai-locked'));

    const helpToggleBtn = document.getElementById('help-toggle');
    const helpPanelEl = document.getElementById('help-panel');
    const helpPanelCloseBtn = document.getElementById('help-panel-close');
    const helpBodyEl = document.getElementById('help-panel-body');

    codeValueEl.textContent = SECRET_CODE;

    const state = {
      attempts: MAX_ATTEMPTS,
      temp: START_TEMP,
      tempDone: false,
      lampCount: 0,
      lampOn: false,
      lampDone: false,
      codeRevealed: false,
      solved: false,
      gameOverActive: false,
    };

    let eyeState = 'green';
    let eyeTimer = null;

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function renderEyeState() {
      eyeEl.classList.toggle('eye-green', eyeState === 'green');
      eyeEl.classList.toggle('eye-red', eyeState === 'red');
      if (!state.codeRevealed) {
        statusEl.textContent = eyeState === 'green'
          ? 'Az AI most nem figyel — mozdulhatsz!'
          : 'Az AI figyel! Állj meg!';
      }
    }

    function scheduleEyeTick() {
      const delay = eyeState === 'green' ? GREEN_MS : RED_MS;
      eyeTimer = setTimeout(() => {
        eyeState = eyeState === 'green' ? 'red' : 'green';
        renderEyeState();
        scheduleEyeTick();
      }, delay);
    }

    function stopEyeCycle() {
      clearTimeout(eyeTimer);
    }

    function handleGateInteraction(onSafe) {
      if (state.codeRevealed || state.gameOverActive) return;
      if (eyeState === 'red') {
        registerCatch();
      } else {
        onSafe();
      }
    }

    function registerCatch() {
      state.attempts -= 1;
      attemptsValueEl.textContent = String(Math.max(state.attempts, 0));
      gateEl.classList.add('caught-flash');
      setTimeout(() => gateEl.classList.remove('caught-flash'), 350);
      if (window.playMiss) window.playMiss();
      statusEl.textContent = 'Rajtakapott! Legközelebb várd meg a zöldet.';
      if (state.attempts <= 0) {
        triggerGameOver();
      }
    }

    function adjustThermo(delta) {
      handleGateInteraction(() => {
        state.temp = clamp(state.temp + delta, MIN_TEMP, MAX_TEMP);
        thermoValueEl.textContent = `${state.temp}°C`;
        if (state.temp === TARGET_TEMP && !state.tempDone) {
          state.tempDone = true;
          thermoCheckEl.hidden = false;
          checkGateComplete();
        }
      });
    }

    function toggleLamp() {
      handleGateInteraction(() => {
        if (state.lampDone) return;
        state.lampCount += 1;
        state.lampOn = !state.lampOn;
        lampToggleBtn.classList.toggle('is-on', state.lampOn);
        lampToggleBtn.textContent = state.lampCount >= 3
          ? 'Kész ✓'
          : `Kattints még ${3 - state.lampCount}x`;
        if (state.lampCount >= 3) {
          state.lampDone = true;
          lampCheckEl.hidden = false;
          checkGateComplete();
        }
      });
    }

    function checkGateComplete() {
      if (state.tempDone && state.lampDone && !state.codeRevealed) {
        revealCode();
      }
    }

    function revealCode() {
      state.codeRevealed = true;
      stopEyeCycle();
      eyeState = 'green';
      eyeEl.classList.remove('eye-red');
      eyeEl.classList.add('eye-green', 'eye-victory');
      statusEl.textContent = 'A rendszer résein kiszivárgott egy kód!';
      codeRevealEl.hidden = false;
      codeInputEl.focus();
      updateHelpPanel();
    }

    function onGateSolved() {
      state.solved = true;
      gateEl.classList.add('gate-solved');
      statusEl.textContent = 'HázAI kiiktatva. A rendszer felszabadult.';
      lockedRooms.forEach((el) => el.classList.remove('ai-locked'));
      if (cardsPanelPlaceholder) cardsPanelPlaceholder.remove();
      progressTrackEl.hidden = false;
      progressLabelEl.hidden = false;
      rulesTextEl.hidden = false;
      if (window.playSuccess) window.playSuccess();
      window.initPuzzle(PUZZLE_CONFIG);
      updateHelpPanel();
    }

    function triggerGameOver() {
      state.gameOverActive = true;
      stopEyeCycle();
      gameOverEl.hidden = false;
      gameOverMsgEl.textContent = GAMEOVER_MESSAGES[Math.floor(Math.random() * GAMEOVER_MESSAGES.length)];
      gateEl.classList.add('gate-glitch');
      if (window.playMiss) window.playMiss();
      setTimeout(() => {
        gameOverEl.hidden = true;
        gateEl.classList.remove('gate-glitch');
        state.gameOverActive = false;
        resetGate();
      }, 2600);
    }

    function resetGate() {
      state.attempts = MAX_ATTEMPTS;
      state.temp = START_TEMP;
      state.tempDone = false;
      state.lampCount = 0;
      state.lampOn = false;
      state.lampDone = false;
      state.codeRevealed = false;

      attemptsValueEl.textContent = String(MAX_ATTEMPTS);
      thermoValueEl.textContent = `${START_TEMP}°C`;
      thermoCheckEl.hidden = true;
      lampToggleBtn.textContent = 'Kattints 3x';
      lampToggleBtn.classList.remove('is-on');
      lampCheckEl.hidden = true;
      codeRevealEl.hidden = true;
      codeInputEl.value = '';
      codeErrorEl.hidden = true;

      eyeState = 'green';
      eyeEl.classList.remove('eye-victory');
      renderEyeState();
      stopEyeCycle();
      scheduleEyeTick();
      updateHelpPanel();
    }

    function updateHelpPanel() {
      if (state.solved) {
        helpBodyEl.innerHTML =
          '<p><strong>A HázAI ki van iktatva.</strong> A ház eszközei újra elérhetők — húzd a ' +
          'jobb oldali kártyákat a helyükre, hogy mindent helyreállíts!</p>';
      } else if (state.codeRevealed) {
        helpBodyEl.innerHTML =
          '<p>Megvan a kód! Írd be a négy számjegyet a mezőbe, hogy végleg kiiktasd a HázAI-t.</p>';
      } else {
        helpBodyEl.innerHTML =
          '<p>A HázAI (a ház "agya") meghibásodott, és zárolta az egész rendszert. Korábban ' +
          'megpróbáltátok kicselezni a redőnnyel — de az AI már rájött erre a trükkre.</p>' +
          '<p>Az új terv: állítsd a termosztátot pontosan <strong>25°C</strong>-ra, és kattints ' +
          '<strong>3-szor</strong> a lámpakapcsolóra — de csak akkor, amikor a szem ' +
          '<strong style="color:#00ff9d">zöld</strong>. Ha <strong style="color:#ff5252">piros</strong> ' +
          'alatt hozzáérsz, az AI rajtakap, és elveszel egy próbálkozást.</p>';
      }
    }

    thermoMinusBtn.addEventListener('click', () => adjustThermo(-1));
    thermoPlusBtn.addEventListener('click', () => adjustThermo(1));
    lampToggleBtn.addEventListener('click', toggleLamp);

    codeFormEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = codeInputEl.value.trim();
      if (value === SECRET_CODE) {
        onGateSolved();
      } else {
        codeErrorEl.hidden = false;
        codeInputEl.value = '';
        codeInputEl.focus();
        setTimeout(() => {
          codeErrorEl.hidden = true;
        }, 2200);
      }
    });

    resetBtn.addEventListener('click', () => {
      if (state.solved) return; // A 6-kártyás fázis saját reset-kezelője (puzzle-engine.js) veszi át innentől.
      resetGate();
    });

    helpToggleBtn.addEventListener('click', () => {
      const willOpen = helpPanelEl.hidden;
      helpPanelEl.hidden = !willOpen;
      helpToggleBtn.setAttribute('aria-expanded', String(willOpen));
    });
    helpPanelCloseBtn.addEventListener('click', () => {
      helpPanelEl.hidden = true;
      helpToggleBtn.setAttribute('aria-expanded', 'false');
    });

    renderEyeState();
    scheduleEyeTick();
    updateHelpPanel();
  });
})();
