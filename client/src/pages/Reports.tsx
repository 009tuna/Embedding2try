import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, FileText, CheckCircle2, AlertCircle, Clock, Activity, BarChart3, ShieldCheck, XCircle, Percent,
} from "lucide-react";

function MetricCard({ title, value, subtitle, icon: Icon }: {
  title: string; value: string | number; subtitle?: string; icon: React.ElementType;
}) {
  return (
    <Card>
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

function ProgressBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm">{label}</span>
        <span className="text-sm font-medium">{value} (%{pct})</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Reports() {
  const { data: quality, isLoading: qualityLoading } = trpc.dataQuality.stats.useQuery();
  const { data: logs, isLoading: logsLoading } = trpc.logs.list.useQuery({ limit: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Raporlar ve Veri Kalitesi</h1>
        <p className="text-muted-foreground mt-1">Veri kalitesi KPI'lari, eslestirme performansi ve islem metrikleri</p>
      </div>

      {/* Key KPIs */}
      {qualityLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Tamamlanma Orani"
            value={`%${(quality?.completionRate ?? 0).toFixed(1)}`}
            icon={CheckCircle2}
            subtitle="Islenen / Toplam belge"
          />
          <MetricCard
            title="Ortalama Guven Skoru"
            value={quality?.avgConfidence ? `%${(quality.avgConfidence * 100).toFixed(1)}` : "-%"}
            icon={TrendingUp}
            subtitle="Tum eslestirmeler"
          />
          <MetricCard
            title="Onay Orani"
            value={`%${(quality?.approvalRate ?? 0).toFixed(1)}`}
            icon={ShieldCheck}
            subtitle="Onaylanan eslestirmeler"
          />
          <MetricCard
            title="Parse Hata Orani"
            value={`%${(quality?.parseFailureRate ?? 0).toFixed(1)}`}
            icon={XCircle}
            subtitle="Basarisiz islemler"
          />
        </div>
      )}

      {/* Confidence & Match Type Distribution */}
      {qualityLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Confidence Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Guven Skoru Dagilimi</CardTitle>
              <CardDescription>Eslestirme sonuclarinin guvenilirlik dagilimi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const dist = quality?.confidenceDistribution;
                const total = (dist?.high ?? 0) + (dist?.medium ?? 0) + (dist?.low ?? 0);
                if (total === 0) return (
                  <div className="flex flex-col items-center justify-center py-8">
                    <BarChart3 className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">Henuz eslestirme verisi yok</p>
                  </div>
                );
                return (
                  <div className="space-y-3">
                    <ProgressBar label="Yuksek Guven (≥80%)" value={dist?.high ?? 0} total={total} color="bg-emerald-500" />
                    <ProgressBar label="Orta Guven (50-79%)" value={dist?.medium ?? 0} total={total} color="bg-amber-500" />
                    <ProgressBar label="Dusuk Guven (<50%)" value={dist?.low ?? 0} total={total} color="bg-red-500" />
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Match Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Eslestirme Tipi Dagilimi</CardTitle>
              <CardDescription>Hangi yontemle kac eslestirme yapildi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const dist = quality?.matchTypeDistribution;
                const total = (dist?.semantic ?? 0) + (dist?.rule ?? 0) + (dist?.exact ?? 0) + (dist?.manual ?? 0);
                if (total === 0) return (
                  <div className="flex flex-col items-center justify-center py-8">
                    <BarChart3 className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">Henuz eslestirme verisi yok</p>
                  </div>
                );
                const items = [
                  { label: "Anlamsal (LLM)", value: dist?.semantic ?? 0, color: "bg-purple-500" },
                  { label: "Kural Tabanli", value: dist?.rule ?? 0, color: "bg-blue-500" },
                  { label: "Tam Eslesme", value: dist?.exact ?? 0, color: "bg-emerald-500" },
                  { label: "Manuel", value: dist?.manual ?? 0, color: "bg-orange-500" },
                ];
                return (
                  <>
                    <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                      {items.filter(i => i.value > 0).map(item => (
                        <div key={item.label} className={`h-full ${item.color} transition-all`} style={{ width: `${(item.value / total) * 100}%` }} />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {items.map(item => (
                        <div key={item.label} className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${item.color}`} />
                          <span className="text-sm">{item.label}: <strong>{item.value}</strong></span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional KPIs */}
      {!qualityLoading && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <Percent className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-2xl font-bold">{`%${(quality?.unmatchedRate ?? 0).toFixed(1)}`}</p>
              <p className="text-xs text-muted-foreground mt-1">Eslesmeyen Oran</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold">{quality?.totalProcessed ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Basarili Islem</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-2xl font-bold">{quality?.totalFailed ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Basarisiz Islem</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Processing Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Isleme Gecmisi
          </CardTitle>
          <CardDescription>Son isleme aktiviteleri ve sonuclari</CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Clock className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Henuz isleme gecmisi yok</p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3">
                    {log.status === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {log.status === "warning" && <AlertCircle className="h-4 w-4 text-amber-500" />}
                    {log.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                    <span className="text-sm">{formatLogAction(log.action)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString("tr-TR")}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatLogAction(action: string): string {
  const map: Record<string, string> = {
    document_uploaded: "Belge yuklendi",
    document_uploaded_with_file: "Dosya ile belge yuklendi",
    document_processed: "Belge islendi",
    document_processing_failed: "Belge isleme hatasi",
    category_created: "Kategori olusturuldu",
    rule_created: "Kural olusturuldu",
    rule_auto_created: "Otomatik kural olusturuldu (ogrenme)",
    match_approved: "Eslestirme onaylandi",
  };
  return map[action] || action;
}
