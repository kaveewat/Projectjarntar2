const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function checkPlayer(efhubId) {
  const url = 'https://efhub.com/en/players/' + efhubId;
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120' },
    timeout: 10000,
  });
  const html = await r.text();
  const c = cheerio.load(html);
  
  // Print all relevant meta tags
  console.log('--- title ---', c('title').text());
  c('meta').each((i, el) => {
    const n = c(el).attr('name') || c(el).attr('property') || '';
    const v = c(el).attr('content') || '';
    if (n && v) console.log('META', n, ':', v.substring(0, 200));
  });
  
  // Find numbers in head area
  const headHtml = c('head').html() || '';
  const numbers = headHtml.match(/\b\d{2,3}\b/g) || [];
  console.log('Numbers in head:', [...new Set(numbers)].slice(0,20));
}

// Test with Lionel Messi
checkPlayer('89138556575063').then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
