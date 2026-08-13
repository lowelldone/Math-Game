# MathQuest Village

MathQuest Village is a downloadable, offline-ready 2D RPG math adventure.

## Play On A Computer

Open `index.html` in a browser.

## Install On Mobile

For the best mobile offline experience, serve the folder once from a web server, open it on the phone, then add it to the home screen.

1. Put the project folder on a computer.
2. Start a simple server in this folder.
3. Open the shown address on the phone.
4. Use the browser menu and choose **Add to Home screen** or **Install app**.
5. After the first load, the game is cached for offline play.

Example local server:

```bash
python -m http.server 8080
```

Then open:

```text
http://YOUR-COMPUTER-IP:8080
```

## Files Included

- `index.html` - game screen and UI
- `styles.css` - mobile-friendly RPG styling
- `game.js` - gameplay, quests, math challenges, and scoring
- `manifest.webmanifest` - installable mobile app metadata
- `sw.js` - offline cache service worker
- `icon.svg` - app icon
