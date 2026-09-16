# KÓDLAB — projekt-leírás

## Mi ez a projekt

A **KÓDLAB** egy magyar nyelvű, böngészőben futó, önálló (build-lépés és külső könyvtárak nélküli, tisztán HTML/CSS/vanilla JS) webes demó, amit a **Miskolci SZC Kandó Kálmán Informatikai Technikum** készített a **Kutatók Éjszakája** pályaorientációs rendezvényére. Célja, hogy középiskolás diákoknak élményszerűen mutassa be a webfejlesztést: egy "elromlott" weboldalt kell drag-and-drop kódkártyákkal helyreállítaniuk.

A projekt GitHub-on van: `github.com/sandornefr/kodlab`, `main` ágon.

## Fájlstruktúra

```
index.html                     → belépő oldal, 3 témaválasztó kártya
manifest.webmanifest           → PWA manifest
sw.js                          → offline cache service worker
assets/
  css/base.css                 → globális layout, gombok, kártyák, PWA-független közös elemek
  css/themes.css                → téma-specifikus stílusok (mind a 3 témára + az okosház AI-kapu)
  js/puzzle-engine.js           → generikus, minden témán újrafelhasznált húzd-és-vidd motor
  js/confetti.js                → canvas konfetti-effekt
  js/sound.js                   → Web Audio szintetizált hangeffektek (nincs audiófájl)
  js/certificate.js             → nem-blokkoló "kész vagy" banner
  js/house-scene.js             → okosház canvas-illusztráció (csak az okosház témában)
  js/ai-lockout.js              → az okosház téma teljes egyedi logikája (nagy fájl)
  js/pwa.js                     → service worker regisztráció
  icons/                        → PWA ikonok (generált PNG-k)
data/
  gamer.config.js, halozat.config.js, okoshaz.config.js  → kártya-definíciók témánként
themes/
  gamer.html, halozat.html, okoshaz.html
```

## Alap-mechanika (mindhárom témában közös)

`puzzle-engine.js` egy generikus motor: `initPuzzle(config)` beolvas egy kártya-listát (`{id, code, hint, targetSlot}`), minden kártyát legenerál a jobb oldali panelbe, Pointer Events-szel (egér+touch egységesen) húzhatóvá teszi. A bal oldali "preview" panelen `.drop-slot` elemek várják a kártyákat (`data-slot-id`, `data-apply-class`, opcionális `data-apply-target`). Helyes találatnál a cél elem megkapja az `apply-class`-t (ez a CSS-ben a "megjavított" vizuális állapotot adja), rossz találatnál a kártya visszapattan. Ha minden kártya a helyén van, megjelenik egy "Kész vagyok, mutasd!" gomb → konfetti + certifikát-banner.

## A 3 téma

1. **Gamer/Streamer Profil** (`themes/gamer.html`) — 8 kártya, egy streamer-oldal helyreállítása (cím, követőszám, avatár, stream-ablak, gomb, sötét mód, középre igazítás, élő jelzés pulzálása). Egyszerű, klasszikus párosítós mechanika, nincs extra sztori.
2. **Távközlés & Hálózat** (`themes/halozat.html`) — 6 kártya, szerver→router→telefon adatút helyreállítása (áram, kábel, router LED, wifi, telefon képernyő, sebességkijelző). Szintén egyszerű mechanika.
3. **Okosház / IoT** (`themes/okoshaz.html`) — **ez a legkidolgozottabb, szabadulószoba-szerű téma**, saját, nagy JS-modullal (`ai-lockout.js`, ~800 sor). Ez az igazi "termék", a másik kettő változatlan maradt az iterációk alatt.

## Az okosház téma — részletes leírás

### Márka / sztori-keret
- A látható termékmárka: **HÁZŐRZŐ**.
- A mögötte "futó" rendszer neve (easter egg, a Kandó Kálmán névre utalva): **KANDÓ** = *Központi Automatizált Neurális Digitális Óvórendszer*.
- A ház mesterséges intelligenciájának neve: **Jarvis** (ejtsd: Dzsárvisz) — a diák beszélget vele.

