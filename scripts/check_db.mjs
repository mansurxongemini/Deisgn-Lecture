import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
const page = await browser.newPage();
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
const docs = await page.evaluate(async () => {
  return new Promise((resolve) => {
    const req = indexedDB.open('yurist_studio_workspace_db', 1);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('documents', 'readonly');
      const store = tx.objectStore('documents');
      const getAll = store.getAll();
      getAll.onsuccess = () => resolve(getAll.result);
      getAll.onerror = () => resolve([]);
    };
    req.onerror = () => resolve([]);
  });
});
console.log('IndexedDB Docs Count:', docs.length);
docs.forEach(d => {
  console.log(`- ID: ${d.id}, Title: "${d.title}", ContentLength: ${d.content?.length}`);
  console.log(`  Snippet: ${d.content?.slice(0, 150)}...\n`);
});

await browser.close();
