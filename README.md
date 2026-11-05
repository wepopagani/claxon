# Claxon Bedano

Sito interattivo per Snack Bar Pizzeria Claxon: colazione, pranzo, pizza e aperitivo.

## Anteprima locale

```sh
python3 -m http.server 8017 --directory dist
```

Aprire http://localhost:8017. Il sito è statico, senza dipendenze o build.

## Struttura

- `dist/index.html`: pagine, sezioni e moduli.
- `dist/style.css`: design, layout e animazioni.
- `dist/app.js`: scene, selezione delle proposte e richieste WhatsApp.
- `dist/assets/`: immagini WebP e font con licenze OFL.
- `RECENSIONI-FONTI.txt`: fonti e data di rilevazione delle recensioni Google.
- `PROMPT-IMMAGINI.txt`: prompt delle immagini illustrative.
- `LEGGIMI.txt`: note di consegna e contenuti da confermare.

## Recensioni

Tre estratti verificati direttamente su Google Maps, con autore, stelle e link alla scheda del locale. Valutazione complessiva **4,5 / 5 su 191 recensioni**, rilevata il **5 novembre 2026**. Aggiornamento manuale.

## Contenuti della bozza

Immagini dei prodotti generate con AI e dichiarate illustrative. Logo tipografico provvisorio. Menu, disponibilità, prezzi, ingredienti, orari ed eventi richiedono conferma del locale.

I pulsanti per prenotare aprono la chiamata al +41 91 945 40 40. La lista dei preferiti prepara una bozza WhatsApp, senza inviare messaggi automaticamente. I preferiti restano nel browser.

## Hosting

La cartella da pubblicare è `dist`. `netlify.toml` contiene la configurazione statica per Netlify. `.openai/hosting.json` conserva l'identità della versione privata su Sites.
