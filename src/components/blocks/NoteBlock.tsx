import React from 'react';
import type { NoteBlock as NoteBlockType } from '../../schema/types';
import { FormattedText } from '../../utils/inlineMarkdown';
import { AlertTriangle, Lightbulb, Info, Quote } from 'lucide-react';

interface Props {
  block: NoteBlockType;
}

export const NoteBlock: React.FC<Props> = ({ block }) => {
  const variant = block.variant || 'tip';

  const getIcon = () => {
    switch (variant) {
      case 'warning':
        return <AlertTriangle className="note-icon in-card-icon" />;
      case 'tip':
        return <Lightbulb className="note-icon in-card-icon" />;
      case 'important':
        return <Info className="note-icon in-card-icon" />;
      case 'quote':
        return <Quote className="note-icon in-card-icon" />;
      default:
        return <Info className="note-icon in-card-icon" />;
    }
  };

  return (
    <div className="block-container" id={block.id}>
      <div className={`study-note note-${variant}`}>
        {getIcon()}
        <div className="note-content">
          {block.title && (
            <h5
              className="note-title"
              data-canvas-editable="true"
              data-edit-type="note_title"
              data-source-line={block.sourceLine}
              data-block-id={block.id}
            >
              <FormattedText text={block.title} />
            </h5>
          )}
          <p
            className="note-text"
            data-canvas-editable="true"
            data-edit-type="note_text"
            data-source-line={block.sourceLine}
            data-block-id={block.id}
          >
            <FormattedText text={block.text} />
          </p>
        </div>
      </div>
    </div>
  );
};
