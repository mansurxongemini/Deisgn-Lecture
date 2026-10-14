/**
 * YURIST STUDIO — REAL BROWSER LATENCY BENCHMARK (Item 2 Verification)
 *
 * Haqiqiy Google Chrome brauzerida 20 sahifalik hujjat o'rtasida
 * yozish paytida "input" hodisasidan keyingi chizilgan kadrgacha
 * (React render + DOM balandlik o'lchovi + layout + paint) bo'lgan
 * kechikishni (latency) o'lchash.
 */

import puppeteer from 'puppeteer-core';

async function runBenchmark() {
  console.log('🚀 Chrome ishga tushirilmoqda (/bin/google-chrome)...');

  const browser = await puppeteer.launch({
    executablePath: '/bin/google-chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1440,900'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Onboarding modalini chetlab o'tish
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('yurist_onboarding_completed', 'true');
    localStorage.setItem('yurist_preview_output_mode', 'a4');
  });

  console.log('🌐 http://localhost:5173 sahifasiga ulanmoqda...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

  // 20 sahifalik katta yuridik hujjat manbasini shakllantirish
  const twentyPageMarkdown = generate20PageMarkdown();

  console.log('📄 20 sahifalik namunaviy hujjat yuklanmoqda...');
  await page.evaluate((mdContent) => {
    // View mode: Ikkalasi
    const bothBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Ikkalasi')
    );
    if (bothBtn) bothBtn.click();

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
    if (textarea) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(textarea, mdContent);
      } else {
        textarea.value = mdContent;
      }
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, twentyPageMarkdown);

  // Pagination va render to'liq yakunlanishini kutamiz
  await page.waitForSelector('.preview-container .a4-sheet', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));

  const pageCount = await page.evaluate(() => {
    return document.querySelectorAll('.preview-container .a4-sheet').length;
  });
  console.log(`📄 Jami A4 sahifalar soni: ${pageCount}`);

  // 30 ta yozish siklida muharrir (Editor) kechikishini o'lchash (input hodisasidan paint gacha)
  console.log('⏱️ 20 sahifalik hujjat o‘rtasida 30 ta klaviatura zarbasida (keystrokes) paint latency o‘lchanmoqda...');
  const editorLatencies: number[] = [];

  for (let i = 0; i < 30; i++) {
    const latency = await page.evaluate(async (step) => {
      const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement | null;
      if (!textarea) return null;

      const mid = Math.floor(textarea.value.length / 2);
      const val = textarea.value.slice(0, mid) + ' ' + step + textarea.value.slice(mid);

      const t0 = performance.now();
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(textarea, val);
      } else {
        textarea.value = val;
      }
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      // Double requestAnimationFrame: brauzer layout + React render + paint to'liq chizilishini kutish
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      });

      return performance.now() - t0;
    }, i);

    if (latency !== null) {
      editorLatencies.push(latency);
    }
    await new Promise((r) => setTimeout(r, 60));
  }

  editorLatencies.sort((a, b) => a - b);
  const median = editorLatencies[Math.floor(editorLatencies.length * 0.5)];
  const p95 = editorLatencies[Math.floor(editorLatencies.length * 0.95)];
  const max = editorLatencies[editorLatencies.length - 1];
  const min = editorLatencies[0];

  console.log('\n📊 REAL CHROME BROWSER LATENCY NATIJALARI (20 sahifalik hujjat o‘rtasida):');
  console.log(`- Sinovlar soni: ${editorLatencies.length}`);
  console.log(`- Min: ${min.toFixed(2)} ms`);
  console.log(`- Median: ${median.toFixed(2)} ms`);
  console.log(`- p95: ${p95.toFixed(2)} ms`);
  console.log(`- Max: ${max.toFixed(2)} ms`);
  console.log(`- Talab: Median <= 50 ms. Natija: ${median <= 50 ? '✅ A’LO (PASS)' : '❌ CHEGARADAN YUQORI'}`);

  await browser.close();
  return { min, median, p95, max };
}

function generate20PageMarkdown(): string {
  let md = `# O‘zbekiston Respublikasi Mehnat va Fuqarolik Qonunchiligi Kengaytirilgan Kursi\nmuallif: TDYU Ilmiy Kengashi\nmuassasa: Toshkent Davlat Yuridik Universiteti\nuslub: classic\n\n`;

  for (let s = 1; s <= 12; s++) {
    md += `## ${s}-Bob. Huquqiy munosabatlarning nazariy va amaliy asoslari\n`;
    md += `Ushbu bob mehnat va fuqarolik huquqining asosiy qoidalarini, subyektlar huquq va majburiyatlarini to‘liq o‘rganadi.\n\n`;

    md += `### ${s}.1. Asosiy Qoidalar va Subsidiar Qo‘llanish\n`;
    md += `Mehnat munosabatlarida qonuniylik, adolat va ijtimoiy himoya prinsiplari ustuvor ahamiyatga ega bo‘lib, fuqarolik qonunchiligi bilan o‘zaro uzviy bog‘liqdir.\n\n`;

    md += `> norma: Mehnat kodeksi ${s * 10}-moddasi\n`;
    md += `Xodim va ish beruvchi o‘rtasida mehnat shartnomasi tuzilgan paytdan e’tiboran mehnat munosabatlari vujudga keladi.\n\n`;

    md += `| T/r | Huquqiy kategoriya | Tushunchasi | Huquqiy oqibatlari |\n`;
    md += `| --- | --- | --- | --- |\n`;
    md += `| 1 | Mehnat shartnomasi | Xodim va ish beruvchi kelishuvi | Majburiyatlar yuzaga kelishi |\n`;
    md += `| 2 | Sinov muddati | Kasbiy layoqatni tekshirish | 3 oygacha muddat belgilanadi |\n`;
    md += `| 3 | Mehnat intizomi | Ichki tartib qoidalariga rioya | Intizomiy jazo choralari |\n\n`;

    md += `### ${s}.2. Muhim Tushunchalar va Kazus Tahlili\n`;
    md += `> ta’rif: Majburiy mehnat\n`;
    md += `Qandaydir jazo qo‘llash bilan tahdid qilish orqali ish bajarishga majburlash qat’iyan man etiladi.\n\n`;

    md += `> kazus: Ishga tiklash bo‘yicha nizoli vaziyat\n`;
    md += `Xodim homiladorlik davrida ish beruvchining tashabbusi bilan asossiz ishdan bo‘shatilgan.\n`;
    md += `Sud qarori bilan xodim darhol avvalgi lavozimiga tiklandi va majburiy progul uchun kompensatsiya to‘landi.\n\n`;

    md += `- Xodimning qonuniy huquqlari to‘liq tiklanishi shart\n`;
    md += `- Ma’naviy zarar uchun moddiy kompensatsiya undirilishi lozim\n`;
    md += `- Aybdor mansabdor shaxsga nisbatan qonuniy chora ko‘riladi\n\n`;
  }

  return md;
}

runBenchmark().catch(console.error);
