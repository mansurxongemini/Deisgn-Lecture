import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { SAMPLE_CATALOG, type SampleDocItem } from '../../samples/catalog';
import {
  FileText,
  Scale,
  Gavel,
  HelpCircle,
  FilePlus2,
  X,
  AlertTriangle,
  FolderPlus,
  RefreshCw
} from 'lucide-react';
import './editor.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SampleDocItem, mode: 'replace' | 'new_doc') => void;
  currentContent: string;
}

export const SamplePickerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectSample,
  currentContent
}) => {
  const [pendingSample, setPendingSample] = useState<SampleDocItem | null>(null);

  if (!isOpen) return null;

  // Hujjatda o'zgartirilgan yoki saqlanmagan foydalanuvchi matni bormi?
  const trimmed = (currentContent || '').trim();
  const hasUserWork = trimmed.length > 30 && !trimmed.startsWith('# Yangi hujjat\n\n## 1-Mavzu');

  const handleCardClick = (sample: SampleDocItem) => {
    if (hasUserWork) {
      setPendingSample(sample);
    } else {
      onSelectSample(sample, 'replace');
      onClose();
    }
  };

  const handleConfirmReplace = () => {
    if (pendingSample) {
      onSelectSample(pendingSample, 'replace');
      setPendingSample(null);
      onClose();
    }
  };

  const handleConfirmNewDoc = () => {
    if (pendingSample) {
      onSelectSample(pendingSample, 'new_doc');
      setPendingSample(null);
      onClose();
    }
  };

  const renderIcon = (id: string) => {
    switch (id) {
      case 'civil_law':
        return <Scale size={20} className="sample-card-icon" />;
      case 'constitutional_law':
        return <FileText size={20} className="sample-card-icon" />;
      case 'case_study':
        return <Gavel size={20} className="sample-card-icon" />;
      case 'flashcards':
        return <HelpCircle size={20} className="sample-card-icon" />;
      case 'blank':
      default:
        return <FilePlus2 size={20} className="sample-card-icon" />;
    }
  };

  const modalContent = (
    <div className="editor-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="editor-modal-card sample-picker-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="editor-modal-header">
          <div className="editor-modal-title-group">
            <h3 className="editor-modal-title">Namunaviy konspektni tanlang</h3>
            <p className="editor-modal-subtitle">
              Tayyor huquqiy mavzular, kazuslar yoki bo‘sh qoralamadan birini yuklang
            </p>
          </div>
          <button
            type="button"
            className="editor-modal-close-btn"
            onClick={onClose}
            aria-label="Yopish"
          >
            <X size={18} />
          </button>
        </div>

        {pendingSample ? (
          // Ogohlantirish va tasdiqlash bosqichi (Never overwrite without confirmation)
          <div className="sample-confirm-box">
            <div className="sample-confirm-icon-row">
              <div className="sample-confirm-icon-wrap">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="sample-confirm-title">Joriy hujjatda kiritilgan matn mavjud</h4>
                <p className="sample-confirm-desc">
                  Siz <strong>«{pendingSample.title}»</strong> namunasini tanladingiz. Hozirgi matningizni yo‘qotmaslik uchun uni yangi hujjat sifatida ochishingiz yoki mavjudini almashtirishingiz mumkin.
                </p>
              </div>
            </div>

            <div className="sample-confirm-actions">
              <button
                type="button"
                className="sample-confirm-btn sample-confirm-newdoc"
                onClick={handleConfirmNewDoc}
              >
                <FolderPlus size={16} />
                <span>Yangi alohida hujjat sifatida ochish (Tavsiya etiladi)</span>
              </button>
              <button
                type="button"
                className="sample-confirm-btn sample-confirm-replace"
                onClick={handleConfirmReplace}
              >
                <RefreshCw size={16} />
                <span>Joriy hujjatni almashtirish</span>
              </button>
              <button
                type="button"
                className="sample-confirm-btn sample-confirm-cancel"
                onClick={() => setPendingSample(null)}
              >
                <span>Bekor qilish</span>
              </button>
            </div>
          </div>
        ) : (
          // Namunalar ro'yxati (5 ta)
          <div className="sample-grid">
            {SAMPLE_CATALOG.map((sample) => (
              <button
                key={sample.id}
                type="button"
                className="sample-picker-card"
                onClick={() => handleCardClick(sample)}
              >
                <div className="sample-card-head">
                  <div className="sample-card-icon-box">{renderIcon(sample.id)}</div>
                  <span className="sample-card-badge">{sample.badge}</span>
                </div>
                <h4 className="sample-card-title">{sample.title}</h4>
                <p className="sample-card-desc">{sample.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
