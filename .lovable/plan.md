## Obiettivo
Ridurre la dimensione visiva della card **Recovery Monitor** in Home (`MonitorCardsRow.tsx`). Per coerenza visiva applico la stessa riduzione anche alla card gemella **Cognitive Monitor**, dato che vivono nello stesso grid 2-colonne.

## Modifica (solo `src/components/home/MonitorCardsRow.tsx`)

Riduzione moderata (~30%, livello 3/5):

- **Padding card**: `p-3` → `p-2.5`
- **Border radius**: `rounded-2xl` → `rounded-xl`
- **Margine sotto la riga**: `mb-5` → `mb-3`
- **Gap tra le card**: `gap-2.5` → `gap-2`
- **Header (label uppercase)**: `text-[10px]` → `text-[9px]`, `mb-2` → `mb-1.5`
- **Icona quadrata sx**: `w-5 h-5` → `w-4 h-4`, icone interne `w-3 h-3` → `w-2.5 h-2.5`
- **Status label** (Within Range / Steady / ecc.): `text-[12px]` → `text-[11px]`
- **Sotto-riga** (`{inRange}/4 Metrics` e `{recValue} battery`): `text-[10px]` → `text-[9px]`
- **Chevron**: `w-3.5 h-3.5` → `w-3 h-3`

## Cosa NON cambia
- Logica, soglie recovery, navigazione, stati di loading
- Colori, semantic tokens, struttura DOM
- Le altre card della Home (anello principale, Daily Briefing, CapacityTab, ecc.)

## Verifica
- Screenshot della Home a viewport 1050×840 dopo l'edit per confermare la riduzione visiva.
