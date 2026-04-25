# Piano Tutor

Tuteur piano interactif avec détection de notes (micro + MIDI).

## Déploiement sur Cloudflare Pages

### Option 1 : drag-and-drop (le plus rapide)

1. Installe les dépendances et build :
   ```
   npm install
   npm run build
   ```
2. Va sur https://dash.cloudflare.com → Pages → Create a project → Direct Upload
3. Glisse le dossier `dist/` dans la zone de dépôt
4. C'est en ligne

### Option 2 : via GitHub (redéploiement automatique)

1. Crée un repo GitHub et push ce dossier
2. Va sur https://dash.cloudflare.com → Pages → Create a project → Connect to Git
3. Configure :
   - Build command : `npm run build`
   - Build output directory : `dist`
   - Node version : 18+
4. Chaque push sur main redéploie automatiquement

## Développement local

```
npm install
npm run dev
```

Ouvre http://localhost:5173

## Ajouter une chanson

Ouvre `src/App.jsx`, dans l'objet `SONGS`, duplique le bloc `zombie` et adapte :
- `chords` : les accords avec doigtés et arpèges
- `riff` : le riff d'intro
- `melody` : couplet et refrain note par note
- `melPerChord` : les notes de mélodie par accord (pour la leçon deux mains)
- `structure` : l'ordre des sections de la chanson
- `lessons` : les objectifs et tips de chaque leçon
