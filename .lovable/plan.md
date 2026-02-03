
# Piano: Integrazione Wearable tramite HealthKit (iOS) e Health Connect (Android)

## Panoramica

Questo piano descrive l'implementazione di un sistema completo per leggere dati biometrici (sonno, HRV, frequenza cardiaca a riposo) dalle piattaforme health native di iOS e Android. I dati verranno usati per calcolare la **Cognitive Readiness** dell'utente.

---

## Architettura del Sistema

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         LOOMA App (Frontend)                             │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  src/lib/capacitor/health.ts (Bridge API unificato)              │   │
│  │  - readSleep(start, end)                                          │   │
│  │  - readHRV(start, end)                                            │   │
│  │  - readRestingHR(start, end)                                      │   │
│  │  - requestPermissions()                                           │   │
│  │  - checkPermissions()                                             │   │
│  └─────────────────────────┬────────────────────────────────────────┘   │
│                             │                                            │
│              ┌──────────────┴──────────────┐                            │
│              ▼                              ▼                            │
│  ┌─────────────────────┐      ┌─────────────────────────┐               │
│  │   iOS (HealthKit)    │      │  Android (Health Connect) │             │
│  │   Swift Plugin       │      │  Kotlin Plugin           │             │
│  └─────────────────────┘      └─────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────────┐
                    │  Backend (Edge Function)            │
                    │  wearables-ingest                  │
                    │  - Salva in wearable_snapshots      │
                    └────────────────────────────────────┘
```

---

## Fase 1: Bridge API TypeScript

Creare il modulo unificato `src/lib/capacitor/health.ts` che astrae le differenze tra iOS e Android.

**Interfacce da esporre (AGGIORNATE):**

```typescript
interface SleepRecord {
  startDate: string;     // ISO timestamp
  endDate: string;       // ISO timestamp
  durationMin: number;   // Minuti totali di sonno
  efficiency?: number;   // 0-1 (se disponibile)
  stages?: {
    rem: number;         // Minuti
    deep: number;        // Minuti
    core: number;        // Minuti (light sleep)
    awake: number;       // Minuti
  };
}

// CORRETTO: Distingue tra SDNN (iOS) e RMSSD (Android)
interface HRVRecord {
  timestamp: string;     // ISO timestamp
  value: number;         // Valore in millisecondi
  metric: "sdnn" | "rmssd";  // Tipo di metrica HRV
}

interface RHRRecord {
  timestamp: string;     // ISO timestamp
  bpm: number;           // Battiti per minuto
}

type HealthError = 
  | "permission_denied"
  | "not_available"
  | "no_data"
  | "health_connect_not_installed"
  | "unknown";

interface HealthResult<T> {
  success: boolean;
  data?: T[];
  error?: HealthError;
}
```

**Funzioni esposte:**

| Funzione | Descrizione |
|----------|-------------|
| `checkPermissions()` | Verifica stato permessi |
| `requestPermissions()` | Richiede permessi all'utente |
| `readSleep(start, end)` | Legge dati sonno nel range |
| `readHRV(start, end)` | Legge campioni HRV (SDNN su iOS, RMSSD su Android) |
| `readRestingHR(start, end)` | Legge frequenza cardiaca a riposo |
| `isHealthAvailable()` | Verifica disponibilità piattaforma health |
| `getPlatformHRVMetric()` | Ritorna "sdnn" o "rmssd" in base alla piattaforma |

---

## Fase 2: Plugin Nativo iOS (HealthKit)

### File da creare

| File | Posizione |
|------|-----------|
| `HealthPlugin.swift` | `ios-plugin/health/HealthPlugin.swift` |
| README setup | `ios-plugin/README.md` |

### Data Types HealthKit Utilizzati

| Dato | HealthKit Identifier | Unità |
|------|---------------------|-------|
| **Sleep** | `HKCategoryTypeIdentifier.sleepAnalysis` | Categoria |
| **HRV** | `HKQuantityTypeIdentifier.heartRateVariabilitySDNN` | ms |
| **Resting HR** | `HKQuantityTypeIdentifier.restingHeartRate` | count/min (bpm) |

### Configurazioni iOS Richieste

**Info.plist** - Usage Description (AGGIORNATO):
```xml
<key>NSHealthShareUsageDescription</key>
<string>LOOMA uses your sleep, HRV, and resting heart rate data to calculate your Cognitive Readiness score and deliver personalized cognitive performance insights.</string>
```

**App.entitlements** (CORRETTO - solo HealthKit standard, NO health-records):
```xml
<key>com.apple.developer.healthkit</key>
<true/>
```

### Logica Swift

Il plugin Swift dovrà:
1. Verificare disponibilità HealthKit (`HKHealthStore.isHealthDataAvailable()`)
2. Richiedere autorizzazione lettura per i 3 data types
3. Query `HKSampleQuery` per ogni tipo di dato
4. Filtrare campioni per fonte (preferire Apple Watch/device over manual entry)
5. Aggregare e normalizzare i dati
6. Impostare `metric: "sdnn"` per tutti i record HRV
7. Restituire al bridge JS tramite Capacitor

---

## Fase 3: Plugin Nativo Android (Health Connect)

### File da creare

| File | Posizione |
|------|-----------|
| `HealthPlugin.kt` | `android-plugin/health/HealthPlugin.kt` |
| README setup | `android-plugin/health/README.md` |

### Data Types Health Connect Utilizzati

| Dato | Health Connect Record Type | Note |
|------|---------------------------|------|
| **Sleep** | `SleepSessionRecord` | Include stages se disponibili |
| **HRV** | `HeartRateVariabilityRmssdRecord` | **RMSSD** (non SDNN) |
| **Resting HR** | `RestingHeartRateRecord` | Diretto |

### Permessi Android (AndroidManifest.xml)

```xml
<!-- Health Connect permissions -->
<uses-permission android:name="android.permission.health.READ_SLEEP" />
<uses-permission android:name="android.permission.health.READ_HEART_RATE_VARIABILITY" />
<uses-permission android:name="android.permission.health.READ_RESTING_HEART_RATE" />

