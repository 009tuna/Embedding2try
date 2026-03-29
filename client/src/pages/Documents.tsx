import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
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
  FileText, Plus, Upload, Play, Trash2, Eye, Loader2, Mail, Clock, CheckCircle2, AlertCircle, FileUp, RefreshCw,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";

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
    pending: { label: "Beklemede", className: "bg-amber-500/15 text-amber-600 border-amber-500/20", icon: Clock },
    processing: { label: "Isleniyor", className: "bg-blue-500/15 text-blue-600 border-blue-500/20", icon: Loader2 },
    completed: { label: "Tamamlandi", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
    failed: { label: "Basarisiz", className: "bg-red-500/15 text-red-600 border-red-500/20", icon: AlertCircle },
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
  const [uploadTab, setUploadTab] = useState("text");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const uploadFileMutation = trpc.documents.uploadFile.useMutation({
    onSuccess: () => {
      toast.success("Dosya basariyla yuklendi ve metin cikarildi");
      utils.documents.list.invalidate();
      utils.dashboard.stats.invalidate();
      utils.dashboard.recentActivity.invalidate();
      setDialogOpen(false);
      resetForm();
    },
    onError: (e) => toast.error("Dosya yukleme hatasi: " + e.message),
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
      setUploadTab("text");
      toast.success("E-posta basariyla ayristirildi");
    },
    onError: (e) => toast.error("E-posta ayristirma hatasi: " + e.message),
  });

  function resetForm() {
    setTitle("");
    setSourceType("email");
    setRawContent("");
    setSupplierName("");
    setSelectedFile(null);
    setUploadTab("text");
  }

  const handleFileSelect = useCallback((file: File) => {
    const allowedTypes = ["text/plain", "text/csv", "text/markdown", "application/pdf"];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".txt") && !file.name.endsWith(".csv") && !file.name.endsWith(".md") && !file.name.endsWith(".pdf")) {
      toast.error("Desteklenmeyen dosya formati. Desteklenen: TXT, CSV, MD, PDF");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Dosya boyutu 10MB'i asamaz");
      return;
    }
    setSelectedFile(file);
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
  }, [title]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  async function handleFileUpload() {
    if (!selectedFile || !title) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadFileMutation.mutate({
        title,
        sourceType: sourceType as any,
        fileBase64: base64,
        fileName: selectedFile.name,
        mimeType: selectedFile.type || "text/plain",
        supplierName: supplierName || undefined,
      });
    };
    reader.readAsDataURL(selectedFile);
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

          <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
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

                <Tabs value={uploadTab} onValueChange={setUploadTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text">
                      <FileText className="h-4 w-4 mr-2" />
                      Metin Yapistir
                    </TabsTrigger>
                    <TabsTrigger value="file">
                      <FileUp className="h-4 w-4 mr-2" />
                      Dosya Yukle
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="text" className="mt-3">
                    <Textarea
                      value={rawContent}
                      onChange={(e) => setRawContent(e.target.value)}
                      placeholder="Serbest metin icerigini buraya girin veya yapisirin..."
                      className="min-h-[200px]"
                    />
                  </TabsContent>
                  <TabsContent value="file" className="mt-3">
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                        isDragging ? "border-primary bg-primary/5" : selectedFile ? "border-emerald-500 bg-emerald-500/5" : "border-muted-foreground/25 hover:border-primary/50"
                      }`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".txt,.csv,.md,.pdf"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                      />
                      {selectedFile ? (
                        <div className="space-y-2">
                          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                            Degistir
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                          <p className="text-sm text-muted-foreground">Dosyayi surukleyip birakin veya tiklayarak secin</p>
                          <p className="text-xs text-muted-foreground">Desteklenen formatlar: TXT, CSV, MD, PDF (maks. 10MB)</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <DialogFooter>
                {uploadTab === "text" ? (
                  <Button
                    onClick={() => uploadMutation.mutate({ title, sourceType: sourceType as any, rawContent, supplierName: supplierName || undefined })}
                    disabled={!title || !rawContent || uploadMutation.isPending}
                  >
                    {uploadMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Yukle
                  </Button>
                ) : (
                  <Button
                    onClick={handleFileUpload}
                    disabled={!title || !selectedFile || uploadFileMutation.isPending}
                  >
                    {uploadFileMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Dosyayi Yukle
                  </Button>
                )}
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
                        {doc.fileName && (
                          <span className="text-xs text-muted-foreground/70 font-mono">{doc.fileName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={doc.status} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewDoc(doc)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {/* Allow processing for pending, failed, AND completed (reprocess) */}
                    {doc.status !== "processing" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        onClick={() => processMutation.mutate({ id: doc.id })}
                        disabled={processMutation.isPending}
                        title={doc.status === "completed" ? "Yeniden isle" : "Isle"}
                      >
                        {processMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : doc.status === "completed" ? (
                          <RefreshCw className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
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
                {viewDoc.fileName && <Badge variant="secondary" className="font-mono text-xs">{viewDoc.fileName}</Badge>}
              </div>
              {viewDoc.fileUrl && (
                <a href={viewDoc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                  <FileUp className="h-3.5 w-3.5" />
                  Orijinal dosyayi indir
                </a>
              )}
              <div className="rounded-lg border p-4 bg-muted/30">
                <pre className="text-sm whitespace-pre-wrap font-mono max-h-[400px] overflow-y-auto">{viewDoc.rawContent}</pre>
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
