import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { BookOpen, Plus, Edit2, Trash2, Loader2, Zap } from "lucide-react";
import { useState } from "react";

const strategyLabels: Record<string, string> = {
  exact: "Tam Eslesme",
  contains: "Icerir",
  regex: "Regex",
  semantic: "Anlamsal",
};

export default function Rules() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", sourcePattern: "", targetCategoryId: 0, matchStrategy: "contains" as string, priority: 0 });

  const utils = trpc.useUtils();
  const { data: rules, isLoading } = trpc.rules.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();

  const createMutation = trpc.rules.create.useMutation({
    onSuccess: () => {
      toast.success("Kural olusturuldu");
      utils.rules.list.invalidate();
      utils.dashboard.stats.invalidate();
      setDialogOpen(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.rules.update.useMutation({
    onSuccess: () => {
      toast.success("Kural guncellendi");
      utils.rules.list.invalidate();
      setEditItem(null);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.rules.delete.useMutation({
    onSuccess: () => {
      toast.success("Kural silindi");
      utils.rules.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ name: "", description: "", sourcePattern: "", targetCategoryId: 0, matchStrategy: "contains", priority: 0 });
  }

  function openEdit(rule: any) {
    setForm({
      name: rule.name,
      description: rule.description || "",
      sourcePattern: rule.sourcePattern,
      targetCategoryId: rule.targetCategoryId,
      matchStrategy: rule.matchStrategy,
      priority: rule.priority,
    });
    setEditItem(rule);
  }

  function handleSave() {
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, ...form, description: form.description || null } as any);
    } else {
      createMutation.mutate(form as any);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Eslestirme Kurallari</h1>
          <p className="text-muted-foreground mt-1">Otomatik eslestirme kurallarini tanimlayarak dogruluk oranini artirin</p>
        </div>
        <Dialog open={dialogOpen || !!editItem} onOpenChange={(v) => { if (!v) { setDialogOpen(false); setEditItem(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Kural Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? "Kural Duzenle" : "Yeni Kural"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Kural Adi</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ornek: Nakliye giderleri" className="mt-1.5" />
              </div>
              <div>
                <Label>Aciklama</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Opsiyonel" className="mt-1.5" />
              </div>
              <div>
                <Label>Kaynak Deseni (Pattern)</Label>
                <Input value={form.sourcePattern} onChange={(e) => setForm({ ...form, sourcePattern: e.target.value })} placeholder="Ornek: nakliye bedeli" className="mt-1.5" />
                <p className="text-xs text-muted-foreground mt-1">Bu desen, gelen metinlerde aranacaktir</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Eslestirme Stratejisi</Label>
                  <Select value={form.matchStrategy} onValueChange={(v) => setForm({ ...form, matchStrategy: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(strategyLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Oncelik</Label>
                  <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label>Hedef Kategori</Label>
                <Select value={form.targetCategoryId ? String(form.targetCategoryId) : ""} onValueChange={(v) => setForm({ ...form, targetCategoryId: parseInt(v) })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Kategori secin" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat: any) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>{cat.name} ({cat.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={!form.name || !form.sourcePattern || !form.targetCategoryId || createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editItem ? "Guncelle" : "Olustur"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : !rules || rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium mb-1">Henuz kural yok</h3>
            <p className="text-sm text-muted-foreground mb-4">Eslestirme kurallarini tanimlayarak otomatik eslestirmeyi gelistirin</p>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Kural Ekle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule: any) => (
            <Card key={rule.id} className="hover:border-primary/20 transition-colors group">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{rule.name}</p>
                        <Badge variant="outline" className="shrink-0 text-xs">{strategyLabels[rule.matchStrategy]}</Badge>
                        <Badge variant="secondary" className="shrink-0 text-xs">Oncelik: {rule.priority}</Badge>
                        {!rule.isActive && <Badge variant="destructive" className="text-xs">Pasif</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Desen: <code className="bg-muted px-1 rounded">{rule.sourcePattern}</code></span>
                        <span>{rule.timesApplied} kez uygulandi</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(rule)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("Silmek istediginize emin misiniz?")) deleteMutation.mutate({ id: rule.id }); }}>
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
