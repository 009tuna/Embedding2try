import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  FileText, Plus, Upload, Play, Trash2, Eye, Loader2, Mail, FileCheck, AlertCircle, Clock, CheckCircle2,
} from "lucide-react";
import { useState } from "react";

const sourceTypeLabels: Record<string, string> = {
  email: "E-posta",
  waybill: "Irsaliye",
  invoice: "Fatura",
  order_note: "Siparis Notu",
  customs: "Gumruk",
  price_quote: "Fiyat Teklifi",
  other: "Diger",
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    pending: { label: "Beklemede", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: Clock },
    processing: { label: "Isleniyor", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20", icon: Loader2 },
    completed: { label: "Tamamlandi", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
    failed: { label: "Basarisiz", className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20", icon: AlertCircle },
  };
  const v = map[status] || map.pending;
  return (
    <Badge variant="outline" className={v.className}>
      <v.icon className="h-3 w-3 mr-1" />
      {v.label}
    </Badge>
  );
}

export default function Documents() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<string>("email");
  const [rawContent, setRawContent] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [emailContent, setEmailContent] = useState("");

  const utils = trpc.useUtils();
  const { data: docs, isLoading } = trpc.documents.list.useQuery({ limit: 50 });

  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast.success("Belge basariyla yuklendi");
      utils.documents.list.invalidate();
      utils.dashboard.stats.invalidate();
      utils.dashboard.recentActivity.invalidate();
      setDialogOpen(false);
      resetForm();
    },
    onError: (e) => toast.error("Yukleme hatasi: " + e.message),
  });

  const processMutation = trpc.documents.process.useMutation({
    onSuccess: (data) => {
      toast.success(`Belge islendi: ${data.termsExtracted} terim cikarildi, ${data.matchesFound} eslestirme bulundu`);
      utils.documents.list.invalidate();
      utils.dashboard.stats.invalidate();
      utils.dashboard.recentActivity.invalidate();
      utils.matching.list.invalidate();
    },
    onError: (e) => toast.error("Isleme hatasi: " + e.message),
  });

  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Belge silindi");
      utils.documents.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (e) => toast.error("Silme hatasi: " + e.message),
  });

  const parseEmailMutation = trpc.documents.parseEmail.useMutation({
    onSuccess: (data) => {
      setTitle(data.subject || "E-posta Belgesi");
      setSourceType(data.documentType);
      setRawContent(emailContent);
      setSupplierName(data.sender || "");
      setEmailDialogOpen(false);
      setDialogOpen(true);
      toast.success("E-posta basariyla ayristirildi");
    },
    onError: (e) => toast.error("E-posta ayristirma hatasi: " + e.message),
  });

  function resetForm() {
    setTitle("");
    setSourceType("email");
    setRawContent("");
    setSupplierName("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Belgeler</h1>
          <p className="text-muted-foreground mt-1">E-posta, irsaliye, fatura ve diger belgeleri yonetin</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                E-posta Ayristir
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>E-posta Icerigini Ayristir</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>E-posta Icerigi</Label>
                  <Textarea
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    placeholder="E-posta icerigini buraya yapisirin..."
                    className="min-h-[200px] mt-1.5"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => parseEmailMutation.mutate({ emailContent })}
                  disabled={!emailContent || parseEmailMutation.isPending}
                >
                  {parseEmailMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Ayristir ve Yukle
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Belge Yukle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Yeni Belge Yukle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Baslik</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Belge basligi" className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Kaynak Tipi</Label>
                    <Select value={sourceType} onValueChange={setSourceType}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(sourceTypeLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Tedarikci / Gonderici</Label>
                  <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Opsiyonel" className="mt-1.5" />
                </div>
                <div>
                  <Label>Belge Icerigi</Label>
                  <Textarea
                    value={rawContent}
                    onChange={(e) => setRawContent(e.target.value)}
                    placeholder="Serbest metin icerigini buraya girin veya yapisirin..."
                    className="min-h-[200px] mt-1.5"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => uploadMutation.mutate({ title, sourceType: sourceType as any, rawContent, supplierName: supplierName || undefined })}
                  disabled={!title || !rawContent || uploadMutation.isPending}
                >
                  {uploadMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Yukle
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Document List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !docs || docs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium mb-1">Henuz belge yok</h3>
            <p className="text-sm text-muted-foreground mb-4">Ilk belgenizi yukleyerek baslayin</p>
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Belge Yukle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {docs.map((doc: any) => (
            <Card key={doc.id} className="hover:border-primary/20 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{doc.title}</p>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {sourceTypeLabels[doc.sourceType] || doc.sourceType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {doc.supplierName && (
                          <span className="text-xs text-muted-foreground">{doc.supplierName}</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.createdAt).toLocaleString("tr-TR")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={doc.status} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewDoc(doc)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {(doc.status === "pending" || doc.status === "failed") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        onClick={() => processMutation.mutate({ id: doc.id })}
                        disabled={processMutation.isPending}
                      >
                        {processMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => { if (confirm("Bu belgeyi silmek istediginize emin misiniz?")) deleteMutation.mutate({ id: doc.id }); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Document Dialog */}
      <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewDoc?.title}</DialogTitle>
          </DialogHeader>
          {viewDoc && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{sourceTypeLabels[viewDoc.sourceType] || viewDoc.sourceType}</Badge>
                <StatusBadge status={viewDoc.status} />
                {viewDoc.supplierName && <Badge variant="secondary">{viewDoc.supplierName}</Badge>}
              </div>
              <div className="rounded-lg border p-4 bg-muted/30">
                <pre className="text-sm whitespace-pre-wrap font-mono">{viewDoc.rawContent}</pre>
              </div>
              <p className="text-xs text-muted-foreground">
                Olusturulma: {new Date(viewDoc.createdAt).toLocaleString("tr-TR")}
                {viewDoc.processedAt && ` | Isleme: ${new Date(viewDoc.processedAt).toLocaleString("tr-TR")}`}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
