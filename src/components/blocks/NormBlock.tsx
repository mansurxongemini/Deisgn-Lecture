import React from 'react';
import type { NormBlock as NormBlockType } from '../../schema/types';
import { CanvasEditable } from '../preview/CanvasEditable';
import { Scale, BookOpen, Calendar } from 'lucide-react';

interface Props {
  block: NormBlockType;
}

export const NormBlock: React.FC<Props> = ({ block }) => {
  let badgeText = block.number;
  let titleText = block.title;

  if (block.number && block.title && (block.number === block.title || block.title.startsWith(block.number))) {
    const match = block.number.match(/^(\d+(?:-[a-zA-Z]+|\s*-\s*[a-zA-Z]+)?(?:-modda|[.\s]))\s*(.*)$/i);
    if (match && match[2]) {
      badgeText = match[1].replace(/[.:]\s*$/, '').trim();
      titleText = match[2].trim();
    }
  }

  return (
    <div className="block-container" id={block.id}>
      <div className="norm-plaque">
        <div className="norm-header">
          <div className="norm-badge-group">
            <span className="norm-number-badge">{badgeText}</span>
            <Scale className="norm-scale-icon in-card-icon" />
          </div>
          <CanvasEditable
            as="h4"
            className="norm-title"
            data-canvas-editable="true"
            data-edit-type="norm_title"
            data-source-line={block.sourceLine}
            data-block-id={block.id}
            text={titleText}
          />
        </div>

        <CanvasEditable
          as="div"
          className="norm-body"
          data-canvas-editable="true"
          data-edit-type="norm_text"
          data-source-line={block.sourceLine}
          data-block-id={block.id}
          text={block.text}
        />

        {(block.source || block.effectiveDate) && (
          <div className="norm-footer">
            {block.source ? (
              <span className="norm-source">
                <BookOpen className="norm-source-icon in-card-icon" />
                <CanvasEditable
                  as="span"
                  className="norm-source-text"
                  data-canvas-editable="true"
                  data-edit-type="norm_source"
                  data-source-line={block.sourceLine}
                  data-block-id={block.id}
                  text={block.source}
                />
              </span>
            ) : (
              <span />
            )}
            {block.effectiveDate && (
              <span className="norm-date">
                <Calendar className="norm-date-icon in-card-icon" />
                <span>Sana: {block.effectiveDate}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
