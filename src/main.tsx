import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTokenEngine } from './design/applyTokens'
import * as presets from './design/presets'
import { initCustomStyles } from './design/customStyles'

// Token dvigatelini va Maxsus uslublarni ilova yuklanishi bilan ishga tushirish
initTokenEngine();
initCustomStyles();

if (typeof window !== 'undefined') {
  (window as any).presets = presets;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


