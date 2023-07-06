// Import
const http = require('http');
const express = require('express');
const fs = require('fs');
const sqlite = require('sqlite3').verbose();
const bodyParser = require('body-parser');

// Define consts
const app = express();
const hostname = '127.0.0.1'
const port = 3000

// Define previous entries
previousBook = '';
previousChapter = '';
previousVerse = '';
previousWords = '';
previousLanguage = 'english.db';

languages = []

fs.readdir('../databases/', (err, files) => {
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

// Serve static files from the '.' directory
app.use(express.static('.'));

// Use url encoded
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON bodies
app.use(bodyParser.json());

// Read biblical books into dictionary
const bibleBooks = {};
const bibleNumbers = {};
const bibleBooksArray = [];
fs.readFile('books.txt', 'utf8', (err, data) => {
  if (err) {
    return console.error(err.message);
  }

  // Split the data into an array of book titles
  const bookTitles = data.trim().split('\n');
  // Create the dictionary
  bookTitles.forEach((title, index) => {
    const bookNumber = index;

    // Set the two different dictionarties
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
      formatLang: formatLang
    });
});




// Post reqeust
app.post('/', (req, res) => {
  const verses = [];
  const inputData = req.body;

  // Get user input
  book = inputData.book || '';
  
  // If book is has input, then guess input
  if (book) {
    book = guessInput(book);
  }

  chapter = inputData.chapter;
  verse = inputData.verse;
  words = inputData.words;
  language = inputData.language;

  // Set previous enteries
  previousBook = book
  previousChapter = chapter
  previousVerse = verse
  previousWords = words
  previousLanguage = language

  // Connect to db
  let db = new sqlite.Database('../databases/' + language, sqlite.OPEN_READONLY, (err) => {
    if (err) {
      return console.error(err.message);
    }
  });
  

  // Set search query
  sql = 'SELECT * FROM bible WHERE Book = COALESCE(?, Book) AND verse LIKE COALESCE(?, verse)';
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
      formatLang: formatLang
    }); 

  });
});








/// Establish connection ///
app.listen(process.env.PORT || 3000, () => console.log('App avaible on http://' + hostname + ':' + port));
