
# Piano: Grafici Trend Intraday (Oggi)

## Obiettivo
Aggiungere una vista intraday nella sezione Analytics → Trends che mostra le variazioni orarie delle metriche cognitive per la giornata corrente, con lo stesso stile visivo WHOOP dei grafici settimanali esistenti.

---

## Analisi dello Stato Attuale

### Dati Disponibili
Attualmente il sistema non dispone di snapshot orari. I dati intraday devono essere **ricostruiti** a partire dagli eventi esistenti:

| Fonte Dati | Tabella | Timestamp | Metriche Impattate |
|------------|---------|-----------|-------------------|
| Game sessions | `game_sessions` | `completed_at` | Sharpness (via S1/S2) |
| Detox sessions | `detox_sessions` | `end_time` | Recovery |
| Walking sessions | `walking_sessions` | `completed_at` | Recovery |
| Recovery decay | `user_cognitive_metrics.rec_last_ts` | Continuo | Recovery (decadimento) |

### Sfida Tecnica
Il modello Recovery v2.0 è **event-driven con decadimento continuo**: il valore cambia costantemente nel tempo (formula: `REC × 2^(-Δt_hours / 72)`). Questo significa che possiamo calcolare il valore di Recovery a qualsiasi timestamp storico applicando il modello di decay/gain.

---

## Proposta di Posizionamento UI

**Opzione consigliata: Toggle Week/Today sopra i grafici**

```text
┌─────────────────────────────────────────┐
│  [●  Week  ] [  Today  ]     ← Toggle   │
├─────────────────────────────────────────┤
│                                         │
│  SHARPNESS                              │
│  ─────────────────────────────          │
│  (grafico con X = ore/giorni)           │
│                                         │
│  READINESS                              │
│  ─────────────────────────────          │
│  ...                                    │
└─────────────────────────────────────────┘
```

Il toggle permette di passare tra:
- **Week**: Vista settimanale esistente (7 giorni)
- **Today**: Vista intraday (ore della giornata)

---

## Specifica Asse X (Intraday)

- **Prima ora**: 00:00 (mezzanotte)
- **Ultima ora**: Ora corrente
- **Punti mostrati**: Solo le ore in cui c'è stata una variazione (evento)
- **Fallback**: Se nessun evento oggi, mostrare solo il valore corrente con label dell'ora attuale

Esempio visivo:
```text
00:00    09:15    14:30    (ora corrente)
  │        │        │           │
  ●────────●────────●───────────●
  45%     47%      52%        48%
```

---

## Implementazione Tecnica

### 1. Nuovo Hook: `useIntradayMetricHistory`
Calcola i valori delle metriche a ogni ora con variazione:

```typescript
interface IntradayDataPoint {
  timestamp: string;      // ISO timestamp
  hour: string;           // "09:15" format
  readiness: number | null;
  sharpness: number | null;
  recovery: number | null;
  reasoningQuality: number | null;
  isNow: boolean;         // Flag per highlight ora corrente
}
```

**Strategia di ricostruzione**:
1. Query degli eventi di oggi (game_sessions, detox_sessions, walking_sessions)
2. Per ogni evento, calcolare il valore delle metriche al momento dell'evento
3. Aggiungere un punto "now" con i valori correnti
4. Recovery: applicare il modello di decay tra eventi consecutivi

### 2. Nuovo Componente: `IntradayMetricCharts`
Riutilizza la struttura di `MetricTrendCharts` con adattamenti:
- `CustomXAxisTick` mostra ore invece di giorni
- Highlight sull'ultimo punto (ora corrente) con banda traslucida
- Stessa palette colori, stessi dot, stessi gradient

### 3. Modifica: `MetricTrendCharts`
Aggiungere toggle per switch Week/Today:
- State locale per `viewMode: 'week' | 'today'`
- Render condizionale dei dati

---

## Flusso Dati

```text
┌─────────────────────────────────────────────────────────────────┐
│                        useIntradayMetricHistory                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Fetch game_sessions (oggi)                                   │
│     └─> timestamp + score → calcola Sharpness al momento        │
│                                                                  │
│  2. Fetch detox_sessions + walking_sessions (oggi)               │
│     └─> timestamp + durata → calcola Recovery al momento        │
│                                                                  │
│  3. Calcola Recovery decay tra eventi                            │
│     └─> Applica formula esponenziale per timestamp intermedi    │
│                                                                  │
│  4. Aggiungi punto "now" con valori correnti                    │
│     └─> useTodayMetrics().sharpness, .readiness, .recovery      │
│                                                                  │
│  5. Ordina per timestamp e restituisci array                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## File da Creare/Modificare

| File | Azione | Descrizione |
|------|--------|-------------|
| `src/hooks/useIntradayMetricHistory.ts` | **Nuovo** | Hook per fetch e calcolo dati intraday |
| `src/components/dashboard/MetricTrendCharts.tsx` | Modifica | Aggiungere toggle Week/Today e logica condizionale |
| `src/components/dashboard/IntradayXAxisTick.tsx` | **Nuovo** (opzionale) | Custom tick per asse X orario |

---

## Considerazioni Speciali

1. **Recovery "phantom decay"**: Tra un evento e l'altro, Recovery decade continuamente. Per mostrare questo:
   - Opzione A: Mostrare solo punti agli eventi (linea congiunge)
   - Opzione B: Aggiungere punti interpolati ogni ora (più complesso)
   - **Consiglio**: Opzione A per semplicità iniziale

2. **Giorni senza eventi**: Se oggi non ci sono ancora eventi, mostrare solo il punto "now" o un messaggio "No activity yet today"

3. **Sharpness/Readiness**: Queste metriche derivano da S1/S2/AE che cambiano solo con XP (games). Se nessun game oggi, il valore è costante → mostrare linea piatta con un solo punto.

---

## Stima Complessità
- **Bassa-Media**: Riutilizzo estensivo del componente chart esistente
- **Rischio**: Ricostruzione accurata dei valori storici intraday (specialmente Recovery con decay)

