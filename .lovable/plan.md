
# Fix Grid Lines per Chart Trends WHOOP-Style

## Problema Identificato
1. `CartesianGrid` non utilizza `horizontalPoints` o `horizontalCoordinatesGenerator` per allineare le linee ai tick Y
2. Quando i valori sono tutti uguali (es. 34, 34), il range diventa 0 e i calcoli falliscono
3. Le linee orizzontali non sono visibili perche il CartesianGrid di recharts non rispetta automaticamente i ticks dell'asse Y nascosto

## Soluzione

### 1. Correggere il calcolo del range Y
Quando tutti i valori sono uguali, creare un range artificiale centrato sul valore:
- Se `range === 0`: usare `dataMin - 10` come minimo e `dataMin + 30` come massimo
- Questo garantisce che ci sia sempre spazio per 4 bande visibili
- Il valore minimo deve posare sulla prima linea (la piu bassa)

### 2. Usare horizontalCoordinatesGenerator nel CartesianGrid
Recharts richiede coordinate Y esplicite per disegnare le linee orizzontali ai punti corretti:
```tsx
<CartesianGrid 
  horizontal={true}
  vertical={false}
  stroke={GRID_COLOR}
  horizontalCoordinatesGenerator={(props) => {
    // Calcola le Y pixel per ogni tick
    const { height, offset } = props;
    const yScale = height / (yMax - yMin);
    return yTicks.map(tick => offset.top + (yMax - tick) * yScale);
  }}
/>
```

### 3. Assicurare che il minimo sia sulla prima linea
- `yMin` deve essere esattamente uguale al `dataMin` (senza padding negativo)
- Le 4 bande vanno calcolate dal minimo verso l'alto
- Formula: `yMin = dataMin`, poi distribuire le 4 fasce sopra

### Modifiche Tecniche

**File: `src/components/dashboard/MetricTrendCharts.tsx`**

Linee 143-154 - Ricalcolare yMin/yMax:
```tsx
// Calculate min/max for dynamic Y axis with 4 bands
const values = data.filter(d => d.value !== null).map(d => d.value as number);
const dataMin = values.length > 0 ? Math.min(...values) : 50;
const dataMax = values.length > 0 ? Math.max(...values) : 50;

// Handle case when all values are the same
let yMin: number;
let yMax: number;

if (dataMin === dataMax) {
  // Create artificial range when values are identical
  yMin = Math.max(0, dataMin - 5);
  yMax = Math.min(100, dataMin + 15);
} else {
  // Normal case: min sits on bottom line, add space above max
  yMin = dataMin;
  const range = dataMax - dataMin;
  yMax = Math.min(100, dataMax + range * 0.2);
}

// Generate 4 equidistant horizontal lines (yMin = first line at bottom)
const tickStep = (yMax - yMin) / 3; // 4 lines = 3 gaps
const yTicks = [yMin, yMin + tickStep, yMin + tickStep * 2, yMax];
```

Linee 190-195 - Implementare horizontalCoordinatesGenerator:
```tsx
<CartesianGrid 
  horizontal={true}
  vertical={false}
  stroke={GRID_COLOR}
  strokeWidth={1}
  horizontalCoordinatesGenerator={({ height, offset }) => {
    // Map yTicks to pixel coordinates
    const chartHeight = height;
    const scale = chartHeight / (yMax - yMin);
    return yTicks.map(tick => {
      const yPixel = offset.top + (yMax - tick) * scale;
      return yPixel;
    });
  }}
/>
```

### Risultato Atteso
- 4 linee orizzontali equidistanti sempre visibili
- La prima linea (in basso) corrisponde esattamente al valore minimo della settimana
- Le linee si adattano dinamicamente ai dati
- Funziona anche quando tutti i valori sono identici
