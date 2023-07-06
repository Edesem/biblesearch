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