### 1. fázis — Onboarding-varázsló (teljes képernyős, lépésenkénti modal)
Egy `position:fixed; inset:0` overlay (`#ai-onboarding`) fedi az egész oldalt, amíg le nem zajlik. Nincs automatikus időzítés sehol — **minden lépés a látogató kattintására vár**. Lépések sorban:
1. **Üdvözlés**: "Üdvözöllek a Központi Automatizált Neurális Digitális Óvórendszerben!" + "Belépés" gomb (nagy, kiemelt "🏠 HÁZŐRZŐ" felirat fent).
2. **Név**: "Hogyan szólíthatlak?" + beviteli mező + "Tovább".
3. **Köszönés**: "Szia, {név}! Örülök, hogy újra itt vagy." (hangosan is elhangzik).
4. **Hangulat**: "Milyen napod volt ma?" — 5 emoji (😄🙂😐😕😢), mindegyikhez egyedi, kedves Jarvis-válasz (rossz hangulatnál extra együttérző).
5–7. **Igen/nem házkérdések**, mindegyiknél él a canvas-jelenet is: "Redőnyt felhúzzam?", "Indíthatom a kedvenc zenédet?" (igen esetén tényleges szintetizált, ének nélküli, deep-house-hangulatú zenehurok szól), "Optimalizáljam a fűtést 21 fokra?".
8. **Napelem-infó**: "A napelem ma 26,6 kW-ot termelt, mert szép időnk volt." + "Szuper!" gomb.

**Fontos szabály**: a kérdések szövegét **nem írjuk ki képernyőre**, csak Jarvis mondja ki hangosan (böngésző natív `speechSynthesis` API, `hu-HU`) — kivéve, ha a böngésző nem támogatja a hangot, akkor tartalék-módban írásban is megjelenik. A válaszok/állítások viszont mindig látszanak írásban is.

Minden igen-válasznál (és a napelem-infónál) egy jól látható, kék felvillanás fut végig az egész onboarding-kártyán, hogy a visszajelzés ne maradjon észrevétlen.

### Canvas házjelenet (`house-scene.js`)
Egy `<canvas>`-on rajzolt, lapos vektor-stílusú illusztráció: ablak+redőny (csúszó csíkok), napfény/inverter-fény az ablakban, hangszóró pulzáló hanghullám-ívekkel, meleg-hangulat színátmenet a termosztáthoz. `window.createHouseScene(canvas)` egy vezérlő-objektumot ad vissza (`openBlind/closeBlind/activateSolar/deactivateSolar/playMusic/stopMusic/warmUp/glitchOut/resize/destroy`). Ugyanaz a canvas-példány él az onboarding alatt (a felugró ablakban) és utána is (áthelyeződik DOM-ban a kapu-panelbe), és **élőben** tükrözi a tényleges játék közbeni vezérlő-állapotokat is, nem csak az onboarding alatt.

### 2. fázis — Meghibásodás
Az utolsó onboarding-lépés után: képernyő-rázkódás (CSS animáció), egy fénycsík fut át a panelen, hang-akadozás (`playGlitch()`), Jarvis bejelenti hangosan, hogy hiba történt és mindent zárol. Ezután indul a tényleges rejtvény.

### 3. fázis — 5 szintes rejtvény ("piros lámpa / zöld lámpa")
- Egy stilizált **szem** (`#ai-eye`, szemhéjjal, íriszes-pupillás, valósághű canvas-mentes CSS-animáció) véletlenszerű időközönként vált **zöld** (Jarvis nem figyel, szabad mozogni) és **piros** (Jarvis figyel, ha piros alatt bármelyik vezérlőhöz nyúlsz, rajtakapva!) között. A kapu-panel háttere is finoman zöldbe/pirosba húz ehhez igazodva.
- 5 vezérlő van: **redőny** (nyitva/zárva kapcsoló), **termosztát** (10–32°C stepper), **lámpa** (kattintás-számláló), **napelem inverter** (be/ki kapcsoló), **hangszóró** (0–10 hangerő-stepper).
- **5 szint**, mindegyiknek saját, fokozatosan nehezedő **találós kérdése** (nem direkt utasítás) a vezérlők egy adott kombinációjára, amit **zöld fényben** kell teljesíteni:
  1. Redőny nyitva + lámpa 3× → kulcs: **EGY**
  2. Termosztát 25°C + lámpa 3× → kulcs: **PÓK**
  3. Inverter be + redőny zárva → kulcs: **OKOZTA**
  4. Hangszóró 7 + lámpa 5× → kulcs: **A**
  5. (Finálé) Redőny nyitva + termosztát 25°C + inverter be + hangszóró 7, egyszerre → kulcs: **RÖVIDZÁRLATOT**
- **Rajtakapás** (piros alatt vezérlőhöz nyúlás) **nem büntet szint-vesztéssel és nem indít újra semmit** — csak számol (`state.strikes`), és minden 3. rajtakapásnál Jarvis **szigorúbbra kapcsol** (rövidebb lesz a zöld, hosszabb a piros időablak, egy vizuális/hangzó "Jarvis egyre gyanakvóbb" pillanat kíséretében), maximált mértékig.
- A widgetek szintváltáskor **sosem** egy fix alapállapotra állnak vissza, hanem mindig **az adott szint céljával ellentétes** állapotra — így mindig kell egy tényleges kattintás/állítás, sosem "ingyen" teljesül egy lépés.
- Minden megoldott szint egy **kulcsszót** ad, ami chipként megjelenik a kapu-panelen.
- Az 5. kulcs után egy szövegmező jelenik meg: a diáknak **be kell írnia** a mondatot, amit a kulcsszavak sorban összeolvasva adnak ki: **"EGY PÓK OKOZTA A RÖVIDZÁRLATOT"** (kis/nagybetűtől és felesleges szóköztől független az ellenőrzés). Helyes beírás után Jarvis kiiktatásra kerül, és megjelenik a vicces csattanó: *"🕷️ Kiderült: egy pók okozta a rövidzárlatot a szellőzőrendszerben!"*

