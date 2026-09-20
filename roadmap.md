# Roadmap — Daily Oracle (valore quotidiano stile WHOOP)

## Principi vincolanti
- Passivo di default, attivo opzionale (check di 2 minuti)
- Zero costi AI a runtime (tabelle deterministiche / query esistenti)
- Onestà: mai numeri inventati; segnalare dati insufficienti
- UI WHOOP-like "Executive Calm" (sobria, tipografica, accenti metrica)

## Fase 1 — Verdetto quotidiano ✅ (completata)
- [x] Tipo `DailyVerdict` + verdetto su tutti i rami in `src/lib/dailyOutlook.ts`
- [x] `DailyOutlookCard.tsx` ridisegnata WHOOP-style (puntino colorato, eyebrow "Today's verdict", label 19px, subline, chevron; niente gradiente viola/avatar)
- [x] Verdetto mostrato come eyebrow nella scheda dettaglio
- [x] Verifica visiva su preview mobile (390px) + build/lint/test:outlook OK

## Fase 2 — "Abbiamo notato…" (scoperta settimanale)
- [ ] Tabella `user_insights` (RLS user-scoped, GRANT, service_role)
- [ ] Motore correlazioni personali: sonno corto → performance giorno dopo; movimento → Recovery; trend 7gg per metrica con perché
- [ ] Edge function schedulata settimanalmente; serve ≥14 giorni di dati, mai inventare
- [ ] UI: card discreta in Home/Monitor, stile insight WHOOP

## Fase 3 — Performance Trend ("VO2max mentale") in Monitor
- [ ] Grafico 30/90gg composito dei check (drills) normalizzato per difficoltà
- [ ] Overlay eventi (sonno anomalo, streak training)
- [ ] Headline "La tua velocità di ragionamento è migliorata del X% in 6 settimane"; silenzio onesto se non significativo

## Aperto / in attesa
- Recovery ferma a 50 in preview web: dati passivi assenti (richiede dispositivo nativo con permessi Salute). Possibile seeding dati di test o target reattivo a drills/quality time — da decidere.
