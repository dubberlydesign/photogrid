AST Photo Grid
==============

This node script will build an SVG photo grid using timestamped `.jpg` files obtained from the Narrative Clip during the Atlas of Caregiving in-home studies. The script expects the following directory structure:

```
source
    ├── index.html
    └── images
        ├── $participant_name
        │   ├── YYYY-MM-DDTHHmmss.jpg
        │   │   ...
        │   └── YYYY-MM-DDTHHmmss.jpg
        ├── ...
        └── $participant_name
            ├── YYYY-MM-DDTHHmmss.jpg
            │   ...
            └── YYYY-MM-DDTHHmmss.jpg
```

SVG files will be output into the `build` folder with the same name as the originating folder.

## Getting Started

```
npm install
npm run build
```
