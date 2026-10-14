import React from 'react';
import { FormattedText } from '../../utils/inlineMarkdown';

interface CanvasEditableProps {
  as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'strong' | 'p';
  text?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

/**
 * Tahrirlanayotgan paytda kursor sakrab ketmasligi (caret jump to 0) uchun
 * React re-render jarayonida o'z DOM bolalarini saqlab qoluvchi maxsus komponent.
 */
export const CanvasEditable: React.FC<CanvasEditableProps> = React.memo(
  ({ as: Component = 'span', text, children, ...props }) => {
    return (
      <Component {...props}>
        {children !== undefined ? children : <FormattedText text={text} />}
      </Component>
    );
  },
  (prev, next) => {
    if (typeof document !== 'undefined') {
      const activeEl = document.querySelector('.canvas-is-editing');
      if (activeEl) {
        const nextBlockId = next['data-block-id'];
        const activeBlockId = activeEl.getAttribute('data-block-id');
        const nextEditType = next['data-edit-type'];
        const activeEditType = activeEl.getAttribute('data-edit-type');
        const nextLine = next['data-source-line'];
        const activeLine = activeEl.getAttribute('data-source-line');

        const isSame =
          (nextBlockId && activeBlockId && nextBlockId === activeBlockId && nextEditType === activeEditType) ||
          (nextEditType && activeEditType && nextEditType === activeEditType && String(nextLine) === String(activeLine));

        if (isSame) {
          return true; // Foydalanuvchi hozir yozayotgan element bolalarini React o'chirib qayta qurmasin!
        }
      }
    }
    return (
      prev.text === next.text &&
      prev['data-edit-type'] === next['data-edit-type'] &&
      prev['data-source-line'] === next['data-source-line'] &&
      prev['data-block-id'] === next['data-block-id'] &&
      prev.className === next.className &&
      prev.children === next.children
    );
  }
);
