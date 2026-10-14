import React from 'react';
import type { TextBlock as TextBlockType } from '../../schema/types';
import { CanvasEditable } from '../preview/CanvasEditable';

interface Props {
  block: TextBlockType;
}

export const TextBlock: React.FC<Props> = ({ block }) => {
  return (
    <div className="block-container" id={block.id}>
      <CanvasEditable
        as="p"
        className={`study-text ${block.lead ? 'study-text-lead' : ''}`}
        data-canvas-editable="true"
        data-edit-type="paragraph"
        data-source-line={block.sourceLine}
        data-block-id={block.id}
        text={block.text}
      />
    </div>
  );
};
