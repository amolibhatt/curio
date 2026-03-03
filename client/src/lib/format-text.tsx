import React from "react";

export function formatText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(__(.+?)__)|(\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      parts.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<u key={key++}>{match[4]}</u>);
    } else if (match[5]) {
      parts.push(<em key={key++}>{match[6]}</em>);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function insertFormatting(
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix: string,
  setText: (val: string) => void
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.slice(start, end);

  const newText = text.slice(0, start) + prefix + selected + suffix + text.slice(end);
  setText(newText);

  requestAnimationFrame(() => {
    textarea.focus();
    if (selected.length > 0) {
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    } else {
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }
  });
}
