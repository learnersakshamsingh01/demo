import { useState } from "react";
import axios from "axios";
import { useAuth, API } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Image as ImageIcon, Loader2, Sparkles, Download } from "lucide-react";
import { toast } from "sonner";

export default function ImageGenDialog({ sessionId, onAttached }) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(
        `${API}/generate-image`,
        { prompt, session_id: sessionId || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
      if (sessionId && onAttached) onAttached();
      toast.success("Image generated");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Image generation failed");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!result?.image) return;
    const link = document.createElement("a");
    link.href = result.image;
    link.download = `sap-copilot-${Date.now()}.png`;
    link.click();
  };

  const reset = () => {
    setPrompt("");
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#008FD3] gap-1.5 h-8" data-testid="image-gen-trigger">
          <ImageIcon className="w-4 h-4" /> Image
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl" data-testid="image-gen-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#008FD3]" /> Generate Image
          </DialogTitle>
          <DialogDescription>
            Create diagrams, illustrations, or visuals for your ABAP/SAP concepts.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A clean flowchart showing the RAP managed scenario lifecycle"
          rows={3}
          className="resize-none"
          data-testid="image-gen-prompt"
        />
        {loading && (
          <div className="aspect-video bg-gray-50 border border-dashed border-gray-200 rounded-md flex items-center justify-center text-gray-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Painting your image...
          </div>
        )}
        {result?.image && !loading && (
          <div className="space-y-2" data-testid="image-gen-result">
            <img src={result.image} alt="Generated" className="w-full rounded-md border border-gray-200" />
            {result.text && <p className="text-xs text-gray-500">{result.text}</p>}
          </div>
        )}
        <DialogFooter className="gap-2">
          {result?.image && (
            <Button variant="outline" onClick={download} data-testid="image-gen-download" className="gap-1.5">
              <Download className="w-4 h-4" /> Download
            </Button>
          )}
          <Button
            onClick={generate}
            disabled={loading || !prompt.trim()}
            className="bg-[#008FD3] hover:bg-[#0073AA] text-white"
            data-testid="image-gen-submit"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : result ? "Regenerate" : "Generate"}
          </Button>
        </DialogFooter>
        {sessionId && result?.image && (
          <p className="text-xs text-emerald-600 text-center">✓ Attached to current chat</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
