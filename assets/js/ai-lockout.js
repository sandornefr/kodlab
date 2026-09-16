// Okosház "AI-kiiktatás" kapu-rejtvény. Bevezető: egy teljes képernyős, lépésenkénti
// onboarding-varázsló (üdvözlés → belépés → név → köszönés → hangulat → redőny → zene →
// fűtés → napelem), amiben minden lépés a látogató kattintására vár — nincs automatikus
// időzítő. Utána Jarvis hirtelen meghibásodik és mindent lezár. Onnantól 5 szint, mindegyikhez
// egy találós kérdés (nem közvetlen utasítás) — a helyes kombó zöld fényben felold egy
// kulcsszót. Ha Jarvis rajtakap, nem indul újra semmi, csak egyre gyanakvóbb/szigorúbb lesz.
// Az 5 kulcsszó együtt adja ki a végső, beírandó mondatot. A jobb oldali panelen egy lapozható
// biztonsági kézikönyv mindig mutatja az aktuális teendőt. A 6 megmaradó eszköz feloldása után
// a meglévő, generikus húzd-és-vidd motor (puzzle-engine.js) veszi át a vezérlést változatlanul.
(function () {
  const START_TEMP = 21;
  const MIN_TEMP = 10;
  const MAX_TEMP = 32;

  const GREEN_MIN_BASE = 1200;
  const GREEN_MAX_BASE = 4000;
  const RED_MIN_BASE = 700;
  const RED_MAX_BASE = 2600;
  const GREEN_MIN_FLOOR = 900;
  const RED_MAX_CEIL = 3200;
  const MAX_VIGILANCE_STEPS = 4;
  const STRIKES_PER_ESCALATION = 3;

  const MOOD_OPTIONS = [
    { emoji: '😄', label: 'Szuper', reply: 'Ez az energia! Örülök, hogy ilyen jó napod volt.' },
    { emoji: '🙂', label: 'Jó', reply: 'Ez jól hangzik, örülök neki!' },
    { emoji: '😐', label: 'Átlagos', reply: 'Rendben, néha ilyen egy nap. Remélem, ez a pár perc feldob egy kicsit!' },
    { emoji: '😕', label: 'Nem túl jó', reply: 'Sajnálom, hogy nem alakult jól a nap. Remélem, itt egy kicsit jobban érzed majd magad.' },
    { emoji: '😢', label: 'Rossz', reply: 'Ez nehéz lehetett. Igyekszem, hogy legalább itt legyen egy kis jó élményed ma.' },
  ];

  const ONBOARDING_STEPS = [
    { type: 'welcome' },
    { type: 'name' },
    { type: 'greeting' },
    { type: 'mood' },
    {
      type: 'yesno',
      key: 'blind',
      prompt: 'Redőnyt felhúzzam?',
      yes: 'Máris felhúzom, hadd jöjjön be a fény!',
      no: 'Rendben, hagyom lehúzva.',
      showScene: true,
    },
    {
      type: 'yesno',
      key: 'music',
      prompt: 'Indíthatom a kedvenc zenédet?',
      yes: 'Szóljon akkor egy nyugis kis szám!',
      no: 'Rendben, maradok csendben.',
      showScene: true,
    },
    {
      type: 'yesno',
      key: 'heat',
      prompt: 'Optimalizáljam a fűtést 21 fokra?',
      yes: 'Máris állítom, mindjárt kellemes meleg lesz.',
      no: 'Rendben, hagyom a jelenlegi hőfokon.',
      showScene: true,
    },
    {
      type: 'info',
      key: 'solar',
      prompt: 'A napelem ma 26,6 kW-ot termelt, mert szép időnk volt.',
      ack: 'Szuper!',
      showScene: true,
    },
  ];

  const LEVELS = [
    {
      blind: 'open',
      lamp: 3,
      riddle: 'Háromszor váltja egymást a fény és a sötét — aztán a napfény is beszűrődik az ablakon.',
      key: 'EGY',
    },
    {
      thermo: 25,
      lamp: 3,
      riddle: 'A hőmérséklet emelkedjen pontosan 25 fokra — mint egy kellemes nyári nap —, és eközben még háromszor billenjen a kapcsoló is.',
      key: 'PÓK',
    },
    {
      inverter: 'on',
      blind: 'closed',
      riddle: 'Ébressz fel valamit, ami a napból él, majd engedd vissza sötétbe azt, amit az előbb kiengedtél a fényre.',
      key: 'OKOZTA',
    },
    {
      speaker: 7,
      lamp: 5,
      riddle: 'Told fel a hangot hétig, mintha egy zenekar hangolna — és a fény ötször pisloghat, mire kész a hangzás.',
      key: 'A',
    },
    {
      blind: 'open',
      thermo: 25,
      inverter: 'on',
      speaker: 7,
      riddle:
        'Idézd fel újra a reggelt: eressz be mindent, amit egyszer már kiengedtél — a fényt az ' +
        'ablakon, a kellemes 25 fokos meleget, a nap erejét, és a zenét hetes hangerőn — mind ' +
        'egyszerre, ahogy régen volt.',
      key: 'RÖVIDZÁRLATOT',
    },
  ];

  const FINAL_PHRASE = LEVELS.map((l) => l.key).join(' ');

  const VIGILANCE_MESSAGES = [
    'Gyanús mozgást észlelek. Szigorúbban figyelek mostantól!',
    'Ismerem ezt a trükköt is. Kapcsolok egy fokozattal feljebb.',
    'Egyre óvatosabb vagy — de én is egyre éberebb leszek.',
  ];

  const HANDBOOK_INTRO = {
    title: 'Bevezető',
    body:
      'A HÁZŐRZŐ rendszer motorja a KANDÓ (Központi Automatizált Neurális Digitális ' +
      'Óvórendszer) meghibásodott, és mindent zárolt. Fejtsd meg a rejtvényeket, hogy ' +
      'megtaláld a hibát! Figyeld Jarvis szemét: ha PIROS, akkor figyel — ilyenkor semmihez ' +
      'ne nyúlj, mert azt hiszi, fel akarod törni a rendszert, és szigorítja a hibaelhárítást ' +
      '(egyre rövidebb lesz a zöld, egyre hosszabb a piros időszak). Csak akkor mozdulj, ' +
      'amikor a szem ZÖLDRE vált! Ha mégis rajtakap, nem veszítesz semmit, csak óvatosabban ' +
      'kell majd időzítened legközelebb.',
  };

  document.addEventListener('DOMContentLoaded', () => {
    const canSpeak = !!window.speechSynthesis;

    const gateEl = document.getElementById('ai-gate');
    const streakEl = document.getElementById('ai-gate-streak');
    const gateHeaderEl = document.getElementById('ai-gate-header');
    const eyeEl = document.getElementById('ai-eye');
    const statusEl = document.getElementById('ai-gate-status');
    const levelValueEl = document.getElementById('ai-level-value');

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

    const keyChipEls = Array.from(document.querySelectorAll('#ai-keys .ai-key-chip'));

    const codeRevealEl = document.getElementById('ai-code-reveal');
    const codeFormEl = document.getElementById('ai-code-form');
    const codeInputEl = document.getElementById('ai-code-input');
    const codeErrorEl = document.getElementById('ai-code-error');
    const causeRevealEl = document.getElementById('ai-cause-reveal');

    const vigilanceEl = document.getElementById('ai-vigilance');
    const vigilanceMsgEl = document.getElementById('ai-vigilance-msg');

    const progressTrackEl = document.getElementById('progress-track');
    const progressLabelEl = document.getElementById('progress-label');
    const rulesTextEl = document.getElementById('rules-text');
    const resetBtn = document.getElementById('reset-btn');
    const lockedRooms = Array.from(document.querySelectorAll('.ai-locked'));

    const sceneWrapEl = document.getElementById('ai-scene-wrap');
    const sceneCanvasEl = document.getElementById('ai-house-scene');

    const onboardingEl = document.getElementById('ai-onboarding');
    const onboardingCardEl = document.getElementById('ai-onboarding-card');
    const onboardingEyebrowEl = document.getElementById('ai-onboarding-eyebrow');
    const onboardingSceneEl = document.getElementById('ai-onboarding-scene');
    const onboardingLineEl = document.getElementById('ai-onboarding-line');
    const onboardingBodyEl = document.getElementById('ai-onboarding-body');

    const handbookPageEl = document.getElementById('ai-handbook-page');
    const handbookTitleEl = document.getElementById('ai-handbook-title');
    const handbookBodyEl = document.getElementById('ai-handbook-body');
    const handbookCounterEl = document.getElementById('ai-handbook-counter');
    const handbookPrevBtn = document.getElementById('ai-handbook-prev');
    const handbookNextBtn = document.getElementById('ai-handbook-next');

    let houseScene = null;

    const state = {
      userName: 'Kedves Látogató',
      introDone: false,
      levelIndex: 0,
      strikes: 0,
      vigilance: 0,
      blind: 'closed',
      thermo: START_TEMP,
      lampCount: 0,
      lampOn: false,
      inverter: 'off',
      speakerVolume: 0,
      keysCollected: [],
      finalPhase: false,
      solved: false,
      vigilanceFlashActive: false,
      handbookPage: 0,
    };

    let eyeState = 'green';
    let eyeTimer = null;

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function randomBetween(min, max) {
      return min + Math.random() * (max - min);
    }

    function currentLevel() {
      return LEVELS[state.levelIndex] || LEVELS[LEVELS.length - 1];
    }

    function normalizePhrase(str) {
      return str.trim().replace(/\s+/g, ' ').toUpperCase();
    }

    function warmthFor(temp) {
      return clamp((temp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP), 0, 1);
    }

    // Csak a nagy sztori-pillanatoknál és kérdéseknél szólal meg — a kérdések szövegét emiatt
    // nem is kell kiírni képernyőre (lásd az onboarding-lépéseket), csak ha a böngésző nem
    // támogatja a felolvasást (akkor írásban is megjelenik, biztonsági tartalékként).
    function speak(text) {
      if (!canSpeak) return;
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'hu-HU';
        utter.rate = 1;
        utter.pitch = 0.95;
        window.speechSynthesis.speak(utter);
      } catch (err) {
        /* speechSynthesis nem elérhető vagy blokkolva */
      }
    }

    // ---------- Jarvis figyelés-ciklus, egyre szigorodó tartományokkal ----------

    function vigilanceSteps() {
      return Math.min(state.vigilance, MAX_VIGILANCE_STEPS);
    }

    function greenRange() {
      const steps = vigilanceSteps();
      const min = Math.max(GREEN_MIN_FLOOR, GREEN_MIN_BASE - steps * 75);
      const max = Math.max(min + 400, GREEN_MAX_BASE - steps * 700);
      return [min, max];
    }

    function redRange() {
      const steps = vigilanceSteps();
      const min = RED_MIN_BASE + steps * 60;
      const max = Math.min(RED_MAX_CEIL, RED_MAX_BASE + steps * 150);
      return [min, Math.max(min + 300, max)];
    }

    function renderEyeState() {
      eyeEl.classList.toggle('eye-green', eyeState === 'green');
      eyeEl.classList.toggle('eye-red', eyeState === 'red');
      gateEl.classList.toggle('gate-eye-open', eyeState === 'red');
      gateEl.classList.toggle('gate-eye-closed', eyeState === 'green');
      if (!state.finalPhase) {
        statusEl.textContent = eyeState === 'green'
          ? 'Jarvis most nem figyel — mozdulhatsz!'
          : 'Jarvis figyel! Állj meg!';
      }
    }

    function scheduleEyeTick() {
      const [min, max] = eyeState === 'green' ? greenRange() : redRange();
      eyeTimer = setTimeout(() => {
        eyeState = eyeState === 'green' ? 'red' : 'green';
        renderEyeState();
        scheduleEyeTick();
      }, randomBetween(min, max));
    }

    function stopEyeCycle() {
      clearTimeout(eyeTimer);
    }

    function handleGateInteraction(onSafe) {
      if (!state.introDone || state.finalPhase || state.vigilanceFlashActive) return;
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
      if (houseScene) {
        if (isOpen) houseScene.openBlind(); else houseScene.closeBlind();
      }
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
      if (houseScene) {
        if (isOn) houseScene.activateSolar(); else houseScene.deactivateSolar();
      }
    }

    function renderSpeaker() {
      speakerValueEl.textContent = String(state.speakerVolume);
      const activeBars = Math.ceil(state.speakerVolume / 2);
      speakerBarEls.forEach((bar, i) => {
        bar.classList.toggle('bar-active', i < activeBars);
      });
      if (houseScene) {
        if (state.speakerVolume > 0) houseScene.playMusic(); else houseScene.stopMusic();
      }
    }

    function renderLamp() {
      const level = currentLevel();
      lampToggleBtn.classList.toggle('is-on', state.lampOn);
      if (level.lamp) {
        lampToggleBtn.textContent = state.lampCount >= level.lamp
          ? 'Kész ✓'
          : `Kattints még ${Math.max(level.lamp - state.lampCount, 0)}x`;
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
      const level = currentLevel();
      blindCheckEl.hidden = !('blind' in level && state.blind === level.blind);
      thermoCheckEl.hidden = !('thermo' in level && state.thermo === level.thermo);
      lampCheckEl.hidden = !('lamp' in level && state.lampCount >= level.lamp);
      inverterCheckEl.hidden = !('inverter' in level && state.inverter === level.inverter);
      speakerCheckEl.hidden = !('speaker' in level && state.speakerVolume === level.speaker);
    }

    function afterWidgetChange() {
      updateChecks();
      checkLevelComplete();
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
        if (houseScene) houseScene.warmUp(warmthFor(state.thermo));
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

    // ---------- szint-logika ----------

    function checkLevelComplete() {
      const level = currentLevel();
      const blindOk = !('blind' in level) || state.blind === level.blind;
      const thermoOk = !('thermo' in level) || state.thermo === level.thermo;
      const lampOk = !('lamp' in level) || state.lampCount >= level.lamp;
      const inverterOk = !('inverter' in level) || state.inverter === level.inverter;
      const speakerOk = !('speaker' in level) || state.speakerVolume === level.speaker;

      if (blindOk && thermoOk && lampOk && inverterOk && speakerOk && !state.finalPhase) {
        completeLevel();
      }
    }

    function renderKeyChip(index, key) {
      const chip = keyChipEls[index];
      if (!chip) return;
      chip.textContent = key;
      chip.classList.add('filled');
    }

    function completeLevel() {
      const level = currentLevel();
      state.keysCollected.push(level.key);
      renderKeyChip(state.levelIndex, level.key);
      if (window.playSuccess) window.playSuccess();

      if (state.levelIndex >= LEVELS.length - 1) {
        enterFinalPhase();
        return;
      }

      state.levelIndex += 1;
      levelValueEl.textContent = String(state.levelIndex + 1);
      resetWidgetsForCurrentLevel();
      statusEl.textContent = `${level.key} megvan! Jöhet a következő szint.`;
      jumpToLastHandbookPage();
    }

    function enterFinalPhase() {
      state.finalPhase = true;
      stopEyeCycle();
      eyeState = 'green';
      eyeEl.classList.remove('eye-red');
      eyeEl.classList.add('eye-green', 'eye-victory');
      gateEl.classList.remove('gate-eye-open');
      gateEl.classList.add('gate-eye-closed');
      statusEl.textContent = 'Mind az 5 kulcsszó megvan! Rakd össze a választ.';
      codeRevealEl.hidden = false;
      codeInputEl.focus();
      jumpToLastHandbookPage();
    }

    function onGateSolved() {
      state.solved = true;
      gateEl.classList.add('gate-solved');
      statusEl.textContent = 'Jarvis kiiktatva. A rendszer felszabadult.';
      causeRevealEl.hidden = false;
      speak(`${state.userName}, kiderült: egy pók okozta a rövidzárlatot a szellőzőrendszerben!`);
      lockedRooms.forEach((el) => el.classList.remove('ai-locked'));
      progressTrackEl.hidden = false;
      progressLabelEl.hidden = false;
      rulesTextEl.hidden = false;
      if (window.playSuccess) window.playSuccess();
      window.initPuzzle(PUZZLE_CONFIG); // ez törli és újraépíti a cards-panel tartalmát (a kézikönyv helyén)
    }

    // ---------- rajtakapás / szigorodás ----------

    function registerCatch() {
      state.strikes += 1;
      gateEl.classList.add('caught-flash');
      setTimeout(() => gateEl.classList.remove('caught-flash'), 350);
      if (window.playMiss) window.playMiss();
      statusEl.textContent = 'Rajtakapott! Jarvis gyanakvóbb lett.';

      if (state.strikes % STRIKES_PER_ESCALATION === 0) {
        escalateVigilance();
      }
    }

    function escalateVigilance() {
      state.vigilance += 1;
      state.vigilanceFlashActive = true;
      stopEyeCycle();
      vigilanceEl.hidden = false;
      vigilanceMsgEl.textContent = VIGILANCE_MESSAGES[Math.floor(Math.random() * VIGILANCE_MESSAGES.length)];
      speak(vigilanceMsgEl.textContent);
      gateEl.classList.add('gate-glitch');
      if (window.playMiss) window.playMiss();
      setTimeout(() => {
        vigilanceEl.hidden = true;
        gateEl.classList.remove('gate-glitch');
        state.vigilanceFlashActive = false;
        eyeState = 'green';
        renderEyeState();
        scheduleEyeTick();
      }, 2600);
    }

    // A bináris kapcsolókat (redőny, inverter) SOSEM egy fix alapállapotra állítjuk vissza,
    // hanem mindig az aktuális szint céljával ELLENTÉTES állapotra — különben, ha épp egybeesne
    // a "pihenő" alapállapottal az elvárt cél, azt a lépést ingyen, esemény nélkül teljesítené.
    function resetWidgetsForCurrentLevel() {
      const level = currentLevel();

      state.blind = level.blind ? (level.blind === 'open' ? 'closed' : 'open') : 'closed';
      state.inverter = level.inverter ? (level.inverter === 'on' ? 'off' : 'on') : 'off';
      state.thermo = START_TEMP;
      state.speakerVolume = 0;
      state.lampCount = 0;
      state.lampOn = false;

      renderBlind();
      renderInverter(false);
      thermoValueEl.textContent = `${START_TEMP}°C`;
      if (houseScene) houseScene.warmUp(warmthFor(START_TEMP));
      renderSpeaker();
      renderLamp();
      updateChecks();
    }

    function resetGate() {
      if (!state.introDone) return;

      state.levelIndex = 0;
      state.strikes = 0;
      state.vigilance = 0;
      state.keysCollected = [];
      state.finalPhase = false;

      levelValueEl.textContent = '1';
      keyChipEls.forEach((chip) => {
        chip.textContent = '';
        chip.classList.remove('filled');
      });
      codeRevealEl.hidden = true;
      codeInputEl.value = '';
      codeErrorEl.hidden = true;
      causeRevealEl.hidden = true;

      resetWidgetsForCurrentLevel();

      eyeState = 'green';
      eyeEl.classList.remove('eye-victory');
      renderEyeState();
      stopEyeCycle();
      scheduleEyeTick();
      jumpToLastHandbookPage();
    }

    // ---------- lapozható biztonsági kézikönyv (jobb oldali panel) ----------

    function handbookPages() {
      const pages = [HANDBOOK_INTRO];

      if (state.introDone) {
        const lastLevel = (state.finalPhase || state.solved) ? LEVELS.length - 1 : state.levelIndex;
        for (let i = 0; i <= lastLevel; i += 1) {
          pages.push({ title: `${i + 1}. szint`, body: LEVELS[i].riddle });
        }
      }

      if (state.finalPhase && !state.solved) {
        pages.push({
          title: 'Utolsó lépés',
          body: 'Mind az 5 kulcsszó megvan! Rakd össze őket egy mondattá, és írd be a kapu-panel alján lévő mezőbe.',
        });
      }

      return pages;
    }

    function renderHandbook() {
      const pages = handbookPages();
      state.handbookPage = clamp(state.handbookPage, 0, pages.length - 1);
      const page = pages[state.handbookPage];
      handbookTitleEl.textContent = page.title;
      handbookBodyEl.textContent = page.body;
      handbookCounterEl.textContent = `${state.handbookPage + 1} / ${pages.length}`;
      handbookPrevBtn.disabled = state.handbookPage <= 0;
      handbookNextBtn.disabled = state.handbookPage >= pages.length - 1;
    }

    function playHandbookTransition() {
      handbookPageEl.classList.remove('page-turn');
      void handbookPageEl.offsetWidth;
      handbookPageEl.classList.add('page-turn');
    }

    function jumpToLastHandbookPage() {
      const pages = handbookPages();
      state.handbookPage = pages.length - 1;
      playHandbookTransition();
      renderHandbook();
    }

    handbookPrevBtn.addEventListener('click', () => {
      state.handbookPage = Math.max(0, state.handbookPage - 1);
      playHandbookTransition();
      renderHandbook();
    });
    handbookNextBtn.addEventListener('click', () => {
      const pages = handbookPages();
      state.handbookPage = Math.min(pages.length - 1, state.handbookPage + 1);
      playHandbookTransition();
      renderHandbook();
    });

    // ---------- onboarding-varázsló ----------

    function makeChoiceButton(label, onClick) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ai-dialogue-btn';
      btn.textContent = label;
      btn.addEventListener('click', onClick);
      return btn;
    }

    function playOnboardingTransition() {
      onboardingCardEl.classList.remove('step-enter');
      void onboardingCardEl.offsetWidth;
      onboardingCardEl.classList.add('step-enter');
    }

    function ensureHouseScene() {
      if (!houseScene && window.createHouseScene) {
        houseScene = window.createHouseScene(sceneCanvasEl);
      }
    }

    function flashOnboardingScene() {
      onboardingSceneEl.classList.remove('action-flash');
      onboardingCardEl.classList.remove('action-flash');
      void onboardingSceneEl.offsetWidth;
      onboardingSceneEl.classList.add('action-flash');
      onboardingCardEl.classList.add('action-flash');
    }

    function applyOnboardingEffect(step, yes) {
      if (step.key === 'blind' && yes) {
        state.blind = 'open';
        renderBlind();
        flashOnboardingScene();
      } else if (step.key === 'music' && yes) {
        state.speakerVolume = 6;
        renderSpeaker();
        if (window.playAmbientLoop) window.playAmbientLoop();
        flashOnboardingScene();
      } else if (step.key === 'heat' && yes) {
        if (houseScene) houseScene.warmUp(warmthFor(START_TEMP));
        flashOnboardingScene();
      } else if (step.key === 'solar') {
        if (houseScene) houseScene.activateSolar();
        flashOnboardingScene();
      }
    }

    function renderChoices(buttons) {
      const row = document.createElement('div');
      row.className = 'ai-onboarding-choices';
      buttons.forEach((btn) => row.appendChild(btn));
      onboardingBodyEl.appendChild(row);
      return row;
    }

    function showOnboardingStep(index) {
      if (index >= ONBOARDING_STEPS.length) {
        finishOnboarding();
        return;
      }

      const step = ONBOARDING_STEPS[index];
      onboardingBodyEl.innerHTML = '';
      onboardingLineEl.textContent = '';
      onboardingSceneEl.hidden = !step.showScene;
      if (step.showScene) ensureHouseScene();
      playOnboardingTransition();

      if (step.type === 'welcome') {
        onboardingEyebrowEl.textContent = '🏠 HÁZŐRZŐ';
        onboardingLineEl.textContent =
          'Üdvözöllek a Központi Automatizált Neurális Digitális Óvórendszerben!';
        renderChoices([makeChoiceButton('Belépés', () => showOnboardingStep(index + 1))]);
      } else if (step.type === 'name') {
        onboardingEyebrowEl.textContent = '🏠 HÁZŐRZŐ — Bejelentkezés';
        onboardingLineEl.textContent = 'Hogyan szólíthatlak?';
        const form = document.createElement('form');
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 24;
        input.placeholder = 'A neved';
        input.setAttribute('aria-label', 'A neved');
        input.autocomplete = 'off';
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'btn-primary';
        submitBtn.textContent = 'Tovább';
        form.append(input, submitBtn);
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          state.userName = input.value.trim() || 'Kedves Látogató';
          showOnboardingStep(index + 1);
        });
        onboardingBodyEl.appendChild(form);
        setTimeout(() => input.focus(), 50);
      } else if (step.type === 'greeting') {
        onboardingEyebrowEl.textContent = '🏠 HÁZŐRZŐ';
        const line = `Szia, ${state.userName}! Örülök, hogy újra itt vagy.`;
        onboardingLineEl.textContent = line;
        speak(line);
        renderChoices([makeChoiceButton('Szia!', () => showOnboardingStep(index + 1))]);
      } else if (step.type === 'mood') {
        const line = 'Milyen napod volt ma? Válassz egy arcot!';
        if (!canSpeak) onboardingLineEl.textContent = line;
        speak(line);
        const buttons = MOOD_OPTIONS.map((mood) => {
          const btn = makeChoiceButton(mood.emoji, () => {
            onboardingBodyEl.innerHTML = '';
            onboardingLineEl.textContent = mood.reply;
            speak(mood.reply);
            renderChoices([makeChoiceButton('Tovább', () => showOnboardingStep(index + 1))]);
            playOnboardingTransition();
          });
          btn.classList.add('ai-mood-btn');
          btn.setAttribute('aria-label', mood.label);
          return btn;
        });
        renderChoices(buttons);
      } else if (step.type === 'yesno') {
        if (!canSpeak) onboardingLineEl.textContent = step.prompt;
        speak(step.prompt);
        const yesBtn = makeChoiceButton('Igen', () => {
          applyOnboardingEffect(step, true);
          onboardingBodyEl.innerHTML = '';
          onboardingLineEl.textContent = step.yes;
          speak(step.yes);
          renderChoices([makeChoiceButton('Tovább', () => showOnboardingStep(index + 1))]);
          playOnboardingTransition();
        });
        const noBtn = makeChoiceButton('Nem', () => {
          applyOnboardingEffect(step, false);
          onboardingBodyEl.innerHTML = '';
          onboardingLineEl.textContent = step.no;
          speak(step.no);
          renderChoices([makeChoiceButton('Tovább', () => showOnboardingStep(index + 1))]);
          playOnboardingTransition();
        });
        renderChoices([yesBtn, noBtn]);
      } else if (step.type === 'info') {
        if (!canSpeak) onboardingLineEl.textContent = step.prompt;
        speak(step.prompt);
        applyOnboardingEffect(step, true);
        renderChoices([makeChoiceButton(step.ack, () => showOnboardingStep(index + 1))]);
      }
    }

    function finishOnboarding() {
      onboardingEl.hidden = true;
      if (sceneCanvasEl.parentElement !== sceneWrapEl) {
        sceneWrapEl.appendChild(sceneCanvasEl);
        sceneWrapEl.hidden = false;
        if (houseScene) houseScene.resize();
      }
      triggerMalfunction();
    }

    function triggerMalfunction() {
      if (state.introDone) return;
      state.introDone = true;
      gateEl.classList.remove('intro-active');
      if (window.stopAmbientLoop) window.stopAmbientLoop();
      if (window.playGlitch) window.playGlitch();
      gateEl.classList.add('gate-glitch', 'malfunction-shake');
      streakEl.classList.remove('play');
      void streakEl.offsetWidth;
      streakEl.classList.add('play');
      if (houseScene) houseScene.glitchOut(500);
      speak(`${state.userName}, meghibásodás történt a központi rendszerben. Mindent zárolok.`);
      setTimeout(() => {
        gateEl.classList.remove('gate-glitch', 'malfunction-shake');
        gateHeaderEl.hidden = false;
        resetWidgetsForCurrentLevel();
        renderEyeState();
        scheduleEyeTick();
        jumpToLastHandbookPage();
      }, 500);
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
      const value = normalizePhrase(codeInputEl.value);
      if (value === normalizePhrase(FINAL_PHRASE)) {
        onGateSolved();
      } else {
        codeErrorEl.hidden = false;
        codeInputEl.focus();
        codeInputEl.select();
        setTimeout(() => {
          codeErrorEl.hidden = true;
        }, 2400);
      }
    });

    resetBtn.addEventListener('click', () => {
      if (state.solved) return; // A 6-kártyás fázis saját reset-kezelője (puzzle-engine.js) veszi át innentől.
      resetGate();
    });

    resetWidgetsForCurrentLevel();
    renderHandbook();
    showOnboardingStep(0);
  });
})();
