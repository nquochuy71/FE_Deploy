import { useEffect, useRef, type TextareaHTMLAttributes } from 'react';

type AutoGrowTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  minHeight?: number;
  maxHeight?: number;
};

export const AutoGrowTextarea = ({ minHeight = 120, maxHeight = 280, className = '', onInput, value, ...props }: AutoGrowTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeTextarea = () => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }

    element.style.height = 'auto';
    const nextHeight = Math.min(element.scrollHeight, maxHeight);
    element.style.height = `${Math.max(nextHeight, minHeight)}px`;
    element.style.overflowY = element.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  useEffect(() => {
    resizeTextarea();
  }, [value]);

  return (
    <textarea
      {...props}
      ref={textareaRef}
      value={value}
      onInput={(event) => {
        resizeTextarea();
        onInput?.(event);
      }}
      className={`${className} resize-none`}
    />
  );
};
