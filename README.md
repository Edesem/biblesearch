# Bible Search

Read and search the Bible in 17 languages, by reference or by word. Styled like a printed reference Bible, with light and dark themes.

**[Live demo](https://searchthebible.vercel.app)**

## Features

- **Look up a passage** by book, chapter and verse, including ranges such as `1-3`
- **Search for a word or phrase** in one book or across the whole Bible, with matches highlighted
- **Switch languages:** Afrikaans, Bengali, English, Gujarati, Hindi, Hungarian, Indonesian, Kannada, Malayalam, Nepali, Oriya, Punjabi, Sepedi, Tamil, Telugu, Xhosa and Zulu
- **Share a search:** every search has its own URL, for example `/?book=John&chapter=3&verse=16&language=english.db`
- **Choose a theme:** follows the device setting on the first visit, then remembers the visitor's choice

A search shows at most 500 verses. If there are more, the page asks the reader to narrow it down.

## Tech stack

- Node.js and Express, with server-rendered EJS templates
- SQLite, with one read-only database per language
- Tailwind CSS v4
- Jest and Supertest for tests
- Deployed on Vercel

## Getting started

```sh
npm install
npm run dev
```

Then open <http://127.0.0.1:3030>. Set `PORT` to use a different port.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Build the CSS, then start the server |
| `npm start` | Start the server without building the CSS |
| `npm run build:css` | Build `src/tailwind.css` from `src/input.css` |
| `npm run watch:css` | Rebuild the CSS on every change |
| `npm test` | Run the tests |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check with TypeScript |

`src/tailwind.css` is committed and served as is, so rebuild it and commit the result after changing styles.

## Project layout

```
databases/               One SQLite database per language
src/index.js             Express app: routes, query building, helpers
src/views/pages/index.ejs  The page template
src/scripts.js           Theme toggle
src/input.css            Tailwind source and theme tokens
src/tailwind.css         Built stylesheet
src/books.txt            The 66 book names, in canonical order
tests/app.test.js        Helper and route tests
vercel.json              Vercel build and routing config
```

## Adding a language

Add a `<language>.db` file to `databases/`. The server lists that folder at startup, so the language appears in the dropdown after a restart. Each database needs this table:

```sql
CREATE TABLE `bible` (
  `Book` int(2),         -- zero-based position in src/books.txt
  `Chapter` int(3),
  `Versecount` int(3),   -- the verse number
  `verse` varchar(528)   -- the verse text
);
```

## License

[GNU GPL v3](LICENSE.txt)
