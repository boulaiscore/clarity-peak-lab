

# Piano: Asse X Temporale Proporzionale per Grafici Intraday

## Obiettivo
Modificare i grafici intraday (1d) in modo che:
1. **Etichette fisse** sull'asse X: 00:00, 06:00, 12:00, 18:00 + orario corrente
2. **Pallini posizionati al timestamp reale**: se un evento è alle 11:03, il pallino appare esattamente a quella posizione sulla timeline

## Problema Attuale
Il grafico usa una scala **categorica** dove ogni data point crea automaticamente un'etichetta e i pallini si allineano a queste etichette. Questo causa:
- Tutti i grafici mostrano gli stessi orari (11:30, 13:00, ecc.)
- I pallini non riflettono il momento esatto dell'evento

## Soluzione Tecnica
Convertire l'XAxis da scala categorica a scala **numerica/temporale**:

```text
ATTUALE (categorico):
┌────────────────────────────────────────┐
│  Punto1    Punto2    Punto3    Punto4  │
│    ●         ●         ●         ●     │
│  10:30    12:00     15:00     17:00    │ ← Etichette generate dai dati
└────────────────────────────────────────┘

NUOVO (temporale):
┌────────────────────────────────────────┐
│       ●        ●            ●      ●   │ ← Pallini a posizioni proporzionali
│    (10:47)  (11:58)      (15:22) (17:03)│ ← Orari reali
│  00:00    06:00    12:00    18:00  Now │ ← Etichette fisse
└────────────────────────────────────────┘
```

## Modifiche al Codice

### 1. Aggiungere campo timestamp numerico ai dati (`MetricTrendCharts.tsx`)

Aggiungere `timeValue` (timestamp Unix in millisecondi) a ogni punto dati intraday per il posizionamento proporzionale.

### 2. Configurare XAxis come scala numerica

```typescript
<XAxis
  type="number"
  dataKey="timeValue"              // Usa timestamp numerico
  scale="time"                     // Scala temporale
  domain={[midnightTimestamp, nowTimestamp]}  // Da mezzanotte a ora corrente
  ticks={[00:00, 06:00, 12:00, 18:00, Now]}   // Etichette fisse
  tickFormatter={(ts) => format(ts, "HH:mm")} // Formatta come orario
/>
```

### 3. Aggiornare il componente IntradayXAxisTick

Modificare per ricevere un timestamp numerico invece di una stringa, e formattare l'orario dinamicamente. Evidenziare l'ultimo tick ("Now") con stile diverso.

### 4. Calcolare i tick fissi

```typescript
const todayStart = startOfDay(new Date()).getTime();
const nowTs = Date.now();

const fixedTicks = [
  todayStart,                        // 00:00
  todayStart + 6 * 60 * 60 * 1000,   // 06:00
  todayStart + 12 * 60 * 60 * 1000,  // 12:00
  todayStart + 18 * 60 * 60 * 1000,  // 18:00
  nowTs                               // Ora corrente
].filter(t => t <= nowTs);            // Mostra solo tick passati
```

### 5. Aggiornare intradayChartData

Aggiungere il campo `timeValue` calcolato da `new Date(point.timestamp).getTime()`.

## File da Modificare
- `src/components/dashboard/MetricTrendCharts.tsx`

## Risultato Atteso
- Sull'asse X: etichette fisse (00:00, 06:00, 12:00, 18:00, Now)
- Pallini posizionati esattamente all'orario in cui è avvenuto l'evento
- Se RQ è cambiata alle 17:03, il pallino sarà leggermente a sinistra di "18:00"

