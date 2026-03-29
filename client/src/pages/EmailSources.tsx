import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Mail, Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";

const sourceTypeLabels: Record<string, string> = {
  supplier: "Tedarikci",
  carrier: "Nakliyeci",
  customs: "Gumruk",
  internal: "Dahili",
  other: "Diger",
};

export default function EmailSources() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: "", emailAddress: "", sourceType: "supplier" as string });

  const utils = trpc.useUtils();
  const { data: sources, isLoading } = trpc.emailSources.list.useQuery();

  const createMutation = trpc.emailSources.create.useMutation({
    onSuccess: () => {
      toast.success("E-posta kaynagi eklendi");
      utils.emailSources.list.invalidate();
      setDialogOpen(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.emailSources.update.useMutation({
    onSuccess: () => {
      toast.success("E-posta kaynagi guncellendi");
      utils.emailSources.list.invalidate();
      setEditItem(null);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.emailSources.delete.useMutation({
    onSuccess: () => {
      toast.success("E-posta kaynagi silindi");
      utils.emailSources.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ name: "", emailAddress: "", sourceType: "supplier" });
  }

  function openEdit(src: any) {
    setForm({ name: src.name, emailAddress: src.emailAddress, sourceType: src.sourceType });
    setEditItem(src);
  }

  function handleSave() {
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, ...form } as any);
    } else {
      createMutation.mutate(form as any);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">E-posta Kaynaklari</h1>
          <p className="text-muted-foreground mt-1">Tedarikci ve nakliyeci e-posta adreslerini yonetin</p>
        </div>
        <Dialog open={dialogOpen || !!editItem} onOpenChange={(v) => { if (!v) { setDialogOpen(false); setEditItem(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Kaynak Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? "Kaynak Duzenle" : "Yeni E-posta Kaynagi"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Isim</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ornek: ABC Lojistik" className="mt-1.5" />
              </div>
              <div>
                <Label>E-posta Adresi</Label>
                <Input type="email" value={form.emailAddress} onChange={(e) => setForm({ ...form, emailAddress: e.target.value })} placeholder="ornek@sirket.com" className="mt-1.5" />
              </div>
              <div>
                <Label>Kaynak Tipi</Label>
                <Select value={form.sourceType} onValueChange={(v) => setForm({ ...form, sourceType: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(sourceTypeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={!form.name || !form.emailAddress || createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editItem ? "Guncelle" : "Ekle"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !sources || sources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Mail className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium mb-1">Henuz e-posta kaynagi yok</h3>
            <p className="text-sm text-muted-foreground mb-4">Tedarikci ve nakliyeci e-posta adreslerini ekleyin</p>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Kaynak Ekle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sources.map((src: any) => (
            <Card key={src.id} className="hover:border-primary/20 transition-colors group">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{src.name}</p>
                        <Badge variant="outline" className="shrink-0 text-xs">{sourceTypeLabels[src.sourceType]}</Badge>
                        {!src.isActive && <Badge variant="destructive" className="text-xs">Pasif</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{src.emailAddress}</span>
                        <span>{src.totalProcessed} belge islendi</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(src)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("Silmek istediginize emin misiniz?")) deleteMutation.mutate({ id: src.id }); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
