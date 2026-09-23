# Roadmap — Daily Oracle (valore quotidiano stile WHOOP)

## Principi vincolanti
- Passivo di default, attivo opzionale (check di 2 minuti)
- Zero costi AI a runtime (tabelle deterministiche / query esistenti)
- Onestà: mai numeri inventati; segnalare dati insufficienti
- UI WHOOP-like "Executive Calm" (sobria, tipografica, accenti metrica)

## Layout Home
- [x] Today's verdict posizionato sotto Cognitive Recovery

## Fase 1 — Verdetto quotidiano ✅ (completata)
- [x] Tipo `DailyVerdict` + verdetto su tutti i rami in `src/lib/dailyOutlook.ts`
- [x] `DailyOutlookCard.tsx` ridisegnata WHOOP-style (puntino colorato, gerarchia tipografica compatta, subline, chevron; niente gradiente viola/avatar)
- [x] Verdetto mostrato come eyebrow nella scheda dettaglio
- [x] Verifica visiva su preview mobile (390px) + build/lint/test:outlook OK

## Fase 2 — "Abbiamo notato…" (scoperta settimanale) ✅ (completata)
- [x] Motore deterministico `src/lib/weeklyInsights.ts`: sonno → Sharpness giorno dopo, movimento → Recovery, regolarità bedtime → Readiness, fallback trend 7gg vs 7gg
- [x] Soglie di onestà: ≥21 giorni osservati, ≥6 giorni per gruppo, effetto ≥4 pt, direzione stabile nelle due metà; stati `insufficient` / `no-signal`
- [x] `useWeeklyInsight.ts` (query su snapshot + phone health, calcolo client-side: nessuna tabella nuova, nessun costo AI)
- [x] `WeeklyInsightCard.tsx` WHOOP-style in Home (puntino metrica, eyebrow "We noticed", confidence Emerging/Solid + campione)
- [x] `npm run test:insights`

## Fase 3 — Performance Trend ("VO2max mentale") in Monitor ✅ (completata)
- [x] Grafico 30/90gg composito dei check (drills) normalizzato per difficoltà
- [x] Overlay eventi (sonno anomalo, streak training)
- [x] Headline di miglioramento percentuale solo con ≥6 check su ≥4 giorni e variazione ≥3%; stato onesto negli altri casi
- [x] `npm run test:performance`

## Aperto / in attesa
- Recovery ferma a 50 in preview web: dati passivi assenti (richiede dispositivo nativo con permessi Salute). Possibile seeding dati di test o target reattivo a drills/quality time — da decidere.

## Investor deck v3
- [x] Replace every product visual with current, authenticated mobile screenshots
- [x] Include LOOMA Coach as a core product surface
- [x] Reframe the problem around modern cognitive load, interruptions, social feeds, and careful evidence on AI offloading
- [x] Rebuild the competitor set around mental fitness, brain training, cognitive readiness, and professional performance
- [x] Re-audit all slides for overlap, alignment, readability, and download compatibility

## Investor deck v4
- [x] Use the official LOOMA open-loop logo rather than a recreated approximation
- [x] Explain the Kahneman-style System 1 / System 2 framework without presenting it as literal neuroscience
- [x] Show how LOOMA's proprietary, versioned algorithms turn cognitive checks and passive context into explainable metrics
- [x] Validate, render and visually inspect every slide before delivery

## Audit Home state — typography and formula integrity
- [x] Align the “My day” typography and visual hierarchy with the rest of Home
- [x] Make Today's Verdict depend only on canonical, sufficiently mature inputs
- [x] Harden We Noticed against duplicate dates, formula drift, confounding, and weak samples
- [x] Expand regression tests and verify the mobile preview

## Test interno Android (21 set)
- [x] Login con Google aggiunto
- [x] Chiave RevenueCat inserita (Test Store `test_…` per il test interno; servono prodotti/entitlements configurati su RevenueCat e la chiave `goog_` di produzione prima del rilascio pubblico)
- [x] Coach usa direttamente il token della sessione Android già verificata; rinnova solo dopo un rifiuto del server
- [x] Correggere la persistenza Android: sessione salvata senza doppia codifica e migrazione automatica dei login esistenti
- [ ] Confermare persistenza login e LOOMA Coach sul dispositivo con bundle 1.0.29 (codice 30)
- [ ] Verificare consegna email di conferma

## Lab drill gating clarity
- [x] Make the selected System card unmistakable
- [x] Explain metric entry levels as LOOMA quality-control rules
- [x] Move the Sharpness action directly below the score
