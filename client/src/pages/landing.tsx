import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useBranding } from "@/hooks/use-branding";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GraduationCap, BookOpen, Users, Shield, QrCode } from "lucide-react";

function LoginDialog({ open, onClose, title, role, icon: Icon }: {
  open: boolean;
  onClose: () => void;
  title: string;
  role: string;
  icon: any;
}) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const loginPassword = role === "admin" ? password : identifier;
      await login({ identifier, password: loginPassword, role });
      onClose();
    } catch (err: any) {
      setError(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = () => {
    if (role === "siswa") return "NISN";
    if (role === "guru" || role === "wali_kelas") return "PegId";
    return "Username";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="identifier">{getPlaceholder()}</Label>
            <Input
              id="identifier"
              data-testid="input-identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={`Masukkan ${getPlaceholder()}`}
              required
            />
          </div>
          {role === "admin" && (
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                data-testid="input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
              />
            </div>
          )}
          {error && <p className="text-sm text-destructive" data-testid="text-login-error">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading} data-testid="button-login-submit">
            {loading ? "Memproses..." : "Masuk"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function LandingPage() {
  const [loginDialog, setLoginDialog] = useState<string | null>(null);
  const branding = useBranding();

  const loginCards = [
    { role: "siswa", title: "Login Siswa", subtitle: "Masuk dengan NISN", icon: GraduationCap, color: "from-blue-500 to-blue-600" },
    { role: "guru", title: "Login Guru", subtitle: "Masuk dengan PegId", icon: BookOpen, color: "from-emerald-500 to-emerald-600" },
    { role: "wali_kelas", title: "Login Wali Kelas", subtitle: "Masuk dengan PegId", icon: Users, color: "from-amber-500 to-amber-600" },
    { role: "admin", title: "Login Admin", subtitle: "Username & Password", icon: Shield, color: "from-purple-500 to-purple-600" },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={branding.landingBgUrl ? {
        backgroundImage: `url(${branding.landingBgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      } : undefined}
    >
      {!branding.landingBgUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950" />
      )}
      {branding.landingBgUrl && (
        <div className="absolute inset-0 bg-black/40" />
      )}
      <div className="relative z-10 container mx-auto px-3 sm:px-4 py-8 max-w-2xl">
        <div className="text-center mb-8 sm:mb-12">
          {branding.logoUrl ? (
            <div className="flex justify-center mb-4">
              <img src={branding.logoUrl} alt="Logo Sekolah" className="h-20 sm:h-28 w-auto object-contain drop-shadow-md" />
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <QrCode className={`w-12 h-12 sm:w-16 sm:h-16 ${branding.landingBgUrl ? "text-white" : "text-primary"}`} />
            </div>
          )}
          <h1
            className={`text-xl sm:text-3xl md:text-4xl font-bold ${branding.landingBgUrl ? "text-white drop-shadow-md" : "text-foreground"}`}
            data-testid="text-title"
          >
            {branding.schoolName}
          </h1>
          <p className={`text-sm sm:text-base mt-1 ${branding.landingBgUrl ? "text-white/80" : "text-muted-foreground"}`}>
            {branding.schoolSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {loginCards.map((card) => (
            <Card
              key={card.role}
              className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border"
              onClick={() => setLoginDialog(card.role)}
              data-testid={`card-login-${card.role}`}
            >
              <CardContent className="p-4 sm:p-6 text-center">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <card.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm">{card.title}</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{card.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center py-4 mt-8">
          <p className="text-[10px] text-muted-foreground/50" data-testid="text-credit">Developed by Bangkit Cerdas Mandiri</p>
        </div>
      </div>

      <LoginDialog
        open={loginDialog === "siswa"}
        onClose={() => setLoginDialog(null)}
        title="Login Siswa"
        role="siswa"
        icon={GraduationCap}
      />
      <LoginDialog
        open={loginDialog === "guru"}
        onClose={() => setLoginDialog(null)}
        title="Login Guru"
        role="guru"
        icon={BookOpen}
      />
      <LoginDialog
        open={loginDialog === "wali_kelas"}
        onClose={() => setLoginDialog(null)}
        title="Login Wali Kelas"
        role="wali_kelas"
        icon={Users}
      />
      <LoginDialog
        open={loginDialog === "admin"}
        onClose={() => setLoginDialog(null)}
        title="Login Admin"
        role="admin"
        icon={Shield}
      />
    </div>
  );
}
