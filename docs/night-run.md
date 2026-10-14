# Yurist Studio — Night Run Audit & Visual Defect Log

> **Loyiha**: Yurist Studio — O‘quv Hujjatlari Muharriri  
> **Sana**: 2026-10-03  
> **Bosqich**: TASK 1/20 — FOUNDATION AUDIT  
> **Holat**: Tizim barqarorligi va poydevor auditi to‘liq yakunlandi (Build: PASS, Lint: PASS, Tests: 83/83 PASS).

---

## 1. Texnik Tekshiruv Natijalari (Verification Gates)

| Tekshiruv turi | Buyruq | Natija | Izoh |
| :--- | :--- | :--- | :--- |
| **TypeScript & Build** | `npm run build` | **MUVAFFAQ TARZDA O‘TDI (PASS)** | Hech qanday TypeScript xatosi yo‘q; to‘liq `tsc -b && vite build` devoriy vaqti (wall-clock time): ~3.4s (faqat Vite ichki bosqichi ~315ms emas). |
| **Linter tekshiruvi** | `npm run lint` | **MUVAFFAQ TARZDA O‘TDI (PASS)** | 67 ta faylda 0 ta xatolik (0 errors). |
| **Barcha Testlar** | `npm test` | **83/83 MUVAFFAQ TARZDA O‘TDI (PASS)** | 10 ta test to‘plami to‘liq o‘tdi (DOM invariantlari, qirqilish (clipping) yo‘qligi, o‘lcham standartlari). |

---

## 2. Puppeteer Skrinshotlari va Holatlar Tahlili

Quyidagi skrinshotlar `scripts/capture-night-run.mjs` orqali to‘liq avtomatlashtirilgan tarzda olingan:

### 2.1. Ko‘rinish Rejimlari (Desktop — 1440px)

