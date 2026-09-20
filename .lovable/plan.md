# LOOMA — Da monitor a "oracolo quotidiano"

Obiettivo: trasformare LOOMA da cruscotto di metriche a strumento che risponde ogni giorno a *"oggi come uso la testa?"* — con scoperte personali settimanali e prova di miglioramento nel tempo.

## Fase 1 — Il verdetto quotidiano (cuore della Home)

Estendere `DailyOutlookCard` + `dailyOutlook.ts` da "outlook" a verdetto azionabile:

- **Una riga, un verdetto**: "Giornata da decisioni" / "Giornata da esecuzione" / "Giornata da recupero", derivato da Recovery + Readiness + Decision Quality vs baseline personale (7gg).
- **Il perché in una riga**: "Sonno −1h vs media, errori logici in crescita da 3 giorni".
- **Un'azione concreta**: "Sposta le decisioni critiche dopo le 15:00" / "Oggi ottimo per lavoro analitico profondo" / "Fai solo operativo, decidi domani".
- Posizione: primo elemento della Home, sopra i cerchi (già spostata lì).
- Logica: tabella deterministica di combinazioni (nessun AI call a runtime, costi zero, latenza zero), con fallback onesto quando i dati sono stimati.

## Fase 2 — "Abbiamo notato..." (scoperta settimanale)

Nuovo motore di correlazioni personali sui dati già raccolti:

- Input: `daily_metric_snapshots`, `phone_health_snapshots`, `game_sessions`, wearable snapshots.
- Correlazioni minime al lancio (servono ≥14 giorni di dati):
  - Sonno corto → performance del giorno dopo (errori, tempi di risposta)
  - Giorni con più movimento → Recovery del giorno dopo
  - Trend 7gg: quale metrica sta migliorando/peggiorando e perché
- Output: **una** card settimanale in Home ("La tua settimana: una scoperta"), frase naturale, solo correlazioni con confidenza sufficiente. Se i dati non bastano: nessuna card (mai inventare).
- Implementazione: funzione SQL/edge schedulata settimanalmente + tabella `user_insights` (RLS user-scoped), letta dalla Home.

## Fase 3 — Prova di miglioramento (il motivo per rinnovare)

In Monitor, nuova sezione "Performance Trend":

- Un unico grafico 30/90 giorni: punteggio composito dei check (drills) normalizzato per difficoltà — il "VO2max mentale".
- Overlay eventi: marker su giorni con sonno anomalo o streak di training.
- Headline: "La tua velocità di ragionamento è migliorata del X% in 6 settimane" quando il trend è significativo; silenzio onesto quando non lo è.
- Riutilizza `MetricTrendCharts` e i dati `game_sessions` esistenti.

## Principi trasversali

- **Passivo di default**: tutto funziona dai dati phone/wearable; l'unico gesto attivo resta il check da 2 min.
- **Onestà**: mai numeri inventati — dati insufficienti → messaggio che spiega cosa attivare.
- **Zero costi AI runtime**: logica deterministica; AI solo (opzionale, dopo) per la formulazione delle frasi.

## Ordine di lavoro

1. Fase 1 (verdetto) — nessuna migrazione, solo logica + UI esistente.
2. Fase 2 (scoperte) — 1 tabella + 1 funzione schedulata + card.
3. Fase 3 (trend prova) — solo frontend + query esistenti.
