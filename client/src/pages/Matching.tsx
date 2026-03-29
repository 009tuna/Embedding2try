import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  GitCompareArrows, CheckCircle2, Download, Eye, Loader2, Filter, ThumbsUp,
} from "lucide-react";
import { useState, useMemo } from "react";

function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 0.8) return <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">%{(score * 100).toFixed(0)}</Badge>;
  if (score >= 0.5) return <Badge variant="outline" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20">%{(score * 100).toFixed(0)}</Badge>;
  return <Badge variant="outline" className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20">%{(score * 100).toFixed(0)}</Badge>;
}

function MatchTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; className: string }> = {
    semantic: { label: "Anlamsal", className: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20" },
    rule: { label: "Kural", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20" },
    exact: { label: "Tam", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
    manual: { label: "Manuel", className: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20" },
  };
  const v = map[type] || map.semantic;
  return <Badge variant="outline" className={v.className}>{v.label}</Badge>;
}

export default function Matching() {
  const [filter, setFilter] = useState<string>("all");
  const [viewResult, setViewResult] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: results, isLoading } = trpc.matching.list.useQuery({ limit: 100 });

  const approveMutation = trpc.matching.approve.useMutation({
    onSuccess: () => {
      toast.success("Eslestirme onaylandi");
      utils.matching.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const exportMutation = trpc.matching.export.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.data], { type: data.format === "csv" ? "text/csv" : "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eslestirme-sonuclari.${data.format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export basarili");
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!results) return [];
    if (filter === "all") return results;
    if (filter === "approved") return results.filter((r: any) => r.isApproved);
    if (filter === "pending") return results.filter((r: any) => !r.isApproved);
    if (filter === "high") return results.filter((r: any) => r.confidenceScore >= 0.8);
    if (filter === "low") return results.filter((r: any) => r.confidenceScore < 0.5);
    return results;
  }, [results, filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Eslestirme Sonuclari</h1>
          <p className="text-muted-foreground mt-1">AI tabanli anlamsal eslestirme sonuclarini inceleyin</p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tumu</SelectItem>
              <SelectItem value="approved">Onaylanmis</SelectItem>
              <SelectItem value="pending">Bekleyen</SelectItem>
              <SelectItem value="high">Yuksek Guven</SelectItem>
              <SelectItem value="low">Dusuk Guven</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => exportMutation.mutate({ format: "csv" })} disabled={exportMutation.isPending}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportMutation.mutate({ format: "json" })} disabled={exportMutation.isPending}>
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <GitCompareArrows className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium mb-1">Henuz eslestirme sonucu yok</h3>
            <p className="text-sm text-muted-foreground">Belge yukleyip isleyerek eslestirme sonuclari olusturun</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-3">Cikarilan Terim</div>
            <div className="col-span-2">Eslesen Kategori</div>
            <div className="col-span-2">Standart Deger</div>
            <div className="col-span-1">Guven</div>
            <div className="col-span-1">Tip</div>
            <div className="col-span-1">Durum</div>
            <div className="col-span-2 text-right">Islemler</div>
          </div>

          {filtered.map((result: any) => (
            <Card key={result.id} className="hover:border-primary/20 transition-colors">
              <CardContent className="py-3">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-3">
                    <p className="text-sm font-medium truncate">{result.extractedTerm}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground truncate">
                      {result.matchedCategoryName || "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm truncate">{result.standardizedValue || "-"}</p>
                  </div>
                  <div className="col-span-1">
                    <ConfidenceBadge score={result.confidenceScore} />
                  </div>
                  <div className="col-span-1">
                    <MatchTypeBadge type={result.matchType} />
                  </div>
                  <div className="col-span-1">
                    {result.isApproved ? (
                      <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Onayli
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Bekliyor</Badge>
                    )}
                  </div>
                  <div className="col-span-2 flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewResult(result)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {!result.isApproved && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-emerald-600"
                        onClick={() => approveMutation.mutate({ id: result.id })}
                        disabled={approveMutation.isPending}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!viewResult} onOpenChange={() => setViewResult(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Eslestirme Detayi</DialogTitle>
          </DialogHeader>
          {viewResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Cikarilan Terim</p>
                  <p className="text-sm font-medium">{viewResult.extractedTerm}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Eslesen Kategori</p>
                  <p className="text-sm font-medium">{viewResult.matchedCategoryName || "Eslestirilemedi"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Standart Deger</p>
                  <p className="text-sm">{viewResult.standardizedValue || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ERP Alani</p>
                  <p className="text-sm">{viewResult.erpField || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Guven Skoru</p>
                  <ConfidenceBadge score={viewResult.confidenceScore} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Eslestirme Tipi</p>
                  <MatchTypeBadge type={viewResult.matchType} />
                </div>
              </div>
              {viewResult.llmExplanation && (
                <div className="rounded-lg border p-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">AI Aciklamasi</p>
                  <p className="text-sm">{viewResult.llmExplanation}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
