// Generikus "kódkártya" drag & drop motor. Pointer Events -> egér + touch egységesen.
(function () {
  function buildCard(cardData) {
    const card = document.createElement('div');
    card.className = 'code-card';
    card.dataset.cardId = cardData.id;
    card.dataset.targetSlot = cardData.targetSlot;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${cardData.code} — ${cardData.hint}`);

    const codeEl = document.createElement('code');
    codeEl.className = 'code-card-code';
    codeEl.textContent = cardData.code;

    const hintEl = document.createElement('p');
    hintEl.className = 'code-card-hint';
    hintEl.textContent = cardData.hint;

    const badge = document.createElement('span');
    badge.className = 'code-card-badge';
    badge.textContent = '✓';
    badge.setAttribute('aria-hidden', 'true');

    card.append(codeEl, hintEl, badge);
    return card;
  }

  function initPuzzle(config) {
    const shell = document.querySelector('.puzzle-shell');
    const preview = document.getElementById('preview');
    const cardsPanel = document.getElementById('cards-panel');
    const progressFill = document.getElementById('progress-fill');
    const progressLabel = document.getElementById('progress-label');
    const resetBtn = document.getElementById('reset-btn');
    const closeBtn = document.getElementById('certificate-close');

    const slots = Array.from(preview.querySelectorAll('.drop-slot'));
    const slotById = new Map(slots.map((s) => [s.dataset.slotId, s]));

    let doneCount = 0;
    const total = config.cards.length;

    function updateProgress() {
      const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
      progressFill.style.width = `${pct}%`;
      progressLabel.textContent = `${doneCount}/${total} kész`;
    }

    function applyToTarget(slot, add) {
      const applyClass = slot.dataset.applyClass;
      if (!applyClass) return;
      const targetId = slot.dataset.applyTarget;
      const target = targetId ? document.getElementById(targetId) : slot;
      if (!target) return;
      target.classList.toggle(applyClass, add);
    }

    function onSuccess(card, slot) {
      slot.classList.add('slot-filled');
      applyToTarget(slot, true);

      card.classList.add('card-done');
      card.style.transition = 'transform 0.25s ease';
      card.style.transform = 'translate(0,0)';
      card.setAttribute('aria-disabled', 'true');

      doneCount += 1;
      updateProgress();

      if (doneCount === total) {
        setTimeout(() => {
          if (window.launchConfetti) window.launchConfetti();
          if (window.showCertificate) window.showCertificate({ themeTitle: config.themeTitle });
        }, 250);
      }
    }

    function snapBack(card) {
      card.style.transition = 'transform 0.35s cubic-bezier(.36,1.4,.4,1)';
      card.style.transform = 'translate(0,0)';
      card.classList.add('card-shake');
      setTimeout(() => card.classList.remove('card-shake'), 350);
    }

    function wireCard(card) {
      let startX = 0;
      let startY = 0;
      let dragging = false;

      card.addEventListener('pointerdown', (e) => {
        if (card.classList.contains('card-done')) return;
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        card.style.transition = 'none';
        card.classList.add('dragging');
        card.setPointerCapture(e.pointerId);
      });

      card.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        card.style.transform = `translate(${dx}px, ${dy}px)`;
      });

      function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        card.classList.remove('dragging');
        try {
          card.releasePointerCapture(e.pointerId);
        } catch (err) {
          /* pointer already released */
        }

        card.style.pointerEvents = 'none';
        const el = document.elementFromPoint(e.clientX, e.clientY);
        card.style.pointerEvents = '';

        const slot = el ? el.closest('.drop-slot') : null;
        if (slot && slot.dataset.slotId === card.dataset.targetSlot && !slot.classList.contains('slot-filled')) {
          onSuccess(card, slot);
        } else {
          snapBack(card);
        }
      }

      card.addEventListener('pointerup', endDrag);
      card.addEventListener('pointercancel', endDrag);
    }

    function render() {
      cardsPanel.innerHTML = '';
      config.cards.forEach((cardData) => {
        const card = buildCard(cardData);
        wireCard(card);
        cardsPanel.appendChild(card);
      });
      updateProgress();
    }

    function reset() {
      doneCount = 0;
      slots.forEach((slot) => {
        slot.classList.remove('slot-filled');
        applyToTarget(slot, false);
      });
      render();
      if (window.hideCertificate) window.hideCertificate();
      shell.classList.remove('all-done');
    }

    render();
    resetBtn.addEventListener('click', reset);
    if (closeBtn) closeBtn.addEventListener('click', () => window.hideCertificate && window.hideCertificate());
  }

  window.initPuzzle = initPuzzle;
})();
