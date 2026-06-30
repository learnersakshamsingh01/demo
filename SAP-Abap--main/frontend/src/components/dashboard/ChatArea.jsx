import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAuth, API } from "@/context/AuthContext";
import MessageBubble from "@/components/dashboard/MessageBubble";
import PromptInput from "@/components/dashboard/PromptInput";
import EmptyState from "@/components/dashboard/EmptyState";
import SapHelpDialog from "@/components/dashboard/SapHelpDialog";
import ImageGenDialog from "@/components/dashboard/ImageGenDialog";
import { PanelLeftOpen, Download } from "lucide-react";
import { SapLogo } from "@/components/SapLogo";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function ChatArea({ sessionId, onCreateSession, onSessionUpdated, onToggleSidebar, sidebarOpen }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/sessions/${sessionId}/messages`, { headers });
        setMessages(res.data);
      } catch (e) {
        toast.error("Failed to load messages");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const sendMessage = async (text) => {
    if (!text.trim() || streaming) return;
    let sid = sessionId;
    if (!sid) {
      const newSess = await onCreateSession({ skipNavigate: true });
      if (!newSess) return;
      sid = newSess.id;
      // Update URL silently without remounting (key still 'empty' until stream done)
      window.history.replaceState(null, "", `/app/${sid}`);
    }

    const tempUserMsg = {
      id: `temp-u-${Date.now()}`,
      session_id: sid,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    const tempAssistant = {
      id: `temp-a-${Date.now()}`,
      session_id: sid,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg, tempAssistant]);
    setStreaming(true);

    try {
      const res = await fetch(`${API}/sessions/${sid}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`Stream failed: ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.type === "delta") {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last && last.role === "assistant") {
                  next[next.length - 1] = { ...last, content: last.content + payload.content };
                }
                return next;
              });
            } else if (payload.type === "done") {
              // Reload messages and session metadata
              try {
                const refreshed = await axios.get(`${API}/sessions/${sid}/messages`, { headers });
                setMessages(refreshed.data);
                const sessRes = await axios.get(`${API}/sessions`, { headers });
                const updatedSess = sessRes.data.find((s) => s.id === sid);
                if (updatedSess) onSessionUpdated?.(updatedSess);
              } catch (e) {
                /* non-fatal */
              }
            }
          } catch (e) {
            console.error("parse error", e);
          }
        }
      }
    } catch (err) {
      toast.error("Stream error: " + err.message);
    } finally {
      setStreaming(false);
      // URL was already updated via history.replaceState above when creating a new session.
      // We do NOT call navigate() to avoid remounting ChatArea via the parent's key prop.
    }
  };

  const isEmpty = !loading && messages.length === 0;

  const onImageAttached = async () => {
    if (!sessionId) return;
    try {
      const r = await axios.get(`${API}/sessions/${sessionId}/messages`, { headers });
      setMessages(r.data);
      const sr = await axios.get(`${API}/sessions`, { headers });
      const upd = sr.data.find((s) => s.id === sessionId);
      if (upd) onSessionUpdated?.(upd);
    } catch (e) { /* ignore */ }
  };

  const ANALYZE_PROMPT = "Analyze the previous ABAP code/answer for production / client readiness. Cover: (1) performance & SQL pitfalls, (2) error handling, (3) modularization & naming conventions, (4) security & authorization checks, (5) maintainability and S/4HANA compatibility. Provide a Pass / Needs work verdict and a concrete refactor if needed.";

  const downloadChat = () => {
    if (messages.length === 0) return;
    const md = messages.map((m) => {
      const who = m.role === "user" ? "**You**" : "**SAP Copilot**";
      return `### ${who}\n\n${m.content}\n`;
    }).join("\n---\n\n");
    const blob = new Blob([`# SAP Copilot Chat\n\n${md}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sap-copilot-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat downloaded");
  };

  return (
    <main className="flex-1 flex flex-col min-w-0" data-testid="chat-area">
      {/* Top bar */}
      <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-3 shrink-0">
        {!sidebarOpen && (
          <button onClick={onToggleSidebar} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500" data-testid="top-sidebar-open" aria-label="Open sidebar">
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        )}
        <SapLogo size="sm" />
        <span className="text-sm text-gray-400 ml-2">/ Chat</span>
        <div className="ml-auto flex items-center gap-1">
          <SapHelpDialog />
          <ImageGenDialog sessionId={sessionId} onAttached={onImageAttached} />
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadChat}
              className="text-gray-600 hover:text-[#008FD3] gap-1.5 h-8"
              data-testid="download-chat-button"
            >
              <Download className="w-4 h-4" /> Export
            </Button>
          )}
        </div>
      </header>

      {/* Scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin" data-testid="messages-scroll">
        {loading && (
          <div className="max-w-3xl mx-auto px-6 py-10 text-gray-400 text-sm">Loading messages...</div>
        )}
        {isEmpty && <EmptyState onPick={sendMessage} />}
        {!isEmpty && (
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
            {messages.map((m, idx) => (
              <MessageBubble
                key={m.id}
                message={m}
                isLast={idx === messages.length - 1}
                streaming={streaming && idx === messages.length - 1 && m.role === "assistant"}
                onAnalyze={
                  m.role === "assistant" && !streaming && idx === messages.length - 1
                    ? () => sendMessage(ANALYZE_PROMPT)
                    : null
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Prompt */}
      <PromptInput disabled={streaming} onSend={sendMessage} />
    </main>
  );
}
