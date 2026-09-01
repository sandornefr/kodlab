const PUZZLE_CONFIG = {
  themeTitle: 'Gamer/Streamer Profil',
  cards: [
    {
      id: 'title',
      code: '<h1>ShadowFox_LIVE</h1>',
      hint: 'A csatornanevet senki nem veszi észre! Tedd a helyére a főcímet, hogy hatalmas és vastag legyen.',
      targetSlot: 'slot-title',
    },
    {
      id: 'followers',
      code: '<strong>128 400 követő</strong>',
      hint: 'A követők száma elvész a szövegben. Emeld ki vastagon és színesen!',
      targetSlot: 'slot-followers',
    },
    {
      id: 'avatar',
      code: 'src="fox-avatar.png"',
      hint: 'Hiányzik a kabalafigura! Add meg a kép forrását, hogy megjelenjen a róka.',
      targetSlot: 'slot-avatar',
    },
    {
      id: 'stream',
      code: 'display: block;',
      hint: 'A videólejátszó kerete el van rejtve. Tedd láthatóvá, hogy elinduljon az élő közvetítés!',
      targetSlot: 'slot-stream',
    },
    {
      id: 'button',
      code: 'border-radius: 999px; box-shadow: 0 8px 24px rgba(255,93,162,.4);',
      hint: 'A "Belépés" most csak sima szöveg. Formázd kerekített, animált gombbá!',
      targetSlot: 'slot-btn',
    },
    {
      id: 'darkmode',
      code: 'background: linear-gradient(160deg, #1b0d2e, #05030a);',
      hint: 'Vakítóan világos a háttér. Húzd be a sötét, neon hangulatú színt!',
      targetSlot: 'slot-bg',
    },
    {
      id: 'align',
      code: 'display: flex; justify-content: center;',
      hint: 'Minden a bal felső sarokba ragadt. Igazítsd középre az egész profilt!',
      targetSlot: 'slot-align',
    },
    {
      id: 'live',
      code: 'animation: pulse 1.4s infinite;',
      hint: 'Az ÉLŐ jelzés nem pulzál — ez mutatja a stabil kapcsolatot. Indítsd el az animációt!',
      targetSlot: 'slot-live',
    },
  ],
};
