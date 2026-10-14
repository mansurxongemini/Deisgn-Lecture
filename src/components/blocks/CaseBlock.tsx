import React from 'react';
import type { CaseBlock as CaseBlockType, BlockStyleOverride } from '../../schema/types';
import { FormattedText } from '../../utils/inlineMarkdown';
import { Gavel, Building } from 'lucide-react';

interface Props {
  block: CaseBlockType;
  override?: BlockStyleOverride;
}

interface StepConfig {
  key: string;
  stepClass: string;
  label: string;
  text?: string;
}

export const CaseBlock: React.FC<Props> = ({ block, override }) => {
  const steps: StepConfig[] = [
    { key: 'facts', stepClass: 'step-facts', label: 'Vaziyat va faktlar', text: block.facts },
    { key: 'issue', stepClass: 'step-issue', label: 'Huquqiy masala', text: block.issue },
    { key: 'rule', stepClass: 'step-rule', label: 'Qo‘llaniladigan norma', text: block.rule },
    { key: 'analysis', stepClass: 'step-analysis', label: 'Yuridik tahlil', text: block.analysis },
    { key: 'conclusion', stepClass: 'step-conclusion', label: block.court ? 'Sud qarori va xulosa' : 'Xulosa', text: block.conclusion }
  ].filter((s) => Boolean(s.text && s.text.trim()));

  const customAccent = override?.accentColor;
  const cardStyle: React.CSSProperties = {
    ...(customAccent
      ? {
          borderLeftColor: customAccent,
          '--block-accent': customAccent,
        }
      : {})
  };

  return (
    <div className="block-container" id={block.id}>
      <div className="case-card" style={cardStyle}>
        <div className="case-header">
          <div className="case-title-area">
            <Gavel className="case-gavel-icon in-card-icon" />
            <h4
              className="case-name"
              data-canvas-editable="true"
              data-edit-type="case_title"
              data-source-line={block.sourceLine}
              data-block-id={block.id}
            >
              <FormattedText text={block.title || block.name || 'Sud kazusi'} />
              {block.isContinuation && <span className="case-continuation-text"> (davomi)</span>}
            </h4>
          </div>
          {block.court && (
            <div className="case-court-badge">
              <Building className="case-court-icon in-card-icon" />
              <span>{block.court}</span>
            </div>
          )}
        </div>

        <div className="case-steps-container case-stepper-pipeline">
          {steps.map((step, idx) => (
            <div key={step.key} className={`case-step ${step.stepClass}`}>
              <div className="case-step-left">
                <div className="case-step-indicator" title={step.label}>
                  {idx + 1}
                </div>
                {idx < steps.length - 1 && <div className="case-step-line" />}
              </div>
              <div className="case-step-content">
                <div className="case-step-label">{step.label}</div>
                <p
                  className="case-step-text"
                  data-canvas-editable="true"
                  data-edit-type={`case_${step.key}`}
                  data-source-line={block.sourceLine}
                  data-block-id={block.id}
                >
                  <FormattedText text={step.text!} />
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
