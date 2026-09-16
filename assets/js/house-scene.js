// Egyszerű, lapos vektor-stílusú házjelenet canvas-on: ablak+redőny, hangszóró
// hanghullámokkal, napfény és szoba-hangulat. Élőben tükrözi a kapu-rejtvény
// vezérlőinek állapotát (nem csak az introban). Nincs külső fájl/kép, minden
// rajzolás kód, ugyanabban a szellemben, mint a confetti.js.
(function () {
  function animateValue(setter, from, to, duration) {
    const start = performance.now();
    function step(now) {
      const t = duration <= 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 2);
      setter(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function createHouseScene(canvas) {
    const ctx = canvas.getContext('2d');
    let cssW = canvas.clientWidth || 260;
    let cssH = canvas.clientHeight || 150;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      cssW = canvas.clientWidth || cssW;
      cssH = canvas.clientHeight || cssH;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const v = { blind: 0, sun: 0, musicPulse: 0, warmth: 0, glitch: 0 };
    let raf = null;
    let running = true;

    function draw() {
      const W = cssW;
      const H = cssH;
      ctx.clearRect(0, 0, W, H);

      // szoba alap
      ctx.fillStyle = '#0c1c14';
      ctx.fillRect(0, 0, W, H);

      // meleg hangulat-overlay (termosztát)
      if (v.warmth > 0.01) {
        const warmGrad = ctx.createRadialGradient(W * 0.3, H * 0.7, 0, W * 0.3, H * 0.7, W * 0.8);
        warmGrad.addColorStop(0, `rgba(255, 158, 87, ${0.18 * v.warmth})`);
        warmGrad.addColorStop(1, 'rgba(255, 158, 87, 0)');
        ctx.fillStyle = warmGrad;
        ctx.fillRect(0, 0, W, H);
      }

      // ablak
      const winX = W * 0.52;
      const winY = H * 0.12;
      const winW = W * 0.4;
      const winH = H * 0.58;

      const skyGrad = ctx.createLinearGradient(winX, winY, winX, winY + winH);
      skyGrad.addColorStop(0, `rgba(255, 212, 0, ${0.12 + v.sun * 0.45})`);
      skyGrad.addColorStop(1, `rgba(0, 229, 255, ${0.05 + v.sun * 0.18})`);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(winX, winY, winW, winH);

      // nap az ablakban
      if (v.sun > 0.02) {
        const sunX = winX + winW * 0.7;
        const sunY = winY + winH * 0.32;
        const sunR = 10 + v.sun * 8;
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 2.4);
        sunGlow.addColorStop(0, `rgba(255, 212, 0, ${0.65 * v.sun})`);
        sunGlow.addColorStop(1, 'rgba(255, 212, 0, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR * 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 226, 122, ${0.9 * v.sun})`;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
        ctx.fill();
      }

      // redőny-csíkok (fedik az ablakot fentről, blind=1 -> teljesen nyitva)
      const coverH = winH * (1 - v.blind);
      ctx.fillStyle = '#1b2a20';
      const slat = 7;
      for (let y = 0; y < coverH; y += slat) {
        const h = Math.min(slat - 1.5, coverH - y);
        if (h > 0) ctx.fillRect(winX, winY + y, winW, h);
      }

      ctx.strokeStyle = '#2a3a4a';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(winX, winY, winW, winH);

      // hangszóró + hanghullámok
      const spX = W * 0.22;
      const spY = H * 0.72;
      ctx.fillStyle = '#3a3450';
      ctx.beginPath();
      ctx.arc(spX, spY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a4460';
      ctx.beginPath();
      ctx.arc(spX, spY, 4, 0, Math.PI * 2);
      ctx.fill();

      if (v.musicPulse > 0.03) {
        ctx.strokeStyle = `rgba(0, 229, 255, ${v.musicPulse})`;
        ctx.lineWidth = 2;
        const t = performance.now() / 260;
        [14, 21, 28].forEach((r, i) => {
          const wobble = Math.sin(t + i) * 2;
          ctx.beginPath();
          ctx.arc(spX, spY, r + wobble, -0.55, 0.55);
          ctx.stroke();
        });
      }

      // glitch: rövid, véletlenszerű "statikus" csíkok
      if (v.glitch > 0.02) {
        const bands = 5;
        for (let i = 0; i < bands; i += 1) {
          if (Math.random() > 0.5) continue;
          const by = Math.random() * H;
          const bh = 2 + Math.random() * 6;
          ctx.fillStyle = `rgba(255, 82, 82, ${0.25 * v.glitch})`;
          ctx.fillRect(0, by, W, bh);
        }
      }
    }

    function loop() {
      if (!running) return;
      draw();
      raf = requestAnimationFrame(loop);
    }
    loop();

    return {
      openBlind() { animateValue((n) => { v.blind = n; }, v.blind, 1, 900); },
      closeBlind() { animateValue((n) => { v.blind = n; }, v.blind, 0, 900); },
      activateSolar() { animateValue((n) => { v.sun = n; }, v.sun, 1, 900); },
      deactivateSolar() { animateValue((n) => { v.sun = n; }, v.sun, 0, 700); },
      playMusic() { animateValue((n) => { v.musicPulse = n; }, v.musicPulse, 1, 350); },
      stopMusic() { animateValue((n) => { v.musicPulse = n; }, v.musicPulse, 0, 500); },
      warmUp(level) { animateValue((n) => { v.warmth = n; }, v.warmth, clamp01(level), 700); },
      glitchOut(durationMs) {
        v.glitch = 1;
        setTimeout(() => {
          animateValue((n) => { v.glitch = n; }, v.glitch, 0, 300);
          v.blind = 0;
          v.sun = 0;
          v.musicPulse = 0;
          v.warmth = 0;
        }, durationMs || 500);
      },
      resize,
      destroy() {
        running = false;
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      },
    };

    function clamp01(n) {
      return Math.min(1, Math.max(0, n));
    }
  }

  window.createHouseScene = createHouseScene;
})();
