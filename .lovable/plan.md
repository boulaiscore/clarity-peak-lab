# Correzioni coerenza metriche (dall'audit)

Principio guida: ogni numero mostrato deve essere reale o dichiarato come stimato, e la stessa regola deve dare lo stesso risultato ovunque (oggi, storico, grafici, Coach).

## 1. Variabilità cardiaca (HRV) — iPhone vs Android
Problema: iPhone misura SDNN, Android RMSSD; oggi stessa scala 20–120 ms.
Soluzione (coerente con "LOOMA confronta te con te stesso", come le soglie personali):
- Salvare insieme al valore il tipo di misura (SDNN / RMSSD).
- Con almeno 7 giorni di dati: punteggio HRV rispetto alla propria media degli ultimi 30 giorni dello stesso tipo. Formula: 50 + 50 × clamp(ln(oggi/mediana) / 0,25, −1, 1). Pari alla tua norma = 50, +28% = 100, −22% = 0.
- Prima dei 7 giorni: scale separate per tipo (SDNN 20–100 ms, RMSSD 15–90 ms) con affidabilità ridotta del 50%, così il peso passa ad altri segnali.
- Se l'utente cambia telefono/tipo, la base personale riparte da zero per quel tipo.
- Peso nel target Recovery invariato (40%).

## 2. Recovery: oggi e storico devono coincidere
Problema: dopo giorni mancanti, il valore live usa il target di oggi per tutti i giorni; il grafico usa il target di ciascun giorno.
Soluzione: un unico calcolo "giorno per giorno" condiviso: ogni giorno saltato si avvicina al target di quel giorno (se esiste un dato salute/wearable), altrimenti al target neutro 50. Live e grafico usano la stessa funzione. I giorni ricostruiti appaiono nel grafico come tratto tratteggiato "stimato".

## 3. Età cognitiva: testo coerente col calcolo
Il calcolo su 180 giorni è giusto (l'età cognitiva deve muoversi lentamente, non per una settimana storta). Cambia solo la descrizione: "Stima a lungo termine basata sulle tue prestazioni degli ultimi 6 mesi".

## 4. Grafico di oggi senza punti inventati
Per un utente nuovo la linea parte dal primo dato reale della giornata; prima resta vuota. Nessun punto finto a mezzanotte.

## 5. Confronto settimana su settimana
Usare veri ultimi 7 giorni vs 7 precedenti di calendario. Servono almeno 4 giorni con dati in ciascuna settimana, altrimenti il confronto non viene mostrato ("dati insufficienti questa settimana").

## 6. Soglie personali dei drill
Conteggio separato per metrica: la soglia di Sharpness si personalizza dopo 5 giorni di Sharpness, quella di Readiness dopo 5 giorni di Readiness. Le altre regole restano invariate (mai sopra lo standard, Recovery mai personalizzata).

## 7. Correzioni minori
- Testi del blocco Sistema 2: mostrare la soglia reale dell'utente invece del fisso "60".
- Minuti di recupero negativi o non validi ignorati; Recovery sempre tra 0 e 100.
- Rimuovere le vecchie costanti di decadimento a 72 ore non più usate.
- Verifica Fast Recover: aggiunta prova che il valore non scende mai (90 resta 90).

## 8. Verifica drill fallita
Controllare il passaggio del primo accesso segnalato: se è solo un controllo obsoleto lo aggiorno; se l'ordine è davvero sbagliato lo correggo.

## Dettagli tecnici
- HRV: nuova colonna `hrv_metric` ('sdnn'|'rmssd') nei dati wearable canonici, valorizzata dai plugin; funzione `scoreHrv(value, type, history)` in cognitiveEngine usata da computeWearablePhysiology.
- Recovery: estrarre `advanceRecoveryByDays(rec, datedTargets[])` in recoveryV2, usata da computeLiveRecovery e da useMetricHistory; flag `projected` sui punti.
- adaptiveThresholds: `sampleDaysByMetric`, `isActive` per metrica.
- weeklyInsights: finestre per data, `MIN_DAYS_PER_WEEK = 4`.
- useIntradayMetricHistory: rimuovere il fallback sintetico a mezzanotte.
- recoveryV2 applyRecoveryAction: validazione input + clamp 0–100.
- Nuovi test in scripts/metric-formula-tests.ts per HRV, Recovery giorno-per-giorno, Fast Recover, soglie per metrica, finestre settimanali.
