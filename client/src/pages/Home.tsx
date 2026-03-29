import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import {
  FileText,
  GitCompareArrows,
  FolderTree,
  TrendingUp,
  Upload,
  Plus,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layers,
} from "lucide-react";

function StatCard({ title, value, subtitle, icon: Icon }: {
  title: string; value: string | number; subtitle?: string; icon: React.ElementType;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: activity, isLoading: activityLoading } = trpc.dashboard.recentActivity.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Karanlik veri standardizasyon sureclerinizi izleyin</p>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Toplam Belge" value={stats?.totalDocuments ?? 0} subtitle={`${stats?.pendingDocuments ?? 0} beklemede`} icon={FileText} />
          <StatCard title="Eslestirme Sonuclari" value={stats?.totalMatches ?? 0} subtitle={`${stats?.approvedMatches ?? 0} onaylanmis`} icon={GitCompareArrows} />
          <StatCard title="ERP Kategorileri" value={stats?.totalCategories ?? 0} icon={FolderTree} />
          <StatCard title="Ort. Guven Skoru" value={stats?.avgConfidence ? `%${(stats.avgConfidence * 100).toFixed(0)}` : "-%"} subtitle={`${stats?.totalRules ?? 0} aktif kural`} icon={TrendingUp} />
        </div>
      )}

      {/* Quick Actions + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Hizli Islemler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { icon: Upload, label: "Belge Yukle", desc: "E-posta, irsaliye veya fatura yukleyin", path: "/documents" },
              { icon: Plus, label: "Kategori Ekle", desc: "ERP kategorilerini tanimlayin", path: "/categories" },
              { icon: BookOpen, label: "Kural Olustur", desc: "Otomatik eslestirme kurallari tanimlayin", path: "/rules" },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className="flex items-center gap-4 w-full p-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Son Islemler
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : !activity || activity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Henuz islem yapilmamis</p>
                <p className="text-xs text-muted-foreground mt-1">Belge yukleyerek baslayin</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activity.slice(0, 8).map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-3">
                      {log.status === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      {log.status === "warning" && <AlertCircle className="h-4 w-4 text-amber-500" />}
                      {log.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                      <span className="text-sm">{formatAction(log.action)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString("tr-TR")}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatAction(action: string): string {
  const map: Record<string, string> = {
    document_uploaded: "Belge yuklendi",
    document_uploaded_with_file: "Dosya ile belge yuklendi",
    document_processed: "Belge islendi",
    document_processing_failed: "Belge isleme hatasi",
    category_created: "Kategori olusturuldu",
    rule_created: "Kural olusturuldu",
    rule_auto_created: "Otomatik kural olusturuldu",
    match_approved: "Eslestirme onaylandi",
  };
  return map[action] || action;
}
