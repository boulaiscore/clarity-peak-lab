
# Fix Layout Grafico Trend WHOOP-Style

## Problema
1. La linea piu bassa del grafico coincide attualmente con yMin (valore minimo)
2. Le date (asse X) sono renderizzate sulla seconda linea invece che sulla prima (baseline)
3. Il pallino del valore minimo non poggia correttamente sulla prima linea dati

## Struttura Corretta (dal basso verso l'alto)
```text
Linea 4 (top)     ─────────────────────  (yMax o spazio sopra massimo)
Linea 3           ─────────────────────  (valore intermedio)
Linea 2           ────────O────────O──  (yMin = valore minimo, pallini qui)
Linea 1 (base)    ─────────────────────  (baseline per date: Sat 24, Sun 25...)
```

## Soluzione Tecnica

### 1. Aggiungere una linea baseline separata
La griglia deve avere 4 linee orizzontali, ma il dominio Y deve iniziare SOTTO il valore minimo per creare spazio per la baseline delle date.

Nuovo calcolo:
- `yBaseline` = valore fittizio sotto yMin (es. yMin - baselineGap)
- `yMin` = dataMin (valore minimo reale)
- `yMax` = dataMax + padding
- 4 linee: [yBaseline, yMin, yMid, yMax]

### 2. Modificare il dominio YAxis
```tsx
const baselineGap = (yMax - dataMin) * 0.25; // Gap per baseline
const yBaseline = dataMin - baselineGap;

// Domain ora include baseline
domain={[yBaseline, yMax]}

// 4 linee equidistanti
const yTicks = [yBaseline, dataMin, (dataMin + dataMax) / 2, yMax];
```

### 3. Spostare l'asse X alla baseline
Configurare XAxis con posizione esplicita per allinearsi alla prima linea (yBaseline).

### Modifiche File

**File: `src/components/dashboard/MetricTrendCharts.tsx`**

**Linee 143-166** - Ricalcolo dominio Y con baseline:
```tsx
// Calculate min/max for dynamic Y axis
const values = data.filter(d => d.value !== null).map(d => d.value as number);
const dataMin = values.length > 0 ? Math.min(...values) : 50;
const dataMax = values.length > 0 ? Math.max(...values) : 50;

// Create 4 horizontal bands:
// Line 1 (bottom): baseline for dates
// Line 2: minimum value (data points rest here)
// Line 3: middle
// Line 4 (top): maximum + padding

let yDataMin: number;
let yDataMax: number;

if (dataMin === dataMax) {
  yDataMin = dataMin;
  yDataMax = dataMin + 20;
} else {
  yDataMin = dataMin;
  const range = dataMax - dataMin;
  yDataMax = dataMax + range * 0.15;
}

// Baseline is below yDataMin to create space for date labels
const bandHeight = (yDataMax - yDataMin) / 2; // 3 data bands above baseline
const yBaseline = yDataMin - bandHeight;

// 4 equidistant lines: baseline, min, mid, max
const yTicks = [
  yBaseline,                           // Line 1: baseline for dates
  yDataMin,                            // Line 2: minimum value
  yDataMin + bandHeight,               // Line 3: middle
  yDataMax,                            // Line 4: top
];

const yMin = yBaseline;
const yMax = yDataMax;
```

**Linee 193-216** - Aggiornare margin bottom e CartesianGrid:
```tsx
<LineChart data={chartData} margin={{ top: 32, right: 20, left: 20, bottom: 8 }}>
  <CartesianGrid 
    horizontal={true}
    vertical={false}
    stroke={GRID_COLOR}
    strokeWidth={1}
    horizontalCoordinatesGenerator={({ height, offset }) => {
      const chartHeight = height;
      const scale = chartHeight / (yMax - yMin);
      return yTicks.map(tick => {
        const yPixel = offset.top + (yMax - tick) * scale;
        return yPixel;
      });
    }}
  />
  <XAxis
    dataKey="xLabel"
    axisLine={false}
    tickLine={false}
    tick={<CustomXAxisTick />}
    interval={0}
    orientation="bottom"
  />
  <YAxis
    domain={[yMin, yMax]}
    ticks={yTicks}
    hide
  />
```

**Linee 52-97** - Aggiornare CustomXAxisTick per allinearsi alla baseline:
Il tick dell'asse X deve posizionarsi correttamente sulla prima linea orizzontale (baseline). Aggiustare le coordinate Y del rect highlight e del testo.

## Risultato Atteso
- 4 linee orizzontali equidistanti
- Linea 1 (piu bassa): solo date (Sat 24, Sun 25, ecc.)
- Linea 2: valore minimo - i pallini con valore 34 poggiano QUI
- Linea 3: valore intermedio
- Linea 4: valore massimo o spazio sopra
- Le date sono sulla baseline, non sovrapposte ai dati
