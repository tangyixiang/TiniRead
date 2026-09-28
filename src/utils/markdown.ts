export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function inlineFormat(text: string): string {
  let s = escapeHtml(text);
  // Unescape safe <mark> tags if present
  s = s.replace(/&lt;mark class="(hl-[a-z0-9_-]+)"&gt;([\s\S]*?)&lt;\/mark&gt;/gi, '<mark class="$1">$2</mark>');
  // Colored highlights: ==green:text==, ==hl-green:text==, etc.
  s = s.replace(/==(hl-)?(yellow|green|blue|pink|purple):([^=\r\n]+)==/gi, (_match, _pfx, color, content) => {
    return `<mark class="hl-${color.toLowerCase()}">${content}</mark>`;
  });
  // Default highlights: ==text==
  s = s.replace(/==([^=\r\n]+)==/g, '<mark class="hl-yellow">$1</mark>');
  // Bold + Italic: ***text***
  s = s.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong class="font-semibold text-[var(--text-main)]"><em class="italic">$1</em></strong>');
  // Bold: **text** or __text__
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-[var(--text-main)]">$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<strong class="font-semibold text-[var(--text-main)]">$1</strong>');
  // Italic: *text* or _text_
  s = s.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
  s = s.replace(/_([^_]+)_/g, '<em class="italic">$1</em>');
  // Strikethrough: ~~text~~
  s = s.replace(/~~([^~]+)~~/g, '<del class="line-through text-[var(--text-light)]">$1</del>');
  // Inline code: `code`
  s = s.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  // Images: ![alt](url)
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-xl border border-[var(--border-subtle)] my-3 max-w-full shadow-sm">');
  // Links: [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-[var(--link-text)] underline decoration-[var(--link-decoration)] hover:text-[var(--link-hover)] transition cursor-pointer font-medium">$1</a>');
  return s;
}

