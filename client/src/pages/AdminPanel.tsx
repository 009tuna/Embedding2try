import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  FileText,
  GitCompareArrows,
  FolderTree,
  Shield,
  Clock,
  Mail,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

function StatCard({ title, value, icon: Icon }: { title: string; value: number | string; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight mt-1">{value}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const { data: allUsers, isLoading: usersLoading } = trpc.admin.users.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const utils = trpc.useUtils();
  const updateRole = trpc.admin.updateRole.useMutation({
    onSuccess: () => {
      utils.admin.users.invalidate();
      toast.success("Kullanici rolu guncellendi");
    },
    onError: () => {
      toast.error("Rol guncellenirken hata olustu");
    },
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Shield className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Erisim Engellendi</h2>
        <p className="text-muted-foreground mt-2">Bu sayfaya erisim icin admin yetkisi gereklidir.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Paneli</h1>
        <p className="text-muted-foreground mt-1">Sistem istatistikleri ve kullanici yonetimi</p>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Toplam Kullanici" value={stats?.totalUsers ?? 0} icon={Users} />
          <StatCard title="Toplam Belge" value={stats?.totalDocuments ?? 0} icon={FileText} />
          <StatCard title="Eslestirme Sonucu" value={stats?.totalMatches ?? 0} icon={GitCompareArrows} />
          <StatCard title="ERP Kategorisi" value={stats?.totalCategories ?? 0} icon={FolderTree} />
        </div>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Kayitli Kullanicilar
          </CardTitle>
          <CardDescription>Sisteme kayitli tum kullanicilari goruntuleyip yonetin</CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : !allUsers || allUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Henuz kayitli kullanici yok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Kullanici</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">E-posta</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Rol</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Kayit Tarihi</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Son Giris</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Islem</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u: any) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{u.name || "Isimsiz"}</p>
                            <p className="text-xs text-muted-foreground">ID: {u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{u.email || "-"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={u.role === "admin" ? "default" : "secondary"} className={u.role === "admin" ? "bg-primary text-primary-foreground" : ""}>
                          {u.role === "admin" ? "Admin" : "Kullanici"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{new Date(u.createdAt).toLocaleDateString("tr-TR")}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">
                          {new Date(u.lastSignedIn).toLocaleDateString("tr-TR")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.id !== user?.id ? (
                          <Select
                            value={u.role}
                            onValueChange={(val) => {
                              updateRole.mutate({ userId: u.id, role: val as "user" | "admin" });
                            }}
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Kullanici</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Siz</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
