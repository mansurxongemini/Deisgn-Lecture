import React, { useState } from 'react';
import type { QaBlock as QaBlockType } from '../../schema/types';
import { FormattedText } from '../../utils/inlineMarkdown';
import { CanvasEditable } from '../preview/CanvasEditable';
import { HelpCircle, Eye, EyeOff } from 'lucide-react';

interface Props {
  block: QaBlockType;
  forceShowAnswer?: boolean;
}

/**
 * Yagona ixcham savol-javob bloki (A4 va O'quvchi rejimlarida)
 */
export const QaBlock: React.FC<Props> = ({ block, forceShowAnswer = false }) => {
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const showAnswer = forceShowAnswer || isRevealed;

  return (
    <div className="block-container qa-compact-container" id={block.id}>
      <div className="qa-compact-box">
        {block.question && (
          <div className="qa-compact-q">
            <strong className="qa-q-label">Savol: </strong>
            <CanvasEditable
              as="span"
              className="qa-q-text"
              data-canvas-editable="true"
              data-edit-type="qa_question"
              data-source-line={block.sourceLine}
              data-block-id={block.id}
              text={block.question}
            />
          </div>
        )}

        {block.answer && !forceShowAnswer && !isRevealed && (
          <div className="qa-reveal-action-row no-print">
            <button
              type="button"
              className="qa-reveal-btn"
              onClick={() => setIsRevealed(true)}
              aria-expanded={false}
              title="To‘g‘ri javobni ko‘rish"
            >
              <Eye size={13} />
              <span>Javobni ko‘rsatish</span>
            </button>
          </div>
        )}

        {block.answer && showAnswer && (
          <div className="qa-compact-a">
            <span className="qa-a-label">Javob: </span>
            <CanvasEditable
              as="span"
              className="qa-a-text"
              data-canvas-editable="true"
              data-edit-type="qa_answer"
              data-source-line={block.sourceLine}
              data-block-id={block.id}
              text={block.answer}
            />
            {block.hint && (
              <span className="qa-compact-hint"> (Eslatma: <FormattedText text={block.hint} />)</span>
            )}
            {!forceShowAnswer && (
              <button
                type="button"
                className="qa-reveal-hide-btn no-print"
                onClick={() => setIsRevealed(false)}
                title="Javobni qayta yashirish"
                aria-expanded={true}
              >
                <EyeOff size={12} />
                <span>Yashirish</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface GroupProps {
  blocks: QaBlockType[];
  title?: string;
  forceShowAnswer?: boolean;
}

/**
 * Ketma-ket kelgan savol-javob bloklari birlashtirilgan "Takrorlash savollari" bloki
 */
export const CompactQaGroup: React.FC<GroupProps> = ({
  blocks,
  title = 'Takrorlash savollari',
  forceShowAnswer = false
}) => {
  const [revealedMap, setRevealedMap] = useState<Record<string, boolean>>({});
  const [allRevealed, setAllRevealed] = useState<boolean>(false);

  if (blocks.length === 0) return null;

  const toggleItem = (key: string) => {
    setRevealedMap((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleAll = () => {
    const nextState = !allRevealed;
    setAllRevealed(nextState);
    const updated: Record<string, boolean> = {};
    blocks.forEach((b, idx) => {
      updated[b.id || String(idx)] = nextState;
    });
    setRevealedMap(updated);
  };

  return (
    <div className="block-container qa-group-container">
      <div className="qa-group-header">
        <div className="qa-group-header-left">
          <HelpCircle size={15} className="qa-group-icon" />
          <h4 className="qa-group-title">{title}</h4>
        </div>
        {!forceShowAnswer && (
          <button
            type="button"
            className="qa-group-reveal-all-btn no-print"
            onClick={handleToggleAll}
          >
            {allRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{allRevealed ? 'Barchasini yashirish' : 'Barcha javoblarni ko‘rsatish'}</span>
          </button>
        )}
      </div>

      <div className="qa-group-list">
        {blocks.map((block, idx) => {
          const itemKey = block.id || String(idx);
          const isItemRevealed = forceShowAnswer || Boolean(revealedMap[itemKey] || allRevealed);

          return (
            <div key={block.id || idx} className="qa-group-item" id={block.id}>
              <div className="qa-compact-q">
                <span className="qa-item-num">{idx + 1}. </span>
                <strong className="qa-q-label">Savol: </strong>
                <CanvasEditable
                  as="span"
                  className="qa-q-text"
                  data-canvas-editable="true"
                  data-edit-type="qa_question"
                  data-source-line={block.sourceLine}
                  data-block-id={block.id}
                  text={block.question}
                />
              </div>

              {block.answer && !forceShowAnswer && !isItemRevealed && (
                <div className="qa-reveal-action-row no-print">
                  <button
                    type="button"
                    className="qa-reveal-btn"
                    onClick={() => toggleItem(itemKey)}
                    title="Javobni ko‘rish"
                  >
                    <Eye size={12} />
                    <span>Javobni ko‘rsatish</span>
                  </button>
                </div>
              )}

              {block.answer && isItemRevealed && (
                <div className="qa-compact-a">
                  <span className="qa-a-label">Javob: </span>
                  <CanvasEditable
                    as="span"
                    className="qa-a-text"
                    data-canvas-editable="true"
                    data-edit-type="qa_answer"
                    data-source-line={block.sourceLine}
                    data-block-id={block.id}
                    text={block.answer}
                  />
                  {block.hint && (
                    <span className="qa-compact-hint"> (Eslatma: <FormattedText text={block.hint} />)</span>
                  )}
                  {!forceShowAnswer && (
                    <button
                      type="button"
                      className="qa-reveal-hide-btn no-print"
                      onClick={() => toggleItem(itemKey)}
                      title="Javobni yashirish"
                    >
                      <EyeOff size={12} />
                      <span>Yashirish</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
