// Service worker regisztráció — ha a lap http(s)-en fut (pl. GitHub Pages), ez adja az
// offline-cache-elést és a telepíthető "alkalmazás" élményt. file://-ról nézve a böngésző
// egyszerűen nem engedélyezi a service workert, ilyenkor ez a hívás csendben elbukik, a lap
// magától is teljesen működik tovább.
(function () {
  if (!('serviceWorker' in navigator)) return;
  const depth = (document.body.dataset.swDepth || '0') === '1' ? '../' : './';
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${depth}sw.js`, { scope: depth }).catch(() => {
      /* nincs http(s) kontextus, vagy a böngésző nem támogatja — nem probléma */
    });
  });
})();
