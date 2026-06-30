import { useState } from "react";
import axios from "axios";
import { useAuth, API } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { BookOpen, ExternalLink, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

export default function SapHelpDialog({ defaultQuery = "" }) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(defaultQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const search = async (e) => {
    e?.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/sap-help`, {
        params: { q },
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(res.data);
    } catch (err) {
      toast.error("SAP Help search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-600 hover:text-[#008FD3] gap-1.5 h-8"
          data-testid="sap-help-trigger"
        >
          <BookOpen className="w-4 h-4" /> SAP Help
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl" data-testid="sap-help-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#008FD3]" /> Search SAP Help Portal
          </DialogTitle>
          <DialogDescription>
            Find official SAP documentation, BAPIs, transactions, and how-to guides.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={search} className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. BAPI_SALESORDER_CREATEFROMDAT2"
            className="rounded-md"
            data-testid="sap-help-input"
            autoFocus
          />
          <Button type="submit" disabled={loading || !q.trim()} className="bg-[#008FD3] hover:bg-[#0073AA]" data-testid="sap-help-search-button">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin -mx-1 px-1">
          {!results && !loading && (
            <div className="text-sm text-gray-500 py-6 text-center">
              Search SAP Help for any ABAP keyword, BAPI, or transaction.
            </div>
          )}
          {loading && <div className="text-sm text-gray-500 py-6 text-center"><Loader2 className="w-5 h-5 animate-spin inline-block" /></div>}
          {results && results.results.length === 0 && (
            <div className="text-sm text-gray-500 py-6 text-center">
              No SAP Help articles found. <a className="text-[#008FD3] underline" href={results.search_url} target="_blank" rel="noreferrer">Try help.sap.com directly</a>.
            </div>
          )}
          <div className="space-y-2 mt-2" data-testid="sap-help-results">
            {results?.results.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="block border border-gray-200 rounded-md p-3 hover:border-[#008FD3] hover:bg-gray-50 transition-colors"
                data-testid={`sap-help-result-${i}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-[#008FD3] text-sm">{r.title}</div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-1" />
                </div>
                {r.deliverable && (
                  <div className="text-xs text-gray-500 mt-0.5">{r.deliverable} {r.date && `· ${r.date}`}</div>
                )}
                {r.snippet && <div className="text-xs text-gray-600 mt-1.5 leading-snug line-clamp-3">{r.snippet}</div>}
              </a>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
