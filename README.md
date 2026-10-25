# envi-tcg playtest simulator

A browser app for playtesting a student-designed freshwater ecology trading card game. Two players share one screen (hotseat) and play a match, and an editor lets you tune card stats and game rules between sessions.

**Play:** https://gioacupan.github.io/envi-tcg/

## Run locally

```sh
npm install
npm run dev
```

## Share a tuned ruleset

The Ruleset editor's **Export** button downloads a `.envi-tcg.json` file with your current card stats and rules. Send that file to groupmates, and they can load it with **Import** in their own copy of the app.

## Rules

The game rules come from [docs/TCG_DRAFT.pdf](docs/TCG_DRAFT.pdf). Rules the app had to guess are listed in the app's Interpretations tab.
