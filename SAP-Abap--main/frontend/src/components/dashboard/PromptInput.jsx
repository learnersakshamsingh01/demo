import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Mic, MicOff, Square } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { toast } from "sonner";

export default function PromptInput({ onSend, disabled }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);
  const { supported, listening, start, stop } = useSpeechRecognition({
    onResult: (transcript) => {
      setText((prev) => (prev ? prev + " " : "") + transcript);
    },
    onError: (err) => toast.error("Voice input: " + err),
  });

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text);
    setText("");
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleVoice = () => {
    if (!supported) {
      toast.error("Speech recognition not supported in this browser. Try Chrome/Edge.");
      return;
    }
    listening ? stop() : start();
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-4 shrink-0" data-testid="prompt-input-bar">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="relative rounded-md border border-gray-300 bg-white shadow-sm focus-within:border-[#008FD3] focus-within:ring-2 focus-within:ring-[#008FD3]/20 transition-all">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder="Ask SAP Copilot about ABAP, CDS, BAPI, RAP..."
            className="w-full resize-none bg-transparent px-4 py-3 pr-28 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none max-h-48 min-h-[52px]"
            disabled={disabled}
            data-testid="prompt-textarea"
            style={{ height: "auto" }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 192) + "px";
            }}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVoice}
              disabled={disabled}
              className={`p-2 rounded-md transition-all ${
                listening
                  ? "bg-red-500 text-white voice-active"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
              data-testid="voice-input-toggle"
              aria-label={listening ? "Stop listening" : "Start voice input"}
            >
              {listening ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <Button
              type="submit"
              disabled={disabled || !text.trim()}
              size="icon"
              className="h-9 w-9 bg-[#008FD3] hover:bg-[#0073AA] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-md"
              data-testid="send-message-button"
              aria-label="Send"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 px-1 text-xs text-gray-400">
          <span>
            {listening ? (
              <span className="text-red-600 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Listening...
              </span>
            ) : (
              "Enter to send · Shift+Enter for new line"
            )}
          </span>
          <span>SAP Copilot may produce inaccurate code. Verify before running.</span>
        </div>
      </form>
    </div>
  );
}
