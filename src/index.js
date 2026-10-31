// Import
const express = require('express');
const fs = require('fs');
const path = require('path');
const sqlite = require('sqlite3').verbose();
const bodyParser = require('body-parser');

// Define consts
const app = express();
const DB_DIR = path.join(__dirname, '..', 'databases');
const hostname = '127.0.0.1'
//const port = 3000
const PORT = process.env.PORT || 3030;
const DEFAULT_LANGUAGE = 'english.db';
const RESULT_LIMIT = 500;

const languages = [];

fs.readdir(DB_DIR, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  // Log the list of files
  files.forEach((file) => {
    languages.push(file);
  });
});


// Set engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the '.' directory
app.use(express.static(__dirname));

// Use url encoded
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON bodies
app.use(bodyParser.json());

// Read biblical books into dictionary
const bibleBooks = {};
const bibleNumbers = {};
const bibleBooksArray = [];

fs.readFile(path.join(__dirname, 'books.txt'), 'utf8', (err, data) => {
  if (err) {
    return console.error(err.message);
  }

  // Split the data into an array of book titles
  const bookTitles = data.trim().split('\n');
  // Create the dictionary
  bookTitles.forEach((title, index) => {
    const bookNumber = index;

    // Set the two different dictionaries
    bibleBooks[bookNumber] = title.trim();
    bibleNumbers[title.trim()] = bookNumber;
    bibleBooksArray.push(title.trim())
  });
});




//////////// Functions /////////////////

// Highlight query result
function highlightSearchResult(result, searchQuery) {

  if (!searchQuery) {
    return result;
  }

  // Escape regex characters so input like "(" is searched literally
  const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const highlightedResult = result.replace(
    new RegExp(escaped, "gi"),
    '<span class="highlight">$&</span>'
  );

  return highlightedResult;
}

// Returns a list of books with users input in the word
// Always shows the first index by default
function guessInput(userInput) {
  return bibleBooksArray.filter(book => book.includes(userInput))[0];
}

// Format the language name correctly
function formatLang(language) {
  language = language.replace('.db', '');
  return language.charAt(0).toUpperCase() + language.slice(1);
}

// Integer from user input, or null when blank/invalid so SQL ignores the filter
function toInt(value) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

// Add a single value or an "a-b" range filter to the query
function addRange(sql, input, column, raw) {
  if (raw.includes('-')) {
    const [from, to] = raw.split('-');
    input.push(toInt(from), toInt(to));
    return sql + ` AND ${column} BETWEEN COALESCE(?, ${column}) AND COALESCE(?, ${column})`;
  }
  input.push(toInt(raw));
  return sql + ` AND ${column} = COALESCE(?, ${column})`;
}

// Build the values every render of the page needs
function viewData(query, extra) {
  return Object.assign({
    verseAmount: 0,
    verses: [],
    searched: false,
    truncated: false,
    error: null,
    query: query,
    previousBook: query.book,
    previousChapter: query.chapter,
    previousVerse: query.verse,
    previousWords: query.words,
    previousLanguage: query.language,
    searchQuery: query.words,
    languages: languages,
    bibleBooks: bibleBooks,
    bibleBooksArray: bibleBooksArray,
    formatLang: formatLang,
    highlightSearchResult: highlightSearchResult
  }, extra);
}

// Clean up whatever the browser sent, from either the query string or a POST body
function readQuery(params) {
  const text = (value) => (typeof value === 'string' ? value.trim() : '');
  let book = text(params.book);

  // If book has input, then guess input
  if (book) {
    book = guessInput(book) || '';
  }

  const language = languages.includes(params.language) ? params.language : DEFAULT_LANGUAGE;

  return {
    book: book,
    chapter: text(params.chapter),
    verse: text(params.verse),
    words: text(params.words),
    language: language
  };
}

// Run a search and render the page
function search(params, res, forceSearch) {
  const query = readQuery(params);
  const searched = forceSearch || ['book', 'chapter', 'verse', 'words'].some((key) => key in params);

  if (!searched) {
    return res.render('pages/index', viewData(query, {}));
  }

  // Connect to db
  const db = new sqlite.Database(path.join(DB_DIR, path.basename(query.language)), sqlite.OPEN_READONLY, (err) => {
    if (err) {
      console.error(err.message);
    }
  });

  // Set search query
  let sql = 'SELECT * FROM bible WHERE Book = COALESCE(?, Book) AND verse LIKE ?';
  const input = [query.book ? bibleNumbers[query.book] : null, '%' + query.words + '%'];

  sql = addRange(sql, input, 'Versecount', query.verse);
  sql = addRange(sql, input, 'Chapter', query.chapter);
  sql += ' ORDER BY Book, Chapter, Versecount LIMIT ' + (RESULT_LIMIT + 1);

  // Get query
  db.all(sql, input, (err, rows) => {
    db.close();

    if (err) {
      console.error(err.message);
      return res.status(500).render('pages/index', viewData(query, {
        searched: true,
        error: 'The search could not be run. Please try again.'
      }));
    }

    const truncated = rows.length > RESULT_LIMIT;
    const verses = truncated ? rows.slice(0, RESULT_LIMIT) : rows;

    // Render the results
    res.render('pages/index', viewData(query, {
      searched: true,
      verseAmount: verses.length,
      truncated: truncated,
      verses: verses
    }));
  });
}



//////////////////// APP GET/POST //////////////////////

// Index: searches live in the URL so they can be shared and bookmarked
app.get('/', (req, res) => {
  search(req.query, res, false);
});

// Post request kept for older clients and forms
app.post('/', (req, res) => {
  search(req.body || {}, res, true);
});



/// Establish connection ///
//app.listen(process.env.PORT || 3000, () => console.log('App available on http://' + hostname + ':' + port));

// Vercel imports the app; only listen when run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`server started on port http://${hostname}:${PORT}`);
  });
}

module.exports = Object.assign(app, { highlightSearchResult, guessInput, formatLang });