export function parseMarkdownToHtml(rawMd: string): string {
  if (!rawMd) return '<p class="text-sm text-[var(--text-light)]">暂无内容，点击开始编写...</p>';
  
  const lines = rawMd.replace(/\r\n/g, '\n').split('\n');
  let html: string[] = [];
  let inCode = false;
  let codeLang = '';
  let codeLines: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let inList = false;
  let listType = '';
  let quoteBuffer: string[] = [];
  let paraBuffer: string[] = [];

  function flushParagraph() {
    if (paraBuffer.length > 0) {
      html.push(`<p class="text-[14px] leading-7 text-[var(--text-main)] my-3.5">${paraBuffer.map(inlineFormat).join('<br>')}</p>`);
      paraBuffer = [];
    }
  }

  function flushList() {
    if (inList) {
      html.push(`</${listType}>`);
      inList = false;
      listType = '';
    }
  }

  function flushQuote() {
    if (quoteBuffer.length > 0) {
      let firstLine = quoteBuffer[0];
      let alertMatch = firstLine.match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)/i);
      let icon = '<div class="w-5 h-5 rounded-lg bg-[var(--text-main)] text-[var(--bg-card)] flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">!</div>';
      let calloutClass = 'p-4 rounded-2xl bg-[var(--callout-bg)] border border-[var(--callout-border)] flex items-start gap-3 text-sm leading-relaxed text-[var(--text-main)] my-4';

      if (alertMatch) {
        let type = alertMatch[1].toUpperCase();
        let firstBody = alertMatch[2];
        let allLines: string[] = [];
        if (firstBody) allLines.push(firstBody);
        for (let k = 1; k < quoteBuffer.length; k++) {
          allLines.push(quoteBuffer[k]);
        }
        html.push(`
          <div class="${calloutClass}">
            ${icon}
            <div>
              <div class="font-semibold text-[var(--text-main)] mb-1">${type}</div>
              <div>${allLines.map(inlineFormat).join('<br>')}</div>
            </div>
          </div>
        `);
      } else {
        html.push(`
          <div class="${calloutClass}">
            ${icon}
            <div>${quoteBuffer.map(inlineFormat).join('<br>')}</div>
          </div>
        `);
      }
      quoteBuffer = [];
    }
  }

  function flushTable() {
    if (inTable && tableRows.length > 0) {
      let tHtml = '<div class="overflow-x-auto my-3 border border-[var(--border-subtle)] rounded-xl"><table class="w-full text-left text-xs">';
      let hasHeader = false;
      let headerRow: string[] | null = null;
      let dataRows: string[][] = [];

      if (tableRows.length >= 2 && tableRows[1].every(c => /^[-:| ]+$/.test(c))) {
        hasHeader = true;
        headerRow = tableRows[0];
        dataRows = tableRows.slice(2);
      } else {
        dataRows = tableRows;
      }

      if (hasHeader && headerRow) {
        tHtml += '<thead class="bg-[var(--bg-window)] border-b border-[var(--border-subtle)] text-[var(--text-muted)]"><tr>';
        headerRow.forEach(c => {
          tHtml += `<th class="py-2.5 px-3 font-semibold">${inlineFormat(c)}</th>`;
        });
        tHtml += '</tr></thead>';
      }
      tHtml += '<tbody class="divide-y divide-[var(--border-subtle)]">';
      dataRows.forEach(row => {
        tHtml += '<tr class="hover:bg-[var(--bg-window)]/50">';
        row.forEach(c => {
          tHtml += `<td class="py-2.5 px-3 text-[var(--text-main)]">${inlineFormat(c)}</td>`;
        });
        tHtml += '</tr>';
      });
      tHtml += '</tbody></table></div>';
      html.push(tHtml);
      inTable = false;
      tableRows = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let trimmed = line.trim();

    // 1. Fenced Code blocks
    if (trimmed.startsWith('```')) {
      if (inCode) {
        const rawCode = codeLines.join('\n');
        const escapedCode = escapeHtml(rawCode);
        html.push(`
          <div class="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-window)] overflow-hidden my-3">
            <div class="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
              <span class="font-mono font-medium text-[var(--text-main)]">${codeLang || 'plaintext'}</span>
              <button class="copy-btn hover:text-[var(--text-main)] transition font-medium" data-code="${escapeHtml(rawCode)}">复制</button>
            </div>
            <pre class="p-4 text-xs font-mono overflow-x-auto leading-6 text-[var(--text-main)]"><code>${escapedCode}</code></pre>
          </div>
        `);
        inCode = false;
        codeLang = '';
        codeLines = [];
      } else {
        flushParagraph();
        flushList();
        flushQuote();
        flushTable();
        inCode = true;
        codeLang = trimmed.substring(3).trim();
        codeLines = [];
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    // 2. Tables
    if (trimmed.includes('|') && (trimmed.startsWith('|') || trimmed.endsWith('|') || trimmed.split('|').length >= 3)) {
      flushParagraph();
      flushList();
      flushQuote();
      inTable = true;
      let raw = trimmed;
      if (raw.startsWith('|')) raw = raw.substring(1);
      if (raw.endsWith('|')) raw = raw.substring(0, raw.length - 1);
      let cols = raw.split('|').map(c => c.trim());
      tableRows.push(cols);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Blank lines
    if (trimmed === '') {
      flushParagraph();
      flushList();
      flushQuote();
      continue;
    }

    // 3. Headings #, ##, ###, ####
    if (trimmed.startsWith('#')) {
      flushParagraph();
      flushList();
      flushQuote();
      let level = 0;
      while (level < trimmed.length && trimmed[level] === '#') {
        level++;
      }
      if (trimmed[level] === ' ' || level === trimmed.length) {
        let text = trimmed.substring(level).trim();
        let hTag = `h${Math.min(level, 6)}`;
        let hClass = level === 1 ? 'text-2xl md:text-3xl font-bold text-[var(--text-main)] tracking-tight mt-7 mb-4 pb-2.5 border-b border-[var(--border-subtle)]' :
                     level === 2 ? 'text-xl font-bold text-[var(--text-main)] tracking-tight mt-8 mb-3' :
                     level === 3 ? 'text-base font-bold text-[var(--text-main)] tracking-tight mt-6 mb-2' :
                     'text-sm font-bold text-[var(--text-main)] tracking-tight mt-4 mb-2';
        html.push(`<${hTag} class="${hClass}">${inlineFormat(text)}</${hTag}>`);
        continue;
      }
    }

    // 4. Horizontal rules
    if (/^([-*_]){3,}$/.test(trimmed)) {
      flushParagraph();
      flushList();
      flushQuote();
      html.push('<hr class="my-6 border-t border-[var(--border-subtle)]">');
      continue;
    }

    // 5. Blockquote & Notion Callouts >
    if (trimmed.startsWith('>')) {
      flushParagraph();
      flushList();
      let quoteText = trimmed.substring(1).trim();
      quoteBuffer.push(quoteText);
      continue;
    } else if (quoteBuffer.length > 0) {
      flushQuote();
    }

    // 6. Task lists: - [ ] or - [x] or * [ ]
    let taskMatch = trimmed.match(/^[-*+]\s+\[([ xX])\]\s+(.*)/);
    if (taskMatch) {
      flushParagraph();
      flushList();
      flushQuote();
      let isChecked = taskMatch[1].toLowerCase() === 'x';
      let taskText = taskMatch[2];
      html.push(`
        <div class="flex items-center gap-3 p-1 rounded-xl hover:bg-[var(--bg-window)] cursor-pointer transition">
          <input type="checkbox" ${isChecked ? 'checked' : ''} class="w-4 h-4 rounded-md border-[var(--border-strong)] text-[var(--text-main)] focus:ring-0">
          <span class="${isChecked ? 'line-through text-[var(--text-light)]' : 'text-[var(--text-main)]'} text-[14px] leading-relaxed">${inlineFormat(taskText)}</span>
        </div>
      `);
      continue;
    }

    // 7. Unordered lists: - or * or +
    let ulMatch = trimmed.match(/^[-*+]\s+(.*)/);
    if (ulMatch) {
      flushParagraph();
      flushQuote();
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
        html.push('<ul class="list-disc pl-6 my-3 space-y-1.5 text-[14px] leading-7 text-[var(--text-main)]">');
      }
      html.push(`<li>${inlineFormat(ulMatch[1])}</li>`);
      continue;
    }

    // 8. Ordered lists: 1. 2.
    let olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      flushParagraph();
      flushQuote();
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
        html.push('<ol class="list-decimal pl-6 my-3 space-y-1.5 text-[14px] leading-7 text-[var(--text-main)]">');
      }
      html.push(`<li>${inlineFormat(olMatch[2])}</li>`);
      continue;
    }

    // Regular paragraph
    flushList();
    flushQuote();
    paraBuffer.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushQuote();
  flushTable();

  return html.join('\n');
}

export function inlineNodeToMarkdown(node: Node | null): string {
  if (!node) return '';
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  if (tag === 'button') return '';
  const childrenMd = Array.from(el.childNodes).map(inlineNodeToMarkdown).join('');
  
  if (tag === 'strong' || tag === 'b') {
    const text = childrenMd.trim();
    return text ? `**${text}**` : '';
  }
  if (tag === 'em' || tag === 'i') {
    const text = childrenMd.trim();
    return text ? `*${text}*` : '';
  }
  if (tag === 'del' || tag === 's') {
    const text = childrenMd.trim();
    return text ? `~~${text}~~` : '';
  }
  if (tag === 'mark') {
    const text = childrenMd.trim();
    if (!text) return '';
    const cls = el.className || '';
    const match = cls.match(/hl-(yellow|green|blue|pink|purple)/i);
    const color = match ? match[1].toLowerCase() : 'yellow';
    if (color === 'yellow') {
      return `==${text}==`;
    }
    return `==${color}:${text}==`;
  }
  if (tag === 'code' && el.parentElement?.tagName.toLowerCase() !== 'pre') {
    return `\`${el.textContent}\``;
  }
  if (tag === 'a') {
    const href = el.getAttribute('href') || '#';
    return `[${childrenMd.trim()}](${href})`;
  }
  if (tag === 'img') {
    const alt = el.getAttribute('alt') || '';
    const src = el.getAttribute('src') || '';
    return `![${alt}](${src})`;
  }
  if (tag === 'br') {
    return '\n';
  }
  return childrenMd;
}

export function domToMarkdown(container: HTMLElement): string {
  const parts: string[] = [];
  const children = Array.from(container.childNodes);

  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    if (el.nodeType === Node.TEXT_NODE) {
      const text = (el.textContent || '').trim();
      if (text) parts.push(text);
      continue;
    }
    if (el.nodeType !== Node.ELEMENT_NODE) continue;

    const htmlEl = el as HTMLElement;
    const tag = htmlEl.tagName.toLowerCase();

    // 1. Headings
    if (/^h[1-6]$/.test(tag)) {
      const level = parseInt(tag[1], 10);
      const prefix = '#'.repeat(level);
      const text = inlineNodeToMarkdown(htmlEl).trim();
      parts.push(`${prefix} ${text}`);
      continue;
    }

    // 2. Horizontal Rules
    if (tag === 'hr') {
      parts.push('---');
      continue;
    }

    // 3. Code Blocks
    const preEl = tag === 'pre' ? htmlEl : htmlEl.querySelector('pre');
    if (preEl) {
      const codeEl = preEl.querySelector('code') || preEl;
      const langEl = htmlEl.querySelector('span.font-mono');
      const lang = langEl ? langEl.textContent?.trim() : '';
      const code = (codeEl.innerText || codeEl.textContent || '').replace(/\r\n/g, '\n').replace(/\n$/, '');
      const langHeader = (lang && lang !== 'plaintext') ? lang : '';
      parts.push(`\`\`\`${langHeader}\n${code}\n\`\`\``);
      continue;
    }

    // 4. Task items (div with checkbox)
    const checkbox = htmlEl.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    if (checkbox) {
      const label = htmlEl.querySelector('span') || htmlEl;
      const taskText = inlineNodeToMarkdown(label).trim();
      const mark = checkbox.checked ? 'x' : ' ';
      parts.push(`- [${mark}] ${taskText}`);
      continue;
    }

    // 5. Unordered List
    if (tag === 'ul') {
      const items = Array.from(htmlEl.querySelectorAll(':scope > li')).map(li => {
        return `- ${inlineNodeToMarkdown(li).trim()}`;
      });
      if (items.length > 0) parts.push(items.join('\n'));
      continue;
    }

    // 6. Ordered List
    if (tag === 'ol') {
      const items = Array.from(htmlEl.querySelectorAll(':scope > li')).map((li, idx) => {
        return `${idx + 1}. ${inlineNodeToMarkdown(li).trim()}`;
      });
      if (items.length > 0) parts.push(items.join('\n'));
      continue;
    }

    // 7. Callouts & Blockquotes
    if (tag === 'blockquote' || htmlEl.classList.contains('callout') || htmlEl.className.includes('callout-bg')) {
      const titleEl = htmlEl.querySelector('.font-semibold');
      const alertType = titleEl ? titleEl.textContent?.trim().toUpperCase() : '';
      const validAlerts = ['NOTE', 'TIP', 'WARNING', 'IMPORTANT', 'CAUTION'];
      
      const bodyClone = htmlEl.cloneNode(true) as HTMLElement;
      bodyClone.querySelectorAll('.font-semibold, .shrink-0').forEach(n => n.remove());
      const bodyText = inlineNodeToMarkdown(bodyClone).trim();
      const lines = bodyText.split('\n').filter(l => l.trim().length > 0);

      if (validAlerts.includes(alertType || '')) {
        let calloutLines = [`> [!${alertType}]`];
        lines.forEach(l => calloutLines.push(`> ${l}`));
        parts.push(calloutLines.join('\n'));
      } else {
        parts.push(lines.map(l => `> ${l}`).join('\n'));
      }
      continue;
    }

    // 8. Tables
    const tableEl = tag === 'table' ? htmlEl : htmlEl.querySelector('table');
    if (tableEl) {
      const rows = Array.from(tableEl.querySelectorAll('tr'));
      if (rows.length > 0) {
        const tableLines: string[] = [];
        rows.forEach((tr, rIdx) => {
          const cells = Array.from(tr.querySelectorAll('th, td')).map(c => inlineNodeToMarkdown(c).trim());
          tableLines.push(`| ${cells.join(' | ')} |`);
          if (rIdx === 0) {
            tableLines.push(`| ${cells.map(() => '---').join(' | ')} |`);
          }
        });
        parts.push(tableLines.join('\n'));
        continue;
      }
    }

    // 9. Standard paragraphs or divs
    const pText = inlineNodeToMarkdown(htmlEl).trim();
    if (pText) {
      parts.push(pText);
    }
  }

  return parts.join('\n\n');
}
