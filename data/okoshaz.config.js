const PUZZLE_CONFIG = {
  themeTitle: 'Okosház / IoT',
  cards: [
    {
      id: 'lamp',
      code: 'box-shadow: 0 0 14px #ffe27a;',
      hint: 'A nappali sötét! Kapcsold fel a lámpát, hogy fény öntse el a szobát.',
      targetSlot: 'slot-lamp',
    },
    {
      id: 'thermo',
      code: 'color: #00ff9d;',
      hint: 'A hőmérő kijelzője üres. Jelenítsd meg a pontos hőfokot!',
      targetSlot: 'slot-thermo',
    },
    {
      id: 'lock',
      code: 'filter: drop-shadow(0 0 10px #00ff9d);',
      hint: 'Az ajtó nyitva maradt! Zárd be, és jelezze zölden, hogy biztonságban vagy.',
      targetSlot: 'slot-lock',
    },
    {
      id: 'solar',
      code: 'opacity: 1;',
      hint: 'A napelemek most nem termelnek. Aktiváld őket, hogy elinduljon az áramtermelés!',
      targetSlot: 'slot-solar',
    },
    {
      id: 'blind',
      code: 'transform: scaleY(1);',
      hint: 'A redőny félig lehúzva ragadt. Húzd fel teljesen!',
      targetSlot: 'slot-blind',
    },
    {
      id: 'cam',
      code: 'filter: drop-shadow(0 0 10px #ff5252);',
      hint: 'A biztonsági kamera nem jelez. Kapcsold be a megfigyelést!',
      targetSlot: 'slot-cam',
    },
    {
      id: 'speaker',
      code: 'animation: speakerWave 1.2s infinite;',
      hint: 'Az okoshangszóró néma. Indítsd el, hogy hallgasson a házra!',
      targetSlot: 'slot-speaker',
    },
    {
      id: 'dashboard',
      code: 'visibility: visible;',
      hint: 'A vezérlőpult rejtve van. Jelenítsd meg az összesített állapotot!',
      targetSlot: 'slot-dashboard',
    },
  ],
};
