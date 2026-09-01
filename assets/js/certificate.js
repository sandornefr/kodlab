// Canvas alapú "oklevél" generátor. Nincs külső függőség.
(function () {
  function drawCertificate(canvas, { themeTitle, name }) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#12081f');
    bg.addColorStop(1, '#1c1035');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#ffd400';
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.strokeStyle = 'rgba(255,212,0,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(38, 38, w - 76, h - 76);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd400';
    ctx.font = '700 22px "Segoe UI", sans-serif';
    ctx.fillText('OKLEVÉL', w / 2, h * 0.22);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 40px "Segoe UI", sans-serif';
    ctx.fillText('Junior Web Design Restaurátor', w / 2, h * 0.34);

    ctx.font = '400 20px "Segoe UI", sans-serif';
    ctx.fillStyle = '#c9bfe0';
    ctx.fillText('Ezt az oklevelet a helyreállított oldal bizonyítja:', w / 2, h * 0.46);

    ctx.font = '700 30px "Segoe UI", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(themeTitle, w / 2, h * 0.55);

    if (name && name.trim()) {
      ctx.font = '400 18px "Segoe UI", sans-serif';
      ctx.fillStyle = '#c9bfe0';
      ctx.fillText('Kiállítva részére:', w / 2, h * 0.68);
      ctx.font = '700 32px "Segoe UI", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(name.trim(), w / 2, h * 0.76);
    }

    const dateStr = new Date().toLocaleDateString('hu-HU');
    ctx.font = '400 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#8b7fae';
    ctx.fillText(dateStr, w / 2, h * 0.9);
  }

  function showCertificate({ themeTitle }) {
    const modal = document.getElementById('certificate-modal');
    const canvas = document.getElementById('certificate-canvas');
    const nameInput = document.getElementById('certificate-name');
    const downloadLink = document.getElementById('certificate-download');

    function render() {
      drawCertificate(canvas, { themeTitle, name: nameInput ? nameInput.value : '' });
      if (downloadLink) {
        downloadLink.href = canvas.toDataURL('image/png');
      }
    }

    render();
    if (nameInput) {
      nameInput.oninput = render;
    }
    modal.classList.add('open');
  }

  function hideCertificate() {
    const modal = document.getElementById('certificate-modal');
    modal.classList.remove('open');
  }

  window.showCertificate = showCertificate;
  window.hideCertificate = hideCertificate;
})();