1. **Boshlang‘ich holat (Default State — Ikkalasi rejimi)**  
   Fayl: [01_default_state_1440px.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/01_default_state_1440px.png)  
   ![Boshlang'ich holat](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/01_default_state_1440px.png)  
   *Tahlil*: Chap panelda hujjatlar daraxti, o‘rtada MD+ muharriri, o‘ng tomonda 9:16 o‘quv kartochkasi preview oynasi joylashgan. Chiziqlar va bo‘shliqlar toza.

2. **Yozish rejimi (Edit Mode)**  
   Fayl: [02_yozish_1440px.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/02_yozish_1440px.png)  
   ![Yozish rejimi](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/02_yozish_1440px.png)  
   *Tahlil*: Muharrir to‘liq kenglikda ochiladi. Qator raqamlari, asboblar paneli va holat paneli to‘liq ko‘rinadi.

3. **Ko‘rish rejimi (Preview Mode)**  
   Fayl: [03_korish_1440px.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/03_korish_1440px.png)  
   ![Ko'rish rejimi](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/03_korish_1440px.png)  
   *Tahlil*: 9:16 kartochka ekranning markazida silliq joylashgan, yuqori boshqaruv paneli (`< 1 / 4 karta >`, masshtab, to‘liq ekran) to‘liq ishlaydi.

4. **Ikkalasi rejimi (Both Mode)**  
   Fayl: [04_ikkalasi_1440px.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/04_ikkalasi_1440px.png)  
   ![Ikkalasi rejimi](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/04_ikkalasi_1440px.png)  
   *Tahlil*: Yozish va jonli ko‘rish oynasi 50/50 mutanosiblikda silliq ishlamoqda.

---

### 2.2. Hujjat Uslublari (All 4 Document Styles — 1440px)

1. **Mumtoz uslub (Classic)**  
   Fayl: [05_theme_classic_1440px.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/05_theme_classic_1440px.png)  
   ![Mumtoz uslub](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/05_theme_classic_1440px.png)  
   *Tahlil*: Lora va Merriweather serifi, klassik kitob nashriyoti uslubi, yumshoq fon rangi (`#FAF8F5`).

2. **Zamonaviy uslub (Modern)**  
   Fayl: [06_theme_modern_1440px.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/06_theme_modern_1440px.png)  
   ![Zamonaviy uslub](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/06_theme_modern_1440px.png)  
   *Tahlil*: Geometrik sans-serif (Inter / Plus Jakarta Sans), chuqur to‘q ko‘k aksentlar, zamonaviy tahririy ko‘rinish.

3. **Qorong‘i uslub (Dark)**  
   Fayl: [07_theme_dark_1440px.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/07_theme_dark_1440px.png)  
   ![Qorong'i uslub](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/07_theme_dark_1440px.png)  
   *Tahlil*: Chuqur to‘q kulrang-ko‘k fon (`#101726`), oltin rangli adolat tarozisi va yuqori kontrastli oq sarlavhalar. Matn o‘qilishi 7:1 dan yuqori kontrastda.

4. **Minimal uslub (Minimal)**  
   Fayl: [08_theme_minimal_1440px.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/08_theme_minimal_1440px.png)  
   ![Minimal uslub](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/08_theme_minimal_1440px.png)  
   *Tahlil*: Toza oq fon, yengil chegaralar, minimalistik tipografik urg‘ular.

---

### 2.3. To‘liq Ekran Taqdimot Rejimi (Fullscreen Presentation)

Fayl: [09_fullscreen_presentation_1440px.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/09_fullscreen_presentation_1440px.png)  
![To'liq ekran rejimi](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/09_fullscreen_presentation_1440px.png)  
*Tahlil*: Avvalgi kichik va qora bo‘lib qolish muammosi to‘liq bartaraf etildi. O‘quv kartochkasi ekran balandligining 94% qismini to‘ldiradi, o‘zining haqiqiy hujjati foni va ranglarida aks etadi, chap/o‘ng o‘tkazish tugmalari hamda `01 / 04` hisoblagichi ravshan joylashgan.

---

### 2.4. Mobil Moslashuvchanlik (Mobile — 360px)

1. **Mobil Boshlang‘ich Holat (360px)**  
   Fayl: [10_mobile_360px_default.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/10_mobile_360px_default.png)  
   ![Mobil boshlang'ich](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/10_mobile_360px_default.png)  
   *Tahlil*: 360px ekranda yon menyu avtomatik berkitilib, kartochka markazga 32% masshtab bilan chiroyli sig‘dirilgan.

2. **Mobil Yozish Rejimi (360px)**  
   Fayl: [11_mobile_360px_yozish.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/11_mobile_360px_yozish.png)  
   ![Mobil Yozish](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/11_mobile_360px_yozish.png)  
   *Tahlil*: Mobil qurilmada to‘liq ekranli matn muharriri ishlaydi.

3. **Mobil Ko‘rish Rejimi (360px)**  
   Fayl: [12_mobile_360px_korish.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/12_mobile_360px_korish.png)  
   ![Mobil Ko'rish](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/12_mobile_360px_korish.png)

---

## 3. Aniqlangan Kamchiliklar va Yechimlar Jurnali (Visual Defect Log)

| № | Kamchilik tavsifi | Qayerda aniqlandi | Holati | Qo‘llanilgan / Rejalashtirilgan Yechim |
|---|---|---|---|---|
| **1** | **To‘liq ekranda kartochkaning kichik va qora bo‘lib chiqishi** | To‘liq ekran (Fullscreen overlay) | **TUZATILDI** | `fullscreenScale` dinamik hisoblandi (`(vh * 0.94) / 1920`), kartochkaga o‘zining `var(--doc-bg)` foni bog‘landi. |
| **2** | **Muharrirda so‘z o‘chirilganda kursorning eng oxirgi qatorga sakrab ketishi** | MD+ matn muharriri (`MdEditor.tsx`) | **TUZATILDI** | `selectionRangeRef` va `useLayoutEffect` orqali kursor holati (selectionStart/End) saqlab qolindi va har bir tahrirda tiklandi. |
| **3** | **Mobil ekranda (360px) yuqori asboblar panelining gorizontal cho‘zilishi** | Yuqori boshqaruv paneli | **KUZATILDI (Rejada)** | `overflow-x: auto` tufayli sahifa buzilmaydi, biroq kichik ekranlar uchun "Eksport" va "Qo‘llanma"ni ixcham menyuga yig‘ish tavsiya etiladi. |
| **4** | **Qator raqamlari bilan matn balandligi o‘rtasida sinxronlik** | Muharrir chap qismi | **TUZATILDI** | Qator balandligi `1.6`, shrift `13.5px` va `padding: 16px` ga to‘liq tenglashtirildi. |
| **5** | **Uslublar o‘rtasida almashganda markdown sarlavhasiga uslub yozilishi** | `App.tsx` (handleThemeChange) | **TEKSHIRILDI** | Hujjat matniga `uslub: <nom>` tegi to‘g‘ri yozilib, AST bilan sinxron yangilanmoqda. |
| **6** | **DOM qirqilishi (clipping) va gorizontal oqib ketish (overflow)** | Barcha sahifalar | **0 TA XATO** | Real DOM auditida 0px clipping (`scrollHeight <= clientHeight`) va 0px body horizontal overflow qayd etildi. |

---

## 4. Keyingi Vazifalar Uchun Xulosa

TASK 1/20 (Foundation Audit) to‘liq bajarildi:
- Loyiha TypeScript, linter va test standartlari bo‘yicha toza.
- Barcha 12 ta muhim ko‘rinish skrinshotlari olinib, saqlandi.
- Kamchiliklar va ularning yechimlari to‘liq hujjatlashtirildi.

---

## 5. TASK 2/20 — DATA SAFETY (Ma’lumotlar Xavfsizligi va Butunligi)

> **Vazifa maqsadi**: Foydalanuvchi yozgan hech bir ma’lumot yo‘qolmasligi, noto‘g‘ri hujjat ustiga yozilmasligi, ko‘p oynalarda qoralamalar o‘chib ketmasligi, uzun matnlar qirqilmasdan to‘liq keyingi kartochkalarga o‘tishi hamda har qanday ko‘rinish rejimidan to‘liq PDF eksport qilinishini kafolatlash.

### 5.1. Amalga Oshirilgan Xavfsizlik Mexanizmlari

| № | Talab | Amalga oshirilgan yechim | Holati |
|---|---|---|---|
| **1** | **Haqiqiy saqlash holati (Truthful save status)** | Holatlar to‘liq ajratildi: `O‘zgartirilgan` (yozilganda darhol), `Saqlanmoqda…` (IndexedDB yozish boshlanganda), `Saqlandi` (faqatgina IndexedDB tranzaksiyasi to‘liq tasdiqlangach), `Xatolik` / `Ziddiyat` (muammo chiqsa). "Saqlandi" soxta kechikishsiz faqat ma’lumot omborga muvaffaqiyatli tushgach ko‘rsatiladi. | **TO‘LIQ BOSHINCHA ISHLAMOQDA** |
| **2** | **Hujjatlar o‘rtasida tezkor almashishda adashmaslik (Zero Cross-Saving)** | Hujjat almashtirilganda (`handleSelectDoc`), avvalgi o‘zgartirilgan qoralama darhol o‘zining ID si ostida xotiraga fiksatsiya qilinadi va saqlanadi. `switchSeq` va `activeDocIdRef` tekshiruvi orqali yangi ochilgan hujjat ustiga eski hujjat matni yozilib qolishi (cross-save) 100% bartaraf etildi. | **BARQARORLASHTIRILDI** |
| **3** | **Ko‘p oynali rejimda (Multi-tab) qoralamani himoyalash** | Boshqa brauzer oynasida hujjat saqlanganda, `BroadcastChannel` orqali joriy oynadagi qoralama tekshiriladi (`hasDirtyDraft`). Agar joriy oynada saqlanmagan o‘zgarish bo‘lsa, u boshqa oynadan kelgan ma’lumot bilan aslo o‘chirib yuborilmaydi (never overwritten). Aksincha, ziddiyat ogohlantirishi chiqariladi. | **HIMOYALANDI** |
| **4** | **Qirqilishsiz sahifalash (Zero Clipping Pagination)** | `.card-content-area` uslubidan `overflow: hidden` butunlay olib tashlandi (`overflow: visible`). Uzun paragraflar, kazus qoidalari va xulosalari, savol-javob kartalari matni sig‘maganda keyingi kartochkalarga uzluksiz bo‘lib o‘tkaziladi (`[Davomi...]`). Kartochkalar soni dinamik oshadi. | **TO‘LIQ AMALGA OSHIRILDI** |
| **5** | **Barcha 3 ta ko‘rinish rejimidan to‘liq PDF eksport** | Bosmaga chiqarish (`@media print`) uchun doimiy `#print-export-host` mexanizmi ulandi. `Ikkalasi`, `Yozish` va `Ko‘rish` rejimlarining har birida PDF eksport bir xil, barcha sahifalarni to‘liq o‘z ichiga olgan holda generatsiya qilinadi. | **YAGONA STANDARTGA KELTIRILDI** |

---

### 5.2. Vizual va Avtomatlashtirilgan Tekshiruv Natijalari

Puppeteer orqali 3000+ belgili (haqiqiy testda 5982 belgi) katta yuridik matn, kazuslar va qonun normalari kiritilib, to‘liq vizual va dasturiy sinov o‘tkazildi:

1. **Haqiqiy Saqlash Holati Sinovi:**
   - Matn kiritilishi bilanoq holat: `O‘zgartirilgan`
   - IndexedDB tasdig‘idan so‘ng holat: `Saqlandi`
   - Dalil skrinshot: [01_saved_status_verified.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task2/01_saved_status_verified.png)

2. **Sahifalash va Qirqilish Natijalari (DOM Audit):**
   - Jami hosil bo‘lgan o‘quv kartochkalari soni: **21 ta**
   - DOM qirqilish holatlari (`clippingIssues`): **0 ta**
   - Tushib qolgan yoki yo‘qotilgan so‘zlar soni (`missingWordsCount`): **0 ta**
   - Har bir sahifa uchun olingan 21 ta skrinshot:
     - [page_01.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task2/page_01.png) dan [page_21.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task2/page_21.png) gacha to‘liq saqlandi.

3. **Barcha 3 Rejimdan PDF Eksport Natijalari:**
   - **Ikkalasi rejimi (Both):** [export_ikkalasi.pdf](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task2/export_ikkalasi.pdf) (Hajmi: 77 790 bayt, barcha sahifalar to‘liq mavjud).
   - **Yozish rejimi (Edit):** [export_yozish.pdf](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task2/export_yozish.pdf) (Hajmi: 77 790 bayt, barcha sahifalar to‘liq mavjud).
   - **Ko‘rish rejimi (Preview):** [export_ko‘rish.pdf](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task2/export_ko‘rish.pdf) (Hajmi: 77 790 bayt, barcha sahifalar to‘liq mavjud).

4. **Tezkor Almashish Stress-Testi:**
   - Hujjatlar ketma-ket tez bosilganda hech qanday matn chalkashuvi (cross-save) sodir bo‘lmadi, yakuniy holat muvaffaqiyatli saqlandi.

---

### 5.3. Avtomatlashtirilgan Birlik Testlari

Yangi yaratilgan `src/tests/dataSafety.test.ts` test to‘plami quyidagi talablarni qat’iy tekshiradi:
- `splitTextIntoChunks`: So‘zlarning bittasi ham yo‘qolmasligi va barcha qismlar yaxlit yig‘ilishi.
- `3000-char paragraph`: Uzoq matnlarning 9:16 kartochkalarga to‘g‘ri taqsimlanishi va uzluksiz davom etishi.
- `Kazus splitting`: Kazus faktlari va xulosalari qirqilmasdan keyingi kartalarga ko‘chishi.
- `Flashcard QA splitting`: Savol-javob kartochkalarining sig‘magan qismlari kartalar sonini oshirib joylashishi.

---

## 6. TASK 3/20 — RUNTIME DESIGN TOKEN ENGINE (Jonli Dizayn Tokenlari Tizimi)

> **Vazifa maqsadi**: Ilovaning barcha ko‘rinish elementlari (ranglar, shrift o‘lchamlari, hoshiyalar, radius va soyalar)ni qat’iy tiplashtirilgan yagona reestrga birlashtirish, qattiq yozilgan qiymatlarni yo‘qotish hamda foydalanuvchi interfeysni sahifani qayta yuklamasdan (runtime) jonli o‘zgartirishi va saqlashi uchun zamin yaratish.

### 6.1. Reestr va Modulli Arxitektura

1. **Yagona tiplashtirilgan reestr (`src/design/tokens.ts`):**
   - Har bir token qat’iy tuzilmaga ega:
     - `id`: Yagona identifikator (masalan: `ui_accent`, `doc_bg`, `canvas_font_h1`).
     - `cssVar`: Standartlashtirilgan CSS o‘zgaruvchi nomi (`--accent`, `--doc-bg`, `--canvas-font-h1`).
     - `label`: O‘zbek tilidagi tushunarli nomi.
     - `category`: `color` | `typography` | `spacing` | `radius` | `shadow` | `layout`.
     - `type`: `color` | `size` | `font` | `spacing` | `radius` | `shadow`.
     - `defaultValue`: Dastlabki standart qiymat.
     - `min` / `max` / `step` / `unit`: Sonli o‘lchamlar uchun chegaralar va birliklar (`px`).
     - `scope`: `ui` (ilova qobig‘i) yoki `doc` (9:16 o‘quv kartochkalari).

2. **Ikki qatlamli ko‘lam (Two Scopes):**
   - `data-ui-theme` — Yuqori navbar, yon menyu, tugmalar, modallar va vidjetlar.
   - `data-document-theme` — 9:16 formatidagi o‘quv kartochkalari (`.study-card-9-16`, `.print-study-card`).

3. **Jonli boshqaruv dvigateli (`src/design/applyTokens.ts`):**
   - `setToken(id, value)`: CSS o‘zgaruvchisini zudlik bilan jonli ravishda yangilaydi (hech qanday sahifani yangilashsiz), o‘zgarishlarni IndexedDB (`user_meta` ombori)ga muhrlaydi.
   - `resetToken(id)`: Muayyan tokenni standart holatiga qaytaradi.
   - `resetAll()`: Barcha foydalanuvchi o‘zgartirishlarini tozalab, asl dizayn standartini tiklaydi.
   - DevTools yoki konsol orqali to‘g‘ridan-to‘g‘ri boshqarish uchun `window.setToken`, `window.resetToken`, `window.resetAll` global funksiyalari ulandi.

---

### 6.2. Qattiq Kodlangan Qiymatlarni Almashtirish Statistikasi (Before / After)

Loyiha bo‘ylab barcha komponent CSS fayllari tekshirilib, qattiq kodlangan piksellar va ranglar tokenlarga to‘liq o‘tkazildi:

| CSS Fayl | Hex Ranglar (Oldin / Keyin) | Shrift o‘lchami (Oldin / Keyin) | Padding (Oldin / Keyin) | Border-radius (Oldin / Keyin) |
|---|:---:|:---:|:---:|:---:|
| `src/App.css` | 1 → **0** | 10 → **0** | 14 → **0** | 0 → **0** |
| `src/components/preview/preview.css` | 11 → **0** | 58 → **0** | 40 → **0** | 16 → **0** |
| `src/components/editor/editor.css` | 0 → **0** | 7 → **0** | 13 → **0** | 0 → **0** |
| `src/components/sidebar/sidebar.css` | 57 → **0** | 8 → **0** | 17 → **0** | 5 → **0** |
| `src/components/palette/palette.css` | 20 → **0** | 3 → **0** | 8 → **0** | 4 → **0** |
| `src/components/guide/guide.css` | 44 → **0** | 0 → **0** | 17 → **0** | 13 → **0** |
| `src/components/blocks/blocks.css` | 0 → **0** | 0 → **0** | 26 → **0** | 9 → **0** |
| `src/index.css` | 0 → **0** | 0 → **0** | 0 → **0** | 0 → **0** |
| **JAMI KOMPONENTLARDA** | **133 → 0** | **86 → 0** | **135 → 0** | **47 → 0** |

*Izoh: Faqatgina `src/tokens/themes.css` faylida tokenlarning o‘ziga biriktirilgan boshlang‘ich 88 ta rang qiymati saqlanib, barcha komponentlarda qattiq qiymatlar 0 taga tushirildi.*

---

### 6.3. Vizual Tekshiruv va Puppeteer Sinov Natijalari

`scripts/verify-task3-token-engine.mjs` orqali to‘liq avtomatlashtirilgan real brauzer testi o‘tkazildi:

1. **Boshlang‘ich standart holat:**
   - Asosiy rang: `rgb(27, 42, 74)` (`#1B2A4A`), Karta foni: `rgb(250, 248, 245)` (`#FAF8F5`).
   - Dalil skrinshot: [01_baseline_default.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task3/01_baseline_default.png)

2. **Qayta yuklamasdan (Live Runtime) yangilanish:**
   - DevTools kontekstida `setToken('ui_accent', '#7C3AED')`, `setToken('doc_bg', '#FEF3C7')`, `setToken('canvas_font_h1', '68px')` buyruqlari berildi.
   - Natija: Tugmalar darhol yorqin binafsha rangga, karta foni iliq och sariq rangga kirdi, H1 sarlavhasi dinamik kattalashdi.
   - Dalil skrinshot: [02_runtime_tokens_applied.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task3/02_runtime_tokens_applied.png)

3. **Sahifani yangilaganda (Reload) xotiradan tiklanishi:**
   - Brauzer sahifasi qayta yuklandi (`page.reload()`).
   - O‘zgartirilgan ranglar va o‘lchamlar IndexedDB orqali to‘liq o‘z joyida saqlanib qolgani tasdiqlandi.
   - Dalil skrinshot: [03_reloaded_persistence_verified.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task3/03_reloaded_persistence_verified.png)

4. **Standart holatni tiklash (`resetAll()`):**
   - Barcha o‘zgarishlar bitta buyruq bilan to‘liq bekor qilindi va asl dizayn tizimi tiklandi.
   - Dalil skrinshot: [04_reset_defaults_restored.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task3/04_reset_defaults_restored.png)

---

### 6.4. Barcha Testlar va Sifat Nazorati

- **Barcha testlar:** 96/96 PASS (12 ta to‘plam, `tokenEngine.test.ts` va `invariants.test.ts` 100% yashil).
- **TypeScript & Build:** Muvaffaqiyatli yakunlandi (0 ta xatolik).
- **Linter:** 0 ta xatolik.

---

## 7. TASK 4/20 — "DIZAYN" CUSTOMIZATION PANEL (Dizayn Sozlamalari Paneli)

> **Vazifa maqsadi**: Yuqori boshqaruv menyusiga (navbar) "Dizayn" tugmasini qo‘shish, o‘ng tomondan ochiluvchi 360px kenglikdagi no-blocking (ilovaning qolgan qismini to‘sib qo‘ymaydigan va bir vaqtda tahrirlash imkonini beruvchi) vizual boshqaruv panelini yaratish hamda hujjat, interfeys va muharrir parametrlarini real vaqtda jonli tahrirlash mexanizmini to‘liq ishga tushirish.

### 7.1. Panelning Arxitekturasi va Tuzilishi (`src/components/design/DesignPanel.tsx`)

1. **No-Blocking va 200ms Silliq Harakat:**
   - Panel `workspace-container` ichiga o‘ng tomondan ulandi.
   - `width: 360px`, `flex-shrink: 0`, silliq `transition: 200ms cubic-bezier(0.16, 1, 0.3, 1)`.
   - Hech qanday ekranni to‘suvchi qorong‘i fon (backdrop overlay) mavjud emas — foydalanuvchi panel ochiq paytda chapdagi muharrirda matn yozishi, o‘rtadagi kartochkalarni varaqlashi va o‘zgarishlarni zudlik bilan kuzatishi mumkin.

2. **Uchta Asosiy Bo‘lim (Tabs):**
   - **"Hujjat" (Document style editing):**
     - Qog‘oz rangi (`doc_bg`), matn rangi (`doc_ink`), urg‘u rangi (`doc_accent`), hoshiya chegarasi (`doc_border`) — ixcham doiraviy rang tanlagichlar, HTML5 native color picker, hex kod kiritish va tezkor tayyor palitralar.
     - Sarlavha shrifti (`doc_font_heading`): Lora (Serif) / Inter (Sans) / Georgia / Tizim shriftlari.
     - Asosiy matn shrifti (`doc_font_body`): Lora / Inter / Georgia / Tizim shriftlari.
     - Matn o‘lchami slayderi (`canvas_font_body`): 28px dan 48px gacha 9:16 canvas masshtabi.
     - Qator oralig‘i slayderi (`doc_line_height`): 1.2 dan 2.2 gacha.
     - Kartochka ichki oralig‘i slayderi (`doc_padding_card`): 40px dan 100px gacha.
     - Burchak radiusi slayderi (`doc_radius_card`): 0px dan 60px gacha.
   - **"Interfeys" (UI Chrome editing):**
     - Asosiy urg‘u rangi (`ui_accent`), interfeys foni (`ui_bg`), chegara kuchi (`ui_line`).
     - UI shrift o‘lchami (`ui_font_size`): S (12px), M (Standart 13.5px), L (15px) tugmalari.
     - Interfeys zichligi (`ui_density`): Ixcham (compact), O‘rtacha (normal), Keng (comfortable).
   - **"Muharrir" (Editor editing):**
     - Shrift o‘lchami slayderi (`editor_font_size`): 11px dan 22px gacha.
     - Qator oralig‘i slayderi (`editor_line_height`): 1.2 dan 2.2 gacha.
     - Muharrir fon rangi (`editor_bg`): Sof oq (`#FFFFFF`), qog‘oz (`#FAF8F5`), salqin shifer (`#F1F5F9`), tungi shifer (`#1C1F26`).

3. **Jonli Yangilanish va Standartga Qaytarish Qoidalari:**
   - Har bir boshqaruv elementi qiymati o‘zgarganda to‘g‘ridan-to‘g‘ri `setToken()` funksiyasini chaqiradi va sahifa yangilanmasdan DOM hamda CSS o‘zgaruvchilarida jonli aks etadi.
   - Har bir qatorda alohida individual kichik qaytarish belgisi (`RotateCcw`) joylashgan bo‘lib, u faqat qiymat o‘zgartirilganda faollashadi.
   - Panel sarlavhasida butun faol bo‘limni bir tugma bilan boshlang‘ich holatiga keltiruvchi **"Standartga qaytarish"** (`resetTokens`) tugmasi mavjud.

---

### 7.2. Vizual Tekshiruv va Puppeteer Skrinshot Dalillari

`scripts/verify-task4-design-panel.mjs` orqali to‘liq avtomatlashtirilgan real brauzer sinovi o‘tkazildi:

1. **Panelning ochilishi va 360px No-Blocking Tuzilma:**
   - Yuqori paneldagi "Dizayn" tugmasi bosildi, panel silliq 200ms ichida ochildi (`rect.width: 360px`).
   - Muharrir va kartochkalar ko‘rinishi mutanosib qisqarib, to‘liq faol holatda qoldi.
   - Dalil skrinshot: [01_design_panel_opened.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task4/01_design_panel_opened.png)

2. **Hujjat uslublarini jonli tahrirlash:**
   - Qog‘oz rangi salqin kulrang (`#F1F5F9`), urg‘u rangi zumrad yashil (`#065F46`) va matn o‘lchami `46px` ga oshirildi.
   - O‘quv kartochkasi foni va urg‘ulari sahifani qayta yuklamasdan real vaqtda yangilandi:
     - `cardBg`: `rgb(241, 245, 249)`
     - `--doc-accent`: `#065F46`
     - `fontSize`: `46px`
   - Dalil skrinshot: [02_document_customized_live.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task4/02_document_customized_live.png)

3. **Interfeys bo‘limi:**
   - Asosiy rang, fon, chegara hamda UI font (S/M/L) va zichlik (Ixcham/O‘rtacha/Keng) sozlamalari tekshirildi.
   - Dalil skrinshot: [03_interfeys_tab.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task4/03_interfeys_tab.png)

4. **Muharrir bo‘limi:**
   - Markdown muharririning shrift o‘lchami, qator balandligi va fon ranglari tekshirildi.
   - Dalil skrinshot: [04_muharrir_tab.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task4/04_muharrir_tab.png)

5. **Bo‘limni standart holatga qaytarish ("Standartga qaytarish"):**
   - Hujjat bo‘limidagi "Standartga qaytarish" tugmasi bosildi. Barcha qiymatlar birlamchi standart qiymatlarga qaytdi (`cardBg: rgb(250, 248, 245)`, `bodySizeVar: 42px`).
   - Dalil skrinshot: [05_reset_restored.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task4/05_reset_restored.png)

6. **Panelni yopish:**
   - X tugmasi bosildi, panel 200ms ichida o‘ng tomonga silliq yopilib, ish maydoni yana 50/50 mutanosibligiga qaytdi.
   - Dalil skrinshot: [06_panel_closed.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task4/06_panel_closed.png)

---

### 7.3. Testlar va Sifat Ko‘rsatkichlari

- **To‘liq testlar:** 13 ta to‘plam, **104/104 PASS** (`designPanel.test.ts`, `invariants.test.ts`, `tokenEngine.test.ts` barchasi yashil).
- **TypeScript kompilyatsiyasi:** 0 ta xatolik (`tsc -b`).
- **Linter tekshiruvi:** 0 ta xatolik (`oxlint`).
- **Production Build:** Muvaffaqiyatli (`vite build`).

---

## 8. TASK 5/20 — PRESET LIBRARY (Tayyor Uslublar Kutubxonasi)

> **Vazifa maqsadi**: Token dvigateli asosida foydalanuvchilar uchun yuzlab professional tayyor uslublar variantlarini yaratish. Kamida 24 ta rang sxemasi (qog‘oz, siyoh, urg‘u, chegara), 8 ta tipografiya juftligi (sarlavha + matn), 6 ta tartib zichligi (ixchamdan kenggacha) va 6 ta muqova kompozitsiyasini ishlab chiqish hamda "Hujjat" bo‘limida jonli miniatyuralar (real rang/shriftlar) gridini integratsiya qilish. Foydalanuvchi preset ustidan qo‘lda o‘zgartirish kiritganda "O‘zgartirilgan" nishonini ko‘rsatish.

---

### 8.1. Kutubxona Arxitekturasi va Matritsasi (`src/design/presets.ts`)

Tayyor uslublar tizimi to‘rtta to‘liq erkin birlashuvchi o‘q (axes) bo‘yicha loyihalandi:

1. **24 ta Hujjat Rang Sxemasi (`COLOR_SCHEME_PRESETS`):**
   Har bir sxema 4 ta uyg‘un tokenlar to‘plamidan iborat (`doc_bg`, `doc_ink`, `doc_accent`, `doc_border`):
   - `warm_paper` (Iliq qog‘oz), `cool_gray` (Salqin kulrang), `cream` (Krem va Oltin), `sepia` (Sepiya arxivi), `slate` (Shifer toshi), `forest` (O‘rmon zumradi), `bordeaux` (Bordo sharobi), `midnight` (Yarim tun — to‘liq tungi mavzu), `parchment` (Pergament), `arctic` (Arktika musaffoligi), `sand` (Sahro qumi), `olive` (Zaytun bog‘i), `navy_academic` (Akademik moviy), `terracotta` (Pishgan g‘isht), `emerald` (Zumrad adolat), `monochrome` (Klassik monoxrom), `lavender` (Lavanda nafisi), `mocha` (Mokka qahvasi), `ivory_gold` (Fil suyagi va Zarrin), `graphite` (Grafit qalam), `rose_vintage` (Vintage atirgul), `nordic_fog` (Skandinaviya tumani), `sage_whisper` (Mavrak epkini), `royal_amber` (Qirollik qahrabosi).
   - Har biriga jozibador o‘zbekcha nom va huquqiy tushuntirish berildi.

2. **8 ta Tipografiya Juftligi (`TYPOGRAPHY_PAIR_PRESETS`):**
   Sarlavha va asosiy matn uyg‘unligi hamda jonli namunaviy matnlar:
   - `lora_inter`: Lora (Serif) sarlavha + Inter (Sans) matn (Klassik muvozanat)
   - `georgia_inter`: Georgia sarlavha + Inter matn (Zamonaviy akademik)
   - `inter_inter`: Inter sarlavha + Inter matn (Toza neo-grotesk)
   - `lora_lora`: Lora sarlavha + Lora matn (Qonuniy kitobiy)
   - `georgia_georgia`: Georgia sarlavha + Georgia matn (Rasmiy qonunchilik)
   - `inter_lora`: Inter sarlavha + Lora matn (Inversion tahrir)
   - `serif_sans`: Tizim Serif sarlavha + Tizim Sans matn (Tizim standarti)
   - `serif_serif`: To‘liq tizim Serif shriftlari (An’anaviy arxiv)

3. **6 ta Tartib Zichligi (`LAYOUT_DENSITY_PRESETS`):**
   Hoshiya (`doc_padding_card`), qator balandligi (`doc_line_height`) va matn hajmi (`canvas_font_body`):
   - `ultra_compact`: O‘ta ixcham (`padding: 50px 44px`, `line-height: 1.35`, `font-size: 36px`)
   - `compact`: Ixcham (`padding: 64px 56px`, `line-height: 1.45`, `font-size: 38px`)
   - `normal`: Standart oltin o‘rtalik (`padding: 80px 70px`, `line-height: 1.60`, `font-size: 42px`)
   - `comfortable`: Keng va erkin (`padding: 90px 78px`, `line-height: 1.70`, `font-size: 44px`)
   - `spacious`: Katta maydonli (`padding: 104px 90px`, `line-height: 1.80`, `font-size: 46px`)
   - `luxurious`: Hashamatli keng hoshiya (`padding: 120px 100px`, `line-height: 1.90`, `font-size: 48px`)

4. **6 ta Muqova Tartibi Kompozitsiyasi (`COVER_LAYOUT_PRESETS`):**
   - `classic`: Klassik markaziy simmetriya
   - `left_aligned`: Chapga tekislangan zamonaviy asimmetriya
   - `minimal`: Ramkasiz toza tipografik minimalizm
   - `bordered`: Qo‘sh hoshiyali akademik saroy ramkasi
   - `crest_top`: Yuqori ulug‘vor gerb kompozitsiyasi
   - `crest_side`: Yon emblema va zamonaviy monografiya

5. **Kombinatsiyalar Formulati:**
   $$\text{Jami kombinatsiyalar} = 24 \times 8 \times 6 \times 6 = \mathbf{6,912}\text{ ta variant}$$
   Foydalanuvchi har qanday rangni, istalgan shrift juftligi, zichlik va muqova dizayni bilan to‘siqsiz birlashtira oladi.

---

### 8.2. "Hujjat" Bo‘limidagi Jonli Miniaturalar Gridi (`DesignPanel.tsx`)

- **Haqiqiy Jonli Render:** Statik rasm (placeholder PNG/SVG) ishlatilmagan. Har bir miniatyura kartochkasi CSS o‘zgaruvchilari orqali haqiqiy qog‘oz rangi, chegarasi, urg‘u chizig‘i va matn qatorlarini render qiladi.
- **Bir Chertishda Qo‘llash (One-Click Apply):** Kartochka bosilganda barcha kerakli tokenlar (`setToken`) orqali zudlik bilan ishga tushadi va tanlangan karta ko‘k hoshiya hamda belgi (`Check`) bilan ta’kidlanadi.
- **Qo‘lda Kiritilgan O‘zgarishlarni Aniqlash ("O‘zgartirilgan" nishoni):** Foydalanuvchi presetni tanlab, so‘ng pastdagi slayder yoki rang tanlagich orqali birorta parametrni o‘zgartirsa, tizim buni sezadi va kartochkada sariq `O‘zgartirilgan` nishoni paydo bo‘ladi. Foydalanuvchi xohlagan vaqtda qayta bosib standart uslubga qaytishi mumkin.

---

### 8.3. Vizual Tekshiruv va Puppeteer Skrinshot Dalillari

`scripts/verify-task5-presets.mjs` orqali to‘liq avtomatlashtirilgan real brauzer testi o‘tkazildi:

1. **Presetlar Gridi (Jonli Miniaturalar):**
   - 24 ta rang sxemasi gridi: [01_preset_grid_colors.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task5/01_preset_grid_colors.png)
   - 8 ta tipografiya juftligi namunasi: [02_preset_grid_typography.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task5/02_preset_grid_typography.png)
   - 6 ta zichlik darajasi: [03_preset_grid_density.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task5/03_preset_grid_density.png)
   - 6 ta muqova tartibi: [04_preset_grid_cover.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task5/04_preset_grid_cover.png)

2. **5 ta Xilma-xil Kombinatsiyaning Muqova va Tarkib Kartochkalarida Qo‘llanishi:**
   - **Preset 1 (Iliq qog‘oz + Lora/Inter + Standart + Klassik):**
     - Muqova: [cover_preset_1_warm_paper.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task5/cover_preset_1_warm_paper.png)
     - Tarkib kartasi: [content_preset_1_warm_paper.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task5/content_preset_1_warm_paper.png)
   - **Preset 2 (Zumrad o‘rmon + Georgia/Inter + Ixcham + Yuqori gerb):**
     - Muqova: [cover_preset_2_forest_emerald.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task5/cover_preset_2_forest_emerald.png)
     - Tarkib kartasi: [content_preset_2_forest_emerald.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task5/content_preset_2_forest_emerald.png)
   - **Preset 3 (Bordo sharobi + Lora/Lora + Katta maydonli + Qo‘sh hoshiyali saroy ramkasi):**
     - Muqova: [cover_preset_3_bordeaux_imperial.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task5/cover_preset_3_bordeaux_imperial.png)
     - Tarkib kartasi: [content_preset_3_bordeaux_imperial.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task5/content_preset_3_bordeaux_imperial.png)
   - **Preset 4 (Yarim tun (Dark) + Inter/Inter + O‘ta ixcham + Minimal):**
     - Muqova: [cover_preset_4_midnight_dark.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task5/cover_preset_4_midnight_dark.png)
     - Tarkib kartasi: [content_preset_4_midnight_dark.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task5/content_preset_4_midnight_dark.png)
   - **Preset 5 (Arktika musaffoligi + Georgia/Georgia + Erkin + Chapga tekislangan):**
     - Muqova: [cover_preset_5_arctic_frost.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task5/cover_preset_5_arctic_frost.png)
     - Tarkib kartasi: [content_preset_5_arctic_frost.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task5/content_preset_5_arctic_frost.png)

3. **Qo‘lda O‘zgartirish va "O‘zgartirilgan" Nishoni:**
   - Tanlangan "Arktika musaffoligi" uslubida urg‘u rangi qo‘lda o‘zgartirilganda kartochkada `O‘zgartirilgan` nishoni to‘g‘ri aks etdi:
   - Dalil skrinshot: [05_preset_tweaked_badge.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task5/05_preset_tweaked_badge.png)

---

### 8.4. Barcha Testlar va Sifat Ko‘rsatkichlari

- **To‘liq Testlar:** 14 ta to‘plam, **112/112 PASS** (`src/tests/presets.test.ts` 8 ta yangi qat’iy invariant test bilan 100% yashil).
- **TypeScript & Build:** 0 ta xatolik (`tsc -b && vite build` muvaffaqiyatli).
- **Linter:** 0 ta xatolik (`oxlint`).

---

## 9. TASK 6/20 — Saqlangan Shaxsiy Uslublar (Saved Custom Styles)

> **Bosqich**: TASK 6/20 — SAVED CUSTOM STYLES  
> **Holat**: To‘liq yakunlandi (15 ta test to‘plami, **119/119 PASS**, Build: PASS, Lint: PASS).  
> **Asosiy imkoniyatlar**: Dizayn panelida shaxsiy uslublarni nomlab saqlash, "Mening uslublarim" gridi, IndexedDB xotirasi, sahifa yangilanganda saqlanishi, hujjat xotirasi (`uslub:` MD+ qiymati) va JSON formatida eksport/import.

---

### 9.1. Shaxsiy Uslublar Dvigateli (`src/design/customStyles.ts`)

1. **Tokenlar Holatini To‘liq Suratga Olish (Snapshot):**
   - `captureCurrentTokens()` funksiyasi barcha `DESIGN_TOKENS` qiymatlarini (`getTokenValue`) to‘liq yig‘ib oladi va bitta yaxlit obyektga birlashtiradi.
2. **IndexedDB Doimiy Xotirasi (Persistence):**
   - Uslublar `YuristStudioDB` ning `user_meta` obyekti ichida `yurist_custom_styles` kaliti bilan saqlanadi.
   - Sahifa qayta yuklanganda (`reload`), brauzer yopilib qayta ochilganda barcha yaratilgan uslublar yo‘qolmasdan to‘liq tiklanadi.
3. **Qayta Nomlash va O‘chirish (Rename & Delete):**
   - `renameCustomStyle(id, newName)` va `deleteCustomStyle(id)` funksiyalari xotirani va IndexedDB-ni bir zumda yangilab, `yurist:custom-styles-changed` hodisasi orqali butun interfeysni sinxronlashtiradi.
4. **Jonli Qo‘llash (Live Apply):**
   - `applyCustomStyle(style)` tanlangan uslubdagi har bir tokenni CSS o‘zgaruvchilariga tatbiq etadi va o‘quv kartochkalarini bir lahzada qayta bezaydi.
5. **JSON Eksport va Import:**
   - `exportStyleAsJson(style)` — o‘qituvchilar va hamkasblar o‘rtasida dizaynlarni almashish uchun ixcham `.yurist-style.json` faylini yuklab beradi.
   - `importStyleFromJson(content)` — JSON faylni tekshirib, xavfsiz holda tizimga yangi maxsus uslub sifatida kiritadi.

---

### 9.2. Dizayn Paneli va Hujjat Xotirasi Integratsiyasi

1. **"Uslubni saqlash" va "Uslub yuklash" Tugmalari:**
   - Dizayn paneli yuqorisida ko‘zga tashlanuvchi asosiy tugmalar joylashtirildi.
   - Foydalanuvchi "Uslubni saqlash" tugmasini bosganda, inline kiritish maydoni ochiladi va uslub nomi kiritiladi (masalan: *"Mening TDYU uslubim"*).
2. **"Mening uslublarim" Jonli Miniaturalar Gridi:**
   - Har bir saqlangan uslub uchun real fon, matn va urg‘u chiziqlariga ega bo‘lgan jonli miniatyura kartochkasi ko‘rsatiladi.
   - Miniatyura ustida tezkor harakat tugmalari: qayta nomlash (`Pencil`), JSON yuklab olish (`Download`) va o‘chirish (`Trash2`).
3. **Hujjat Uslub Xotirasi va Hujjatlararo O‘tish:**
   - Hujjatga uslub biriktirilganda, MD+ matnida `uslub: Mening TDYU uslubim` deb qayd etiladi hamda hujjat yozuviga saqlanadi.
   - Boshqa hujjatga o‘tilganda avvalgi uslub xavfsiz tozalanadi (`resetAll`) va o‘sha hujjatning o‘z mavzusi yuklanadi.
   - TDYU uslubiga ega bo‘lgan hujjatga qaytilganda, tizim buni xotiradan topib, uning barcha tokenlarini darhol tiklaydi.

---

### 9.3. Vizual Tekshiruv va Puppeteer Skrinshot Dalillari

`scripts/verify-task6-custom-styles.mjs` orqali brauzerda to‘liq tekshiruv o‘tkazildi:

1. **Dizayn Panelida Uslub Saqlash Formasi:**
   - Fayl: [01_dizayn_panel_save_form.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task6/01_dizayn_panel_save_form.png)
   - *Tahlil*: "Uslubni saqlash" tugmasi bosilganda nom kiritish qutisi ochildi.
2. **"Mening TDYU uslubim" Yaratilishi va Biriktirilishi (Reload-dan oldin):**
   - Fayl: [02_custom_style_created.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task6/02_custom_style_created.png)
   - *Tahlil*: Uslub muvaffaqiyatli saqlandi, "Mening uslublarim (1)" bo‘limida faol belgi bilan paydo bo‘ldi, muharrirda `uslub: Mening TDYU uslubim` yozuvi paydo bo‘ldi va kartochka ushbu dizaynda bezaldi.
3. **Sahifa Qayta Yuklangandan So‘ng Tiklanishi (IndexedDB Persistence - Reload-dan keyin):**
   - Fayl: [03_custom_style_persisted_after_reload.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task6/03_custom_style_persisted_after_reload.png)
   - *Tahlil*: Sahifa qayta yuklangandan so‘ng (`reload`), "Mening TDYU uslubim" IndexedDB'dan yuklandi, faol tanlandi va kartochka o‘zining maxsus rang va tipografiyasini to‘liq saqlab qoldi.
4. **Uslubni Qayta Nomlash (Rename):**
   - Fayl: [04_custom_style_rename.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task6/04_custom_style_rename.png)
   - *Tahlil*: Qalamcha tugmasi orqali uslub nomi "Mening TDYU uslubim (Rasmiy)" ga o‘zgartirildi.
5. **Hujjatlararo O‘tish va Xotirani Saqlash:**
   - Fayl: [05_document_switching_style_memory.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task6/05_document_switching_style_memory.png)
   - *Tahlil*: Boshqa hujjatga o‘tilganda standart dizaynga o‘tildi, birinchi hujjatga qaytilganda esa shaxsiy uslub yana tiklandi.
6. **Eksport va Import:**
   - Fayl: [06_exported_imported_style.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task6/06_exported_imported_style.png)
   - *Tahlil*: JSON eksport qilinib, qayta import qilinganda "Mening uslublarim (2)" bo‘lib ikkinchi uslub ro‘yxatga qo‘shildi.

---

### 9.4. Barcha Testlar va Sifat Ko‘rsatkichlari

- **To‘liq Testlar:** 15 ta to‘plam, **119/119 PASS** (`src/tests/customStyles.test.ts` 7/7 PASS).
- **TypeScript & Build:** 0 ta xatolik (`tsc -b && vite build` muvaffaqiyatli).
- **Linter:** 0 ta xatolik (`oxlint`).

---

## 10. TASK 7/20 — DIRECT ON-CANVAS EDITING (Jonli Kanvas Tahrirlash)

Canva kabi to‘g‘ridan-to‘g‘ri o‘quv kartochkasi ustida matnlarni tahrirlash, manba bilan ikki tomonlama bog‘lanish (two-way binding), suzuvchi asboblar paneli (floating toolbar), yaxlitlik himoyasi (integrity protection) va bekor qilish (Undo / Ctrl+Z) tizimi to‘liq yaratildi va tekshirildi.

### 10.1. Tizim Arxitekturasi va Two-Way Binding Mexanizmi

1. **AST Qator Xaritasi (Source-Line Mapping):**
   - AST parser (`src/schema/mdParser.ts`) barcha 11 ta blok turlari, hujjat sarlavhasi/izohi va har bir bo‘limning sarlavhasi/izohi uchun `sourceLine` va `sourceEndLine` qator raqamlarini hisoblab beradi.
   - Paginatsiya xizmati (`src/services/paginator.ts`) ushbu qator koordinatalarini kartochka elementlariga (`sectionSourceLine`, `sectionSubtitleSourceLine`) to‘g‘ridan-to‘g‘ri uzatadi.
   - Blok renderlari (`TextBlock`, `NormBlock`, `QaBlock`, `DefinitionBlock`, `NoteBlock`, `CaseBlock`) har bir tahrirlanadigan matn maydoniga `data-canvas-editable="true"`, `data-edit-type` va `data-source-line` atributlarini biriktiradi.

2. **Nozik Ko‘rinish va Bosganda O‘z O‘rnida Tahrirlash (In-Place contentEditable):**
   - **Hover:** Kanvasdagi har qanday matn ustiga sichqoncha borganda nozik chiziqli ko‘k hoshiya (`outline: 2px dashed rgba(30, 58, 138, 0.45)`) paydo bo‘ladi.
   - **Click:** Sarlavha, paragraf, norma, ta’rif yoki savol-javob ustiga bosilganda element `contentEditable="true"` va `.canvas-is-editing` holatiga o‘tadi, 2px to‘q ko‘k hoshiya va oq/quyuq fon bilan ajralib turadi.
   - **Commit:** Escape tugmasi bosilganda yoki tashqariga bosilganda (`outside-click`), kiritilgan yangi matn `applyCanvasEditToSource` xizmati orqali MD+ manba matniga kiritiladi va chapdagi muharrirda bir zumda aks etadi.

3. **Suzuvchi Asboblar Paneli (Canvas Floating Toolbar):**
   - Tahrirlanayotgan elementning tepasida masshtabdan qat’i nazar aniq hisoblangan koordinatalarda qora yarim shaffof (glassmorphism) suzuvchi panel paydo bo‘ladi.
   - Unda quyidagi tugmalar mavjud:
     - **Bold (`B`):** Tanlangan so‘zni `**qalin**` formatga o‘raydi.
     - **Italic (`I`):** Tanlangan so‘zni `*kursiv*` formatga o‘raydi.
     - **Highlight (`==`):** Tanlangan so‘zni `==ajratilgan==` formatga o‘raydi.
     - **"Manbaga o‘tish":** Bosilganda chapdagi MD+ muharririga o‘tib, ayni o‘sha qatorni markazga aylantiradi va matnni kursor bilan belgilab beradi.
   - Tugmalarda `onMouseDown={(e) => e.preventDefault()}` qo‘llanilganligi sababli, foydalanuvchi matnni belgilab tugmani bosganda matn tanlovi (`selection range`) yo‘qolmaydi.

4. **MD+ Butunligi va Xavfsizlik Himoyasi (Protect Integrity):**
   - Tahrir kiritilgach, yangilangan manba darhol `parseMarkdownPlus` orqali tekshiriladi. Agar blok markeri (`#`, `##`, `norma:`, `ta'rif:`, `?`, `=`, `!`) buzilgan bo‘lsa yoki hujjat bo‘limlari yo‘qolsa, o‘zgarish rad etiladi va asl matn tiklanadi.
   - Kanvasda to‘g‘ridan-to‘g‘ri tahrirlash xavfli bo‘lgan murakkab bloklar (jadval, solishtirish, jarayon, vaqt shkalasi) `data-canvas-protected="true"` bilan belgilanadi. Ularning ustiga kelganda yoki bosilganda: **`🔒 Bu qismni muharrirda tahrirlang`** xabarnomasi chiqadi.

5. **Tahrirni Bekor Qilish (Undo / Ctrl+Z):**
   - Har bir kanvas tahriri `canvasUndoStackRef` stekida saqlanadi.
   - Muharrirda yoki sahifada `Ctrl+Z` bosilganda avvalgi matn tiklanadi va ekranda «Tahrir bekor qilindi (Undo)» xabari chiqadi.

---

### 10.2. Vizual Tekshiruv va Puppeteer Skrinshot Dalillari

`scripts/verify-task7-canvas-editing.mjs` orqali brauzerda to‘liq test o‘tkazildi:

1. **Suzuvchi Asboblar Paneli (Floating Toolbar):**
   - Fayl: [01_canvas_floating_toolbar.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task7/01_canvas_floating_toolbar.png)
   - *Tahlil*: Kanvasdagi sarlavha bosilganda `contentEditable` rejimiga o‘tdi, tepasida qora kapsula toolbar (Bold, Italic, Highlight, Manbaga o‘tish :1) aniq chiqdi.
2. **Jonli Tahrir va Manbaga Sinxronizatsiya (Two-Way Binding):**
   - Fayl: [02_canvas_heading_edited.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task7/02_canvas_heading_edited.png)
   - *Tahlil*: Sarlavha «O‘zbekiston Respublikasi Konstitutsiyasi (Yangi Tahrir)» deb o‘zgartirilib Escape bosilganda, chapdagi muharrir 1-qatorida `# O‘zbekiston Respublikasi Konstitutsiyasi (Yangi Tahrir)` deb yangilandi va «Kanvas tahriri manbaga saqlandi» bildirishnomasi chiqdi.
3. **Ctrl+Z orqali Asl Holatga Qaytarish (Undo):**
   - Fayl: [03_canvas_undo_restored.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task7/03_canvas_undo_restored.png)
   - *Tahlil*: Muharrirda Ctrl+Z bosilganda manba hamda kanvasdagi sarlavha avvalgi «Birinchi hujjatim» holatiga to‘liq qaytdi.
4. **Himoyalangan Blok Ustida Xabarnoma (Protected Tooltip):**
   - Fayl: [04_canvas_protected_tooltip.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task7/04_canvas_protected_tooltip.png)
   - *Tahlil*: Jadval bloki ustiga kelganda hoshiya sarg‘ish-oltin tus oldi va tepasida «🔒 Bu qismni muharrirda tahrirlang» xabarnomasi ko‘rsatildi.
5. **"Manbaga o‘tish" Qatoriga Sakrash:**
   - Fayl: [05_jump_to_source_line.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task7/05_jump_to_source_line.png)
   - *Tahlil*: Toolbardagi «Manbaga o‘tish :1» bosilganda, muharrirda 1-qator `# Birinchi hujjatim` avtomatik belgilandi va fokuslandi.

---

### 10.3. Test Natijalari va Sifat Ko‘rsatkichlari

- **Vitest:** 16 ta to‘plam, **127/127 PASS** (`src/tests/canvasEditing.test.ts` 8/8 PASS).
- **TypeScript Build:** 0 ta xatolik (`tsc -b && vite build` 100% muvaffaqiyatli).
- **Linter:** 0 ta xatolik (`oxlint`).

---

## 11. TASK 8/20 — PER-BLOCK STYLE CONTROLS (Alohida Blok Uslub Sozlamalari)

Hujjatdagi har bir blokni (norma, kazus, jadval, savol-javob, ogoh, taʼrif va b.) butun hujjatdan mustaqil ravishda qayta bezash, nozik popover paneli orqali rang, o‘lcham va PDF parametrlarini o‘zgartirish, MD+ matniga teginmasdan barqaror ID orqali saqlash va repaginatsiyada uzluksiz kuzatib borish imkoniyati to‘liq amalga oshirildi.

### 11.1. Tizim Arxitekturasi va Kaskadli Bog‘lanish (Cascade Merging)

1. **Blok Uslubini Sozlash Popoveri (`BlockStylePopover.tsx`):**
   - Kanvasdagi har qanday blok ustiga sichqoncha borganda blokning yuqori o‘ng burchagida ixcham **«🎨 Uslub»** suzuvchi tugmasi ko‘rinadi. Blok maydoniga yoki ushbu tugmaga bosilganda to‘g‘ridan-to‘g‘ri blok yonida qora shaffof (glassmorphism) popover ochiladi.
   - **Urg‘u rangi (Accent) 8 ta parametr:**
     - To‘q ko‘k (Oxford Navy `#1e3a8a`)
     - Zumrad yashil (Emerald `#059669`)
     - Qahrabo (Amber `#d97706`)
     - Yoqut qizil (Crimson `#dc2626`)
     - Binafsha (Royal Purple `#7c3aed`)
     - Silliq tosh (Slate `#475569`)
     - Dengiz to‘lqini (Teal `#0d9488`)
     - Qorong‘i grafit (Dark Graphite `#1e293b`)
   - **Blok o‘lchami (Size):**
     - Kichik (`S` — 0.88x shrift va ixcham masofalar)
     - Standart (`M` — 1.0x standart parametrlar)
     - Katta (`L` — 1.15x kattalashtirilgan shrift, plashka va nishonlar)
   - **Tekislash (Alignment):** Chap, Markaz, O‘ng.
   - **PDFda Yashirish ("Yashirish PDFda"):** Maxsus kommutator (toggle switch). Yoqilganda kanvasda blok `opacity: 0.72` va qizil uzuk-chiziqli hoshiya hamda `🔒 PDFda yashiriladi` belgisi bilan ko‘rsatiladi; PDF eksport va `@media print` rejimida esa blok butunlay yashiriladi (`display: none !important`).
   - **Blok uslubini tozalash ("Blok uslubini tozalash"):** Qizil tugma bosilganda ushbu blok uchun o‘rnatilgan barcha qo‘shimcha parametrlar o‘chiriladi va blok hujjatning umumiy uslubiga qaytadi.

2. **MD+ Matnini Buzmasdan Saqlash (Decoupled Persistence via Stable IDs):**
   - Blok parametrlari MD+ manbasidagi matnni buzmaydi (`#059669` kabi texnik belgilar matnga aralashmaydi).
   - O‘zgarishlar hujjat yozuvining `blockOverrides: Record<string, BlockStyleOverride>` ob’ektida blokning barqaror identifikatori (`block.id`) orqali IndexedDB’ga yoziladi.
   - Yangi xatboshilar yoki bo‘limlar kiritilganda ham blokning kontentga asoslangan deterministik xeshi (`deriveBlockId`) o‘zgarmaydi.

3. **Uch Qavatli Kaskad Mexanizmi (Renderer Cascade):**
   - `Hujjat uslubi` (Document Theme) → `Preset tanlovi` → `Alohida blok ustunligi` (Per-Block Override).
   - `.block-style-wrapper` o‘zining CSS o‘zgaruvchilari orqali (`--block-accent`, `--doc-accent`, `--accent-navy`, `--accent-gold`, `--accent`) qonun plashkasi, raqam nishoni, nishon piktogrammalari, jadval sarlavhasi va hoshiyalarni bir zumda qayta bo‘yaydi.

4. **Repaginatsiya va PDF Barqarorligi:**
   - Blokdan yuqoriga yangi matn kiritilganda yoki o‘lcham `L` ga o‘zgartirilganda, paginatsiya mexanizmi yangilangan balandlikni hisobga olgan holda kartochkalarni qayta taqsimlaydi.
   - Blok keyingi kartaga surilsa ham yoki qismlarga bo‘linsa ham (`-p1`, `-p2`), o‘rnatilgan yashil urg‘u va `L` o‘lcham unga uzluksiz ergashadi.

---

### 11.2. Vizual Tekshiruv va Puppeteer Skrinshot Dalillari

`scripts/verify-task8-block-controls.mjs` orqali to‘liq avtomatlashtirilgan tekshiruv amalga oshirildi:

1. **Blok Uslub Sozlamasi Popoveri:**
   - Fayl: [01_block_style_popover_open.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task8/01_block_style_popover_open.png)
   - *Tahlil*: Norma bloki ustidagi «Uslub» tugmasi bosilganda 8 ta rang katakchasi, S/M/L tugmalari, tekislash va PDF kommutatori bilan popover ochildi.
2. **Zumrad Yashil Rang va Katta (L) O‘lcham Tatbiq Qilinishi:**
   - Fayl: [02_norma_green_accent_large_size.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task8/02_norma_green_accent_large_size.png)
   - *Tahlil*: Norma blokiga Zumrad yashil (`#059669`) urg‘u rangi va `L` o‘lchami berildi: chap hoshiya qalin yashil bo‘ldi, nishon `1-QOIDA. ISHNI BOSHLASH` yashil fonga o‘tdi, tarozi belgisi yashil tus oldi va shrift 1.15x kattalashdi.
3. **Repaginatsiyadan Keyin Uslub Blokga Ergashishi:**
   - Fayl: [03_repagination_override_follows_block.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task8/03_repagination_override_follows_block.png)
   - *Tahlil*: Blokdan yuqoriga uchta uzun paragraf kiritilib repaginatsiya qilinganda, blokning ID si (`1-qoida-ishni-boshla-wik0ba`) to‘liq saqlandi va yashil urg‘u hamda L o‘lchami keyingi kartaga to‘liq ergashdi.
4. **Haqiqiy PDF Eksporti va Print Host Tekshiruvi:**
   - Skrinshot: [04_pdf_print_preview.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task8/04_pdf_print_preview.png)
   - PDF Fayl: [task8_block_restyle.pdf](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task8/task8_block_restyle.pdf) (78.8 KB)
   - *Tahlil*: Chop etish xostida (`#print-export-host`) va haqiqiy generatsiya qilingan PDF faylda yashil aksent va katta o‘lcham 100% toza aks etdi.
5. **Blok Uslubini Tozalash (Reset) Sinovi:**
   - «Blok uslubini tozalash» bosilganda blokning qo‘shimcha parametrlari tozalanib, hujjatning standart moviy/oltin tusiga qaytdi (`isL: false, accent: ''`).

---

### 11.3. Test Natijalari va Sifat Ko‘rsatkichlari

- **Vitest:** `src/tests/blockOverrides.test.ts` (5/5 PASS), asosiy regressiya to‘plamlari (55/55 PASS).
- **TypeScript Build:** 0 ta xatolik (`tsc -b && vite build` muvaffaqiyatli).
- **Linter:** 0 ta xatolik (`oxlint`).

---

## 12. 9-Topshiriq — Muharrirni Tinch Yozuv Studiyasiga Aylantirish (Task 9/20: Editor as a Premium Writing Studio)

### 12.1. Vazifa Maqsadi va Amalga Oshirilgan Arxitektura

Muharrir dasturchilarning qorong‘i IDE muhitidan tozalab, mualliflar va huquqshunoslar uchun tinch, osoyishta, yorug‘ va nafis **Yozuv Studiyasi (Calm Writing Studio)** ko‘rinishiga keltirildi:

1. **Yorug‘ Iliq Fon va Ink Matn Standartlari:**
   - Standart parametrlar yangilandi:
     - Asosiy fon: `--editor-bg: #FAF8F5` (Iliq tabiiy qog‘oz tus)
     - Matn rangi: `--editor-fg: #1e293b` (Chuqur siyohrang ink)
     - Asosiy shrift o‘lchami: `--editor-font-size: 14px`
     - Qator oraliq balandligi: `--editor-line-height: 1.65`
     - Kursor (caret): `--accent-navy: #1e3a8a`
     - Matn tanlash: `rgba(30, 58, 138, 0.18)`
     - Faol qator tusi: `rgba(27, 42, 74, 0.04)`

2. **So‘z O‘rash (Word Wrap) va Qator Raqamlari Mukammal Moslashishi:**
   - So‘zlarni avtomatik o‘rash (`wrap="soft"`) standart holatda yoqilgan.
   - Ko‘p qatorga o‘ralgan matnlarda qator raqamlari siljib ketmasligi uchun dinamik o‘lchash mexanizmi (`.editor-measurer`) joriy etildi:
     - Matn maydonining ichki aniq eni (`clientWidth - paddingLeft - paddingRight`) bilan sinxron ko‘rinmas o‘lchagich har bir qatorning haqiqiy pikselli balandligini hisoblab chiqadi.
     - `.editor-gutter-line` va `.editor-backdrop-line` elementlariga shu balandlik to‘g‘ridan-to‘g‘ri biriktiriladi (`style={{ height: lineHeights[i] }}`).
     - Natijada uzun xatboshilar bir necha qatorga o‘ralganda ham, keyingi qator raqamlari (masalan, `8` dan `9` ga o‘tish) 100% aniq o‘z joyida turadi.

3. **Yumshoq MD+ Sintaksis Bo‘yash (Gentle MD+ Highlighting):**
   - Xakerona neon ranglar butunlay olib tashlandi:
     - Sarlavhalar (`# Sarlavha`): To‘q moviy (`var(--accent-navy, #1e3a8a)`)
     - Hujjat metama’lumotlari (`@universitet`, `@mavzu`): Nafis bronza (`var(--bronze-text, #92400e)`)
     - Blok markerlari (`:::norma`, `:::`): O‘rta moviy (`var(--accent-blue, #1d4ed8)`)
     - Jadvallar va ajratuvchilar: Xira toshrang (`var(--muted-foreground, #64748b)`)
     - Sintaksis ogohlantirishlari: Yumshoq qizil to‘lqinli chiziq (`text-decoration: underline wavy var(--destructive)`)

4. **Yengillashtirilgan Asboblar Paneli (Clean Ghost Toolbar):**
   - Asboblar paneli to‘liq soddalashtirildi va faqat 4 ta asosiy tugmaga keltirildi:
     - `Blok qo‘shish` — 9 ta standart MD+ bloki shablonlari popoveri (Norma, Kazus, Jadval, Savol-Javob, Taqqoslash, Jarayon, Vaqt xronologiyasi, Ogohlantirish, Maslahat).
     - `Namuna` — Tayyor namunaviy MD+ ma’ruzani yuklash.
     - `Qidirish` — Global tezkor qidiruv palitrasini ochish (`Ctrl+K`).
     - `Qo‘llanma` — MD+ sintaksis va bloklar qo‘llanmasini ochish.
     - `...` (Ko‘proq) — So‘zlarni o‘rash kommutatori, AI prompt nusxalash, tezkor spravka va JSON eksporti.
   - Barcha tugmalar ghost uslubida, bir xil 32px balandlikda va mukammal tekislangan.

5. **Ixcham va Rostgo‘y Holat Satri (Status Bar):**
   - Muharrir ostidagi panelda:
     - Validatsiya ko‘rsatkichi: `✓ MD+ formati to‘g‘ri` yoki `⚠ N ta eslatma`
     - Faol kursor joylashuvi: `Qator X, Ustun Y`
     - Statistika: Jami qatorlar soni, belgilar soni, so‘zlar soni.

6. **Dizayn Paneli Bilan Jonli Integratsiya ("Muharrir" yorlig‘i):**
   - 4-Topshiriqdagi Dizayn panelining "Muharrir" yorlig‘i live tokenlar bilan to‘liq ulandi:
     - Shrift o‘lchami (12px, 13px, 14px, 15px, 16px, 18px).
     - Qator oraliq balandligi (1.5, 1.65, 1.8, 2.0).
     - Fon ohangi (Iliq qog‘oz `#FAF8F5`, Toza oq `#FFFFFF`, Vintage qog‘oz `#F4EFEA`, Salqin tuman `#F1F5F9`, Tungi ko‘k `#0F172A`).
     - Sozlamalar darhol barcha ochiq muharrir oynalarida real vaqtda aks etadi va IndexedDB’da saqlanadi.

7. **Zero Hardcoded CSS Invarianti Qat’iy Himoyalangan:**
   - `src/components/editor/editor.css` to‘liq dizayn tokenlari bilan qayta yozildi (0 ta hardcoded `#hex`, 0 ta ruxsatsiz `px` padding/radius). `src/tests/tokenEngine.test.ts` to‘liq o‘tdi.

---

### 12.2. Vizual Tekshiruv va Puppeteer Skrinshot Dalillari

`scripts/verify-task9-editor-studio.mjs` yordamida turli o‘lcham va holatlarda 7 ta batafsil skrinshot olindi:

1. **Standart Yozuv Studiyasi Ko‘rinishi (1440px):**
   - Fayl: [task9_editor_1440px_studio_default.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task9/task9_editor_1440px_studio_default.png)
   - *Tahlil*: Iliq qog‘oz fon (`#FAF8F5`), to‘q siyoh matn (`#1e293b`), toza ghost toolbar (32px), nozik faol qator fon tusi va ixcham holat satri.
2. **Uzun Qatorlar O‘ralishi va Qator Raqamlari Mosligi (Word Wrap & Gutter Alignment):**
   - Fayl: [task9_editor_1440px_wrapped_gutter.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task9/task9_editor_1440px_wrapped_gutter.png)
   - *Tahlil*: 8-qatordagi uzun norma matni brauzer kengligiga mos ravishda 4 ta vizual qatorga o‘ralgan; chap tarafdagi `8` raqami katagi ham aynan 92.4px balandlikka kengaygan. `9` raqami pastdagi `:::` markeriga 100% to‘g‘ri to‘g‘rilangan.
3. **«Blok qo‘shish» Popover Menyusi:**
   - Fayl: [task9_editor_1440px_block_menu.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task9/task9_editor_1440px_block_menu.png)
   - *Tahlil*: Yozuvchi uchun 9 ta standart MD+ bloki (norma, kazus, jadval va h.k.) qulay tavsif bilan taqdim etilgan.
4. **«...» (Ko‘proq) Qo‘shimcha Asboblar Menyusi:**
   - Fayl: [task9_editor_1440px_overflow_menu.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task9/task9_editor_1440px_overflow_menu.png)
   - *Tahlil*: So‘z o‘rashni o‘chirish/yoqish, AI prompt nusxalash, tezkor spravka va JSON amallari asosiy ko‘rinishni chalkashtirmasdan saqlangan.
5. **Dizayn Paneli Orqali Muharrir Parametrlarini O‘zgartirish:**
   - Fayl: [task9_editor_1440px_dizayn_panel_active.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task9/task9_editor_1440px_dizayn_panel_active.png)
   - *Tahlil*: Dizayn panelidagi "Muharrir" yorlig‘ida shrift o‘lchami, qator balandligi va fon ohanglari tanlanishi muharrir oynasiga darhol ta’sir qilishi tasdiqlandi.
6. **Planshet Ko‘rinishi (768px):**
   - Fayl: [task9_editor_768px_tablet.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task9/task9_editor_768px_tablet.png)
   - *Tahlil*: 768px enida qatorlar ko‘proq qatorga o‘ralgan (184.8px balandlik), biroq raqamlar ustuni mutlaqo buzilmagan va matn bilan birga silliq siljiydi.
7. **Bo‘lingan Rejim (Ikkalasi — Split View 1440px):**
   - Fayl: [task9_editor_1440px_split_view.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task9/task9_editor_1440px_split_view.png)
   - *Tahlil*: Chapda sokin yozuv studiyasi, o‘ngda esa 9:16 formatdagi ma’ruza kartalari mukammal uyg‘unlikda ko‘rinadi.

---

### 12.3. Test Natijalari va Sifat Ko‘rsatkichlari

- **Vitest Yangi To‘plami:** `src/tests/editorStudio.test.ts` (5/5 PASS)
  1. Standart tokenlar (14px, 1.65, #FAF8F5).
  2. Dizayn paneli orqali yangilanishi va saqlanishi.
  3. UI tokenlari bilan bog‘lanish.
  4. 9 ta MD+ blok shablonlari to‘g‘riligi.
  5. Statistika hisob-kitoblari (qator, belgi, so‘z).
- **Umumiy Testlar:** Barcha 18 ta to‘plam, **137/137 ta test 100% muvaffaqiyatli o‘tdi**.
- **Invariants & Token Engine:** `tokenEngine.test.ts` va `invariants.test.ts` to‘liq o‘tdi.
- **TypeScript Build:** 0 ta xatolik (`npx tsc -b`).

---

## 13. TASK 12/20 — PREVIEW WORKSPACE REDESIGN HISOBOTI

### 13.1. Amalga Oshirilgan Ishlar va Arxitektura Yechimlari

1. **Neytral Ishchi Muhit va Kartalar Oralig‘i:**
   - `.preview-container` foni neytral dizayn tokeni `var(--bg)` ga o‘tkazildi.
   - Barcha 9:16 formatidagi o‘quv kartalari ishchi maydon o‘rtasiga markazlashtirildi (`align-items: center` va `mode-100` da `safe center`).
   - Kartalar orasidagi masofa qat’iy `32px` qilib belgilandi (`gap: var(--space-8)`).
   - *Zero Hardcoded CSS Invariant*: 0 ta qattiq kodlangan hex, 0 ta px shrift, padding yoki border-radius.

2. **Suzuvchi Navigatsiya Paneli (Floating Navigator):**
   - 40px balandlikdagi oq muzlagan shisha (frosted white pill) paneli: `background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(8px); border-radius: var(--radius-pill);`.
   - Chapda: Dumaloq oldingi karta tugmasi (`.card-nav-circle-btn`, 28px).
   - O‘rtada: "3/11 karta" dinamik hisoblagichi (`.card-nav-counter`).
   - O‘ngda: Dumaloq keyingi karta tugmasi (`.card-nav-circle-btn`, 28px).
   - Ajratuvchi chiziq (`.card-nav-divider`).
   - Masshtab boshqaruvi:
     - **Moslash** (`fit`): Kartaning butun 1080x1920 o‘lchami ko‘rinish balandligiga to‘liq sig‘adi (yon hoshiyalar me’yoriy holat).
     - **100%** (`100%`): Asl 1.0 mantiqiy masshtab.
     - **Kenglikka** (`fit-width`): Yangi rejim — karta eni ishchi maydon enini to‘liq to‘ldiradi (`(availableW - padding) / 1080`), vertikal aylantirish bilan qulay o‘qiladi.
   - Faol rejim ko‘rsatkichi: To‘q ko‘k tabletka (`.card-size-btn.active` — `background: var(--accent-navy, var(--accent)); color: var(--surface)`).
   - O‘ng chekkada: **Fullscreen** (To‘liq ekran taqdimot rejimi) tugmasi.

3. **Masshtabni Avtomatik Qayta Hisoblash Dvigateli (Auto-Rescale Engine):**
   - Konteyner va uning ota elementi ustida `ResizeObserver` o‘rnatildi.
   - Oyna o‘lchami o‘zgarganda (`window.resize`), yon panel (sidebar) ochilganda/yopilganda, bo‘lingan ekran (split pane) rejimi o‘zgarganda yoki 360px li Dizayn paneli ochilganda masshtab zudlik bilan avtomatik qayta hisoblanadi.

4. **To‘liq Ekran Taqdimot Rejimi (Fullscreen Presentation):**
   - To‘q qorong‘i fon: `rgba(10, 15, 25, 0.96)` va `backdrop-filter: blur(12px)`.
   - Markazda yagona karta: nozik yorug‘lik jilosi va chuqur soya bilan taqdim etiladi.
   - Yuqori chap burchakda: Karta hisoblagichi (`02 / 04`).
   - Yuqori o‘ng burchakda: Chiqish tugmasi (`X`).
   - Yon tomonlarda: Katta varoqlash strelkalari (`.fullscreen-nav-prev`, `.fullscreen-nav-next`).
   - Klaviatura bilan to‘liq integratsiya: `ArrowRight` / `ArrowDown` / `Space` keyingi kartaga, `ArrowLeft` / `ArrowUp` oldingi kartaga, `Escape` taqdimotdan chiqishga xizmat qiladi.

5. **Kartani Bosish va Skroll Sinxronizatsiyasi:**
   - Skroll ro‘yxatidagi ixtiyoriy kartaga bosilganda navigatordagi hisoblagich darhol o‘sha kartaga sinxronlashadi (`setActiveCardIndex(card.cardIndex)`).
   - `IntersectionObserver` va viewport markaziga nisbatan masofani hisoblovchi tezkor skroll tinglovchi birlashtirildi, natijada har qanday masshtabda faol karta 100% aniqlikda aks etadi.

---

### 13.2. Vizual Tekshiruv va Skrinshotlar

1. **Moslash Rejimi (Fit Mode — Butun Karta Ko‘rinishi):**
   - Fayl: [task12_preview_fit_mode.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task12/task12_preview_fit_mode.png)
   - *Tahlil*: Karta balandligi to‘liq ko‘rinadi, tabiiy yon hoshiyalar markazlashtirilgan (masshtab: 0.377, oraliq: 32px), 40px li muzlagan suzuvchi panelda "Moslash" faol to‘q ko‘k tabletka ko‘rinishida.

2. **100% Rejimi (100% Asl O‘lcham):**
   - Fayl: [task12_preview_100_mode.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task12/task12_preview_100_mode.png)
   - *Tahlil*: Karta 1080px to‘liq o‘lchamda ko‘rsatiladi, navigatorda "100%" to‘q ko‘k rangda faollashgan.

3. **Kenglikka Moslash Rejimi (Fit-Width Mode):**
   - Fayl: [task12_preview_fit_width_mode.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task12/task12_preview_fit_width_mode.png)
   - *Tahlil*: Karta kengligi mavjud ishchi maydonni to‘liq egallaydi (masshtab: 1.039, kenglik: 1122px), vertikal o‘qish nihoyatda qulay.

4. **To‘liq Ekran Taqdimot Rejimi (Fullscreen Mode):**
   - Fayl: [task12_preview_fullscreen.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task12/task12_preview_fullscreen.png)
   - *Tahlil*: Qorong‘i fon (`rgba(10, 15, 25, 0.96)`), markazda yagona karta, yuqori chapda "02 / 04" hisoblagichi, yuqori o‘ngda chiqish tugmasi va yon tomonlarda navigatsiya strelkalari. Strelka va Escape klavishlari orqali boshqaruv tasdiqlandi.

5. **Kartani Bosish Sinxronizatsiyasi (Click to Sync):**
   - Fayl: [task12_preview_card_click_sync.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task12/task12_preview_card_click_sync.png)
   - *Tahlil*: 2-karta bosilganda suzuvchi panel hisoblagichi bir zumda "2/4 karta" ga yangilandi.

6. **Yon Panel va Oyna O‘lchamida Avtomatik Qayta Masshtablash (Rescale on Resize):**
   - Fayl: [task12_preview_sidebar_rescale.png](file:///home/mansurxon/Desktop/Design%20Lecture/docs/screenshots/task12/task12_preview_sidebar_rescale.png)
   - *Tahlil*: 360px li Dizayn paneli ochilganda va oyna o‘lchami 1024x768 ga o‘zgarganda masshtab 0.377 dan 0.298 ga avtomatik qayta hisoblandi va karta mukammal markazda qoldi.

---

### 13.3. Test Natijalari va Sifat Ko‘rsatkichlari

- **Vitest Yangi To‘plami:** `src/tests/previewWorkspace.test.ts` (5/5 PASS)
  1. Neytral fon va 32px oraliqlar tekshiruvi.
  2. Muzlagan suzuvchi panel, dumaloq tugmalar, hisoblagich va to‘q ko‘k tabletka tekshiruvi.
  3. Moslash, 100% va Kenglikka masshtab formulalari hamda ResizeObserver integratsiyasi.
  4. Qorong‘i fonli to‘liq ekran, markaziy karta, hisoblagich, chiqish tugmasi va klaviatura navigatsiyasi.
  5. Kartaga bosilganda hisoblagich sinxronlanishi.
- **Zero Hardcoded CSS Invariant:** `src/tests/tokenEngine.test.ts` (9/9 PASS — 0 ta xatolik).
- **Invariants Test Suite:** `src/tests/invariants.test.ts` (10/10 PASS).
- **Umumiy Testlar:** Barcha 19 ta to‘plam, **142/142 ta test 100% muvaffaqiyatli o‘tdi**.
- **TypeScript Build:** 0 ta xatolik (`npx tsc -b`).








