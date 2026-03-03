import React from "react";

function formatInline(text: string, keyOffset: number = 0): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(__(.+?)__)|(\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;
  let key = keyOffset;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      parts.push(<strong key={key++}><em>{match[2]}</em></strong>);
    } else if (match[3]) {
      parts.push(<strong key={key++}>{match[4]}</strong>);
    } else if (match[5]) {
      parts.push(<u key={key++}>{match[6]}</u>);
    } else if (match[7]) {
      parts.push(<em key={key++}>{match[8]}</em>);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function formatText(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      result.push(<hr key={`hr-${i}`} className="border-black/10 my-2" />);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const inlineContent = formatInline(content, key);
      key += inlineContent.length + 1;

      const sizes: Record<number, string> = {
        1: 'text-2xl md:text-3xl font-bold',
        2: 'text-xl md:text-2xl font-bold',
        3: 'text-lg md:text-xl font-semibold',
        4: 'text-base md:text-lg font-semibold',
        5: 'text-sm md:text-base font-medium uppercase tracking-wide',
        6: 'text-xs md:text-sm font-medium uppercase tracking-wider text-[#737373]',
      };

      result.push(
        <span key={`h-${i}`} className={`block ${sizes[level]} leading-tight mt-1 mb-1`}>
          {inlineContent}
        </span>
      );
      continue;
    }

    const bulletMatch = line.match(/^[\*\-\+]\s+(.+)$/);
    if (bulletMatch) {
      const content = bulletMatch[1];
      const inlineContent = formatInline(content, key);
      key += inlineContent.length + 1;
      result.push(
        <span key={`li-${i}`} className="block pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-[#909090]">
          {inlineContent}
        </span>
      );
      continue;
    }

    const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      const num = numberedMatch[1];
      const content = numberedMatch[2];
      const inlineContent = formatInline(content, key);
      key += inlineContent.length + 1;
      result.push(
        <span key={`ol-${i}`} className="block pl-5 relative">
          <span className="absolute left-0 text-[#909090]">{num}.</span>
          {inlineContent}
        </span>
      );
      continue;
    }

    if (line.trim() === '') {
      result.push(<br key={`br-${i}`} />);
      continue;
    }

    const inlineContent = formatInline(line, key);
    key += inlineContent.length + 1;
    result.push(
      <span key={`p-${i}`} className="block">
        {inlineContent}
      </span>
    );
  }

  return result;
}

function processNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const childContent = Array.from(el.childNodes).map(processNode).join('');

  switch (tag) {
    case 'b':
    case 'strong':
      return `**${childContent}**`;
    case 'i':
    case 'em':
      return `*${childContent}*`;
    case 'u':
    case 'ins':
      return `__${childContent}__`;
    case 'h1':
      return `# ${childContent}\n`;
    case 'h2':
      return `## ${childContent}\n`;
    case 'h3':
      return `### ${childContent}\n`;
    case 'h4':
      return `#### ${childContent}\n`;
    case 'h5':
      return `##### ${childContent}\n`;
    case 'h6':
      return `###### ${childContent}\n`;
    case 'hr':
      return '\n***\n';
    case 'br':
      return '\n';
    case 'p':
    case 'div':
      return childContent + '\n';
    case 'li':
      return '- ' + childContent + '\n';
    case 'ul':
    case 'ol':
      return childContent;
    case 'a':
      return childContent;
    case 'span': {
      const style = el.getAttribute('style') || '';
      let result = childContent;
      if (style.includes('font-weight: bold') || style.includes('font-weight:bold') || style.match(/font-weight:\s*[7-9]00/)) {
        result = `**${result}**`;
      }
      if (style.includes('font-style: italic') || style.includes('font-style:italic')) {
        result = `*${result}*`;
      }
      if (style.includes('text-decoration: underline') || style.includes('text-decoration:underline') || style.match(/text-decoration[^;]*underline/)) {
        result = `__${result}__`;
      }
      return result;
    }
    default:
      return childContent;
  }
}

export function htmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const result = Array.from(doc.body.childNodes).map(processNode).join('');
  return result.replace(/\n{3,}/g, '\n\n').trim();
}

