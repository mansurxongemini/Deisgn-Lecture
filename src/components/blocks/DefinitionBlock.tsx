import React from 'react';
import type { DefinitionBlock as DefinitionBlockType } from '../../schema/types';
import { FormattedText } from '../../utils/inlineMarkdown';
import { CanvasEditable } from '../preview/CanvasEditable';
import { Bookmark } from 'lucide-react';

interface Props {
  block: DefinitionBlockType;
}

export const DefinitionBlock: React.FC<Props> = ({ block }) => {
  return (
    <div className="block-container def-compact-container" id={block.id}>
      <div className="def-inline-box">
        <span className="def-term-wrapper">
          <Bookmark
            size={14}
            className="def-icon in-card-icon"
            style={{ display: 'inline', marginRight: 4, verticalAlign: -1, userSelect: 'none' }}
          />
          <CanvasEditable
            as="strong"
            className="def-term"
            data-canvas-editable="true"
            data-edit-type="def_term"
            data-source-line={block.sourceLine}
            data-block-id={block.id}
            text={block.term}
          />
          <span contentEditable={false} style={{ userSelect: 'none' }}>: </span>
        </span>{' '}
        <CanvasEditable
          as="span"
          className="def-body"
          data-canvas-editable="true"
          data-edit-type="def_body"
          data-source-line={block.sourceLine}
          data-block-id={block.id}
          text={block.definition}
        />
        {block.source && (
          <CanvasEditable
            as="span"
            className="def-source-tag"
            data-canvas-editable="true"
            data-edit-type="def_source"
            data-source-line={block.sourceLine}
            data-block-id={block.id}
          >
            {' '}&mdash; <FormattedText text={block.source} />
          </CanvasEditable>
        )}
      </div>
    </div>
  );
};
