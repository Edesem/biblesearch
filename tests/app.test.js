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

  test('guessInput matches abbreviated book names', () => {
    expect(app.guessInput('Gen')).toBe('Genesis');
  });
});
