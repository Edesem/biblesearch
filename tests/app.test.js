const request = require('supertest');
const app = require('../src/index');

describe('helpers', () => {
  test('formatLang strips .db and capitalises', () => {
    expect(app.formatLang('english.db')).toBe('English');
  });

  test('highlightSearchResult wraps matches case-insensitively', () => {
    expect(app.highlightSearchResult('In the Beginning', 'beginning')).toBe(
      'In the <span class="highlight">Beginning</span>'
    );
  });

  test('highlightSearchResult treats regex characters literally', () => {
    expect(app.highlightSearchResult('a (b) c', '(b)')).toBe('a <span class="highlight">(b)</span> c');
  });

  test('highlightSearchResult returns text unchanged without a query', () => {
    expect(app.highlightSearchResult('text', '')).toBe('text');
  });
});

describe('routes', () => {
  beforeAll(() => new Promise((resolve) => setTimeout(resolve, 200)));

  test('GET / renders the page', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<html');
  });

  test('POST / returns Genesis 1:1', async () => {
    const res = await request(app)
      .post('/')
      .type('form')
      .send({ book: 'Gen', chapter: '1', verse: '1', words: '', language: 'english.db' });
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/beginning/i);
  });

  test('GET / with query params returns shareable results', async () => {
    const res = await request(app).get('/').query({ book: 'Genesis', chapter: '1', verse: '1', language: 'english.db' });
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/beginning/i);
  });

  test('GET / without params shows no previous search', async () => {
    const res = await request(app).get('/');
    expect(res.text).toContain('Try');
    expect(res.text).not.toContain('No verses found');
  });

  test('a search with no matches says so', async () => {
    const res = await request(app).get('/').query({ book: 'Genesis', chapter: '1', words: 'zzzzqx' });
    expect(res.text).toContain('No verses found');
    expect(res.text).toContain('Search all of Genesis');
  });

  test('regex characters in the search words do not crash', async () => {
    const res = await request(app).get('/').query({ words: '(' });
    expect(res.status).toBe(200);
  });

  test('guessInput matches abbreviated book names', () => {
    expect(app.guessInput('Gen')).toBe('Genesis');
  });
});
