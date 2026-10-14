import React from 'react';
import type { FlowBlock as FlowBlockType } from '../../schema/types';
import { FormattedText } from '../../utils/inlineMarkdown';

interface Props {
  block: FlowBlockType;
}

export const FlowBlock: React.FC<Props> = ({ block }) => {
  const hasDescriptions = block.steps.some((s) => Boolean(s.description && s.description.trim()));
  const hasLongTitles = block.steps.some((s) => Boolean(s.title && s.title.length > 40));
  const isLong = hasDescriptions || hasLongTitles || block.steps.length > 6;

  const titleElement = block.title ? (
    <div className="flow-title-row">
      <span className="flow-title-badge">Jarayon</span>
      <span
        className="flow-title-text"
        data-canvas-editable="true"
        data-edit-type="flow_title"
        data-source-line={block.sourceLine}
        data-block-id={block.id}
      >
        <FormattedText text={block.title} />
      </span>
    </div>
  ) : null;

  if (isLong) {
    // Numbered step sequence fallback
    return (
      <div
        className="block-container flow-container"
        id={block.id}
        data-source-line={block.sourceLine}
      >
        {titleElement}
        <div className="flow-vertical-list">
          {block.steps.map((step, idx) => (
            <div key={idx} className="flow-vertical-item">
              <span className="flow-step-num">{idx + 1}</span>
              <div className="flow-vertical-body">
                <span
                  className="flow-step-title"
                  data-canvas-editable="true"
                  data-edit-type="flow_step"
                  data-item-idx={idx}
                  data-source-line={step.sourceLine || block.sourceLine}
                  data-block-id={block.id}
                >
                  <FormattedText text={step.title} />
                </span>
                {step.description && (
                  <span
                    className="flow-step-desc"
                    data-canvas-editable="true"
                    data-edit-type="flow_desc"
                    data-item-idx={idx}
                    data-source-line={step.sourceLine || block.sourceLine}
                    data-block-id={block.id}
                  >
                    {' '}&mdash; <FormattedText text={step.description} />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Horizontal wrapping chain — wraps seamlessly, never clips or truncates text
  return (
    <div
      className="block-container flow-container"
      id={block.id}
      data-source-line={block.sourceLine}
    >
      {titleElement}
      <div className="flow-chain-wrapper">
        {block.steps.map((step, idx) => (
          <React.Fragment key={idx}>
            <div className="flow-chain-badge">
              <span className="flow-step-num">{idx + 1}</span>
              <span
                className="flow-chain-text"
                data-canvas-editable="true"
                data-edit-type="flow_step"
                data-item-idx={idx}
                data-source-line={step.sourceLine || block.sourceLine}
                data-block-id={block.id}
              >
                <FormattedText text={step.title} />
              </span>
            </div>
            {idx < block.steps.length - 1 && (
              <span className="flow-chain-separator" aria-hidden="true">&rarr;</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
