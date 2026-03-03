import { useRef, useEffect, useCallback } from "react";
import { htmlToMarkdown } from "@/lib/format-text";

interface RichEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  className?: string;
}

export default function RichEditor({ value, onChange, placeholder, maxLength, autoFocus, className }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (!editorRef.current || isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (editorRef.current.innerHTML === '' && value === '') return;
    const html = markdownToHtml(value);
    if (editorRef.current.innerHTML !== html) {
      const sel = window.getSelection();
      const hadFocus = document.activeElement === editorRef.current;
      let savedOffset = 0;
      if (hadFocus && sel && sel.rangeCount > 0) {
        savedOffset = getCaretOffset(editorRef.current);
      }
      editorRef.current.innerHTML = html;
      if (hadFocus) {
        restoreCaretOffset(editorRef.current, savedOffset);
      }
    }
  }, [value]);

  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocus]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const md = htmlContentToMarkdown(html);
    if (maxLength && md.length > maxLength) return;
    isInternalChange.current = true;
    onChange(md);
  }, [onChange, maxLength]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const plain = e.clipboardData.getData('text/plain');

    let textToInsert: string;
    if (html) {
      textToInsert = htmlToMarkdown(html);
    } else {
      textToInsert = plain;
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    sel.deleteFromDocument();

    const insertHtml = markdownToHtml(textToInsert);
    const frag = document.createRange().createContextualFragment(insertHtml);
    sel.getRangeAt(0).insertNode(frag);

    sel.collapseToEnd();
    handleInput();
  }, [handleInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      document.execCommand('bold');
      handleInput();
    } else if (e.key === 'i' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      document.execCommand('italic');
      handleInput();
    } else if (e.key === 'u' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      document.execCommand('underline');
      handleInput();
    }
  }, [handleInput]);

  const applyFormat = useCallback((command: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleInput();
  }, [handleInput]);

  const applyHeading = useCallback((level: number) => {
    editorRef.current?.focus();
    if (level === 0) {
      document.execCommand('formatBlock', false, 'div');
    } else {
      document.execCommand('formatBlock', false, `h${level}`);
    }
    handleInput();
  }, [handleInput]);

  return {
    editorRef,
    applyFormat,
    applyHeading,
    editorElement: (
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        className={`outline-none ${className || ''} [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-[#909090]/40 [&:empty]:before:pointer-events-none [&_h1]:text-2xl [&_h1]:md:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:mt-1 [&_h1]:mb-1 [&_h2]:text-xl [&_h2]:md:text-2xl [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:mt-1 [&_h2]:mb-1 [&_h3]:text-lg [&_h3]:md:text-xl [&_h3]:font-semibold [&_h3]:leading-tight [&_h3]:mt-1 [&_h3]:mb-1 [&_h4]:text-base [&_h4]:md:text-lg [&_h4]:font-semibold [&_h4]:leading-tight [&_h4]:mt-1 [&_h4]:mb-1 [&_h5]:text-sm [&_h5]:md:text-base [&_h5]:font-medium [&_h5]:uppercase [&_h5]:tracking-wide [&_h5]:mt-1 [&_h5]:mb-1 [&_h6]:text-xs [&_h6]:md:text-sm [&_h6]:font-medium [&_h6]:uppercase [&_h6]:tracking-wider [&_h6]:text-[#737373] [&_h6]:mt-1 [&_h6]:mb-1 [&_hr]:border-black/10 [&_hr]:my-2 [&_ul]:pl-4 [&_li]:list-disc`}
        data-placeholder={placeholder || ''}
        data-testid="input-rich-editor"
      />
    ),
  };
}

function markdownToHtml(md: string): string {
  if (!md) return '';
  const lines = md.split('\n');
  const htmlLines: string[] = [];

  for (const line of lines) {
    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      htmlLines.push('<hr>');
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = inlineMarkdownToHtml(headingMatch[2]);
      htmlLines.push(`<h${level}>${content}</h${level}>`);
      continue;
    }

    const bulletMatch = line.match(/^[\*\-\+]\s+(.+)$/);
    if (bulletMatch) {
      const content = inlineMarkdownToHtml(bulletMatch[1]);
      htmlLines.push(`<div>• ${content}</div>`);
      continue;
    }

    if (line.trim() === '') {
      htmlLines.push('<br>');
      continue;
    }

    htmlLines.push(`<div>${inlineMarkdownToHtml(line)}</div>`);
  }

  return htmlLines.join('');
}

function inlineMarkdownToHtml(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<b><i>$1</i></b>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>');
}

function htmlContentToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const result = Array.from(doc.body.childNodes).map(nodeToMarkdown).join('\n');
  return result.replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
}

function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const children = Array.from(el.childNodes).map(nodeToMarkdown).join('');

  switch (tag) {
    case 'b':
    case 'strong':
      return `**${children}**`;
    case 'i':
    case 'em':
      return `*${children}*`;
    case 'u':
    case 'ins':
      return `__${children}__`;
    case 'h1': return `# ${children}`;
    case 'h2': return `## ${children}`;
    case 'h3': return `### ${children}`;
    case 'h4': return `#### ${children}`;
    case 'h5': return `##### ${children}`;
    case 'h6': return `###### ${children}`;
    case 'hr': return '***';
    case 'br': return '';
    case 'div':
    case 'p':
      return children;
    case 'span': {
      const style = el.getAttribute('style') || '';
      let r = children;
      if (style.match(/font-weight:\s*(bold|[7-9]00)/)) r = `**${r}**`;
      if (style.match(/font-style:\s*italic/)) r = `*${r}*`;
      if (style.match(/text-decoration[^;]*underline/)) r = `__${r}__`;
      return r;
    }
    default:
      return children;
  }
}

function getCaretOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0).cloneRange();
  range.selectNodeContents(el);
  range.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  return range.toString().length;
}

function restoreCaretOffset(el: HTMLElement, offset: number) {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();

  let current = 0;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.nextNode();

  while (node) {
    const len = (node.textContent || '').length;
    if (current + len >= offset) {
      range.setStart(node, Math.min(offset - current, len));
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    current += len;
    node = walker.nextNode();
  }

  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}
