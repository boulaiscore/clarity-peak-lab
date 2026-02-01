

# Piano: Decay Recovery Ridotto durante le Ore Notturne

## Contesto Attuale
Il sistema Recovery usa un modello di decay esponenziale con half-life di 72 ore, applicato uniformemente 24/7:
```
REC = REC × 2^(-Δt_hours / 72)
```

## Obiettivo
Ridurre significativamente il decay durante le ore notturne (quando l'utente dorme), riconoscendo che il sonno è un momento di recupero naturale, non di consumo.

## Soluzione Proposta

### Nuove Costanti in `decayConstants.ts`
```
NIGHT_START_HOUR = 23      // Inizio fascia notturna (23:00)
NIGHT_END_HOUR = 7         // Fine fascia notturna (07:00)  
NIGHT_DECAY_MULTIPLIER = 0.2  // Decay al 20% rispetto al giorno
```

### Logica Modificata in `applyRecoveryDecay()`
1. Calcolare separatamente le ore diurne e notturne nel periodo tra `lastTs` e `nowTs`
2. Applicare il decay completo solo alle ore diurne
3. Applicare un decay ridotto (20%) alle ore notturne
4. Formula risultante:
   ```
   effectiveHours = dayHours + (nightHours × 0.2)
   REC = REC × 2^(-effectiveHours / 72)
   ```

### Esempio Pratico
Se passano 8 ore di notte (23:00 - 07:00):
- **Prima**: decay per 8 ore complete
- **Dopo**: decay equivalente a 1.6 ore (8 × 0.2)

Questo significa che dormire 8 ore causa una perdita di recovery quasi trascurabile.

## File da Modificare

| File | Modifica |
|------|----------|
| `src/lib/decayConstants.ts` | Aggiungere costanti per fascia notturna e moltiplicatore |
| `src/lib/recoveryV2.ts` | Creare helper `calculateEffectiveDecayHours()` e aggiornare `applyRecoveryDecay()` |

## Dettagli Tecnici

### Helper Function: `calculateEffectiveDecayHours()`
```typescript
function calculateEffectiveDecayHours(
  startTs: string,
  endTs: string
): number {
  // Itera ora per ora tra start e end
  // Se l'ora è tra NIGHT_START e NIGHT_END: conta × 0.2
  // Altrimenti: conta × 1.0
  // Ritorna il totale delle "ore effettive"
}
```

### Considerazioni Timezone
- Usare l'ora locale del dispositivo per determinare giorno/notte
- Il profilo utente ha già un campo `timezone` che potrebbe essere usato per maggiore precisione

## Impatto
- **Notte (8h di sonno)**: decay equivalente a ~1.6 ore invece di 8
- **Giorno (16h di veglia)**: decay normale
- **Totale 24h**: decay effettivo ~17.6 ore invece di 24 (riduzione del ~27%)

