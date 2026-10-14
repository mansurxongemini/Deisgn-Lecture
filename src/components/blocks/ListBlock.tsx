import React from 'react';
import type { ListBlock as ListBlockType } from '../../schema/types';
import { FormattedText } from '../../utils/inlineMarkdown';

interface Props {
  block: ListBlockType;
}

export const ListBlock: React.FC<Props> = ({ block }) => {
  const isOrdered = block.ordered === true;

  if (isOrdered) {
    return (
      <div className="block-container" id={block.id}>
        <ol className="study-list">
          {block.items.map((item, idx) => (
            <li
              key={idx}
              className="study-list-item"
              data-canvas-editable="true"
              data-edit-type="list_item"
              data-item-idx={idx}
              data-source-line={block.sourceLine}
              data-block-id={block.id}
            >
              <FormattedText text={item} />
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="block-container" id={block.id}>
      <ul className="study-list">
        {block.items.map((item, idx) => (
          <li
            key={idx}
            className="study-list-item"
            data-canvas-editable="true"
            data-edit-type="list_item"
            data-item-idx={idx}
            data-source-line={block.sourceLine}
            data-block-id={block.id}
          >
            <FormattedText text={item} />
          </li>
        ))}
      </ul>
    </div>
  );
};
