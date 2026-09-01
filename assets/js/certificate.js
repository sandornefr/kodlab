// Egyszerű, nem-blokkoló "kész vagy!" jelzés — nincs fájl, nincs letöltés.
(function () {
  function showCertificate({ themeTitle }) {
    const banner = document.getElementById('certificate-modal');
    const subtitle = document.getElementById('completion-theme');
    if (subtitle) subtitle.textContent = themeTitle;
    banner.classList.add('open');
  }

  function hideCertificate() {
    const banner = document.getElementById('certificate-modal');
    banner.classList.remove('open');
  }

  window.showCertificate = showCertificate;
  window.hideCertificate = hideCertificate;
})();
