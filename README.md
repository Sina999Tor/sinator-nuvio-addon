# Sinator addon pro Nuvio / Stremio

Tenhle mini-projekt promění tvoje seznamy a watchlist na Sinator backendu
na Stremio-kompatibilní addon, který si Nuvio (nebo Stremio) přidá jako
kterýkoliv jiný addon.

## Jak to funguje

- `/manifest.json` — vrátí seznam katalogů: "Watchlist" + jeden katalog za
  každý tvůj seznam v Sinatoru (zvlášť pro filmy, zvlášť pro seriály).
- `/catalog/movie/watchlist.json`, `/catalog/series/list:123.json` atd. —
  vrátí položky z daného seznamu. Ke každé položce se dotáhne IMDb id přes
  TMDB (Stremio/Nuvio to potřebuje, aby na položku navázaly ostatní addony
  jako Cinemeta pro detail a streamovací addony pro přehrání).

Addon **nehostuje** žádné streamy ani meta data — jen říká "tohle je v mém
seznamu", zbytek (plakát v detailu, přehrávání) obstará Nuvio přes vlastní
nainstalované addony, stejně jako u kteréhokoli jiného Stremio katalogu.

## Nasazení (Vercel)

1. Tuhle složku nahraj jako nový GitHub repo (nebo rovnou přes Vercel CLI
   `vercel deploy` z této složky bez GitHubu).
2. Ve Vercelu vytvoř nový projekt z tohohle repa/složky.
3. V nastavení projektu (Settings → Environment Variables) přidej:
   - `SINATOR_BACKEND_KEY` — stejný API klíč, co máš zadaný v Sinatoru
     v Nastavení → Sinator backend (ten `x-api-key`).
   - `TMDB_API_KEY` — tvůj TMDB v3 API klíč (stejný, jaký používáš
     v Sinatoru; pokud ho nemáš po ruce, vygeneruješ zdarma na
     themoviedb.org → Settings → API).
4. Deploy. Vercel ti dá adresu typu `https://sinator-nuvio-addon.vercel.app`.

## Přidání do Nuvia

V Nuviu: Nastavení → Addony/Extensions → Přidat addon z URL a vlož:

```
https://TVOJE-ADRESA.vercel.app/manifest.json
```

Nuvio by mělo nabídnout instalaci addonu "Sinator" a v knihovně/katalozích
se objeví tvoje seznamy.

## Omezení

- Nuvio si manifest stahuje jen občas (ne při každém otevření appky), takže
  nově vytvořený seznam v Sinatoru se v Nuviu neobjeví hned, ale až po chvíli
  / restartu appky.
- Položky, ke kterým TMDB nenajde IMDb id (typicky úplné novinky bez IMDb
  záznamu), se v katalogu zatím nezobrazí — jakmile IMDb id přibude, objeví
  se samo.
- Addon je veřejný (bez tokenu), jak jsme se domluvili — kdokoliv se zná
  adresu, uvidí obsah tvých seznamů (ne ale tvůj `x-api-key` k Sinator
  backendu, ten zůstává jen na serveru).
