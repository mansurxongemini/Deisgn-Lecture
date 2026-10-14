import React from 'react';
import type { TableBlock as TableBlockType } from '../../schema/types';
import { FormattedText } from '../../utils/inlineMarkdown';

interface Props {
  block: TableBlockType;
}

export const TableBlock: React.FC<Props> = ({ block }) => {
  return (
    <div
      className="block-container"
      id={block.id}
      data-source-line={block.sourceLine}
    >
      <div className="table-wrapper">
        {(block.title || block.caption) && (
          <div
            className="table-caption"
            data-canvas-editable="true"
            data-edit-type="table_caption"
            data-source-line={block.sourceLine}
            data-block-id={block.id}
          >
            <FormattedText text={block.title || block.caption} />
          </div>
        )}
        <table className="study-table" data-col-count={(block.headers || []).length}>
          <thead>
            <tr>
              {block.headers.map((h, i) => (
                <th
                  key={i}
                  data-canvas-editable="true"
                  data-edit-type="table_cell"
                  data-source-line={block.sourceLine}
                  data-row-idx="-1"
                  data-col-idx={i}
                  data-block-id={block.id}
                >
                  <FormattedText text={h} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    data-canvas-editable="true"
                    data-edit-type="table_cell"
                    data-source-line={block.sourceLine}
                    data-row-idx={rIdx}
                    data-col-idx={cIdx}
                    data-block-id={block.id}
                  >
                    <FormattedText text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
