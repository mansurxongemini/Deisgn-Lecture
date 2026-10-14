import React, { useState } from 'react';
import { Sparkles, FileText, Printer, Check, X, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoadSample: () => void;
  onOpenGuide?: () => void;
}

export const OnboardingModal: React.FC<Props> = ({ isOpen, onClose, onLoadSample, onOpenGuide }) => {
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          maxWidth: 540,
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.25s ease'
        }}
      >
        {/* Yuqori qism */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1b2a4a 0%, #2a3e68 100%)',
            padding: '24px 28px',
            color: '#ffffff',
            position: 'relative'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>

          <div
            style={{
              display: 'inline-flex',
              padding: '4px 10px',
              borderRadius: 20,
              background: 'rgba(217, 119, 6, 0.25)',
              color: '#fbbf24',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: 8
            }}
          >
            Bosqich {step} / 3
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: '1.4rem',
              fontFamily: 'var(--font-serif)',
              fontWeight: 700
            }}
          >
            {step === 1 && '1. Promptni nusxalash'}
            {step === 2 && '2. AI javobini joylashtirish'}
            {step === 3 && '3. PDF yuklab olish va takrorlash'}
          </h3>
        </div>

        {/* Mazmun */}
        <div style={{ padding: '28px' }}>
          {step === 1 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb'
                  }}
                >
                  <Sparkles size={32} />
                </div>
              </div>
              <p style={{ fontSize: '0.98rem', lineHeight: 1.6, color: '#334155', margin: 0 }}>
                Ilovadagi <strong>«AI ko‘rsatmasini nusxalash»</strong> tugmasini bosing va uni
                ChatGPT, Claude yoki Gemini’ga yuboring. O‘z konspektingiz yoki moddalarni qo‘shing —
                sun’iy intellekt sizga tayyor sodda <strong>MD+</strong> matnini yaratib beradi.
              </p>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d97706'
                  }}
                >
                  <FileText size={32} />
                </div>
              </div>
              <p style={{ fontSize: '0.98rem', lineHeight: 1.6, color: '#334155', margin: 0 }}>
                Olingan MD+ javobini chap tomondagi <strong>Muharrir</strong> oynasiga joylashtiring.
                Tizim hech qachon xatolik bilan qulab tushmaydi va darhol jonli ko‘rinishni namoyish etadi.
              </p>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: '#d1fae5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#059669'
                  }}
                >
                  <Printer size={32} />
                </div>
              </div>
              <p style={{ fontSize: '0.98rem', lineHeight: 1.6, color: '#334155', margin: 0 }}>
                <strong>«PDF yuklab olish»</strong> tugmasi orqali 9:16 vertikal formatdagi mukammal
                o‘quv qo‘llanmasiga ega bo‘lasiz. Savol-javoblar avtomatik ravishda fleshkardlarga aylanadi.
              </p>
            </div>
          )}
        </div>

        {/* Quyi tugmalar */}
        <div
          style={{
            padding: '16px 28px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                onLoadSample();
                onClose();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Namunani ko‘rish
            </button>
            {onOpenGuide && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGuide();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Batafsil Qo‘llanma
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Orqaga
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#1b2a4a',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                Keyingisi <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#059669',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                Boshlash <Check size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
