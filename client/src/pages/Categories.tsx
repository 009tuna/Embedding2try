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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  FolderTree, Plus, Edit2, Trash2, Loader2,
} from "lucide-react";
import { useState } from "react";

const typeLabels: Record<string, string> = {
  expense: "Gider Kalemi",
  operation: "Operasyon Tipi",
  material: "Hammadde",
  route: "Rota",
  supplier: "Tedarikci",
  custom: "Ozel",
};

const typeColors: Record<string, string> = {
  expense: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
  operation: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  material: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  route: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
  supplier: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
  custom: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/20",
};

export default function Categories() {
  const [activeTab, setActiveTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ type: "expense", code: "", name: "", description: "", erpField: "" });

  const utils = trpc.useUtils();
  const typeFilter = activeTab === "all" ? undefined : activeTab;
  const { data: categories, isLoading } = trpc.categories.list.useQuery(typeFilter ? { type: typeFilter } : undefined);

  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success("Kategori olusturuldu");
      utils.categories.list.invalidate();
      utils.dashboard.stats.invalidate();
      setDialogOpen(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => {
      toast.success("Kategori guncellendi");
      utils.categories.list.invalidate();
      setEditItem(null);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      toast.success("Kategori silindi");
      utils.categories.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ type: "expense", code: "", name: "", description: "", erpField: "" });
  }

  function openEdit(cat: any) {
    setForm({ type: cat.type, code: cat.code, name: cat.name, description: cat.description || "", erpField: cat.erpField || "" });
    setEditItem(cat);
  }

  function handleSave() {
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, ...form, description: form.description || null, erpField: form.erpField || null } as any);
    } else {
      createMutation.mutate(form as any);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ERP Kategorileri</h1>
          <p className="text-muted-foreground mt-1">Gider kalemleri, operasyon tipleri ve tedarikci isimlendirmelerini yonetin</p>
        </div>
        <Dialog open={dialogOpen || !!editItem} onOpenChange={(v) => { if (!v) { setDialogOpen(false); setEditItem(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Kategori Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? "Kategori Duzenle" : "Yeni Kategori"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tip</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kod</Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="GDR-001" className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label>Isim</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Kategori ismi" className="mt-1.5" />
              </div>
              <div>
                <Label>Aciklama</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Opsiyonel aciklama" className="mt-1.5" />
              </div>
              <div>
                <Label>ERP Alan Adi</Label>
                <Input value={form.erpField} onChange={(e) => setForm({ ...form, erpField: e.target.value })} placeholder="ornek: gider_kalemi_nakliye" className="mt-1.5" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={!form.code || !form.name || createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editItem ? "Guncelle" : "Olustur"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Tumu</TabsTrigger>
          {Object.entries(typeLabels).map(([k, v]) => (
            <TabsTrigger key={k} value={k}>{v}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : !categories || categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderTree className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium mb-1">Henuz kategori yok</h3>
            <p className="text-sm text-muted-foreground mb-4">ERP kategorilerinizi tanimlayarak baslayin</p>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Kategori Ekle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat: any) => (
            <Card key={cat.id} className="hover:border-primary/20 transition-colors group">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline" className={typeColors[cat.type] || typeColors.custom}>
                    {typeLabels[cat.type] || cat.type}
                  </Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Silmek istediginize emin misiniz?")) deleteMutation.mutate({ id: cat.id }); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{cat.code}</span>
                    {!cat.isActive && <Badge variant="secondary" className="text-xs">Pasif</Badge>}
                  </div>
                  <p className="font-medium">{cat.name}</p>
                  {cat.description && <p className="text-xs text-muted-foreground line-clamp-2">{cat.description}</p>}
                  {cat.erpField && (
                    <p className="text-xs font-mono text-primary/70 mt-2">ERP: {cat.erpField}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
