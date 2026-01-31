

# Piano: Gestione Sovrapposizione Punti nel Grafico Daily (1d)

## Problema Identificato

Quando più eventi (task, game, detox) avvengono in orari ravvicinati (es. 12:20, 12:22, 12:23), i datapoint si sovrappongono visivamente perché:
- L'asse X va da 00:00 a "ora" (circa 12+ ore)
- Pochi minuti di differenza sono impercettibili su questa scala
- Ogni punto mostra un label numerico sopra, creando sovrapposizione

## Opzioni Proposte

### Opzione 1: Smart Label Pruning (Consigliata)

Mostrare le label solo per:
- **Primo punto** (baseline)
- **Ultimo punto** (stato attuale)
- **Punti con distanza X sufficiente** (min 40px tra label)

I punti intermedi mantengono i pallini ma senza numeri, evitando il clutter visivo. Un tooltip al tap potrebbe rivelare il valore esatto.

**Pro:**
- Mantiene la fedeltà temporale dei punti
- Aspetto pulito e premium
- Nessuna perdita di informazione (pallini visibili)

**Contro:**
- Richiede logica per calcolare distanza pixel

### Opzione 2: Collapsing/Bucketing (Aggregazione)

Aggregare eventi che occorrono entro una finestra temporale (es. 5-10 minuti) in un singolo punto che mostra solo il valore finale.

**Pro:**
- Grafico più semplice

**Contro:**
- Perdita di granularità (non vedi i singoli step)
- Meno fedele alla realtà degli eventi

### Opzione 3: Dominio X Dinamico (Zoom Automatico)

Invece di 00:00 → now, il dominio X parte da "primo evento - padding" fino a "now + padding", espandendo visivamente la timeline attiva.

**Pro:**
- Massima separazione visiva tra punti

**Contro:**
- Perde il contesto della giornata intera
- Inconsistente con la filosofia WHOOP (sempre 24h view)

### Opzione 4: Label Verticali Sfalsate

Alternare la posizione delle label (sopra/sotto) per punti vicini.

**Pro:**
- Semplice da implementare

**Contro:**
- Visivamente caotico, non premium

---

## Raccomandazione: Opzione 1 (Smart Label Pruning)

È il pattern usato da WHOOP: tutti i punti sono visibili come pallini, ma solo quelli con sufficiente distanza orizzontale mostrano la label numerica. Il primo e l'ultimo punto mostrano sempre la label.

---

## Implementazione Tecnica

### File da modificare

`src/components/dashboard/MetricTrendCharts.tsx`

### Modifiche

1. **Calcolo distanze X nel CustomLabel**  
   Passare al componente `CustomLabel` un array con tutte le coordinate X dei punti e l'indice corrente, per determinare se la label deve essere nascosta.

2. **Logica di visibilità**  
   ```
   Una label è visibile se:
   - È il primo punto con valore
   - È l'ultimo punto
   - La distanza dal punto precedente visibile è ≥ MIN_LABEL_DISTANCE (es. 40px)
   ```

3. **Pre-calcolo coordinate**  
   Usare `useMemo` per calcolare quali punti devono mostrare la label prima del rendering, basandosi sul layout del grafico.

4. **Pallini sempre visibili**  
   I `CustomDot` rimangono invariati, tutti i punti mantengono il pallino colorato.

### Pseudo-implementazione

```text
1. Ordinare i punti per timeValue
2. Creare Set di indici "labelVisible"
3. Primo punto con valore → visibile
4. Ultimo punto → visibile
5. Per ogni punto intermedio:
   - Calcolare distanza X dal precedente labelVisible
   - Se distanza ≥ 40px → aggiungere a labelVisible
6. Passare labelVisible a CustomLabel via props
```

### Note

- La logica di pruning si applica solo alla vista 1d (intraday)
- La vista 7d mantiene il comportamento attuale (1 punto per giorno, nessun overlap)
- I pallini (dots) rimangono sempre visibili per mantenere la fedeltà dei dati

---

## Risultato Atteso

Il grafico mostrerà:
- Tutti i pallini ai loro orari corretti
- Label solo dove c'è spazio sufficiente (primo, ultimo, e intermedi distanziati)
- Aspetto pulito, premium, in linea con WHOOP

