# Piano Tutor

Tuteur piano interactif avec détection de notes (micro + MIDI). React 18 + Vite, déployé en statique sur Cloudflare Pages. Démo en ligne : [piano.00h11.ca](https://piano.00h11.ca). Note de contexte : [00h11.ca/projets/piano-tutor/](https://00h11.ca/projets/piano-tutor/).

## Comment ça marche

L'application est un seul fichier React (`src/App.jsx`, environ 1600 lignes), sans dépendance externe au-delà de React. Chaque chanson est décomposée en sept leçons progressives : accords en blocs, arpèges, riff d'intro, mélodie couplet et refrain, coordination deux mains, montée vers le tempo réel, performance complète. Deux chansons incluses : *Zombie* (The Cranberries) et *A Thousand Years* (Christina Perri).

La détection fonctionne de deux façons : par micro (algorithme d'autocorrélation sur le signal audio) ou par MIDI USB (Web MIDI API). Optimisé pour iPad 11 pouces en mode paysage, fonctionne aussi sur desktop et mobile.

## Note importante sur les chansons de démonstration

Les exemples inclus — *Zombie* des Cranberries (composition de Dolores O'Riordan, 1994) et *A Thousand Years* de Christina Perri (composition de Christina Perri et David Hodges, 2011) — sont des transcriptions mélodiques simplifiées fournies à but pédagogique personnel uniquement. Les droits sur les compositions originales appartiennent à leurs ayants droit respectifs. Les paroles ont été retirées du repo public, seules les notes restent.

Si tu *fork* ce projet pour le redistribuer, **remplace les blocs `SONGS.zombie` et `SONGS.thousandYears` dans `src/App.jsx` par des chansons du domaine public ou par tes propres compositions** avant de publier. La licence MIT couvre uniquement le code et le moteur, pas la donnée musicale d'exemple.

## Déploiement sur Cloudflare Pages

### Option 1 : drag-and-drop (le plus rapide)

1. Installe les dépendances et *build* :
   ```
   npm install
   npm run build
   ```
2. Va sur https://dash.cloudflare.com → Pages → Create a project → Direct Upload
3. Glisse le dossier `dist/` dans la zone de dépôt
4. C'est en ligne

### Option 2 : via GitHub (redéploiement automatique)

1. *Fork* ce repo ou crée un repo GitHub et *push* le dossier
2. Va sur https://dash.cloudflare.com → Pages → Create a project → Connect to Git
3. Configure :
   - *Build command* : `npm run build`
   - *Build output directory* : `dist`
   - *Node version* : 18+
4. Chaque *push* sur `main` redéploie automatiquement

## Développement local

```
npm install
npm run dev
```

Ouvre http://localhost:5173

## Ajouter une chanson

Ouvre `src/App.jsx`, dans l'objet `SONGS`, duplique le bloc `zombie` et adapte :
- `chords` : les accords avec doigtés et arpèges
- `riff` : le *riff* d'intro
- `melody` : couplet et refrain note par note
- `melPerChord` : les notes de mélodie par accord (pour la leçon deux mains)
- `structure` : l'ordre des sections de la chanson
- `lessons` : les objectifs et *tips* de chaque leçon

## Licence

MIT pour le code (voir `LICENSE`). Donnée musicale de démonstration : voir la note ci-dessus.
