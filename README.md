# Claxon Bedano

Sito interattivo per Snack Bar Pizzeria Claxon: colazione, pranzo, pizza e aperitivo.

## Versione 2

- Giornata guidata dallo scroll, con quattro scene, pulsanti, cursore e possibilità di saltare la sequenza.
- Tre pizze illustrative: Margherita, Crudo e pomodorini, Salame e funghi. Rotazione con trascinamento o cursore, fetta separabile e ingredienti esplorabili.
- Stato della ricetta, rotazione, fetta e ingredienti indipendenti; cambio ricetta senza azzerare la vista.
- 16 fotografie reali dal profilo pubblico Instagram del locale, con fonti individuali in `FONTI-FOTOGRAFIE.json`.
- Galleria filtrabile, vista a tutto schermo, frecce, swipe e tastiera.
- Due clip di 8 secondi ottenuti con un movimento di camera sulle fotografie del caffè e del brindisi. Non sono nuove riprese. Riproduzione su richiesta, nessun autoplay, pausa fuori schermo e un solo clip attivo.
- Catalogo di 12 proposte con ricerca trasversale, filtro dei preferiti, dettagli e richieste WhatsApp su disponibilità, prezzi e allergeni.
- Orari verificati su Google Maps e stato aperto/chiuso nel fuso Europe/Zurich. Mappa caricata su richiesta.
- Prenotazione telefonica, come richiesto: tutti i pulsanti per il tavolo usano `tel:+41919454040`.

## Anteprima locale

```sh
python3 -m http.server 8017 --directory dist
```

Aprire http://localhost:8017. Il sito è statico, senza dipendenze o build.

## Struttura

- `dist/index.html`: pagine, sezioni e moduli.
- `dist/style.css`: design, layout e animazioni.
- `dist/app.js`: funzioni di base, preferiti e richieste WhatsApp.
- `dist/catalogue.js`: catalogo, fotografie, fonti e orari.
- `dist/experience.js`: scorrimento, pizze, ricerca, dettagli, galleria, clip e apertura.
- `dist/experience.css`: impaginazione e animazioni V2.
- `dist/assets/`: immagini WebP e font con licenze OFL.
- `RECENSIONI-FONTI.txt`: fonti e data di rilevazione delle recensioni Google.
- `PROMPT-IMMAGINI.txt`: prompt delle immagini illustrative.
- `LEGGIMI.txt`: note di consegna e contenuti da confermare.

## Recensioni

Tre estratti verificati direttamente su Google Maps, con autore, stelle e link alla scheda del locale. Valutazione complessiva **4,5 / 5 su 191 recensioni**, rilevata il **5 novembre 2026**. Aggiornamento manuale.

## Contenuti della bozza

Prodotti scontornati e pizze interattive generati con AI e dichiarati illustrativi. Le foto della galleria provengono dal profilo pubblico Instagram del locale. Logo tipografico provvisorio. Ricette, disponibilità, prezzi, allergeni ed eventi richiedono conferma del locale: il sito non inventa prezzi o certificazioni alimentari. Gli orari abituali sono stati verificati sulla scheda Google Maps e rimangono una rilevazione manuale; vedere `ORARI-FONTI.txt`.

I pulsanti per prenotare aprono la chiamata al +41 91 945 40 40. La lista dei preferiti prepara una bozza WhatsApp, senza inviare messaggi automaticamente. I preferiti restano nel browser.

## Hosting

La cartella da pubblicare è `dist`. `netlify.toml` contiene la configurazione statica per Netlify. `.openai/hosting.json` conserva l'identità della versione privata su Sites.
