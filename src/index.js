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

// Define previous entries
let previousBook = '';
let previousChapter = '';
let previousVerse = '';
let previousWords = '';
let previousLanguage = 'english.db';

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

  const highlightedResult = result.replace(
    new RegExp(searchQuery, "gi"),
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



//////////////////// APP GET/POST ////////////////////// 

// Index
app.get('/', (req, res) => {

    res.render('pages/index', {
      verseAmount: 0,
      verses: [],
      previousBook: previousBook,
      previousChapter: previousChapter,
      previousVerse: previousVerse,
      previousWords: previousWords,
      previousLanguage: previousLanguage,
      languages: languages,
      bibleBooksArray: bibleBooksArray,
      formatLang: formatLang
    });
});




// Post reqeust
app.post('/', (req, res) => {
  const verses = [];
  const inputData = req.body;

  // Get user input
  let book = inputData.book || '';
  
  // If book is has input, then guess input
  if (book) {
    book = guessInput(book);
  }

  let chapter = inputData.chapter;
  let verse = inputData.verse;
  const words = inputData.words;
  const language = inputData.language;

  // Set previous enteries
  previousBook = book
  previousChapter = chapter
  previousVerse = verse
  previousWords = words
  previousLanguage = language

  // Connect to db
  let db = new sqlite.Database(path.join(DB_DIR, path.basename(language)), sqlite.OPEN_READONLY, (err) => {
    if (err) {
      return console.error(err.message);
    }
  });
  

  // Set search query
  let sql = 'SELECT * FROM bible WHERE Book = COALESCE(?, Book) AND verse LIKE COALESCE(?, verse)';
  const word = '%' + words + '%'

  const input = [bibleNumbers[book], word]
  
  // Check if a single or range of verses were given
  if (verse.includes('-')) {
    verse = verse.split('-')
    sql += ' AND Versecount BETWEEN ? AND ? ';
    input.push(parseInt(verse[0]), parseInt(verse[1]))
  }
  else {
    sql += ' AND Versecount = COALESCE(?, Versecount)';
    input.push(parseInt(verse))
  }

  // Check if a single or range of chapters were given
  if (chapter.includes('-')) {
    chapter = chapter.split('-')
    sql += ' AND Chapter BETWEEN ? AND ? ';
    input.push(parseInt(chapter[0]), parseInt(chapter[1]))
  }
  else {
    sql += ' AND Chapter = COALESCE(?, Chapter)';
    input.push(parseInt(chapter))
  }

  // Get query
  db.all(sql, input, (err, rows) => {

    if (err) {
      throw err;
    }

    db.close();

    // Put each result into an array
    rows.forEach((row) => {
      verses.push(row)
    });

    // Render the results
    res.render('pages/index', {
      verseAmount: verses.length,
      bibleBooks: bibleBooks,
      verses: verses,
      highlightSearchResult: highlightSearchResult,
      searchQuery: words,
      previousBook: previousBook,
      previousChapter: previousChapter,
      previousVerse: previousVerse,
      previousWords: previousWords,
      previousLanguage: previousLanguage,
      languages: languages,
      bibleBooksArray: bibleBooksArray,
      formatLang: formatLang
    }); 

  });
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