<!-- Intent filter per Health Connect permission result -->
<intent-filter>
    <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
</intent-filter>

<!-- Query per Health Connect -->
<queries>
    <package android:name="com.google.android.apps.healthdata" />
</queries>
```

### Logica Kotlin

Il plugin Kotlin dovrà:
1. Verificare se Health Connect è installato
2. Verificare versione SDK (Health Connect richiede Android 14+ o installazione separata)
3. Gestire permission flow tramite `HealthConnectClient.permissionController`
4. Query records per ogni tipo
5. Impostare `metric: "rmssd"` per tutti i record HRV (non chiamarlo SDNN!)
6. Gestire casi edge:
   - Health Connect non installato → aprire Play Store
   - Permessi negati → ritornare errore appropriato
   - Nessun dato → ritornare array vuoto

---

## Fase 4: Hook React per Sync

Creare `useWearableSync.ts` per orchestrare la sincronizzazione.

**Strategia MVP:**
- **On-App-Open**: Ogni apertura app legge ultimi 2 giorni
- **Daily Background Sync**: Se supportato

**Flow:**
1. App si apre → `useWearableSync` si attiva
2. Verifica ultima sync (localStorage)
3. Se > 6 ore dall'ultima sync, legge dati
4. Aggrega dati giornalieri (ultimo giorno completo)
5. Invia a edge function `wearables-ingest` con campo `hrvMetric` per distinguere sdnn/rmssd
6. Edge function salva/aggiorna `wearable_snapshots`
7. Trigger ricalcolo Cognitive Readiness

---

## Fase 5: Integrazione con Sistema Esistente

Il sistema esistente già supporta wearable data:
- **Tabella**: `wearable_snapshots` (già presente)
- **Edge Function**: `wearables-ingest` (già presente)
- **Hook**: `useCognitiveReadiness` (già consuma wearable data)
- **Lib**: `src/lib/readiness.ts` (già calcola physio component)

**Modifiche necessarie:**
1. Aggiornare il campo `source` per usare "healthkit" o "health_connect"
2. Aggiungere campo `hrv_metric` ("sdnn" | "rmssd") nella tabella/payload
3. Aggiungere UI per richiedere permessi
4. Aggiungere stato connessione wearable nel profilo utente

---

## Dettagli Tecnici

### Known Limitations

| Piattaforma | Limitazione |
|-------------|-------------|
| **iOS** | HealthKit richiede device fisico (no Simulator) |
| **iOS** | HRV (SDNN) disponibile solo con Apple Watch o device compatibile |
| **Android** | Health Connect richiede Android 14+ nativo, o Android 9+ con app Health Connect |
| **Android** | HRV usa RMSSD (non SDNN) - metrica diversa da iOS |
| **Android** | Alcuni wearable (Garmin, Fitbit) richiedono sync con Health Connect prima |
| **Entrambi** | Resting HR potrebbe non essere disponibile senza wearable |

### Nota su HRV: SDNN vs RMSSD

- **iOS HealthKit** fornisce **SDNN** (Standard Deviation of NN intervals)
- **Android Health Connect** fornisce **RMSSD** (Root Mean Square of Successive Differences)
- Sono metriche correlate ma NON identiche
- Il backend/readiness calculation dovrà gestire entrambe appropriatamente
- Il campo `metric` nell'interfaccia permette di distinguerle

---

## Checklist Release Android (Health Connect)

### 1. Health Apps Declaration (Google Play Console)

Nella sezione **App content** > **Health apps**:
- [ ] Dichiarare che l'app accede a Health Connect
- [ ] Specificare i data types richiesti:
  - Sleep
  - Heart Rate Variability
  - Resting Heart Rate
- [ ] Spiegare l'uso: "Calculate Cognitive Readiness score for personalized cognitive performance insights"

### 2. Data Safety Section (Google Play Console)

Nella sezione **App content** > **Data safety**:

| Dato | Raccolta | Condivisione | Scopo |
|------|----------|--------------|-------|
| Sleep data | Sì | No | App functionality, Personalization |
| Heart rate | Sì | No | App functionality, Personalization |
| Health info | Sì | No | App functionality, Personalization |

- [ ] Dichiarare che i dati sono criptati in transito
- [ ] Dichiarare che i dati possono essere cancellati su richiesta
- [ ] Specificare che i dati NON sono condivisi con terze parti

### 3. Privacy Policy Requirements

La privacy policy deve includere:
- [ ] Elenco esatto dei dati health raccolti (sleep, HRV, resting HR)
- [ ] Scopo della raccolta (Cognitive Readiness calculation)
- [ ] Come i dati vengono memorizzati (Supabase con RLS)
- [ ] Periodo di retention dei dati
- [ ] Diritti dell'utente (accesso, cancellazione, portabilità)
- [ ] Contatto per richieste privacy
- [ ] Sezione specifica per Health Connect compliance

### 4. App Review Preparation

- [ ] Preparare account test con dati health (o documentare come testare)
- [ ] Screenshot del permission flow
- [ ] Video demo della funzionalità health
- [ ] Rispondere a possibili rejection reasons

### 5. Health Connect Specific Requirements

- [ ] Implementare deep link per "Manage permissions" da Health Connect settings
- [ ] Gestire gracefully la revoca permessi
- [ ] Mostrare link alla privacy policy durante permission request
- [ ] Supportare "Delete my data" flow

---

## Posizione File Finali

| File | Path |
|------|------|
| Bridge TS | `src/lib/capacitor/health.ts` |
| Hook Sync | `src/hooks/useWearableSync.ts` |
| iOS Plugin | `ios-plugin/health/HealthPlugin.swift` |
| iOS README | `ios-plugin/README.md` |
| Android Plugin | `android-plugin/health/HealthPlugin.kt` |
| Android README | `android-plugin/health/README.md` |

---

## Elenco Data Types per Piattaforma

**iOS HealthKit:**
- `HKCategoryTypeIdentifier.sleepAnalysis`
- `HKQuantityTypeIdentifier.heartRateVariabilitySDNN` → metric: "sdnn"
- `HKQuantityTypeIdentifier.restingHeartRate`

**Android Health Connect:**
- `SleepSessionRecord`
- `HeartRateVariabilityRmssdRecord` → metric: "rmssd"
- `RestingHeartRateRecord`

---

## Posizione Permessi/Entitlements

**iOS:**
- `Info.plist`: NSHealthShareUsageDescription
- `App.entitlements`: com.apple.developer.healthkit = true (NO health-records)
- Xcode: Capability HealthKit abilitata nel target

**Android:**
- `AndroidManifest.xml`: permissions READ_SLEEP, READ_HEART_RATE_VARIABILITY, READ_RESTING_HEART_RATE
- `AndroidManifest.xml`: queries per Health Connect package
- `AndroidManifest.xml`: intent-filter per permission rationale

---

## Acceptance Criteria

Su device reale (non emulator):

1. **iOS**: L'app chiede permesso HealthKit e legge dati (se presenti) per sonno/HRV (SDNN)/RHR
2. **Android**: L'app apre Health Connect permission screen e legge gli stessi dati (HRV come RMSSD)
3. Le funzioni JS ritornano dati in formato coerente con campo `metric` per HRV
4. Il frontend può mostrare i dati e distinguere la metrica HRV usata
5. I dati vengono salvati correttamente in `wearable_snapshots` con source e hrv_metric appropriati

---

## Deliverables Confermati

1. **Bridge API** (`health.ts`) - Interfaccia unificata JS/TS con campo metric per HRV
2. **iOS Plugin** - Swift code per HealthKit (SDNN)
3. **Android Plugin** - Kotlin code per Health Connect (RMSSD)
4. **React Hook** - `useWearableSync` per orchestrazione
5. **UI Components** - Bottone connessione + stato permessi
6. **Documentazione** - README con setup, known limitations, e checklist release Android
