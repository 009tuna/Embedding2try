import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Key, Plus, Trash2, Loader2, Copy, Download, Code, FileJson, Zap, BookOpen } from "lucide-react";
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

  const baseUrl = window.location.origin;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API & Export</h1>
          <p className="text-muted-foreground mt-1">API anahtarlarini yonetin, verileri disari aktarin ve entegrasyon yapin</p>
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
            <Button variant="outline" className="w-full justify-start" onClick={() => exportMutation.mutate({ format: "json", approvedOnly: true })} disabled={exportMutation.isPending}>
              <FileJson className="h-4 w-4 mr-3" />
              <div className="text-left">
                <p className="text-sm font-medium">JSON Export (Onaylanmis)</p>
                <p className="text-xs text-muted-foreground">Sadece onaylanmis eslestirmeleri aktar</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => exportMutation.mutate({ format: "csv", approvedOnly: true })} disabled={exportMutation.isPending}>
              <Download className="h-4 w-4 mr-3" />
              <div className="text-left">
                <p className="text-sm font-medium">CSV Export (Onaylanmis)</p>
                <p className="text-xs text-muted-foreground">Excel uyumlu CSV formati</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => exportMutation.mutate({ format: "json" })} disabled={exportMutation.isPending}>
              <FileJson className="h-4 w-4 mr-3" />
              <div className="text-left">
                <p className="text-sm font-medium">JSON Export (Tumu)</p>
                <p className="text-xs text-muted-foreground">Tum eslestirme sonuclarini aktar</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => exportMutation.mutate({ format: "csv" })} disabled={exportMutation.isPending}>
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
              <BookOpen className="h-4 w-4" />
              REST API Dokumantasyonu
            </CardTitle>
            <CardDescription>Dis sistemler icin API key ile kimlik dogrulamali REST endpoint'leri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-3 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-2">Kimlik Dogrulama</p>
              <code className="text-xs break-all">Authorization: Bearer dds_xxxxx...</code>
            </div>

            <Tabs defaultValue="standardize" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-8">
                <TabsTrigger value="standardize" className="text-xs"><Zap className="h-3 w-3 mr-1" />Tek Adim</TabsTrigger>
                <TabsTrigger value="documents" className="text-xs"><Code className="h-3 w-3 mr-1" />Belgeler</TabsTrigger>
                <TabsTrigger value="categories" className="text-xs"><FileJson className="h-3 w-3 mr-1" />Kategoriler</TabsTrigger>
              </TabsList>

              <TabsContent value="standardize" className="mt-3">
                <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs font-mono">POST /api/v1/standardize</Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(`${baseUrl}/api/v1/standardize`)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Belge yukle + isle tek adimda. Sonuclari aninda dondurur.</p>
                  <pre className="text-xs overflow-x-auto bg-background/50 p-2 rounded">{`curl -X POST ${baseUrl}/api/v1/standardize \\
  -H "Authorization: Bearer dds_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Fatura #1234",
    "sourceType": "invoice",
    "rawContent": "Nakliye bedeli: 5000 TL\\nDemuraj: 800 USD",
    "supplierName": "ABC Lojistik"
  }'`}</pre>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="mt-3 space-y-2">
                <div className="rounded-lg border p-3 bg-muted/30 space-y-1">
                  <Badge variant="outline" className="text-xs font-mono">POST /api/v1/documents</Badge>
                  <p className="text-xs text-muted-foreground">Belge yukle (islemeden)</p>
                </div>
                <div className="rounded-lg border p-3 bg-muted/30 space-y-1">
                  <Badge variant="outline" className="text-xs font-mono">POST /api/v1/documents/:id/process</Badge>
                  <p className="text-xs text-muted-foreground">Belgeyi isle ve eslestirme sonuclarini al</p>
                </div>
                <div className="rounded-lg border p-3 bg-muted/30 space-y-1">
                  <Badge variant="outline" className="text-xs font-mono">GET /api/v1/documents/:id/results</Badge>
                  <p className="text-xs text-muted-foreground">Belgenin eslestirme sonuclarini getir</p>
                </div>
              </TabsContent>

              <TabsContent value="categories" className="mt-3">
                <div className="rounded-lg border p-3 bg-muted/30 space-y-1">
                  <Badge variant="outline" className="text-xs font-mono">GET /api/v1/categories</Badge>
                  <p className="text-xs text-muted-foreground">Tum ERP kategorilerini listele. ?type=expense ile filtrele.</p>
                </div>
              </TabsContent>
            </Tabs>
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
