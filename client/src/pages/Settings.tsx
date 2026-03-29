import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Settings, User, Palette, Shield, Bell, LogOut,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-muted-foreground mt-1">Hesap ve uygulama ayarlarinizi yonetin</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Profil Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Isim</p>
              <p className="text-sm font-medium">{user?.name || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">E-posta</p>
              <p className="text-sm font-medium">{user?.email || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Rol</p>
              <Badge variant="outline" className="text-xs">{user?.role === "admin" ? "Yonetici" : "Kullanici"}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Kayit Tarihi</p>
              <p className="text-sm">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString("tr-TR") : "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Gorunum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Karanlik Mod</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Arayuz temasini degistirin</p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Veri ve Gizlilik
          </CardTitle>
          <CardDescription>Veri izolasyonu ve guvenlik ayarlari</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Veri Izolasyonu Aktif</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tum verileriniz kullanici bazli izole edilmistir. Diger kullanicilar verilerinize erisemez.
                  Belgeler, kategoriler, kurallar ve eslestirme sonuclari tamamen size ozeldir.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Bildirimler</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Belge isleme tamamlandiginda ve eslestirme sonuclari hazir oldugunda bildirim alin.
                  Bildirim ayarlari Management UI uzerinden yapilandirabilir.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hakkinda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Uygulama</span>
            <span className="text-sm font-medium">DDS Platform v1.0</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Aciklama</span>
            <span className="text-sm">Karanlik Veri Standardizasyon Platformu</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">AI Motoru</span>
            <span className="text-sm">LLM Tabanli Anlamsal Eslestirme</span>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Tehlikeli Bolge</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Oturumu Kapat</p>
              <p className="text-xs text-muted-foreground">Hesabinizdan cikis yapin</p>
            </div>
            <Button variant="destructive" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Cikis Yap
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
