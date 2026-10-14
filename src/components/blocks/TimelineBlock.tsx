import React from 'react';
import type { TimelineBlock as TimelineBlockType } from '../../schema/types';
import { FormattedText } from '../../utils/inlineMarkdown';
import { Clock } from 'lucide-react';

interface Props {
  block: TimelineBlockType;
}

export const TimelineBlock: React.FC<Props> = ({ block }) => {
  return (
    <div
      className="block-container"
      id={block.id}
      data-source-line={block.sourceLine}
    >
      <div className="timeline-container">
        <div className="timeline-spine" />
        <div className="timeline-events-list">
          {block.events.map((ev, idx) => (
            <div key={idx} className="timeline-event-item">
              <div className="timeline-marker">
                <div className="timeline-dot" />
              </div>

              <div className="timeline-event-body">
                <div
                  className="timeline-date-badge"
                  data-canvas-editable="true"
                  data-edit-type="timeline_date"
                  data-item-idx={idx}
                  data-source-line={block.sourceLine}
                  data-block-id={block.id}
                >
                  <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {ev.date}
                </div>
                <h5
                  className="timeline-event-title"
                  data-canvas-editable="true"
                  data-edit-type="timeline_title"
                  data-item-idx={idx}
                  data-source-line={block.sourceLine}
                  data-block-id={block.id}
                >
                  <FormattedText text={ev.title} />
                </h5>
                <p
                  className="timeline-event-desc"
                  data-canvas-editable="true"
                  data-edit-type="timeline_desc"
                  data-item-idx={idx}
                  data-source-line={block.sourceLine}
                  data-block-id={block.id}
                >
                  <FormattedText text={ev.description} />
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
