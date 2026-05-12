## Obiettivo della revisione

Audit completo di NeuroLoop / LOOMA rispetto al target dichiarato:
**professionisti 25–50 anni, stressati, iper-utilizzatori di social, recovery mentale insufficiente, percezione di calo del pensiero critico.**

Il piano è diviso in due parti:
1. **Diagnosi** — cosa funziona, cosa è in eccesso, cosa manca (contenuto + estetica).
2. **Interventi proposti** — cambi concreti, ordinati per impatto, da approvare prima di implementare.

---

## 1. Diagnosi

### 1.1 Allineamento valore ↔ persona

Punti di forza già coerenti con il target:
- Tre metriche cardine (Sharpness, Readiness, Reasoning) + Recovery battery → linguaggio "performance" affine al persona executive.
- Detox + blocco social (AppBlocker Android) → risponde direttamente al pain "uso eccessivo dei social".
- Reasoning Quality + S2 games + Tasks (lettura/podcast con override) → risponde al pain "perdita di pensiero critico".
- Wearable (HRV, sonno, RHR) → segnale fisiologico per recovery, credibile per il target.
- Subscription annuale Free / Pro $199 / Elite $299 → posizionamento premium coerente.

Gap di posizionamento:
- La promessa di prodotto non è leggibile in 3 secondi: la Home apre con 3 ring + battery + insight + suggestion + tasks + reading + fast charge → troppi blocchi simultanei per un utente stressato.
- Manca una "north-star claim" visibile (es. "Recover focus. Rebuild critical thinking."). Auth + Splash + Home non raccontano in modo unitario il "perché" al persona.
- Il vocabolario è metà clinico (Reasoning Quality, S1/S2, Cognitive Load), metà coaching, metà gaming (XP, weekly target). Per l'executive stressato manca un livello "outcome" ("oggi sei più reattivo del 12%", "hai recuperato 2h di attenzione").

### 1.2 Densità cognitiva e UX

Sovraccarico evidente:
- **Home**: Date nav + 3 Rings + Recovery Battery + Cognitive Insight + Smart Suggestion (top) + ulteriori suggestion + Tasks in progress + Reading in progress + Fast Charge swipe + 4 tab (Overview/Intuition/Reasoning/Capacity) → contraddice il principio "Executive Calm" già a memoria.
- **NeuroLab**: 3 tab (Training/Tasks/Detox) + Recovery guidance + Weekly Goal + Session picker + Games library + Protocol link → pagina densa e operativa, ma senza una raccomandazione singola dominante.
- **Monitor (Dashboard)**: 3 macro-tab × sub-tab (Trends/Activity con 3 sub-attività × Tasks/Detox/Training) + Overview carousel + Wearable prompt. Ottimo per power-user, opprimente per il target dichiarato.
- **Bottom nav**: 5 voci (Home, Lab, Monitor, Wearable, More). Wearable in bottom nav è eccessivo: è una funzione di setup, non un'area di uso quotidiano.

Friction nel primo uso:
- Onboarding 10 step (Personal/Education/Discipline/Work/3×RRI/Plan/Reminder) + Calibration 2 min → tempo-a-valore alto. Per un executive stressato, > 3 minuti di setup è un rischio churn.

### 1.3 Contenuto e copertura del bisogno

Coperto bene:
- Detox social (urgente nel persona).
- Recovery (Recharging, Neural Reset, Fast Charge).
- Training cognitivo S1/S2 con molti runner.

Coperto debolmente o assente:
- **Stress acuto in giornata**: non c'è un'azione "1-tap" da Home tipo "I'm overwhelmed → 90s reset" sempre raggiungibile.
- **Coaching narrativo settimanale**: c'è un Report ma manca un "weekly executive briefing" sintetico in 3 frasi che spiega dove sta migliorando il persona ("attenzione su, recovery giù, suggerimento questa settimana").
- **Critical thinking applicato al lavoro reale**: i tasks sono lettura/podcast generici. Manca una micro-skill "decision quality" su scenari professionali (es. "valuta questa email/decisione in 60s").
- **Connessione causale visibile** tra azione (es. "ieri 30min social in meno") e metrica (es. "+8% sharpness oggi"). Il dato esiste, ma non è raccontato come catena causale memorabile.
- **Onboarding diagnostico**: dopo i 10 step l'utente non riceve un "verdetto personale" forte ("Il tuo profilo: Reactive Executive, recovery debt 38%"). Manca l'ancora identitaria che giustifica il percorso.

### 1.4 Estetica

Buono:
- Palette scura, tipografia uppercase tracking-wider, cerchio LOOMA → coerenza con WHOOP-like premium executive.
- Uso semantico dei tokens HSL e componenti shadcn riutilizzati.

Debolezze visive:
- Card multiple con stile leggermente diverso (alcune `bg-muted/30 border-border/50`, altre con gradient `from-primary/5 ...`, altre con `bg-card/40`) → manca un sistema di "card tiers" (informativa / azione / alert) chiaro.
- Colori metrica hardcoded (electric blue, indigo, steel blue) bypassano il design system.
- Icone miste lucide-react + custom (Garmin) + Brain/Zap generiche → coerenza più alta con set ridotto e tratto 1.5px come da memoria branding.
- Densità tipografica: tante size (`text-[8px]` → `text-2xl`) con poca gerarchia chiara. Un executive scansiona in 3 livelli (eyebrow / number / context), non in 6.
- Nessun "moment of calm" sensoriale: l'app è informativa ma quasi mai respira (animazioni < 200ms ovunque). Il persona stressato beneficerebbe di transizioni più ampie nei momenti di recovery.

