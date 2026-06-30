// Minimal markdown renderer: splits fenced code blocks, renders the rest as basic HTML.
export function renderMarkdown(text) {
  if (!text) return [];
  const blocks = [];
  const regex = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      const chunk = text.slice(lastIndex, m.index);
      blocks.push({ type: "text", html: renderInline(chunk) });
    }
    blocks.push({ type: "code", lang: m[1] || "", code: m[2] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    blocks.push({ type: "text", html: renderInline(text.slice(lastIndex)) });
  }
  return blocks;
}

function escapeHtml(s) {
  return s.replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
}

function renderInline(text) {
  const lines = text.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Headings
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const tag = `h${h[1].length}`;
      out.push(`<${tag}>${formatInline(h[2])}</${tag}>`);
      i++; continue;
    }
    // Unordered list block
    if (/^[\-\*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[\-\*]\s+/.test(lines[i])) {
        items.push(`<li>${formatInline(lines[i].replace(/^[\-\*]\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }
    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${formatInline(lines[i].replace(/^\d+\.\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }
    // Blockquote
    if (/^>\s+/.test(line)) {
      out.push(`<blockquote>${formatInline(line.replace(/^>\s+/, ""))}</blockquote>`);
      i++; continue;
    }
    // Blank line
    if (line.trim() === "") {
      i++; continue;
    }
    // Paragraph: collect consecutive non-empty non-special lines
    const para = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,3}\s|[\-\*]\s|\d+\.\s|>\s)/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    out.push(`<p>${formatInline(para.join(" "))}</p>`);
  }
  return out.join("");
}

function formatInline(s) {
  let h = escapeHtml(s);
  // inline code
  h = h.replace(/`([^`]+)`/g, "<code>$1</code>");
  // bold
  h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // italic
  h = h.replace(/(^|\s)\*([^*]+)\*/g, "$1<em>$2</em>");
  // images (must run before links): ![alt](url)
  h = h.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" class="rounded-md border border-gray-200 my-2 max-w-full" />');
  // links
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return h;
}
