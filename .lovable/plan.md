
# Piano: Cognitive Decision Insights per Home Page

## Obiettivo
Aggiungere un sistema di **insight decisionali** sulla Home che aiuti l'utente a capire **quando la sua mente è pronta per decisioni importanti** — non semplici CTA per fare training, ma veri consigli cognitive-performance-oriented.

## Differenza vs DailyBriefing esistente
| Attuale (DailyBriefing) | Nuovo (Cognitive Insights) |
|------------------------|---------------------------|
| "Recovery è bassa, fai detox" | "Mente sovraccarica: rimanda decisioni importanti" |
| "Forte giornata cognitiva, allena" | "Stato cognitivo ottimale per strategie complesse" |
| Focus su training | Focus su decision-making professionale |

## Esempi di Insight

### Peak States (alta performance)
- **"Peak cognitive state today — optimal for complex decisions and strategic thinking."**
- **"High reasoning quality — ideal for negotiations and evaluations."**
- **"Processing speed high — rapid decisions will be accurate."**

### Warning States (evitare decisioni)
- **"Cognitive load high — avoid major decisions today."**
- **"Reasoning depth limited — stick to routine tasks."**
- **"Recovery below threshold — postpone complex analysis."**

### Trend Insights (long-term)
- **"Cognitive Age improving: 1.2 years younger this month."**
- **"Reasoning Quality building steadily — deep work capacity expanding."**
- **"Sustained high recovery — you're managing cognitive load well."**

## Architettura

```text
┌─────────────────────────────────────────────────────────┐
│                 useCognitiveInsights()                  │
├─────────────────────────────────────────────────────────┤
│  Input:                                                 │
│  • Sharpness, Readiness, Recovery, RQ                   │
│  • Cognitive Age (delta, trend, pace)                   │
│  • Weekly progress                                      │
│                                                         │
│  Output:                                                │
│  • primaryInsight: { headline, body, type }             │
│  • secondaryInsight: { headline, body, type } | null    │
│  • decisionReadiness: "peak" | "good" | "caution" | "avoid" │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              CognitiveInsightCard.tsx                   │
│  (Nuovo componente nella Home)                          │
├─────────────────────────────────────────────────────────┤
│  • Visualizzazione premium: bg-muted/30, border-border  │
│  • Primary insight con headline + body                  │
│  • Optional secondary insight (trend-based)             │
│  • Indicatore "Decision Readiness" visivo               │
└─────────────────────────────────────────────────────────┘
```

## File da creare/modificare

### 1. Nuovo Hook: `src/hooks/useCognitiveInsights.ts`
Logica di prioritizzazione per generare insight decisionali:

**Categorie di insight (in ordine di priorità):**

| Priorità | Condizione | Headline |
|----------|-----------|----------|
| 1 | Recovery < 35 | "Cognitive overload — avoid important decisions" |
| 2 | Recovery < 50 & RQ < 45 | "Mental capacity limited — postpone complex analysis" |
| 3 | Sharpness ≥75 & Readiness ≥75 & RQ ≥60 | "Peak state — optimal for strategic decisions" |
| 4 | Sharpness ≥70 & Readiness ≥70 | "Strong clarity — tackle your hardest problems" |
| 5 | RQ ≥65 & Recovery ≥55 | "High reasoning quality — ideal for deep analysis" |
| 6 | Sharpness ≥70 & Readiness < 55 | "Quick bursts available — short decisions only" |
| 7 | Readiness ≥70 & Sharpness < 55 | "Endurance good, clarity moderate — routine tasks preferred" |
| 8 | Default stable | "Stable baseline — proceed with normal workload" |

**Trend Insights (secondary):**
- Cognitive Age delta < -0.5 → "Your cognitive age is improving"
- RQ in steady growth → "Reasoning depth expanding"
- Recovery consistently ≥60 → "Cognitive reserve well-managed"

### 2. Nuovo Componente: `src/components/home/CognitiveInsightCard.tsx`
Card premium con:
- Headline principale (testo grassetto, 12px)
- Body descrittivo (testo muted, 11px)
- Optional: secondary insight per trend a lungo termine
- Design unificato neutral (come le altre card)

### 3. Modifica: `src/pages/app/Home.tsx`
- Sostituire il blocco DailyBriefing + topSuggestion con il nuovo CognitiveInsightCard
- Mantenere le SmartSuggestionCard per le azioni (training, detox)
- Separare chiaramente: **insight decisionale** (top) vs **azioni consigliate** (sotto)

## Dettagli Tecnici

### Hook Interface
```typescript
interface CognitiveInsight {
  headline: string;           // "Peak state — optimal for strategic decisions"
  body: string;               // "Your processing and reasoning are aligned..."
  type: "peak" | "good" | "caution" | "avoid";
  category: "state" | "trend";
}

interface UseCognitiveInsightsResult {
  primaryInsight: CognitiveInsight;
  secondaryInsight: CognitiveInsight | null;
  decisionReadiness: "peak" | "good" | "caution" | "avoid";
  isLoading: boolean;
}
```

### Visual Design
- Card con `bg-muted/30 border-border/30` (premium neutral)
- Headline in `text-foreground text-xs font-medium`
- Body in `text-muted-foreground text-[11px]`
- Nessun colore urgency (no rosso/verde/giallo) — tutto monocromatico
- Optional: sottile indicatore di "decision readiness" (4 dots o barra)

## Flusso Utente Finale

1. Utente apre Home
2. Vede insight decisionale primario: *"Peak cognitive state — optimal for strategic decisions"*
3. Sotto, vede body: *"Your processing speed and reasoning depth are aligned. This is your best window for negotiations, complex analysis, and high-stakes decisions."*
4. Optional: trend insight secondario: *"Cognitive Age improving: 0.8 years younger than last month."*
5. Sotto ancora, le SmartSuggestionCard per le azioni consigliate
