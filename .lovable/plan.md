
# Acute Recovery Boost — Fast Recover come emergency button

## Concetto
Fast Recover diventa un **pulsante d'emergenza** che applica un boost **transitorio** al Recovery, fisiologicamente coerente con la natura dell'intervento (slow breathing → vagal tone → state change, non trait change).

Il boost **non altera REC_raw**, **non scrive su `recovery_snapshots`**, **non sporca i trend storici**. Vive come layer additivo con decadimento esponenziale.

## Parametri (confermati)

| Parametro | Valore |
|---|---|
| Magnitudo max | +3 / +8 punti REC |
| Calcolo | `boost = clamp(durata_min × 0.8 × delta_percepito_norm, 3, 8)` |
| Half-life | 30 minuti |
| Durata totale (decay → 0) | ~90 minuti |
| Cap assoluto | REC_effettivo ≤ 85 |
| Cooldown | 3h tra un boost e l'altro |
| Limite giornaliero | max 3 boost / giorno |

### Formula boost effettivo nel tempo
```
boost(t) = boost_iniziale × exp(-ln(2) × Δmin / 30)
REC_visualizzato = min(85, REC_raw + boost(t))
```

## Architettura dati

### Nuovo evento intraday (no nuova tabella)
Si scrive su `intraday_metric_events` esistente:
```
event_type = 'acute_recovery_boost'
event_details = {
  initial_boost: 6,
  duration_minutes: 5,
  pre_post_delta: 0.7,
  expires_at: '2026-05-13T15:30:00Z',
  half_life_minutes: 30
}
```

### Cooldown / daily cap
Calcolati a runtime da query su `intraday_metric_events` (ultime 24h, `event_type = 'acute_recovery_boost'`). Nessuna migrazione richiesta.

## Logica applicativa

### Nuovo modulo `src/lib/recovery/acuteBoost.ts`
- `getActiveBoost(userId)` → legge eventi ultime 90 min, calcola boost residuo
- `canApplyBoost(userId)` → verifica cooldown 3h + max 3/giorno
- `applyBoost(userId, sessionData)` → calcola magnitudo, scrive event, ritorna `{boost, expiresAt}`

### Hook `useAcuteRecoveryBoost()`
- Polling ogni 30s per aggiornare countdown e decay
- Espone: `activeBoost`, `expiresInMin`, `canApply`, `nextAvailableAt`

### Integrazione Recovery V2
In `recoveryV2.ts` (o consumer downstream): wrappa l'output con `applyAcuteBoostLayer(rec_raw)` SOLO per la visualizzazione (Home, Recovery card). 
**REC_raw resto intatto** per: Sharpness, Readiness, snapshots, trend charts, Cognitive Age.

## UI

### 1. RechargingRunner — fine sessione
- Sostituire copy "non affects long-term metrics" con:
  - **"Acute Recovery Boost: +6"**
  - **"Decays in 90 min · Foundation remains sleep + HRV"**
- Mostra countdown live nella result screen

### 2. Home — RecoveryBatteryCard
- Quando boost attivo: layer secondario sopra la battery
  - Badge piccolo: `+4 · 47m`
  - Tooltip: "Acute reset — temporary state, not structural"
- Quando boost decade a 0: rimozione automatica senza animazione drammatica

### 3. Fast Recover entry card (Home)
- Se cooldown attivo: stato "locked" con countdown a prossimo uso
- Se 3/3 usati oggi: "Daily limit reached — recover with sleep tonight"

## Onestà narrativa
Copy chiave da rispettare ovunque appaia:
- "Acute reset" mai "Recovery boost"
- "Temporary state change"
- "Foundation remains sleep, HRV, structural recovery"
- Nessuna gamification: il boost serve a riflettere fisiologia, non a premiare l'utente

## File da creare / modificare

**Nuovi:**
- `src/lib/recovery/acuteBoost.ts` (logica core + formule)
- `src/hooks/useAcuteRecoveryBoost.ts` (polling + state)

**Modificati:**
- `src/components/training/RechargingRunner.tsx` — scrivi event al complete + nuovo end screen copy
- `src/components/training/RechargingSession.tsx` — pre/post delta passato al boost calc
- `src/components/dashboard/RecoveryBatteryCard.tsx` — overlay boost attivo
- `src/lib/recovery/recoveryV2.ts` (o equivalente consumer) — wrapper visualizzazione (NON tocca raw)
- Card di entry Fast Recover su Home — stati cooldown / limite

## Cosa NON cambia (importante)
- `recovery_snapshots`: invariato
- `daily_metric_snapshots`: invariato
- Trend chart Recovery 7/30 giorni: invariato (nessuna distorsione)
- Sharpness / Readiness / Cognitive Age: usano REC_raw, immutati
- XP, Training Capacity: invariati

## Memory da aggiornare
Nuovo file `mem://features/recovery/acute-boost-spec` + voce in index Core: "Fast Recover = acute boost +3/+8, half-life 30min, NO trend impact, max 3/day, cooldown 3h."
