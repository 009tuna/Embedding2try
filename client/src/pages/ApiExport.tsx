import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Key, Plus, Trash2, Loader2, Copy, Download, Code, FileJson } from "lucide-react";
import { useState } from "react";

export default function ApiExport() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: apiKeys, isLoading } = trpc.apiKeysMgmt.list.useQuery();

  const createMutation = trpc.apiKeysMgmt.create.useMutation({
    onSuccess: (data) => {
      setGeneratedKey(data.key);
      utils.apiKeysMgmt.list.invalidate();
      toast.success("API anahtari olusturuldu");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.apiKeysMgmt.delete.useMutation({
    onSuccess: () => {
      toast.success("API anahtari silindi");
      utils.apiKeysMgmt.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const exportMutation = trpc.matching.export.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.data], { type: data.format === "csv" ? "text/csv" : "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `erp-export.${data.format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export basarili");
    },
    onError: (e) => toast.error(e.message),
  });

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Panoya kopyalandi");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API & Export</h1>
          <p className="text-muted-foreground mt-1">API anahtarlarini yonetin ve verileri disari aktarin</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-4 w-4" />
              Veri Aktarimi
            </CardTitle>
            <CardDescription>Eslestirme sonuclarini ERP sisteminize aktarin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => exportMutation.mutate({ format: "json", approvedOnly: true })}
              disabled={exportMutation.isPending}
            >
              <FileJson className="h-4 w-4 mr-3" />
              <div className="text-left">
                <p className="text-sm font-medium">JSON Export (Onaylanmis)</p>
                <p className="text-xs text-muted-foreground">Sadece onaylanmis eslestirmeleri aktar</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => exportMutation.mutate({ format: "csv", approvedOnly: true })}
              disabled={exportMutation.isPending}
            >
              <Download className="h-4 w-4 mr-3" />
              <div className="text-left">
                <p className="text-sm font-medium">CSV Export (Onaylanmis)</p>
                <p className="text-xs text-muted-foreground">Excel uyumlu CSV formati</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => exportMutation.mutate({ format: "json" })}
              disabled={exportMutation.isPending}
            >
              <FileJson className="h-4 w-4 mr-3" />
              <div className="text-left">
                <p className="text-sm font-medium">JSON Export (Tumu)</p>
                <p className="text-xs text-muted-foreground">Tum eslestirme sonuclarini aktar</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => exportMutation.mutate({ format: "csv" })}
              disabled={exportMutation.isPending}
            >
              <Download className="h-4 w-4 mr-3" />
              <div className="text-left">
                <p className="text-sm font-medium">CSV Export (Tumu)</p>
                <p className="text-xs text-muted-foreground">Tum eslestirme sonuclari</p>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* API Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Code className="h-4 w-4" />
              API Dokumantasyonu
            </CardTitle>
            <CardDescription>ERP sisteminizle entegrasyon icin API bilgileri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-3 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-2">Endpoint</p>
              <div className="flex items-center gap-2">
                <code className="text-sm flex-1 break-all">POST /api/trpc/documents.upload</code>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyToClipboard("/api/trpc/documents.upload")}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="rounded-lg border p-3 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-2">Ornek Istek</p>
              <pre className="text-xs overflow-x-auto">{`{
  "title": "Fatura #1234",
  "sourceType": "invoice",
  "rawContent": "Nakliye bedeli: 5000 TL",
  "supplierName": "ABC Lojistik"
}`}</pre>
            </div>
            <div className="rounded-lg border p-3 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-2">Desteklenen Islemler</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>documents.upload - Belge yukleme</li>
                <li>documents.process - Belge isleme</li>
                <li>matching.export - Sonuc aktarimi</li>
                <li>categories.list - Kategori listesi</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Keys */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Anahtarlari
            </CardTitle>
            <CardDescription className="mt-1">Dis sistemler icin API anahtarlari olusturun</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setGeneratedKey(null); setKeyName(""); } }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Anahtar Olustur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{generatedKey ? "API Anahtari Olusturuldu" : "Yeni API Anahtari"}</DialogTitle>
              </DialogHeader>
              {generatedKey ? (
                <div className="space-y-4">
                  <div className="rounded-lg border p-4 bg-amber-500/10 border-amber-500/20">
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">Bu anahtari simdi kopyalayin. Tekrar gosterilmeyecektir.</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm flex-1 break-all bg-muted p-2 rounded">{generatedKey}</code>
                      <Button variant="outline" size="icon" className="shrink-0" onClick={() => copyToClipboard(generatedKey)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => { setDialogOpen(false); setGeneratedKey(null); setKeyName(""); }}>Tamam</Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Anahtar Adi</Label>
                    <Input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Ornek: ERP Entegrasyon" className="mt-1.5" />
                  </div>
                  <DialogFooter>
                    <Button onClick={() => createMutation.mutate({ name: keyName })} disabled={!keyName || createMutation.isPending}>
                      {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Olustur
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !apiKeys || apiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Key className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Henuz API anahtari olusturulmamis</p>
            </div>
          ) : (
            <div className="space-y-2">
              {apiKeys.map((key: any) => (
                <div key={key.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{key.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{key.keyPrefix}...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={key.isActive ? "default" : "secondary"} className="text-xs">
                      {key.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Silmek istediginize emin misiniz?")) deleteMutation.mutate({ id: key.id }); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
