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
- [x] `DailyOutlookCard.tsx` ridisegnata WHOOP-style (puntino colorato, eyebrow "Today's verdict", label 19px, subline, chevron; niente gradiente viola/avatar)
- [x] Verdetto mostrato come eyebrow nella scheda dettaglio
- [x] Verifica visiva su preview mobile (390px) + build/lint/test:outlook OK

## Fase 2 — "Abbiamo notato…" (scoperta settimanale) ✅ (completata)
- [x] Motore deterministico `src/lib/weeklyInsights.ts`: sonno → Sharpness giorno dopo, movimento → Recovery, regolarità bedtime → Readiness, training → Decision quality, fallback trend 7gg vs 7gg
- [x] Soglie di onestà: ≥14 giorni osservati, ≥4 giorni per gruppo, effetto ≥3 pt; stati `insufficient` / `no-signal`
- [x] `useWeeklyInsight.ts` (query su snapshot + phone health, calcolo client-side: nessuna tabella nuova, nessun costo AI)
- [x] `WeeklyInsightCard.tsx` WHOOP-style in Home (puntino metrica, eyebrow "We noticed", confidence Emerging/Solid + campione)
- [x] `npm run test:insights`

## Fase 3 — Performance Trend ("VO2max mentale") in Monitor
- [ ] Grafico 30/90gg composito dei check (drills) normalizzato per difficoltà
- [ ] Overlay eventi (sonno anomalo, streak training)
- [ ] Headline "La tua velocità di ragionamento è migliorata del X% in 6 settimane"; silenzio onesto se non significativo

## Aperto / in attesa
- Recovery ferma a 50 in preview web: dati passivi assenti (richiede dispositivo nativo con permessi Salute). Possibile seeding dati di test o target reattivo a drills/quality time — da decidere.
