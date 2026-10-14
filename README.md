# Design Lecture — Professional Ma'ruza va Konspekt Studiyasi

> **Yuridik va akademik ma'ruzalarni qayta ishlash, interaktiv o'qish, 9:16 mobil kartalar, A4 nashr/PDF va SM-2 imtihon trenajyori.**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Electron](https://img.shields.io/badge/Electron-44.7-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Tests](https://img.shields.io/badge/Vitest-235%20passed-4E9A06?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Lint](https://img.shields.io/badge/Oxlint-Clean-green)](https://oxc.rs/)

---

## 🌟 Asosiy Imkoniyatlar

### 1. MD+ Ilg'or Sintaksisi
Oddiy Markdown chegarasidan chiqib, huquqiy va akademik konspektlar uchun maxsus bloklar:
- `norma:` — Qonunchilik normalari va moddalar uchun iqtibos bloki.
- `kazus:` — Huquqiy amaliyot (vaziyat, norma, tahlil va xulosa) tahlili.
- `ta'rif:` — Terminologiya va tushunchalarni ajratib ko'rsatish.
- `savol:` / `javob:` — Interaktiv yashirin javobli faol eslash bloklari.
- `formula:`, `chizma:`, `xulosa:` — Matematik va mantiqiy tuzilmalar.

### 2. 4 xil Ko'rish Rejimi (Multi-Output Engine)
1. 📄 **A4 Hujjat (Oxford Editorial)**: 
   - Oxford Editorial tipografik uslubi (Lora & Inter).
   - Avtomatik sahifalash va bosmaga tayyor A4 PDF eksporti.
2. 📱 **9:16 Slayd-kartalar**:
   - Mobil formatdagi vertikal slaydlar (Instagram Stories, Telegram kanallari).
   - Ekranga avtomatik moslashuvchi (auto-fit) masshtablash mexanizmi.
3. 📖 **O'quvchi (Reader)**:
   - Chalg'ituvchi elementlarsiz toza mutolaa rejimi.
   - Interaktiv javobni ochish/yopish va o'qish progressi indikatori.
4. 🧠 **Imtihon Trenajyori (Exam Trainer)**:
   - SuperMemo SM-2 oraliqli takrorlash (Spaced Repetition) algoritmi.
   - 1 dan 5 gacha baholash (Yana, Qiyin, Yaxshi, Oson).
   - Kunlik o'zlashtirish statistikasi va oraliqli takrorlash sanalari.

### 3. Aqlli Formatlash (Smart Ingestion Studio)
OpenRouter orqali zamonaviy modellar bilan integratsiya qilingan:
- Xom matn, qonun moddalari yoki konspekt parchasini avtomatik ravishda toza MD+ tuzilmasiga o'girish.
- Foydalanuvchi API kalitini o'z brauzerida shifrlangan/xavfsiz saqlaydi.

### 4. Apple Human Interface Guidelines (HIG)
- Apple dizayn tamoyillari asosida nozik Liquid Glass panellari.
- WCAG talablariga to'liq mos kontrast (5.35:1+).
- Mobil qurilmalarga to'liq moslashuvchanlik (390px+).
- Har bir tugma uchun 44px teginish (touch target) o'lchamlari.

### 5. Xavfsizlik va Local-First Maxfiylik
- Barcha konspektlar foydalanuvchining o'z qurilmasida (IndexedDB) saqlanadi.
- Ma'lumotlar hech qanday uchinchi tomon serverlariga yuborilmaydi.
- Avtomatik saqlash va zaxira nusxalash mexanizmi.

---

## 🚀 O'rnatish va Ishga Tushirish

### Talablar
- Node.js 20+
- npm yoki pnpm

### Veb rejimda ishga tushirish (Vite Dev Server)
```bash
# Qaramliklarni o'rnatish
npm install

# Dasturni ishga tushirish
npm run dev
```
Brauzerda `http://localhost:5173` manzilini oching.

### Desktop ilova sifatida ishga tushirish (Electron)
```bash
npm run dev:electron
```

### Production Build
```bash
# TypeScript tekshiruvi va Vite production bundle yaratish
npm run build

# Kod sifatini tekshirish (linter)
npm run lint

# Barcha testlarni o'tkazish
npm test
```

---

## 🧪 Sinov va Sifat Nazorati

Loyiha to'liq birlik (unit), integratsiya va me'moriy invariant testlari bilan qoplangan:
- **30 ta test to'plami**
- **235 ta muvaffaqiyatli o'tgan test**
- Qamrov: MD+ parser, SM-2 oraliqli takrorlash, OpenRouter integratsiyasi, A4 sahifalash, IndexedDB xotirasi va Apple HIG tokenlari.

---

## 📁 Loyiha Tuzilishi

```text
├── electron/          # Electron desktop asosiy va renderlash fayllari
├── public/            # Statik fayllar, ikonkalar, namunaviy konspektlar
├── src/
│   ├── components/    # UI komponentlar (Editor, Preview, Exam, Modals, Toolbar)
│   ├── parser/        # MD+ sintaksis tahlilchisi va AST generatori
│   ├── services/      # SM-2 algoritmi, OpenRouter AI, IndexedDB saqlash
│   ├── styles/        # Apple HIG Liquid Glass tokenlari va CSS modullari
│   ├── tests/         # Vitest sinov to'plamlari (235 ta test)
│   ├── types/         # TypeScript tip tavsiflari
│   └── App.tsx        # Asosiy ilova qobig'i
├── package.json
└── vite.config.ts
```

---

## 📄 Litsenziya

MIT License. Muallif: [mansurxongemini](https://github.com/mansurxongemini).
