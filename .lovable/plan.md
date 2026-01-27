

# Recovery System v2.0 - Decay Continuo

## Obiettivo
Sostituire la rolling window settimanale con un sistema event-driven + decay esponenziale.

## Schema Database

### Nuove Colonne su `user_cognitive_metrics`
```text
rec_value            NUMERIC DEFAULT 50     -- REC attuale [0-100]
rec_last_ts          TIMESTAMPTZ            -- Ultimo aggiornamento
low_rec_hours_total  NUMERIC DEFAULT 0      -- Ore cumulative con REC < 40
```

### Colonne da Rimuovere (Deprecate)
```text
rec_snapshot_date       -- Non piu necessario
rec_snapshot_value      -- Non piu necessario
low_rec_streak_days     -- Sostituito da low_rec_hours_total
```

## Costanti Centralizzate

File: `src/lib/decayConstants.ts`

```text
// RECOVERY DECAY SYSTEM v2.0
REC_HALF_LIFE_HOURS = 72      // Half-life in ore
REC_GAIN_COEFFICIENT = 0.12  // Gain per minuto di recovery action
REC_FLOOR = 0                 // Minimo REC
REC_CEILING = 100             // Massimo REC
REC_DEFAULT = 50              // Valore iniziale nuovi utenti

// LOW RECOVERY ALERTS
LOW_REC_THRESHOLD = 40        // Soglia per tracking ore basse
LOW_REC_WARNING_HOURS = 48    // Ore per warning
LOW_REC_CRITICAL_HOURS = 72   // Ore per critical
```

## Core Engine Functions

File: `src/lib/cognitiveEngine.ts`

### 1. Decay Calculation
```text
function applyRecoveryDecay(currentRec, lastTs, nowTs):
  deltaHours = (nowTs - lastTs) / (1000 * 60 * 60)
  if deltaHours <= 0: return currentRec
  
  decayedRec = currentRec * 2^(-deltaHours / 72)
  return clamp(decayedRec, 0, 100)
```

### 2. Recovery Action Application
```text
function applyRecoveryAction(currentRec, lastTs, detoxMin, walkMin, nowTs):
  // Step 1: Apply decay first
  decayedRec = applyRecoveryDecay(currentRec, lastTs, nowTs)
  
  // Step 2: Apply gain
  x = detoxMin + 0.5 * walkMin
  newRec = min(100, decayedRec + 0.12 * x)
  
  return { rec: newRec, ts: nowTs }
```

### 3. Low Recovery Hours Tracking
```text
function updateLowRecHours(prevHours, prevTs, currentRec, nowTs):
  deltaHours = (nowTs - prevTs) / (1000 * 60 * 60)
  
  if currentRec < 40:
    return prevHours + deltaHours
  else:
    return 0  // Reset quando REC sale sopra 40
```

## Hooks da Modificare

### 1. `useTodayMetrics.ts` (Major Refactor)

**Prima:**
- Query `detox_completions` e `walking_sessions` per rolling 7-day
- Calcola REC = (detox + 0.5*walk) / 840 * 100

**Dopo:**
- Query `user_cognitive_metrics` per `rec_value`, `rec_last_ts`
- Applica decay su ogni render/mount
- Espone `recovery` come valore decayed

### 2. `useRecoveryEffective.ts` (Minor Update)

**Prima:**
- Usa `weeklyDetoxMinutes` e `weeklyWalkMinutes`

**Dopo:**
- Usa direttamente `rec_value` con decay applicato
- Mantiene RRI fallback per nuovi utenti

### 3. Nuovo Hook: `useApplyRecoveryAction.ts`

```text
Mutation che:
1. Legge rec_value, rec_last_ts da DB
2. Applica decay
3. Applica gain da action
4. Persiste rec_value, rec_last_ts aggiornati
5. Aggiorna low_rec_hours_total
6. Invalida query cache
```

### 4. `useDailyRecoverySnapshot.ts` (Deprecate)

Questo hook diventa obsoleto - la logica di streak giornaliero e sostituita dal tracking continuo delle ore.

## Punti di Integrazione Decay

Il decay deve essere applicato in questi momenti:

1. **App Foreground** - `useEffect` in `App.tsx` con `visibilitychange`
2. **Prima di ogni action** - Nel mutation `useApplyRecoveryAction`
3. **Rendering metriche** - In `useTodayMetrics` per display

## Modifiche ai Componenti

### DetoxChallengeTab.tsx

**Prima:**
```text
getRecoveryImpact(minutes) = (minutes / 840) * 100
```

**Dopo:**
```text
getRecoveryImpact(minutes) = 0.12 * minutes  // Diretto
```

### Home.tsx / Recovery Ring

Nessuna modifica UI - usa `recovery` da `useTodayMetrics` che ora e decay-aware.

## Alert System

### Warning (48+ ore con REC < 40)
- Badge arancione su Recovery ring
- Toast notification

### Critical (72+ ore con REC < 40)
- Badge rosso su Recovery ring
- Push notification (se abilitata)
- SCI decay accelerato

## Migration Strategy

### Fase 1: Database Migration
```text
ALTER TABLE user_cognitive_metrics 
ADD COLUMN rec_value NUMERIC DEFAULT 50,
ADD COLUMN rec_last_ts TIMESTAMPTZ DEFAULT now(),
ADD COLUMN low_rec_hours_total NUMERIC DEFAULT 0;
```

### Fase 2: Data Backfill
Per utenti esistenti, calcolare rec_value iniziale dalla rolling window attuale:
```text
rec_value = min(100, (weekly_detox + 0.5*weekly_walk) / 840 * 100)
rec_last_ts = now()
```

### Fase 3: Code Deployment
Deploy nuovo engine + hooks

### Fase 4: Cleanup (2 settimane dopo)
Rimuovere colonne deprecate e vecchia logica

## Backwards Compatibility

- `useRecoveryEffective` mantiene RRI fallback
- Nuovi utenti iniziano con `rec_value = 50`
- Zero breaking changes su formule downstream (Sharpness, Readiness, TC, SCI)

## Technical Considerations

### Precision
- Usare NUMERIC per `rec_value` (non INTEGER) per precisione decay
- Arrotondare a 1 decimale solo per display

### Timezone
- `rec_last_ts` in UTC
- Decay calculation timezone-agnostic

### Performance
- Decay calculation e O(1) - nessun query aggiuntivo
- Single UPDATE per action (atomic)

## Modifiche ai File

| File | Azione |
|------|--------|
| `src/lib/decayConstants.ts` | Aggiungere costanti REC_* |
| `src/lib/cognitiveEngine.ts` | Aggiungere funzioni decay |
| `src/hooks/useTodayMetrics.ts` | Refactor completo logica REC |
| `src/hooks/useRecoveryEffective.ts` | Update per usare rec_value |
| `src/hooks/useApplyRecoveryAction.ts` | Nuovo hook |
| `src/hooks/useDailyRecoverySnapshot.ts` | Deprecare |
| `src/hooks/useDetoxSession.ts` | Chiamare useApplyRecoveryAction |
| `src/components/app/DetoxChallengeTab.tsx` | Update getRecoveryImpact |

## Summary

Il sistema proposto:
- Trasmette che Recovery e una riserva dinamica
- Decay continuo senza background jobs
- Crescita solo da azioni deliberate (Detox + Walk)
- Nessuna rottura su metriche esistenti
- Implementabile in fasi senza downtime

