# Bible Search
#### Video Demo: https://youtu.be/kHLjc7vCNWg
#### Description: A Bible web app

The Bible search web application you described is built using Node.js, SQLite3, HTML, and CSS (Bootstrap). Its purpose is to allow users to view and search the Bible in different languages, with the ability to specify specific content they are looking for.

The backend of the application is powered by Node.js, specifically the src/index.js file. This file handles GET and POST requests, as well as other backend tasks. It also includes a books.txt file which contains the names of all the books in the Protestant Bible, loaded into dictionaries and an array. This allows users to enter the name of a book and retrieve its corresponding numeric value, as the database's book column uses numeric values.

There are three functions defined within the application:

highlightedResult: This function highlights the keyword searched for by making it red. It is used to visually emphasize the search term in the search results.

guessInput: This function helps users by allowing them to enter abbreviated book names. For example, entering "Gen" instead of "Genesis" or "Ecc" instead of "Ecclesiastes" will still yield the desired results.

formatLang: This function formats the language selector, capitalizing each language and adding the ".db" extension at the end. For example, it transforms "english" to "English.db".

The app's default GET route initially displays no verses, but retains the previous user's entries (such as the last selected book or language) for ease of use.

The app's POST route retrieves user input, stores it in the corresponding previous entries, and then queries the database. It begins with a default SQL string and checks if the user has searched for a range of chapters or verses (e.g., "1-5" in the chapters/verses input). If a range is specified, the query is modified accordingly to display the correct results.

After retrieving the results, each result is added to an array and sent to the .ejs template file. The template file, src/pages/index.ejs, serves as the website's layout. It checks if the previous language is the same as the current language selected. If they are the same, nothing is done. Otherwise, the new language is posted.

For each verse, the template formats and displays the book name, chapter, verse, and the actual verse text. If there was a query with keywords, the keywords in the verse are highlighted.

In summary, the web application allows users to search and view Bible verses in different languages. The backend handles requests and database queries, while the frontend template displays the search results and provides a user-friendly interface for selecting books and languages.
