const https = require('https');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getWikiImages(title) {
  return new Promise(resolve => {
    const url = 'https://en.wikipedia.org/w/api.php?action=query&titles=' + encodeURIComponent(title) + '&prop=images&format=json';
    https.get(url, { headers: { 'User-Agent': 'MorePaperFinancialBot/1.0 (info@morepaper.com)' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          const pages = j.query.pages;
          for (const k in pages) {
            resolve({ title, images: (pages[k].images || []).map(i => i.title) });
          }
        } catch(e) { resolve({ title, error: d.slice(0, 80) }); }
      });
    }).on('error', e => resolve({ title, error: e.message }));
  });
}

function getDirectUrl(fileTitle) {
  return new Promise(resolve => {
    const url = 'https://en.wikipedia.org/w/api.php?action=query&titles=' + encodeURIComponent(fileTitle) + '&prop=imageinfo&iiprop=url&format=json';
    https.get(url, { headers: { 'User-Agent': 'MorePaperFinancialBot/1.0 (info@morepaper.com)' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          const pages = j.query.pages;
          for (const k in pages) {
            if (pages[k].imageinfo) {
              resolve(pages[k].imageinfo[0].url);
              return;
            }
          }
          resolve(null);
        } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function searchAll() {
  const titles = [
    'Flash (Barry Allen)',
    'Thor (Marvel Cinematic Universe)',
    'Loki (Marvel Cinematic Universe)',
    'Stephen Strange (Marvel Cinematic Universe)',
    'Natasha Romanoff (Marvel Cinematic Universe)',
    'Spawn (character)'
  ];

  for (const t of titles) {
    await sleep(1500);
    const res = await getWikiImages(t);
    console.log(t, '->', res.images);
    if (res.images && res.images.length > 0) {
      for (const img of res.images) {
        if (img.endsWith('.png') || img.endsWith('.jpg')) {
          await sleep(1000);
          const u = await getDirectUrl(img);
          console.log('   File:', img, 'URL:', u);
        }
      }
    }
  }
}

searchAll();
