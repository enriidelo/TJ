# TJ
# 📈 Trading Journal Pro v1.2.0 (HTML Edition)

**Trading Journal completo in HTML/CSS/JS + Flask.**
Design professionale, responsive, personalizzabile al 100%.

---

## 🚀 Installazione (VS Code)

### 1. Apri il progetto
```bash
cd trading_journal_html
code .
```

### 2. Crea ambiente virtuale
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Installa dipendenze
```bash
pip install -r requirements.txt
```

### 4. Avvia
```bash
python app.py
```

Apri il browser su `http://localhost:5000`

---

## 📱 Responsive Design

| Dispositivo | Layout |
|-------------|--------|
| **Smartphone** | Bottom navigation, colonne singole, touch-friendly |
| **Tablet** | Sidebar compatta, 2 colonne |
| **Desktop** | Sidebar espansa, 3 colonne, grafici grandi |

---

## ✨ Funzionalità

- 📊 **Dashboard** con metriche, equity curve (Chart.js), insight automatici
- ➕ **Nuovo Trade** con form completo e campi personalizzabili
- 📋 **Storico** con tabella e card (responsive), filtri, eliminazione
- 🔍 **Analisi** per strategia, orario, distribuzione P&L, report mensile
- ⚙️ **Impostazioni** con personalizzazione tema, campi, liste

---

## 🎨 Personalizzazione

Tutto dal browser, zero codice:
- **Colori**: primario, successo, pericolo, sfondo, testo...
- **Campi**: aggiungi slider, select, number, text
- **Liste**: modifica asset, strategie, timeframe
- **Layout**: mostra/nascondi widget dashboard

---

## 🛡️ Privacy

- Database SQLite locale (`journal.db`)
- Zero cloud, zero internet richiesto
- Zero dati condivisi

---

## 📁 Struttura

```
trading_journal_html/
├── app.py                 # Flask backend (API REST)
├── database.py            # SQLite + logica business
├── config.json            # Configurazione utente
├── requirements.txt       # Dipendenze
├── templates/
│   └── index.html         # SPA completa
├── static/
│   ├── css/
│   │   └── style.css      # Stili responsive
│   └── js/
│       └── app.js         # Logica frontend
└── .vscode/
    └── settings.json
```

---

**Made with ❤️ for traders who take data seriously.**
