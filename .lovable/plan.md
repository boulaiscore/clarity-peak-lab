
# Piano: QA premium completo dei giochi (mobile-first)

## Stato attuale (rilevato dal codice)

**11 giochi a codice**, distribuiti su 4 sub-skill:

| System | Skill | Giochi |
|---|---|---|
| S1 Fast | AE | Triage Sprint, Orbit Lock, Focus Switch |
| S1 Fast | RA | Flash Connect, Constellation Snap, Semantic Drift |
| S2 Slow | CT | Causal Ledger, Counterfactual Audit, Socratic Cross-Exam |
| S2 Slow | IN | Signal vs Noise, Hidden Rule Lab, Counterexample Forge |

## Red flag già visibili dal codice (prima ancora di testare)

### 1. Mobile-readiness disomogenea
Solo **2 giochi su 11** hanno codice esplicitamente responsive/touch-aware (`useIsMobile`, `onPointerDown`, `select-none`):
- Orbit Lock (✅ già ottimizzato)
- Constellation Snap (✅ parziale)

I restanti **9 drill** non hanno alcun marker di mobile optimization. Su iPhone significa probabili problemi di: tap area, doppio tap che zooma, layout che esce dal viewport, testo selezionabile durante il drill.

### 2. Pacing incoerente tra giochi
Numero di round totali per sessione varia molto:
- Socratic Cross-Exam: **5 round**
- Counterfactual Audit: **8–12**
- Causal Ledger: **12**
- Semantic Drift: **25–30**
- Constellation Snap: **30**

Per un'app premium con loop quotidiano, durate e cadenze così diverse rompono l'aspettativa dell'utente ("quanto durerà?").

### 3. Exit navigation inconsistente
Alcuni runner tornano a `/neuro-lab`, altri a `/neuro-lab?tab=games`. L'utente atterra in tab diverse a seconda del gioco fatto.

### 4. Sospetta ridondanza (overlap di skill)

| Coppia/triade | Sovrapposizione | Ipotesi |
|---|---|---|
| Flash Connect + Constellation Snap | Entrambi RA "intuitive links" + "pattern closure" | Tenerne uno |
| Causal Ledger + Counterfactual Audit | Entrambi CT su validità causale | Tenerne uno |
| Hidden Rule Lab + Counterexample Forge | Entrambi IN su hypothesis testing/rule inference | Tenerne uno |
| Triage Sprint vs Focus Switch | Entrambi AE su decisione rapida/inhibitory control | Da valutare |

Eliminando la ridondanza si arriva a **8 giochi** (2 per sub-skill) — l'obiettivo che avevamo allineato.

## Procedura di assessment (cosa farò in build mode)

### Fase A — Audit per gioco (mobile 390×844, iPhone-class)
Per ognuno degli 11 giochi:

1. Avvio dal selector → verifica intro screen (coerenza copy, icone, gradient, no flicker).
2. Esecuzione di una sessione completa con browser tools.
3. Check tecnici: viewport non scrolla orizzontalmente, tap target ≥ 44px, no testo selezionabile, no flicker tra round, animazioni 60fps, no overflow su notch.
4. Check semantici: il gameplay è coerente con la sub-skill dichiarata? L'end-screen mostra Cognitive Insight correttamente?
5. Check di linguaggio: tagline + descrizione + skill statement in tono clinico-premium uniforme.

### Fase B — Report sintetico (1 riga per gioco)
Per ogni gioco: ✅ Pass / ⚠️ Issues / ❌ Da rifare. Per ogni Issue: priorità (P0/P1/P2) e fix proposto.

### Fase C — Decisione consolidamento
Confronto a coppie sui giochi sospetti di ridondanza. Per ogni coppia decidiamo insieme:
- quale tenere (più premium / più distintivo)
- quale rimuovere
- target finale: **8 giochi** (2 per sub-skill).

### Fase D — Fix in batch
- Mobile hardening sui 9 drill non-responsive (scope: tap targets, `touch-action: manipulation`, `select-none`, viewport handling).
- Allineamento durate sessione (proposta: 8–12 round S2, 20–30 round S1).
- Standardizzazione exit → tutti a `/neuro-lab?tab=games`.
- Rimozione giochi consolidati + relative rotte e selector entries.

## Output di questa fase di plan
Approvazione su:
1. **Procedo con l'audit live** dei giochi su viewport mobile (Fase A+B) e ti consegno il report.
2. **Decisione preliminare**: target 11 → 8 giochi (rimozione 3 ridondanti)? Sì / No / "Decidiamo dopo l'audit".

Nessuna modifica al codice in questa fase. Tutte le rimozioni e i fix arriveranno in build mode dopo le tue decisioni.
