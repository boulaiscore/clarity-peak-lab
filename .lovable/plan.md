## Obiettivo

Le immagini attuali `s1-bg.jpg` e `s2-bg.jpg` (usate nelle card System 1 / System 2 del tab Train → Games Library) sono belle ma generiche: non comunicano il concetto cognitivo. In Monitor → **Dual-Process Integration** mostriamo invece due emisferi cerebrali con una rete neurale che pulsa, in **ambra (System 1)** e **viola (System 2)**.

Allineiamo i due mondi: nuove immagini AI per S1/S2 che richiamino l'estetica del Dual-Process Integration, in versione più rifinita ed editoriale ("Executive Calm").

## Cosa cambia

Solo presentazione: due asset sostituiti, nessuna logica toccata.

- `src/assets/s1-bg.jpg` → emisfero **sinistro** stilizzato, glow **ambra/oro** (#f59e0b → #fbbf24), reti neurali sottili che pulsano
- `src/assets/s2-bg.jpg` → emisfero **destro** stilizzato, glow **viola** (#8b5cf6 → #a78bfa), reti neurali più strutturate/geometriche
- Sfondo scuro (coerente con il tema), composizione minimal, profondità data dal glow non da texture
- Stesso "linguaggio visivo" del componente `FastSlowBrainMap`: emisferi separati, nodi luminosi, connessioni filiformi

`GamesLibrary.tsx` continua a importare gli stessi path — nessuna modifica al codice.

## Direzione artistica (prompt-level)

**S1 — Intuition / Fast**
> Stylized left brain hemisphere, abstract neural network of glowing amber and warm gold nodes connected by thin luminous filaments, soft bokeh, deep charcoal background, cinematic, premium editorial, minimal, high-end medical-tech aesthetic, asymmetric composition with the hemisphere off-center right, subtle particle drift, no text, no UI.

**S2 — Reasoning / Slow**
> Stylized right brain hemisphere, structured neural lattice of glowing violet and lavender nodes with geometric crystalline connections, deeper saturation, deep charcoal background, cinematic, premium editorial, minimal, high-end medical-tech aesthetic, asymmetric composition with the hemisphere off-center left, slow precise rhythm, no text, no UI.

Entrambe in formato landscape adatto a banner di card (tipicamente 1536×640 o simile).

## Verifica

1. Generate le due immagini (modello premium per cura del dettaglio).
2. Apertura preview e screenshot di `GamesLibrary` → verifica leggibilità del testo sopra (le immagini hanno già un overlay scuro nel componente, ma controllo che il contrasto regga).
3. Verifica side-by-side con il blocco "Dual-Process Integration" su `/dashboard` per coerenza cromatica.

## Note tecniche

- Sostituzione file in-place: nessun rename, nessun cambio di import.
- Le card già applicano un gradient overlay scuro su `bgImage`, quindi le immagini possono essere relativamente luminose senza compromettere la leggibilità.
- Niente impatto su bundle (stesso filename).