### 1.5 Business / monetizzazione

- Plan taxonomy ora coerente (Free / Pro / Elite annuali). 
- Manca però una **value ladder narrativa** nella paywall: quale outcome misurabile sblocca Pro? Quale Elite? Oggi è una checklist di feature, non una promessa.
- Niente prova sociale (testimonianze executive, dato aggregato "utenti Pro recuperano X% in 30gg").
- "Elite" non ha un tratto distintivo emotivo (1:1 coaching? report umano? accesso early?). Senza un differenziatore percepibile, $299 è un upsell debole rispetto a $199.

---

## 2. Interventi proposti (ordinati per impatto)

Ognuno è un bucket; in build mode lo eseguiremo separatamente.

### A. Riposizionamento e narrativa (alto impatto, basso costo)
1. Definire e applicare una claim unica: es. *"Recover focus. Rebuild thinking."* → su Auth, Splash, Subscription.
2. Introdurre un livello "outcome copy" nelle metriche home (sotto i ring): traduzione umana del numero ("Oggi reagisci più lentamente del 9%").
3. Scrivere il **Weekly Executive Briefing**: 3 frasi generate dai dati, in cima a Monitor.

### B. Riduzione della densità (Executive Calm v3)
1. **Home** ridotta a: data + 3 ring + Recovery battery + **una** azione dominante (Smart Suggestion) + Fast Charge. Spostare Tasks-in-progress e Currently-Reading dentro Lab/Tasks.
2. **Bottom nav** a 4 voci: Home / Lab / Monitor / More. Wearable spostato in More (è setup).
3. **Monitor**: collassare a 2 tab (Trends / Report). "Activity" diventa un drill-down dentro Trends.
4. **NeuroLab**: mantenere 3 tab ma anteporre un blocco "Today's recommended action" che pre-seleziona Train / Tasks / Detox in base a Recovery; nascondere Weekly Goal sotto un disclosure.

### C. Nuovi contenuti chiave
1. **Panic Button "Reset 90s"** sempre visibile in AppShell (bottom nav centrale, stile WHOOP "Recovery"): apre un breath/reset rapido.
2. **Decision Quality micro-drills** (3–5 nuovi esercizi S2 a scenario professionale: email, prioritization, bias detection).
3. **Causal storytelling**: dopo ogni metrica, una riga "perché": "+8% Sharpness ← 38min meno social ieri".
4. **Onboarding verdict**: alla fine dei 10 step + calibration, schermata "Your Profile: Reactive Executive — Recovery debt 38%, Critical thinking 62%" con CTA "Start your 30-day recovery".

### D. Snellimento onboarding
1. Comprimere i 10 step in **5 step percepiti** (Personal+Work uniti, Education+Discipline opzionali post-onboarding, RRI in 1 schermata multi-domanda).
2. Rendere Calibration "pay-after": permettere accesso a Home demo prima di completare la calibrazione, con un nudge persistente.

### E. Sistema visivo (refresh, non redesign)
1. Definire 3 livelli di card (info / action / alert) con classi semantiche dedicate in `index.css`.
2. Sostituire i 3 colori metrica hardcoded con token semantici (`--metric-sharpness`, `--metric-readiness`, `--metric-reasoning`).
3. Audit icone: ridurre il set, omogeneizzare a stroke 1.5px.
4. Introdurre un'animazione "respiro" (4s ease-in-out) sui moduli di recovery per dare un momento sensoriale calmante.

### F. Pricing & paywall
1. Riscrivere la pagina Subscription con focus outcome:
   - Free → "See your state"
   - Pro → "Train and recover" 
   - Elite → "Coached recovery + monthly human report"
2. Aggiungere prova sociale aggregata e una garanzia "30-day recovery promise".
3. Rendere Elite distintivo (anche solo: report mensile commentato, early access a nuovi drill, sessione 1:1 trimestrale).

---

## 3. Cosa NON faremo (per disciplina)

- Nessuna nuova integrazione wearable oltre l'esistente.
- Nessun cambio del modello dati metriche o del cognitive engine.
- Nessuna riattivazione di billing reale (resta placeholder come da memoria).
- Nessuna rimozione di feature di power-user (Admin, Detox, Recharging) — solo riorganizzazione gerarchica.

---

## 4. Modalità di esecuzione proposta

Procediamo a ondate, una alla volta, ognuna con preview prima di passare alla successiva:
- Ondata 1: A + B (riposizionamento + densità ridotta) → impatto immediato sul percepito.
- Ondata 2: D + E (onboarding + sistema visivo).
- Ondata 3: C (nuovi contenuti: Panic Reset, Decision Quality, Causal storytelling, Onboarding verdict).
- Ondata 4: F (paywall outcome-driven).

Per ognuna apriremo design directions dove la scelta visiva non è univoca (es. Home v3, Onboarding verdict, Panic Reset).