### Lapozható biztonsági kézikönyv (jobb oldali panel)
A jobb oldali kártyapanelben (ahol majd a húzható kódkártyák lesznek) egy **mindig látható**, lapozható "könyv" van (`#ai-handbook`): egy bevezető oldal (a piros/zöld szabály és a KANDÓ-magyarázat) + egy oldal minden eddig elért/megoldott szint rejtvényéhez, Előző/Következő gombokkal, oldalszámlálóval. Új szint megnyílásakor automatikusan a legújabb oldalra ugrik. Ez váltotta ki a korábbi, elrejthető lebegő súgó-gombot — a cél, hogy a diák sose maradjon instrukció nélkül.

### 4. fázis — a 6 megmaradó eszköz
A záró kód beírása után a 6 eddig zárolt eszköz (zár, napelem, redőny, kamera, hangszóró, vezérlőpult-dashboard) feloldódik, és onnantól **a generikus `puzzle-engine.js` motor** veszi át — pontosan úgy, mint a másik 2 témában: a jobb oldali panel megtelik a 6 javító kódkártyával, amiket a diáknak a megfelelő helyre kell húznia. Ha kész, konfetti + certifikát-banner, ugyanúgy, mint a másik két témánál.

## Hang és zene
Minden hang **szintetizált, Web Audio API-val** (`sound.js`), nincs semmilyen letöltött/beágyazott audiófájl vagy jogvédett zene (tudatos döntés jogi okokból). Effektek: `playSuccess`, `playMiss`, `playFanfare`, `playJingle` (kis vidám dallam), `playAmbientLoop`/`stopAmbientLoop` (a zene-kérdésre adott igen válasz), `playGlitch` (meghibásodás/hang-akadozás).

A Jarvis-hang a böngésző **natív `speechSynthesis`** API-ját használja (nem a filmbeli Jarvis-hang — az szerzői jogvédett, nem használható). Csak a nagy sztori-pillanatoknál szólal meg (üdvözlés, kérdések, meghibásodás, szigorodás, záró csattanó), a rejtvény-szövegeket nem olvassa fel.

## Vizuális stílus
Sötét, neon-glassmorphism dizájn (`--bg:#0a0614`, `--accent:#00e5ff` cián, `--accent-2:#ff5da2` pink, `--ok:#00ff9d` zöld), Google Fonts (Space Grotesk + Inter), üveges/elmosott panelek, lekerekített kártyák, animált glow-effektek. Az okosház vezérlőkártyái "hub tile" stílusúak (ikon + állapotszöveg + halvány pulzáló "online" pont).

## PWA / telepíthetőség
`manifest.webmanifest` (name/short_name/icons/standalone display/theme szín), generált ikonok (192/512/apple-touch-icon), minden HTML-oldal fejlécében `apple-mobile-web-app-*` meta-tagek → iPad Safari "Kezdőképernyőhöz adás" után böngészősáv nélküli, teljes képernyős appként nyílik meg. `sw.js` egy egyszerű cache-first offline service worker (csak http(s) kontextusban aktiválódik, pl. GitHub Pages — `file://`-ról nézve csendben nem csinál semmit, nem hibázik).

## Reszponzivitás / hozzáférhetőség
Minden interaktív elem min. 44×44px érintési célterület, dedikált tablet-töréspont (901–1024px, iPad álló/fekvő), Pointer Events (egér+touch egységesen), a canvas Retina/iPad kijelzőn `devicePixelRatio`-val élesen skálázódik, `aria-label`ek az ikon-alapú gombokon.

## Tudatos korlátok / döntések
- Nincs build-eszköz, csomagkezelő, keretrendszer — mindent kézzel írt, natív böngésző-API.
- Nincs valódi zene és nincs a filmbeli Jarvis-hang — jogi okokból mindkettő szintetizált/natív helyettesítővel van megoldva.
- A rajtakapás sosem "game over" — csak nehezíti a következő próbálkozást, hogy standon senki ne akadjon el véglegesen.
- A projekt nem használ semmilyen backendet/szervert — tisztán statikus, offline is működő oldal.
