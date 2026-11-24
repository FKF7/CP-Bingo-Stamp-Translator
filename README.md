# Club Penguin Stamp Translator

Select the stamp names from a BingoSync board to show each goal's game, description, and difficulty in the matching square.

## Run and build

```sh
npm install
npm run dev
npm run build
```

Run `npm run format` to format the project, or `npm run format:check` to check formatting without changing files.

The build creates **`dist/index.html`**. It contains the app's JavaScript and CSS, so you can copy that one file and open it locally. The board is saved in browser local storage.

## Stamp catalog

Edit [`src/stamps.json`](src/stamps.json) before building. The catalog contains Club Penguin stamps and their bingo goal descriptions.

```json
{
  "Exact BingoSync stamp name": {
    "game": "Mini-game name",
    "description": "Brief objective for the player",
    "difficulty": "easy"
  }
}
```

Difficulty must be `easy`, `medium`, `hard`, or `extreme`.
