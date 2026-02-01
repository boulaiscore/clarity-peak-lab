

# Piano: Breakdown Contributi Cognitive Age

## Contesto

La Cognitive Age e calcolata con questa formula:
```
Cognitive Age = Chrono Age - (Improvement Points / 10) × Multiplier
```

Dove `Improvement Points = score_90d - baseline_score_90d` e `score_90d` e la media delle 5 variabili:

| Variabile | Peso | Descrizione |
|-----------|------|-------------|
| AE | 20% | Focus Stability (Attention Efficiency) |
| RA | 20% | Fast Thinking (Rapid Accuracy) |
| CT | 20% | Reasoning Accuracy (Critical Thinking) |
| IN | 20% | Slow Thinking (Insight) |
| S2 | 20% | Reasoning Quality Composite |

Ogni variabile contribuisce equamente (20%) alla media, ma il suo **impatto relativo** sulla variazione dipende da quanto si e discostata dalla baseline.

## Soluzione: Impact Breakdown + Trend Chart

Creeremo una visualizzazione a due livelli sotto la CognitiveAgeCard:

### 1. Impact Bars (Contributo Relativo)

Barre orizzontali che mostrano il contributo di ogni variabile alla variazione totale:

```text
+-------------------------------------------------+
|  COSA PESA DI PIU                               |
+-------------------------------------------------+
|  CT  ████████████████░░░░  +5.2 pts   ↑ Strong  |
|  AE  ███████████░░░░░░░░░  +3.1 pts   ↑ Moderate|
|  IN  ██████░░░░░░░░░░░░░░  +1.8 pts   → Neutral |
|  RA  ███░░░░░░░░░░░░░░░░░  +0.5 pts   → Neutral |
|  S2  ░░░░░░░░░░░░░░░░░░░░  -1.2 pts   ↓ Weak    |
+-------------------------------------------------+
|  Total: +9.4 pts improvement = -0.94 years      |
+-------------------------------------------------+
```

Logica:
- Per ogni variabile: `contribution = (currentValue - baselineValue) × 0.20`
- Le barre sono ordinate per contributo (dal piu positivo al piu negativo)
- Colori: verde (positivo), grigio (neutro), rosso (negativo)

### 2. Trend Chart (Multi-linea)

Grafico WHOOP-style con 5 linee (una per variabile) + toggle temporale:

```text
+-------------------------------------------------+
|  TREND VARIABILI              [7d|30d|90d]      |
+-------------------------------------------------+
|         ●                                        |
|        / \    ●                                  |
|   ●---●   \  / \                                 |
|            \/   \                                |
|                  ●---●                           |
+-------------------------------------------------+
|  ● AE  ● RA  ● CT  ● IN  ● S2                   |
+-------------------------------------------------+
```

## File da Creare/Modificare

| File | Azione | Descrizione |
|------|--------|-------------|
| `src/components/dashboard/CognitiveAgeImpact.tsx` | Nuovo | Componente con Impact Bars + Trend Chart |
| `src/hooks/useCognitiveAgeImpact.ts` | Nuovo | Hook che calcola i contributi per variabile |
| `src/components/dashboard/CognitiveAgeCard.tsx` | Modifica | Importare e renderizzare il nuovo componente |

## Dettagli Tecnici

### Hook `useCognitiveAgeImpact`

```typescript
interface VariableContribution {
  key: "ae" | "ra" | "ct" | "in" | "s2";
  label: string;
  currentValue: number;
  baselineValue: number;
  delta: number;           // currentValue - baselineValue
  contribution: number;    // delta × 0.20
  percentOfTotal: number;  // % del contributo totale
  status: "positive" | "neutral" | "negative";
}

function useCognitiveAgeImpact() {
  // 1. Fetch baseline da user_cognitive_baselines
  // 2. Fetch media 90d da daily_metric_snapshots (ultimi 90 giorni)
  // 3. Calcola il delta e il contributo per ogni variabile
  // 4. Ordina per contributo decrescente
  // 5. Calcola il totale improvement_points
}
```

### Componente `CognitiveAgeImpact`

Features:
- **Sezione Impact Bars**: Barre orizzontali ordinate per contributo
  - Barra piena proporzionale al contributo assoluto
  - Etichetta con +/- punti e indicatore di stato
- **Sezione Trend Chart**: Grafico multi-linea WHOOP-style
  - Toggle 7d/30d/90d (default: 30d, matching la finestra di riferimento)
  - 5 linee colorate con legenda cliccabile
  - Asse X: date
  - Asse Y: scala dinamica 0-100

### Palette Colori

| Variabile | Colore |
|-----------|--------|
| AE | `hsl(210, 100%, 60%)` - Electric Blue |
| RA | `hsl(280, 70%, 60%)` - Purple |
| CT | `hsl(340, 80%, 60%)` - Rose |
| IN | `hsl(45, 95%, 55%)` - Amber |
| S2 | `hsl(174, 72%, 45%)` - Teal |

### Query Dati

1. **Baseline** (gia disponibile via `useCognitiveAge`):
```sql
SELECT baseline_score_90d FROM user_cognitive_baselines WHERE user_id = :userId
```

2. **Valori Attuali per Variabile** (nuova query):
```sql
SELECT ae, ra, ct, in_score, s2 
FROM daily_metric_snapshots 
WHERE user_id = :userId 
  AND snapshot_date >= :ninetyDaysAgo
ORDER BY snapshot_date DESC
```

3. **Storia per Trend Chart**:
```sql
SELECT snapshot_date, ae, ra, ct, in_score, s2
FROM daily_metric_snapshots
WHERE user_id = :userId
  AND snapshot_date >= :startDate
ORDER BY snapshot_date ASC
```

## Comportamento UI

1. **Loading**: Spinner mentre carica i dati
2. **Dati insufficienti**: Messaggio "Servono piu dati" se meno di 7 giorni
3. **Toggle legenda**: Click su una variabile nella legenda la nasconde/mostra nel grafico
4. **Ordinamento dinamico**: Le barre si riordinano in base ai contributi attuali
5. **Tooltip su hover**: Mostra il valore esatto e la spiegazione del contributo

## Posizionamento

Il nuovo componente sara inserito in `CognitiveAgeCard.tsx` dopo il blocco `BaselineVisual` e prima del countdown "Next update in X days".

