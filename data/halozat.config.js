const PUZZLE_CONFIG = {
  themeTitle: 'Távközlés & Hálózat',
  cards: [
    {
      id: 'server',
      code: 'power: on;',
      hint: 'A szerver ki van kapcsolva! Indítsd el, hogy egyáltalán küldeni tudjon adatot.',
      targetSlot: 'slot-server',
    },
    {
      id: 'cable',
      code: 'background: linear-gradient(90deg, #00e5ff, #00ff9d);',
      hint: 'Nincs bekötve az optikai kábel a szerver és a router között! Kösd be, hogy elinduljanak az adatcsomagok.',
      targetSlot: 'slot-cable',
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
      code: 'display: flex; opacity: 1;',
      hint: 'A telefon kijelzője sötét, és nem indul a videó lejátszása. Kapcsold be a képernyőt!',
      targetSlot: 'slot-screen',
    },
    {
      id: 'speed',
      code: 'visibility: visible;',
      hint: 'A sebességkijelző rejtve van. Jelenítsd meg, hány Mbps-sal zúgnak az adatok!',
      targetSlot: 'slot-speed',
    },
  ],
};
