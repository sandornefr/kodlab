// Okosház "AI-kiiktatás" kapu-rejtvény: piros lámpa / zöld lámpa mechanika a
// puzzle-engine.js elé kapcsolva. Próbálkozásonként más a trükk — ha lebuksz,
// az AI kiszúrja az aktuális megoldást, és a következő körben már mást kell
// csinálni. A 6 megmaradó eszköz feloldása után a meglévő, generikus
// húzd-és-vidd motor veszi át a vezérlést változatlanul.
(function () {
  const MAX_ATTEMPTS = 5;
  const START_TEMP = 21;
  const MIN_TEMP = 10;
  const MAX_TEMP = 32;
  const SECRET_CODE = '2503';
  const GREEN_MIN_MS = 1200;
  const GREEN_MAX_MS = 4000;
  const RED_MIN_MS = 700;
  const RED_MAX_MS = 2600;

  const TRICKS = [
    {
      blind: 'open',
      lamp: 3,
      describe: 'húzd fel a redőnyt, és kattints 3x a lámpakapcsolóra',
    },
    {
      thermo: 25,
      lamp: 3,
      describe: 'állítsd a termosztátot pontosan 25°C-ra, és kattints 3x a lámpakapcsolóra',
    },
    {
      inverter: 'on',
      blind: 'closed',
      describe: 'kapcsold be a napelem invertert, és húzd le a redőnyt',
    },
    {
      speaker: 7,
      lamp: 5,
      describe: 'állítsd a hangszórót 7-es hangerőre, és kattints 5x a lámpakapcsolóra',
    },
    {
      blind: 'open',
      thermo: 25,
      inverter: 'on',
      speaker: 7,
      describe:
        'húzd fel a redőnyt, állítsd a termosztátot 25°C-ra, kapcsold be az invertert, és ' +
        'állítsd a hangszórót 7-es szintre — mindezt egyszerre',
    },
  ];

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

    const blindVisualEl = document.getElementById('ai-blind-visual');
    const blindToggleBtn = document.getElementById('ai-blind-toggle');
    const blindCheckEl = document.getElementById('ai-blind-check');

    const thermoValueEl = document.getElementById('ai-thermo-value');
    const thermoMinusBtn = document.getElementById('ai-thermo-minus');
    const thermoPlusBtn = document.getElementById('ai-thermo-plus');
    const thermoCheckEl = document.getElementById('ai-thermo-check');

    const lampIconEl = document.getElementById('ai-lamp-icon');
    const lampToggleBtn = document.getElementById('ai-lamp-toggle');
    const lampCheckEl = document.getElementById('ai-lamp-check');

    const inverterVisualEl = document.getElementById('ai-inverter-visual');
    const inverterToggleBtn = document.getElementById('ai-inverter-toggle');
    const inverterCheckEl = document.getElementById('ai-inverter-check');

    const speakerValueEl = document.getElementById('ai-speaker-value');
    const speakerMinusBtn = document.getElementById('ai-speaker-minus');
    const speakerPlusBtn = document.getElementById('ai-speaker-plus');
    const speakerBarEls = Array.from(document.querySelectorAll('#ai-speaker-bars span'));
    const speakerCheckEl = document.getElementById('ai-speaker-check');

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
      trickIndex: 0,
      blind: 'closed',
      thermo: START_TEMP,
      lampCount: 0,
      lampOn: false,
      inverter: 'off',
      speakerVolume: 0,
      codeRevealed: false,
      solved: false,
      gameOverActive: false,
    };

    let eyeState = 'green';
    let eyeTimer = null;

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function currentTrick() {
      return TRICKS[state.trickIndex] || TRICKS[TRICKS.length - 1];
    }

    function renderEyeState() {
      eyeEl.classList.toggle('eye-green', eyeState === 'green');
      eyeEl.classList.toggle('eye-red', eyeState === 'red');
      gateEl.classList.toggle('gate-eye-open', eyeState === 'red');
      gateEl.classList.toggle('gate-eye-closed', eyeState === 'green');
      if (!state.codeRevealed) {
        statusEl.textContent = eyeState === 'green'
          ? 'Jarvis most nem figyel — mozdulhatsz!'
          : 'Jarvis figyel! Állj meg!';
      }
    }

    function randomBetween(min, max) {
      return min + Math.random() * (max - min);
    }

    function scheduleEyeTick() {
      const delay = eyeState === 'green'
        ? randomBetween(GREEN_MIN_MS, GREEN_MAX_MS)
        : randomBetween(RED_MIN_MS, RED_MAX_MS);
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

    // ---------- vezérlők megjelenítése ----------

    function renderBlind() {
      const isOpen = state.blind === 'open';
      blindVisualEl.classList.toggle('is-open', isOpen);
      blindToggleBtn.classList.toggle('is-on', isOpen);
      blindToggleBtn.textContent = isOpen
        ? 'Nyitva — kattints a záráshoz'
        : 'Zárva — kattints a nyitáshoz';
    }

    function renderInverter(justTurnedOn) {
      const isOn = state.inverter === 'on';
      inverterVisualEl.classList.toggle('is-on', isOn);
      inverterToggleBtn.classList.toggle('is-on', isOn);
      inverterToggleBtn.textContent = isOn
        ? 'Bekapcsolva — kattints a kikapcsoláshoz'
        : 'Kikapcsolva — kattints a bekapcsoláshoz';
      if (justTurnedOn) {
        inverterVisualEl.classList.remove('pulse');
        void inverterVisualEl.offsetWidth;
        inverterVisualEl.classList.add('pulse');
      }
    }

    function renderSpeaker() {
      speakerValueEl.textContent = String(state.speakerVolume);
      const activeBars = Math.ceil(state.speakerVolume / 2);
      speakerBarEls.forEach((bar, i) => {
        bar.classList.toggle('bar-active', i < activeBars);
      });
    }

    function renderLamp() {
      const trick = currentTrick();
      lampToggleBtn.classList.toggle('is-on', state.lampOn);
      if (trick.lamp) {
        lampToggleBtn.textContent = state.lampCount >= trick.lamp
          ? 'Kész ✓'
          : `Kattints még ${Math.max(trick.lamp - state.lampCount, 0)}x`;
      } else {
        lampToggleBtn.textContent = 'Kattints';
      }
    }

    function flashLamp() {
      lampIconEl.classList.remove('flash');
      void lampIconEl.offsetWidth;
      lampIconEl.classList.add('flash');
    }

    function updateChecks() {
      const trick = currentTrick();
      blindCheckEl.hidden = !('blind' in trick && state.blind === trick.blind);
      thermoCheckEl.hidden = !('thermo' in trick && state.thermo === trick.thermo);
      lampCheckEl.hidden = !('lamp' in trick && state.lampCount >= trick.lamp);
      inverterCheckEl.hidden = !('inverter' in trick && state.inverter === trick.inverter);
      speakerCheckEl.hidden = !('speaker' in trick && state.speakerVolume === trick.speaker);
    }

    function afterWidgetChange() {
      updateChecks();
      checkGateComplete();
    }

    // ---------- vezérlők interakciói ----------

    function toggleBlind() {
      handleGateInteraction(() => {
        state.blind = state.blind === 'open' ? 'closed' : 'open';
        renderBlind();
        afterWidgetChange();
      });
    }

    function adjustThermo(delta) {
      handleGateInteraction(() => {
        state.thermo = clamp(state.thermo + delta, MIN_TEMP, MAX_TEMP);
        thermoValueEl.textContent = `${state.thermo}°C`;
        afterWidgetChange();
      });
    }

    function toggleLamp() {
      handleGateInteraction(() => {
        state.lampCount += 1;
        state.lampOn = !state.lampOn;
        renderLamp();
        flashLamp();
        afterWidgetChange();
      });
    }

    function toggleInverter() {
      handleGateInteraction(() => {
        state.inverter = state.inverter === 'on' ? 'off' : 'on';
        renderInverter(state.inverter === 'on');
        afterWidgetChange();
      });
    }

    function adjustSpeaker(delta) {
      handleGateInteraction(() => {
        state.speakerVolume = clamp(state.speakerVolume + delta, 0, 10);
        renderSpeaker();
        afterWidgetChange();
      });
    }

    // ---------- kör-logika ----------

    function checkGateComplete() {
      const trick = currentTrick();
      const blindOk = !('blind' in trick) || state.blind === trick.blind;
      const thermoOk = !('thermo' in trick) || state.thermo === trick.thermo;
      const lampOk = !('lamp' in trick) || state.lampCount >= trick.lamp;
      const inverterOk = !('inverter' in trick) || state.inverter === trick.inverter;
      const speakerOk = !('speaker' in trick) || state.speakerVolume === trick.speaker;

      if (blindOk && thermoOk && lampOk && inverterOk && speakerOk && !state.codeRevealed) {
        revealCode();
      }
    }

    function revealCode() {
      state.codeRevealed = true;
      stopEyeCycle();
      eyeState = 'green';
      eyeEl.classList.remove('eye-red');
      eyeEl.classList.add('eye-green', 'eye-victory');
      gateEl.classList.remove('gate-eye-open');
      gateEl.classList.add('gate-eye-closed');
      statusEl.textContent = 'A rendszer résein kiszivárgott egy kód!';
      codeRevealEl.hidden = false;
      codeInputEl.focus();
      updateHelpPanel();
    }

    function onGateSolved() {
      state.solved = true;
      gateEl.classList.add('gate-solved');
      statusEl.textContent = 'Jarvis kiiktatva. A rendszer felszabadult.';
      lockedRooms.forEach((el) => el.classList.remove('ai-locked'));
      if (cardsPanelPlaceholder) cardsPanelPlaceholder.remove();
      progressTrackEl.hidden = false;
      progressLabelEl.hidden = false;
      rulesTextEl.hidden = false;
      if (window.playSuccess) window.playSuccess();
      window.initPuzzle(PUZZLE_CONFIG);
      updateHelpPanel();
    }

    // ---------- rajtakapás / game over / reset ----------

    function registerCatch() {
      state.attempts -= 1;
      attemptsValueEl.textContent = String(Math.max(state.attempts, 0));
      gateEl.classList.add('caught-flash');
      setTimeout(() => gateEl.classList.remove('caught-flash'), 350);
      if (window.playMiss) window.playMiss();

      if (state.attempts <= 0) {
        triggerGameOver();
        return;
      }

      state.trickIndex = Math.min(state.trickIndex + 1, TRICKS.length - 1);
      resetWidgetsForCurrentTrick();
      statusEl.textContent = 'Rajtakapott! Jarvis kiszúrta ezt a trükköt — jön egy másik.';
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

    // A bináris kapcsolókat (redőny, inverter) SOSEM egy fix alapállapotra állítjuk vissza,
    // hanem mindig az aktuális kör céljával ELLENTÉTES állapotra — különben, ha épp egybeesne
    // a "pihenő" alapállapottal az elvárt cél, azt a lépést ingyen, esemény nélkül teljesítené.
    function resetWidgetsForCurrentTrick() {
      const trick = currentTrick();

      state.blind = trick.blind ? (trick.blind === 'open' ? 'closed' : 'open') : 'closed';
      state.inverter = trick.inverter ? (trick.inverter === 'on' ? 'off' : 'on') : 'off';
      state.thermo = START_TEMP;
      state.speakerVolume = 0;
      state.lampCount = 0;
      state.lampOn = false;

      renderBlind();
      renderInverter(false);
      thermoValueEl.textContent = `${START_TEMP}°C`;
      renderSpeaker();
      renderLamp();
      updateChecks();
    }

    function resetGate() {
      state.attempts = MAX_ATTEMPTS;
      state.trickIndex = 0;
      state.codeRevealed = false;

      attemptsValueEl.textContent = String(MAX_ATTEMPTS);
      codeRevealEl.hidden = true;
      codeInputEl.value = '';
      codeErrorEl.hidden = true;

      resetWidgetsForCurrentTrick();

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
          '<p><strong>A Jarvis ki van iktatva.</strong> A ház eszközei újra elérhetők — húzd a ' +
          'jobb oldali kártyákat a helyükre, hogy mindent helyreállíts!</p>';
        return;
      }
      if (state.codeRevealed) {
        helpBodyEl.innerHTML =
          '<p>Megvan a kód! Írd be a négy számjegyet a mezőbe, hogy végleg kiiktasd a Jarvist.</p>';
        return;
      }

      const trick = currentTrick();
      const isFinal = state.trickIndex === TRICKS.length - 1;
      const introLine = state.trickIndex === 0
        ? 'A Jarvis (ejtsd: Dzsárvisz, a ház "agya") meghibásodott, és zárolta az egész rendszert.'
        : 'Jarvis kiszúrta az előző trükköt — ideje váltani.';
      const trickLine = isFinal
        ? `<strong>Utolsó próbálkozás!</strong> ${trick.describe}.`
        : `${state.trickIndex + 1}. próbálkozás: ${trick.describe}.`;

      helpBodyEl.innerHTML =
        `<p>${introLine}</p>` +
        `<p>${trickLine}</p>` +
        '<p>De csak akkor mozdulj, amikor a szem <strong style="color:#00ff9d">zöld</strong> — ha ' +
        '<strong style="color:#ff5252">piros</strong> alatt hozzáérsz bármelyik vezérlőhöz, Jarvis ' +
        'rajtakap, és elveszel egy próbálkozást.</p>';
    }

    // ---------- eseménykötések ----------

    blindToggleBtn.addEventListener('click', toggleBlind);
    thermoMinusBtn.addEventListener('click', () => adjustThermo(-1));
    thermoPlusBtn.addEventListener('click', () => adjustThermo(1));
    lampToggleBtn.addEventListener('click', toggleLamp);
    inverterToggleBtn.addEventListener('click', toggleInverter);
    speakerMinusBtn.addEventListener('click', () => adjustSpeaker(-1));
    speakerPlusBtn.addEventListener('click', () => adjustSpeaker(1));

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

    resetWidgetsForCurrentTrick();
    renderEyeState();
    scheduleEyeTick();
    updateHelpPanel();
  });
})();
