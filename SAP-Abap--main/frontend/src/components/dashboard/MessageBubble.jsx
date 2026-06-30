import { useState } from "react";
import { Copy, Check, Sparkles, ShieldCheck, Download } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";
import { Button } from "@/components/ui/button";

export default function MessageBubble({ message, streaming, onAnalyze }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end msg-enter" data-testid="message-user">
        <div className="max-w-[85%] bg-[#008FD3] text-white rounded-md px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 msg-enter" data-testid="message-assistant">
      <div className="w-8 h-8 rounded-md bg-[#008FD3]/10 text-[#008FD3] flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-gray-500 mb-1">SAP Copilot</div>
        {message.content === "" && streaming ? (
          <div className="flex items-center gap-1.5 py-2">
            <span className="typing-dot w-2 h-2 rounded-full bg-gray-400" />
            <span className="typing-dot w-2 h-2 rounded-full bg-gray-400" />
            <span className="typing-dot w-2 h-2 rounded-full bg-gray-400" />
          </div>
        ) : (
          <>
            <MarkdownContent content={message.content} />
            {onAnalyze && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onAnalyze}
                  className="h-8 gap-1.5 border-[#008FD3]/30 text-[#008FD3] hover:bg-[#008FD3]/5"
                  data-testid="analyze-client-ready-button"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Analyse · client ready
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MarkdownContent({ content }) {
  const blocks = renderMarkdown(content);
  return (
    <div className="markdown-body text-[15px] text-gray-800">
      {blocks.map((block, i) => {
        if (block.type === "code") {
          return <CodeBlock key={i} lang={block.lang} code={block.code} />;
        }
        return <div key={i} dangerouslySetInnerHTML={{ __html: block.html }} />;
      })}
    </div>
  );
}

function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const download = () => {
    const isAbap = lang?.toLowerCase() === "abap";
    const ext = isAbap ? "abap" : (lang || "txt").toLowerCase();
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snippet-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const highlighted = lang?.toLowerCase() === "abap" ? highlightAbap(code) : escapeHtml(code);
  return (
    <div className="my-3 rounded-md overflow-hidden border border-gray-800 bg-[#0b1020]" data-testid="code-block">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800 bg-black/30">
        <span className="text-xs font-mono-jb text-gray-400 uppercase tracking-wider">{lang || "code"}</span>
        <div className="flex items-center gap-3">
          <button onClick={download} className="text-xs text-gray-300 hover:text-white flex items-center gap-1.5" data-testid="download-code-button">
            <Download className="w-3.5 h-3.5" /> Download
          </button>
          <button onClick={copy} className="text-xs text-gray-300 hover:text-white flex items-center gap-1.5" data-testid="copy-code-button">
            {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>
      </div>
      <pre className="p-4 text-sm leading-relaxed overflow-x-auto"><code dangerouslySetInnerHTML={{ __html: highlighted }} /></pre>
    </div>
  );
}

function escapeHtml(s) {
  return s.replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
}

function highlightAbap(code) {
  const keywords = [
    "SELECT","FROM","WHERE","INTO","TABLE","DATA","TYPES","BEGIN","END","OF","TYPE","LIKE",
    "IF","ELSE","ELSEIF","ENDIF","LOOP","ENDLOOP","AT","ENDAT","DO","ENDDO","WHILE","ENDWHILE",
    "FORM","ENDFORM","FUNCTION","ENDFUNCTION","METHOD","ENDMETHOD","CLASS","ENDCLASS",
    "PUBLIC","PRIVATE","PROTECTED","SECTION","IMPORTING","EXPORTING","CHANGING","RETURNING","RAISING",
    "VALUE","REF","TO","CALL","PERFORM","USING","TRY","CATCH","ENDTRY","RAISE","EXCEPTION",
    "INTERFACE","ENDINTERFACE","DEFINITION","IMPLEMENTATION","INHERITING","ABSTRACT","FINAL",
    "REPORT","PARAMETERS","SELECT-OPTIONS","WRITE","MESSAGE","RETURN","EXIT","CONTINUE","CHECK",
    "READ","INSERT","UPDATE","DELETE","MODIFY","APPEND","SORT","CLEAR","REFRESH","FREE",
    "NEW","CREATE","OBJECT","RECEIVING","ASSIGNING","FIELD-SYMBOL","SYMBOL","CONSTANTS",
    "ORDER","BY","GROUP","HAVING","JOIN","INNER","LEFT","OUTER","ON","AS","UP","ROWS","DISTINCT",
    "AND","OR","NOT","IS","INITIAL","BOUND","NULL","BETWEEN","IN","ASCENDING","DESCENDING",
    "LV_","LT_","LS_","LO_","LR_","GV_","GT_","CV_","SY-"
  ];
  let html = escapeHtml(code);
  // strings
  html = html.replace(/'([^']*)'/g, (m) => `<span class="abap-string">${m}</span>`);
  html = html.replace(/`([^`]*)`/g, (m) => `<span class="abap-string">${m}</span>`);
  // comments (full line starting with *) and inline "
  html = html.replace(/^(\*[^\n]*)/gm, '<span class="abap-comment">$1</span>');
  html = html.replace(/(&quot;[^\n]*)/g, '<span class="abap-comment">$1</span>');
  // numbers
  html = html.replace(/\b(\d+)\b/g, '<span class="abap-number">$1</span>');
  // keywords (case-insensitive whole word)
  const kwRegex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");
  html = html.replace(kwRegex, '<span class="abap-keyword">$1</span>');
  return html;
}
