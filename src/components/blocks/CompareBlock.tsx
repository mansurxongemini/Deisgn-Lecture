import React from 'react';
import type { CompareBlock as CompareBlockType } from '../../schema/types';
import { FormattedText } from '../../utils/inlineMarkdown';
import { GitCompare, Check } from 'lucide-react';

interface Props {
  block: CompareBlockType;
}

export const CompareBlock: React.FC<Props> = ({ block }) => {
  return (
    <div
      className="block-container"
      id={block.id}
      data-source-line={block.sourceLine}
    >
      <div className="compare-card">
        <div className="compare-grid" style={{ '--col-count': block.items.length } as React.CSSProperties}>
          {block.items.map((col, idx) => (
            <div key={idx} className="compare-column">
              <div className="compare-col-header">
                <div className="compare-title-row">
                  <GitCompare size={16} className="compare-icon" />
                  <h5
                    className="compare-col-title"
                    data-canvas-editable="true"
                    data-edit-type="compare_title"
                    data-col-idx={idx}
                    data-source-line={block.sourceLine}
                    data-block-id={block.id}
                  >
                    <FormattedText text={col.title} />
                  </h5>
                </div>
                {col.badge && <span className="compare-badge">{col.badge}</span>}
              </div>

              <ul className="compare-points-list">
                {col.points.map((pt, pIdx) => (
                  <li key={pIdx} className="compare-point-item">
                    <span className="compare-check-icon">
                      <Check size={13} />
                    </span>
                    <span
                      className="compare-point-text"
                      data-canvas-editable="true"
                      data-edit-type="compare_point"
                      data-col-idx={idx}
                      data-item-idx={pIdx}
                      data-source-line={block.sourceLine}
                      data-block-id={block.id}
                    >
                      <FormattedText text={pt} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
