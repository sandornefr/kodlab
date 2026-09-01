const PUZZLE_CONFIG = {
  themeTitle: 'Távközlés & Hálózat',
  cards: [
    {
      id: 'cable',
      code: 'border: 4px solid #6b5320;',
      hint: 'Nincs kábel a szerver és a router között! Kösd be a rézkábelt.',
      targetSlot: 'slot-cable',
    },
    {
      id: 'packets',
      code: 'animation: packetMove 1.8s linear infinite;',
      hint: 'A kábelben nem mozog semmi adat. Indítsd el az adatcsomagok folyamatos áramlását!',
      targetSlot: 'slot-packets',
    },
    {
      id: 'optic',
      code: '/* réz helyett */ optikai szál',
      hint: 'A rézkábel lassú. Cseréld optikai szálra, hogy sokkal gyorsabban mozogjanak az adatok!',
      targetSlot: 'slot-optic',
    },
    {
      id: 'led',
      code: 'background-color: #00ff9d;',
      hint: 'A router jelzőfénye pirosan mutatja a hibát. Kapcsold zöldre, ha rendben a kapcsolat!',
      targetSlot: 'slot-led',
    },
    {
      id: 'wifi',
      code: 'opacity: 1;',
      hint: 'A wifi ikon szinte láthatatlan. Erősítsd fel a jelet!',
      targetSlot: 'slot-wifi',
    },
    {
      id: 'screen',
      code: 'display: flex;',
      hint: 'A telefon kijelzője sötét. Kapcsold be a képernyőt!',
      targetSlot: 'slot-screen',
    },
    {
      id: 'play',
      code: 'opacity: 1; /* lejátszás */',
      hint: 'A videó betöltött, de nem indul a lejátszás. Nyomd meg a play-t!',
      targetSlot: 'slot-play',
    },
    {
      id: 'speed',
      code: 'visibility: visible;',
      hint: 'A sebességkijelző rejtve van. Jelenítsd meg, hány Mbps-sal zúgnak az adatok!',
      targetSlot: 'slot-speed',
    },
  ],
};
