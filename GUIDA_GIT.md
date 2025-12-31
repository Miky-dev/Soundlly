# 🛡️ Guida Rapida ai Salvataggi (Git)

Questo file contiene i comandi essenziali per salvare il tuo lavoro e gestire i backup.

## 1. 💾 SALVARE IL LAVORO (Checkpoint)
Usa questi comandi ogni volta che fai una modifica che funziona e vuoi "salvare".

```bash
git add .
git commit -m "Scrivi qui cosa hai modificato"
```

## 2. 🌍 CARICARE SU GITHUB (Cloud)
Per inviare i tuoi salvataggi online su GitHub:

```bash
git push
```

## 3. 🔀 CREARE UN PUNTO DI SICUREZZA (Nuovo Branch)
Se devi fare modifiche pericolose o vuoi provare qualcosa di nuovo senza rompere quello che funziona, crea un "mondo parallelo" (branch).

```bash
git checkout -b nome-del-tuo-backup
# Esempio: git checkout -b backup-grafica-v1
```

## 4. 🔙 TORNARE AL RAMO PRINCIPALE (Main)
Se vuoi tornare alla versione principale:

```bash
git checkout main
```

## 5. 🚑 EMERGENZA: ANNULLARE TUTTO
Se hai fatto modifiche ma **NON hai ancora fatto il commit** e vuoi cancellare tutto per tornare all'ultimo salvataggio pulito:

```bash
git checkout .
```

---
💡 **Consiglio**: Fai commit piccoli e frequenti (es. "finito header", "aggiunto bottone"). È più facile tornare indietro se sbagli poco.
