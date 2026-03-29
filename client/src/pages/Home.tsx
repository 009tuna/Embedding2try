import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  GitCompareArrows,
  FolderTree,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
} from "lucide-react";
import { useLocation } from "wouter";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  onClick,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${onClick ? "cursor-pointer hover:border-primary/30" : ""}`}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 0.8) return <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15">Yuksek {(score * 100).toFixed(0)}%</Badge>;
  if (score >= 0.5) return <Badge variant="default" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15">Orta {(score * 100).toFixed(0)}%</Badge>;
  return <Badge variant="default" className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/15">Dusuk {(score * 100).toFixed(0)}%</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { icon: React.ElementType; label: string; className: string }> = {
    success: { icon: CheckCircle2, label: "Basarili", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
    warning: { icon: AlertCircle, label: "Uyari", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20" },
    error: { icon: AlertCircle, label: "Hata", className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20" },
  };
  const v = variants[status] || variants.success;
  return (
    <Badge variant="outline" className={v.className}>
      <v.icon className="h-3 w-3 mr-1" />
      {v.label}
    </Badge>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: activity, isLoading: activityLoading } = trpc.dashboard.recentActivity.useQuery();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Karanlik veri standardizasyon sureclerinizi izleyin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">DDS Platform</span>
        </div>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Toplam Belge"
            value={stats?.totalDocuments ?? 0}
            icon={FileText}
            description={`${stats?.pendingDocuments ?? 0} beklemede`}
            onClick={() => setLocation("/documents")}
          />
          <StatCard
            title="Eslestirme Sonuclari"
            value={stats?.totalMatches ?? 0}
            icon={GitCompareArrows}
            description={`${stats?.approvedMatches ?? 0} onaylanmis`}
            onClick={() => setLocation("/matching")}
          />
          <StatCard
            title="ERP Kategorileri"
            value={stats?.totalCategories ?? 0}
            icon={FolderTree}
            onClick={() => setLocation("/categories")}
          />
          <StatCard
            title="Ort. Guven Skoru"
            value={stats?.avgConfidence ? `${(stats.avgConfidence * 100).toFixed(1)}%` : "-%"}
            icon={TrendingUp}
            description={`${stats?.totalRules ?? 0} aktif kural`}
          />
        </div>
      )}

      {/* Quick Actions + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Hizli Islemler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => setLocation("/documents")}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left"
            >
              <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Belge Yukle</p>
                <p className="text-xs text-muted-foreground">E-posta, irsaliye veya fatura yukleyin</p>
              </div>
            </button>
            <button
              onClick={() => setLocation("/categories")}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left"
            >
              <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <FolderTree className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Kategori Ekle</p>
                <p className="text-xs text-muted-foreground">ERP kategorilerini tanimlayin</p>
              </div>
            </button>
            <button
              onClick={() => setLocation("/rules")}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left"
            >
              <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Kural Olustur</p>
                <p className="text-xs text-muted-foreground">Otomatik eslestirme kurallari tanimlayin</p>
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Son Islemler
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !activity || activity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Henuz islem yapilmamis</p>
                <p className="text-xs text-muted-foreground mt-1">Belge yukleyerek baslayin</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activity.slice(0, 8).map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusBadge status={log.status} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {formatAction(log.action)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("tr-TR")}
                        </p>
                      </div>
                    </div>
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
    match_approved: "Eslestirme onaylandi",
  };
  return map[action] || action;
}
