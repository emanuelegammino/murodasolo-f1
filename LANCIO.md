# Lancio della nuova versione — promemoria

Il giorno del lancio i dati della nuova versione si ottengono così:

1. **2021–2025**: archivio verificato già presente in `index.html` (ramo `nuova-versione`).
2. **2026**: episodi presi dal backup JSON esportato dall'app online (Esporta Backup JSON → Copia JSON),
   confrontati con quelli già presenti nel file.
3. **Episodi "senza danni"** (registrati ma esclusi dalla classifica). L'app online non ha questa funzione,
   quindi vanno segnati di nuovo dopo l'import:

| Stagione | GP | Sessione | Pilota | Note |
|---|---|---|---|---|
| 2021 | Austin | FP2 | Fernando Alonso | Senza danni |
| 2021 | Russia | Gara | Sergio Perez | A muro in ingresso pit lane, senza conseguenze |
| 2026 | Canada | FP1 | George Russell | A muro in testacoda ma senza danni |
| 2026 | Monaco | Q3 | Charles Leclerc | Senza danni apparenti |
| 2026 | Las Vegas | Gara | George Russell | Senza danni — registrato solo nella nuova versione, NON presente nell'app online |

Regola per il periodo di transizione: se un muro senza danni viene registrato sull'app online,
scrivere "senza danni" nella nota, così viene riconosciuto e segnato al momento dell'unione.
