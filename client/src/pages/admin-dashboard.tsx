import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";
import { Switch } from "@/components/ui/switch";
import {
  LayoutDashboard, Users, Calendar, QrCode, FileSpreadsheet, Settings, LogOut,
  Lock, Unlock, Plus, Trash2, Edit, Download, Printer, UserPlus, Search, ClipboardEdit, MessageSquare, RefreshCw, ChevronDown, ChevronRight,
  Camera, CheckCircle, XCircle, KeyRound, Palette, Upload, X
} from "lucide-react";
import { useBranding } from "@/hooks/use-branding";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const branding = useBranding();
  const mainRef = useRef<HTMLElement>(null);

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    mainRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <aside className="w-64 border-r bg-card hidden md:flex flex-col no-print h-full">
        <div className="p-4 border-b flex items-center gap-3">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded" />
          ) : null}
          <div>
            <h2 className="font-bold text-sm leading-tight">{branding.schoolName}</h2>
            <p className="text-xs text-muted-foreground">{user?.name}</p>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "scanner", label: "Scanner", icon: Camera },
            { id: "settings", label: "Setelan", icon: Settings },
            { id: "users", label: "Kelola User", icon: Users },
            { id: "manual", label: "Absen Manual", icon: ClipboardEdit },
            { id: "qrcodes", label: "Cetak QR Code", icon: QrCode },
            { id: "recap", label: "Rekap Absensi", icon: FileSpreadsheet },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => switchTab(item.id)}
              data-testid={`nav-${item.id}`}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === item.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t">
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10" data-testid="button-logout">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </aside>

      <main ref={mainRef} className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
        <div className="md:hidden mb-4 no-print">
          <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {["overview","scanner","settings","users","manual","qrcodes","recap"].map(tab => (
              <Button key={tab} variant={activeTab === tab ? "default" : "outline"} size="sm" className="flex-shrink-0 text-xs" onClick={() => switchTab(tab)}>
                {tab === "overview" ? "Overview" : tab === "scanner" ? "Scanner" : tab === "settings" ? "Setelan" : tab === "users" ? "Users" : tab === "manual" ? "Manual" : tab === "qrcodes" ? "QR" : "Rekap"}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={logout} className="text-destructive flex-shrink-0"><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>

        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "scanner" && <ScannerTab />}
        {activeTab === "settings" && <SettingsTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "manual" && <ManualAttendanceTab />}
        {activeTab === "qrcodes" && <QRCodesTab />}
        {activeTab === "recap" && <RecapTab />}
      </main>
    </div>
  );
}

function OverviewTab() {
  const { data: users } = useQuery<any[]>({ queryKey: ["/api/admin/users"] });
  const today = new Date().toISOString().split("T")[0];
  const { data: todayAttendance } = useQuery<any[]>({ queryKey: ["/api/admin/attendance", today], queryFn: async () => {
    const res = await fetch(`/api/admin/attendance?startDate=${today}&endDate=${today}`, { credentials: "include" });
    return res.json();
  }});
  const [expandedStatus, setExpandedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let closed = false;
    function connect() {
      if (closed) return;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "attendance") {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/attendance", today] });
          }
        } catch {}
      };
      ws.onclose = () => {
        if (!closed) reconnectTimer = setTimeout(connect, 3000);
      };
    }
    connect();
    return () => { closed = true; clearTimeout(reconnectTimer); ws?.close(); };
  }, [today]);

  const students = users?.filter(u => u.role === "siswa") || [];
  const teachers = users?.filter(u => u.role === "guru" || u.role === "wali_kelas") || [];

  const hadirList = todayAttendance?.filter(a => a.status === "hadir") || [];
  const telatList = todayAttendance?.filter(a => a.status === "telat") || [];
  const pulangList = todayAttendance?.filter(a => a.checkOutTime) || [];
  const izinList = todayAttendance?.filter(a => a.status === "izin" || a.status === "sakit") || [];
  const alphaList = todayAttendance?.filter(a => a.status === "alpha") || [];

  const attendedIds = new Set(todayAttendance?.map(a => a.userId) || []);
  const allNonAdmin = [...students, ...teachers];
  const belumScanList = allNonAdmin.filter(u => !attendedIds.has(u.id));

  // Filter function for search
  const filterBySearch = (items: any[], isBelumScan: boolean = false) => {
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => {
      const user = isBelumScan ? item : item.user;
      return (
        (user?.name || "").toLowerCase().includes(query) ||
        (user?.identifier || "").toLowerCase().includes(query) ||
        (user?.className || "").toLowerCase().includes(query)
      );
    });
  };

  const statusSections = [
    { key: "hadir", label: "Hadir", count: filterBySearch(hadirList).length, color: "bg-green-500", list: filterBySearch(hadirList), icon: "✓" },
    { key: "telat", label: "Terlambat", count: filterBySearch(telatList).length, color: "bg-yellow-500", list: filterBySearch(telatList), icon: "⏰" },
    { key: "pulang", label: "Sudah Pulang", count: filterBySearch(pulangList).length, color: "bg-blue-500", list: filterBySearch(pulangList), icon: "🏠" },
    { key: "izin", label: "Izin/Sakit", count: filterBySearch(izinList).length, color: "bg-orange-500", list: filterBySearch(izinList), icon: "📋" },
    { key: "alpha", label: "Alpha", count: filterBySearch(alphaList).length, color: "bg-red-500", list: filterBySearch(alphaList), icon: "✗" },
    { key: "belum", label: "Belum Scan", count: filterBySearch(belumScanList, true).length, color: "bg-gray-400", list: filterBySearch(belumScanList, true), icon: "—" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Siswa</p>
            <p className="text-3xl font-bold" data-testid="text-total-students">{students.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Guru</p>
            <p className="text-3xl font-bold" data-testid="text-total-teachers">{teachers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total User</p>
            <p className="text-3xl font-bold" data-testid="text-total-users">{(users?.filter(u => u.role !== "admin")?.length) || 0}</p>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-sm sm:text-lg font-semibold mb-3">Kehadiran Hari Ini — {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h3>
      
      {/* Search Input */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Cari berdasarkan nama, NISN/NIP, atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-overview"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              data-testid="button-clear-search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-muted-foreground mt-1">
            Menampilkan {statusSections.reduce((sum, s) => sum + s.count, 0)} hasil dari {(todayAttendance?.length || 0) + (allNonAdmin?.length || 0)} total data
          </p>
        )}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 mb-4">
        {statusSections.map(s => (
          <button
            key={s.key}
            onClick={() => setExpandedStatus(expandedStatus === s.key ? null : s.key)}
            className={`rounded-lg p-2 sm:p-3 text-center transition-all border ${expandedStatus === s.key ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            data-testid={`card-status-${s.key}`}
          >
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${s.color} text-white flex items-center justify-center mx-auto mb-1 text-xs sm:text-sm`}>{s.icon}</div>
            <p className="text-lg sm:text-2xl font-bold">{s.count}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{s.label}</p>
          </button>
        ))}
      </div>

      {expandedStatus && (() => {
        const section = statusSections.find(s => s.key === expandedStatus);
        if (!section) return null;
        const isBelumScan = expandedStatus === "belum";
        return (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{section.label} ({section.count})</CardTitle>
            </CardHeader>
            <CardContent>
              {section.count === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Tidak ada data</p>
              ) : (
                <div className="border rounded-lg overflow-auto max-h-[40vh]">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs">#</th>
                        <th className="px-3 py-2 text-left text-xs">Nama</th>
                        <th className="px-3 py-2 text-left text-xs">NISN/NIP</th>
                        <th className="px-3 py-2 text-left text-xs">Kelas</th>
                        <th className="px-3 py-2 text-left text-xs">Role</th>
                        {!isBelumScan && <th className="px-3 py-2 text-left text-xs">Jam Datang</th>}
                        {!isBelumScan && <th className="px-3 py-2 text-left text-xs">Jam Pulang</th>}
                        {!isBelumScan && <th className="px-3 py-2 text-left text-xs">Status</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {section.list.map((item: any, i: number) => {
                        const user = isBelumScan ? item : item.user;
                        const roleLabel: Record<string, string> = { siswa: "Siswa", guru: "Guru", wali_kelas: "Wali Kelas" };
                        return (
                          <tr key={i} className="border-t" data-testid={`row-status-${expandedStatus}-${i}`}>
                            <td className="px-3 py-1.5 text-xs text-muted-foreground">{i + 1}</td>
                            <td className="px-3 py-1.5 text-xs font-medium">{user?.name || "-"}</td>
                            <td className="px-3 py-1.5 text-xs font-mono">{user?.identifier || "-"}</td>
                            <td className="px-3 py-1.5 text-xs">{user?.className || "-"}</td>
                            <td className="px-3 py-1.5 text-xs">
                              <Badge variant="outline" className="text-xs">{roleLabel[user?.role] || user?.role || "-"}</Badge>
                            </td>
                            {!isBelumScan && <td className="px-3 py-1.5 text-xs">{item.checkInTime || "-"}</td>}
                            {!isBelumScan && <td className="px-3 py-1.5 text-xs">{item.checkOutTime || "-"}</td>}
                            {!isBelumScan && <td className="px-3 py-1.5 text-xs">
                              <Badge variant="outline" className="text-xs">{item.status}</Badge>
                            </td>}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}

type ScanResult = {
  success: boolean;
  type?: "datang" | "pulang";
  name?: string;
  time?: string;
  className?: string;
  status?: string;
  message: string;
};

function playBeep(type: "success" | "error") {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "success") {
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.type = "square";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch {}
}

function ScanPopupAdmin({ result, onClose }: { result: ScanResult; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className={`rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center transform animate-in zoom-in-95 duration-300 ${
        result.success ? "bg-green-50 dark:bg-green-950 border-2 border-green-500" : "bg-red-50 dark:bg-red-950 border-2 border-red-500"
      }`}>
        <div className="flex justify-center mb-4">
          {result.success ? (
            <CheckCircle className="w-16 h-16 text-green-500" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500" />
          )}
        </div>
        <h3 className={`text-xl font-bold mb-2 ${result.success ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
          {result.success ? "Berhasil!" : "Gagal!"}
        </h3>
        {result.name && <p className="text-lg font-semibold text-foreground">{result.name}</p>}
        {result.className && <p className="text-sm text-muted-foreground">{result.className}</p>}
        {result.type && (
          <p className={`text-sm font-medium mt-1 ${result.success ? result.status === "telat" ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400" : ""}`}>
            {result.status === "telat" ? "Terlambat" : result.type === "datang" ? "Absen Datang" : "Absen Pulang"} - {result.time}
          </p>
        )}
        <p className="text-sm text-muted-foreground mt-2">{result.message}</p>
      </div>
    </div>
  );
}

function QRScannerComponent({ onScan, disabled }: { onScan: (code: string) => void; disabled: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          scanLoop();
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    }

    async function scanLoop() {
      if (!mounted || !videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationRef.current = requestAnimationFrame(scanLoop);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      if (!disabled && !scanningRef.current) {
        try {
          const { default: jsQR } = await import("jsqr");
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            scanningRef.current = true;
            onScan(code.data);
            setTimeout(() => { scanningRef.current = false; }, 3000);
          }
        } catch {}
      }
      animationRef.current = requestAnimationFrame(scanLoop);
    }

    startCamera();

    return () => {
      mounted = false;
      cancelAnimationFrame(animationRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [disabled, onScan]);

  return (
    <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden">
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 border-2 border-white/50 rounded-lg relative">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
        </div>
      </div>
      {disabled && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <p className="text-white/80 text-sm">Menunggu cooldown...</p>
        </div>
      )}
    </div>
  );
}

function ScannerTab() {
  const { toast } = useToast();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const { data: status, refetch } = useQuery<any>({
    queryKey: ["/api/scanner/status"],
    refetchInterval: 10000,
  });

  const togglePinMutation = useMutation({
    mutationFn: async (pinCode: string) => {
      const res = await apiRequest("POST", "/api/scanner/toggle-pin", { pin: pinCode });
      return res.json();
    },
    onSuccess: () => {
      setShowPinDialog(false);
      setPin("");
      setPinError("");
      refetch();
    },
    onError: () => {
      setPinError("PIN salah");
    },
  });

  const scanMutation = useMutation({
    mutationFn: async (qrCode: string) => {
      const res = await apiRequest("POST", "/api/scan", { qrCode });
      return res.json();
    },
    onSuccess: (data) => {
      playBeep("success");
      setScanResult({ ...data, success: true });
      setCooldown(true);
      setTimeout(() => setCooldown(false), 3000);
      refetch();
    },
    onError: (error: any) => {
      playBeep("error");
      let message = "Scan gagal";
      try {
        const parsed = JSON.parse(error.message.split(": ").slice(1).join(": "));
        message = parsed.message || message;
      } catch { message = error.message; }
      setScanResult({ success: false, message });
      setCooldown(true);
      setTimeout(() => setCooldown(false), 3000);
    },
  });

  const handleScan = useCallback((code: string) => {
    if (!cooldown && !scanMutation.isPending) {
      scanMutation.mutate(code);
    }
  }, [cooldown, scanMutation]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Scanner QR Code</h2>
      <Card className="overflow-hidden border-2 max-w-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              <span>Scanner QR Code</span>
            </div>
            <button
              onClick={() => { setShowPinDialog(true); setPin(""); setPinError(""); }}
              className="flex items-center gap-1 text-sm font-normal px-2 py-1 rounded-md hover:bg-muted transition-colors"
            >
              {status?.isLocked ? (
                <span className="flex items-center gap-1 text-destructive">
                  <Lock className="w-4 h-4" /> Terkunci
                </span>
              ) : (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Unlock className="w-4 h-4" /> Aktif
                </span>
              )}
              <KeyRound className="w-3 h-3 ml-1 text-muted-foreground" />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {status?.isLocked ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Lock className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Scanner Dikunci</p>
              <p className="text-sm">Klik tombol kunci di atas untuk membuka</p>
            </div>
          ) : status?.isHoliday ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <QrCode className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Hari Libur</p>
              <p className="text-sm">{status.holidayDescription}</p>
            </div>
          ) : status?.scanWindow === "closed" ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <QrCode className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Di Luar Jadwal Scan</p>
              <p className="text-sm">Waktu saat ini: {status?.currentTime}</p>
            </div>
          ) : (
            <div>
              <div className="mb-2 text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  status?.scanWindow === "checkin"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                }`}>
                  {status?.scanWindow === "checkin" ? "Absen Datang" : "Absen Pulang"}
                </span>
              </div>
              <QRScannerComponent onScan={handleScan} disabled={cooldown || scanMutation.isPending} />
              {cooldown && (
                <p className="text-center text-sm text-muted-foreground mt-2">Cooldown 3 detik...</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {scanResult && (
        <ScanPopupAdmin result={scanResult} onClose={() => setScanResult(null)} />
      )}

      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              {status?.isLocked ? "Buka Kunci Scanner" : "Kunci Scanner"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); togglePinMutation.mutate(pin); }} className="space-y-4">
            <div>
              <Label htmlFor="scanner-pin">Masukkan PIN</Label>
              <Input
                id="scanner-pin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => { setPin(e.target.value); setPinError(""); }}
                placeholder="****"
                className="text-center text-2xl tracking-widest"
                autoFocus
              />
            </div>
            {pinError && <p className="text-sm text-destructive text-center">{pinError}</p>}
            <Button type="submit" className="w-full" disabled={!pin || togglePinMutation.isPending}>
              {togglePinMutation.isPending ? "Memproses..." : status?.isLocked ? "Buka Kunci" : "Kunci Scanner"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const DAY_LABELS: Record<string, string> = {
  senin: "Senin", selasa: "Selasa", rabu: "Rabu", kamis: "Kamis", jumat: "Jumat", sabtu: "Sabtu", minggu: "Minggu"
};
const DAY_KEYS = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"];
const DAY_INDICES: Record<string, number> = { minggu: 0, senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, sabtu: 6 };

type DayScheduleType = { checkInStart: string; checkInEnd: string; checkOutStart: string; checkOutEnd: string; enabled: boolean };

function SettingsTab() {
  const { toast } = useToast();
  const { data: status } = useQuery<any>({ queryKey: ["/api/scanner/status"] });
  const { data: fullSettings } = useQuery<any>({ queryKey: ["/api/scanner/full-settings"] });
  const { data: holidays } = useQuery<any[]>({ queryKey: ["/api/holidays"] });
  const { data: googleDriveStatus } = useQuery<{ connected: boolean }>({ 
    queryKey: ["/api/google-drive/status"],
    refetchInterval: 30000 // Check every 30 seconds
  });

  const [settingsTab, setSettingsTab] = useState("scanner");

  const updateMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("PUT", "/api/scanner/settings", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scanner/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scanner/full-settings"] });
      toast({ title: "Pengaturan diperbarui" });
    },
  });

  const [lockPin, setLockPin] = useState("");
  const [lateThreshold, setLateThreshold] = useState("");
  const [fonnteToken, setFonnteToken] = useState("");
  const [fonnteTestPhone, setFonnteTestPhone] = useState("");
  const [fonnteTestLoading, setFonnteTestLoading] = useState(false);
  const [googleSheetId, setGoogleSheetId] = useState("");
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState("");
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  const [googleDriveLoading, setGoogleDriveLoading] = useState(false);
  const [csvUrlSiswa, setCsvUrlSiswa] = useState("");
  const [csvUrlGuru, setCsvUrlGuru] = useState("");
  const [csvUrlWaliKelas, setCsvUrlWaliKelas] = useState("");
  const [csvUrlRiwayatAbsensi, setCsvUrlRiwayatAbsensi] = useState("");
  const [importHistoryLoading, setImportHistoryLoading] = useState(false);
  const [autoSyncAbsensi, setAutoSyncAbsensi] = useState(() => localStorage.getItem("autoSyncAbsensi") === "true");
  const [syncAbsensiInterval, setSyncAbsensiInterval] = useState(() => parseInt(localStorage.getItem("syncAbsensiInterval") || "30"));
  const [syncAbsensiLoading, setSyncAbsensiLoading] = useState(false);
  const [lastSyncAbsensiTime, setLastSyncAbsensiTime] = useState<string | null>(null);
  const [sheetsWebhookUrl, setSheetsWebhookUrl] = useState("");
  const [webhookTestLoading, setWebhookTestLoading] = useState(false);
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  const [autoSyncFromUrl, setAutoSyncFromUrl] = useState(() => localStorage.getItem("autoSyncFromUrl") === "true");
  const [syncFromUrlInterval, setSyncFromUrlInterval] = useState(() => parseInt(localStorage.getItem("syncFromUrlInterval") || "60"));
  const [syncFromUrlLoading, setSyncFromUrlLoading] = useState(false);
  const [lastSyncFromUrlTime, setLastSyncFromUrlTime] = useState<string | null>(null);
  const [checkInStart, setCheckInStart] = useState("");
  const [checkInEnd, setCheckInEnd] = useState("");
  const [checkOutStart, setCheckOutStart] = useState("");
  const [checkOutEnd, setCheckOutEnd] = useState("");
  const [autoHolidayEnabled, setAutoHolidayEnabled] = useState(false);
  const [autoHolidayTime, setAutoHolidayTime] = useState("09:00");
  const [alphaNotifTime, setAlphaNotifTime] = useState("09:00");

  const defaultSchedule: DayScheduleType = {
    checkInStart: fullSettings?.checkInStart || "06:30",
    checkInEnd: fullSettings?.checkInEnd || "08:00",
    checkOutStart: fullSettings?.checkOutStart || "14:00",
    checkOutEnd: fullSettings?.checkOutEnd || "16:00",
    enabled: true,
  };

  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, DayScheduleType>>({});
  const [holidayDays, setHolidayDays] = useState<number[]>([]);

  useEffect(() => {
    if (fullSettings) {
      try {
        setWeeklySchedule(fullSettings.weeklySchedule ? JSON.parse(fullSettings.weeklySchedule) : {});
      } catch { setWeeklySchedule({}); }
      const days = (fullSettings.defaultHolidayDays || "0,6").split(",").map((d: string) => parseInt(d.trim()));
      setHolidayDays(days);
      setFonnteToken(fullSettings.fonnteToken || "");
      setGoogleSheetId(fullSettings.googleSheetId || "");
      setGoogleDriveFolderId(fullSettings.googleDriveFolderId || "");
      setCsvUrlSiswa(fullSettings.csvUrlSiswa || "");
      setCsvUrlGuru(fullSettings.csvUrlGuru || "");
      setCsvUrlWaliKelas(fullSettings.csvUrlWaliKelas || "");
      setCsvUrlRiwayatAbsensi(fullSettings.csvUrlRiwayatAbsensi || "");
      setSheetsWebhookUrl(fullSettings.sheetsWebhookUrl || "");
      setAutoHolidayEnabled(fullSettings.autoHolidayEnabled || false);
      setAutoHolidayTime(fullSettings.autoHolidayTime || "09:00");
      setAlphaNotifTime(fullSettings.alphaNotifTime || "09:00");
    }
  }, [fullSettings]);

  // Update Google Drive connection status
  useEffect(() => {
    if (googleDriveStatus) {
      setGoogleDriveConnected(googleDriveStatus.connected);
    }
  }, [googleDriveStatus]);

  // Handle Google Drive OAuth
  const handleConnectGoogleDrive = async () => {
    setGoogleDriveLoading(true);
    try {
      const res = await fetch("/api/google-drive/auth-url", { credentials: "include" });
      const data = await res.json();
      if (data.authUrl) {
        window.open(data.authUrl, "_blank", "width=500,height=600");
        toast({ title: "Buka jendela popup untuk login Google" });
      }
    } catch (error) {
      toast({ title: "Gagal mendapatkan auth URL", variant: "destructive" });
    } finally {
      setGoogleDriveLoading(false);
    }
  };

  // Handle OAuth callback (for popup communication)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'google-drive-oauth-callback') {
        const { code } = event.data;
        if (code) {
          handleOAuthCallback(code);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Handle OAuth callback from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isConnected = urlParams.get('google_drive_connected');
    const hasError = urlParams.get('google_drive_error');
    
    if (isConnected === 'true') {
      toast({ title: "Google Drive berhasil terhubung!" });
      queryClient.invalidateQueries({ queryKey: ["/api/google-drive/status"] });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (hasError === 'true') {
      toast({ title: "Gagal menghubungkan Google Drive", variant: "destructive" });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    setGoogleDriveLoading(true);
    try {
      const res = await fetch("/api/google-drive/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        credentials: "include"
      });
      
      if (res.ok) {
        toast({ title: "Google Drive berhasil terhubung!" });
        queryClient.invalidateQueries({ queryKey: ["/api/google-drive/status"] });
      } else {
        const error = await res.text();
        toast({ title: "Gagal menghubungkan Google Drive", description: error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Gagal menghubungkan Google Drive", variant: "destructive" });
    } finally {
      setGoogleDriveLoading(false);
    }
  };

  const getDay = (day: string): DayScheduleType => weeklySchedule[day] || { ...defaultSchedule };
  const setDay = (day: string, field: string, value: any) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: { ...getDay(day), [field]: value }
    }));
  };

  const toggleHolidayDay = (dayIndex: number) => {
    setHolidayDays(prev => prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]);
  };

  const handleSaveGeneral = () => {
    updateMutation.mutate({
      checkInStart: checkInStart || undefined,
      checkInEnd: checkInEnd || undefined,
      checkOutStart: checkOutStart || undefined,
      checkOutEnd: checkOutEnd || undefined,
      lockPin: lockPin || undefined,
      lateThreshold: lateThreshold || undefined,
    });
  };

  const handleSaveWeekly = () => {
    updateMutation.mutate({ weeklySchedule: JSON.stringify(weeklySchedule) });
  };

  const handleSaveHolidayDays = () => {
    updateMutation.mutate({ defaultHolidayDays: holidayDays.join(",") });
  };

  const handleSaveFonnte = () => {
    updateMutation.mutate({ fonnteToken: fonnteToken });
  };

  const handleSaveGoogle = () => {
    updateMutation.mutate({ googleSheetId, googleDriveFolderId, sheetsWebhookUrl });
  };

  const handleTestWebhook = async () => {
    setWebhookTestLoading(true);
    try {
      const res = await fetch("/api/admin/test-sheets-webhook", { method: "POST" });
      const data = await res.json();
      toast({
        title: data.ok ? "Webhook berhasil!" : "Webhook gagal",
        description: data.message,
        variant: data.ok ? "default" : "destructive",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setWebhookTestLoading(false);
    }
  };

  const handleSaveCsvUrls = () => {
    updateMutation.mutate({ csvUrlSiswa, csvUrlGuru, csvUrlWaliKelas, csvUrlRiwayatAbsensi });
  };

  const handleImportAttendanceHistory = async () => {
    setImportHistoryLoading(true);
    try {
      const res = await fetch("/api/admin/import-attendance-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvUrl: csvUrlRiwayatAbsensi }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Gagal import", description: data.message, variant: "destructive" });
      } else {
        toast({
          title: `Import selesai: ${data.imported} record diimport`,
          description: `${data.skipped} baris dilewati dari ${data.total} total.${data.errors?.length ? " Error: " + data.errors[0] : ""}`,
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setImportHistoryLoading(false);
    }
  };

  const handleSyncAbsensiFromSheet = async () => {
    setSyncAbsensiLoading(true);
    try {
      const res = await fetch("/api/admin/import-attendance-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/attendance"] });
      const now = new Date().toLocaleTimeString("id-ID");
      setLastSyncAbsensiTime(now);
      if (!res.ok) {
        toast({ title: "Gagal sinkronisasi", description: data.message, variant: "destructive" });
      } else {
        const parts = [];
        if (data.imported > 0) parts.push(`${data.imported} record diimport`);
        if (data.skipped > 0) parts.push(`${data.skipped} dilewati`);
        toast({
          title: "Sinkronisasi absensi selesai",
          description: parts.length ? parts.join(", ") : "Tidak ada data baru",
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSyncAbsensiLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem("autoSyncAbsensi", autoSyncAbsensi.toString());
    localStorage.setItem("syncAbsensiInterval", syncAbsensiInterval.toString());
    if (!autoSyncAbsensi) return;
    handleSyncAbsensiFromSheet();
    const interval = setInterval(handleSyncAbsensiFromSheet, syncAbsensiInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoSyncAbsensi, syncAbsensiInterval]);

  const handleSyncFromUrls = async () => {
    setSyncFromUrlLoading(true);
    try {
      const res = await apiRequest("POST", "/api/admin/sync-from-urls");
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      const now = new Date().toLocaleTimeString("id-ID");
      setLastSyncFromUrlTime(now);
      const parts = [];
      if (data.added > 0) parts.push(`${data.added} ditambahkan`);
      if (data.updated > 0) parts.push(`${data.updated} diperbarui`);
      if (data.unchanged > 0) parts.push(`${data.unchanged} tidak berubah`);
      toast({
        title: "Sinkronisasi selesai",
        description: (parts.length ? parts.join(", ") : "Tidak ada perubahan") + (data.errors?.length ? ` — ${data.errors.slice(0, 2).join("; ")}` : ""),
      });
    } catch (err: any) {
      toast({ title: "Gagal sinkronisasi", description: err.message, variant: "destructive" });
    } finally {
      setSyncFromUrlLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem("autoSyncFromUrl", autoSyncFromUrl.toString());
    localStorage.setItem("syncFromUrlInterval", syncFromUrlInterval.toString());
    if (!autoSyncFromUrl) return;
    handleSyncFromUrls();
    const interval = setInterval(handleSyncFromUrls, syncFromUrlInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoSyncFromUrl, syncFromUrlInterval]);

  const [alphaTriggerLoading, setAlphaTriggerLoading] = useState(false);

  const handleTestFonnte = async () => {
    if (!fonnteTestPhone) {
      toast({ title: "Isi nomor HP tujuan", variant: "destructive" });
      return;
    }
    setFonnteTestLoading(true);
    try {
      const res = await apiRequest("POST", "/api/fonnte/test", { phone: fonnteTestPhone });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Berhasil!", description: data.message });
      } else {
        toast({ title: "Gagal kirim", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Gagal koneksi ke server", variant: "destructive" });
    } finally {
      setFonnteTestLoading(false);
    }
  };

  const handleTriggerAlpha = async () => {
    setAlphaTriggerLoading(true);
    try {
      const res = await apiRequest("POST", "/api/fonnte/trigger-alpha", {});
      const data = await res.json();
      toast({ title: data.success ? "Berhasil" : "Gagal", description: data.message, variant: data.success ? "default" : "destructive" });
    } catch {
      toast({ title: "Gagal menjalankan pengecekan alpha", variant: "destructive" });
    } finally {
      setAlphaTriggerLoading(false);
    }
  };

  const [holidayDate, setHolidayDate] = useState("");
  const [holidayDesc, setHolidayDesc] = useState("");

  const addHolidayMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("POST", "/api/holidays", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      setHolidayDate(""); setHolidayDesc("");
      toast({ title: "Hari libur ditambahkan" });
    },
  });
  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/holidays/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      toast({ title: "Hari libur dihapus" });
    },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Setelan</h2>
      <Tabs value={settingsTab} onValueChange={setSettingsTab}>
        <div className="overflow-x-auto -mx-1 px-1 mb-4">
          <TabsList className="w-max">
            <TabsTrigger value="tampilan" data-testid="settings-tab-tampilan" className="text-xs sm:text-sm">Tampilan</TabsTrigger>
            <TabsTrigger value="scanner" data-testid="settings-tab-scanner" className="text-xs sm:text-sm">Scanner & PIN</TabsTrigger>
            <TabsTrigger value="schedule" data-testid="settings-tab-schedule" className="text-xs sm:text-sm">Jadwal</TabsTrigger>
            <TabsTrigger value="holidays" data-testid="settings-tab-holidays" className="text-xs sm:text-sm">Hari Libur</TabsTrigger>
            <TabsTrigger value="google" data-testid="settings-tab-google" className="text-xs sm:text-sm">Google</TabsTrigger>
            <TabsTrigger value="fonnte" data-testid="settings-tab-fonnte" className="text-xs sm:text-sm">Fonnte</TabsTrigger>
            <TabsTrigger value="password" data-testid="settings-tab-password" className="text-xs sm:text-sm">Password</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tampilan">
          <BrandingTab />
        </TabsContent>

        <TabsContent value="scanner">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Status Scanner</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Scanner saat ini:</span>
                  <Badge variant={status?.isLocked ? "destructive" : "default"} data-testid="badge-scanner-status">
                    {status?.isLocked ? "Terkunci" : "Aktif"}
                  </Badge>
                </div>
                <Button
                  onClick={() => updateMutation.mutate({ isLocked: !status?.isLocked })}
                  variant={status?.isLocked ? "default" : "destructive"}
                  className="w-full"
                  data-testid="button-toggle-lock"
                >
                  {status?.isLocked ? <><Unlock className="w-4 h-4 mr-2" />Buka Kunci Scanner</> : <><Lock className="w-4 h-4 mr-2" />Kunci Scanner</>}
                </Button>
                <div>
                  <Label>PIN Kunci Scanner</Label>
                  <Input type="text" inputMode="numeric" maxLength={6} value={lockPin} onChange={e => setLockPin(e.target.value)} placeholder="PIN saat ini: ****" data-testid="input-lock-pin" />
                  <p className="text-xs text-muted-foreground mt-1">PIN digunakan untuk kunci/buka scanner dari halaman utama</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Jadwal Default</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Jadwal default digunakan jika hari tidak diatur secara khusus</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Check-in Mulai</Label>
                    <Input type="time" value={checkInStart || fullSettings?.checkInStart || ""} onChange={e => setCheckInStart(e.target.value)} data-testid="input-checkin-start" />
                  </div>
                  <div>
                    <Label>Check-in Selesai</Label>
                    <Input type="time" value={checkInEnd || fullSettings?.checkInEnd || ""} onChange={e => setCheckInEnd(e.target.value)} data-testid="input-checkin-end" />
                  </div>
                  <div>
                    <Label>Check-out Mulai</Label>
                    <Input type="time" value={checkOutStart || fullSettings?.checkOutStart || ""} onChange={e => setCheckOutStart(e.target.value)} data-testid="input-checkout-start" />
                  </div>
                  <div>
                    <Label>Check-out Selesai</Label>
                    <Input type="time" value={checkOutEnd || fullSettings?.checkOutEnd || ""} onChange={e => setCheckOutEnd(e.target.value)} data-testid="input-checkout-end" />
                  </div>
                </div>
                <div>
                  <Label>Batas Waktu Telat</Label>
                  <Input type="time" value={lateThreshold || fullSettings?.lateThreshold || ""} onChange={e => setLateThreshold(e.target.value)} data-testid="input-late-threshold" />
                  <p className="text-xs text-muted-foreground mt-1">Check-in setelah waktu ini dianggap terlambat</p>
                </div>
                <Button onClick={handleSaveGeneral} className="w-full" disabled={updateMutation.isPending} data-testid="button-save-general">Simpan Pengaturan</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Jadwal Scan Per Hari</CardTitle>
              <p className="text-sm text-muted-foreground">Atur jadwal scan untuk setiap hari. Kosongkan untuk menggunakan jadwal default.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DAY_KEYS.map(day => {
                  const schedule = getDay(day);
                  const isHoliday = holidayDays.includes(DAY_INDICES[day]);
                  return (
                    <div key={day} className={`border rounded-lg p-3 ${isHoliday ? "opacity-50" : ""}`} data-testid={`schedule-${day}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={schedule.enabled && !isHoliday}
                              onChange={e => setDay(day, "enabled", e.target.checked)}
                              disabled={isHoliday}
                              className="w-4 h-4"
                              data-testid={`checkbox-${day}-enabled`}
                            />
                            <span className="font-medium">{DAY_LABELS[day]}</span>
                          </label>
                          {isHoliday && <Badge variant="outline" className="text-xs">Libur Default</Badge>}
                        </div>
                        {!schedule.enabled && !isHoliday && <Badge variant="secondary" className="text-xs">Nonaktif</Badge>}
                      </div>
                      {schedule.enabled && !isHoliday && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <Label className="text-xs">Masuk Mulai</Label>
                            <Input type="time" value={schedule.checkInStart} onChange={e => setDay(day, "checkInStart", e.target.value)} className="h-8 text-xs" data-testid={`input-${day}-checkin-start`} />
                          </div>
                          <div>
                            <Label className="text-xs">Masuk Selesai</Label>
                            <Input type="time" value={schedule.checkInEnd} onChange={e => setDay(day, "checkInEnd", e.target.value)} className="h-8 text-xs" data-testid={`input-${day}-checkin-end`} />
                          </div>
                          <div>
                            <Label className="text-xs">Pulang Mulai</Label>
                            <Input type="time" value={schedule.checkOutStart} onChange={e => setDay(day, "checkOutStart", e.target.value)} className="h-8 text-xs" data-testid={`input-${day}-checkout-start`} />
                          </div>
                          <div>
                            <Label className="text-xs">Pulang Selesai</Label>
                            <Input type="time" value={schedule.checkOutEnd} onChange={e => setDay(day, "checkOutEnd", e.target.value)} className="h-8 text-xs" data-testid={`input-${day}-checkout-end`} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <Button onClick={handleSaveWeekly} className="w-full mt-4" disabled={updateMutation.isPending} data-testid="button-save-weekly">Simpan Jadwal Mingguan</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holidays">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Hari Libur Default (Mingguan)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Pilih hari yang selalu dianggap libur setiap minggu</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { index: 1, label: "Senin" }, { index: 2, label: "Selasa" }, { index: 3, label: "Rabu" },
                    { index: 4, label: "Kamis" }, { index: 5, label: "Jumat" }, { index: 6, label: "Sabtu" },
                    { index: 0, label: "Minggu" },
                  ].map(d => (
                    <label key={d.index} className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${holidayDays.includes(d.index) ? "bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-800" : "hover:bg-muted"}`} data-testid={`toggle-holiday-${d.index}`}>
                      <input type="checkbox" checked={holidayDays.includes(d.index)} onChange={() => toggleHolidayDay(d.index)} className="w-4 h-4" />
                      <span className={holidayDays.includes(d.index) ? "text-red-600 font-medium dark:text-red-400" : ""}>{d.label}</span>
                    </label>
                  ))}
                </div>
                <Button onClick={handleSaveHolidayDays} className="w-full" disabled={updateMutation.isPending} data-testid="button-save-holiday-days">Simpan Hari Libur Default</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Hari Libur Khusus</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Tambahkan tanggal libur tertentu (hari nasional, kegiatan sekolah, dll)</p>
                <div className="flex gap-2">
                  <Input type="date" value={holidayDate} onChange={e => setHolidayDate(e.target.value)} data-testid="input-holiday-date" />
                  <Input placeholder="Keterangan" value={holidayDesc} onChange={e => setHolidayDesc(e.target.value)} data-testid="input-holiday-desc" />
                  <Button onClick={() => addHolidayMutation.mutate({ date: holidayDate, description: holidayDesc })} disabled={!holidayDate || !holidayDesc} data-testid="button-add-holiday">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-auto">
                  {holidays?.map((h: any) => (
                    <div key={h.id} className="flex items-center justify-between p-2 border rounded-lg" data-testid={`row-holiday-${h.id}`}>
                      <div>
                        <span className="font-medium text-sm">{h.date}</span>
                        <span className="text-muted-foreground text-sm ml-2">{h.description}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="text-destructive h-7" onClick={() => deleteHolidayMutation.mutate(h.id)} data-testid={`button-delete-holiday-${h.id}`}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {(!holidays || holidays.length === 0) && <p className="text-muted-foreground text-center py-4 text-sm">Belum ada hari libur khusus</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader><CardTitle>Libur Otomatis</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Jika diaktifkan, sistem otomatis menandai hari ini sebagai libur jika sampai jam yang ditentukan tidak ada satu pun yang absen.
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer" data-testid="toggle-auto-holiday">
                    <input type="checkbox" checked={autoHolidayEnabled} onChange={e => setAutoHolidayEnabled(e.target.checked)} className="w-4 h-4" />
                    <span className="font-medium text-sm">Aktifkan Libur Otomatis</span>
                  </label>
                  {autoHolidayEnabled && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Cek pada jam:</Label>
                      <Input type="time" value={autoHolidayTime} onChange={e => setAutoHolidayTime(e.target.value)} className="w-[120px]" data-testid="input-auto-holiday-time" />
                    </div>
                  )}
                </div>
                <Button onClick={() => updateMutation.mutate({ autoHolidayEnabled, autoHolidayTime })} className="w-full" disabled={updateMutation.isPending} data-testid="button-save-auto-holiday">
                  Simpan Pengaturan Libur Otomatis
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Notifikasi Alpha (WA)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sistem otomatis mengirim WhatsApp ke orang tua siswa yang tidak hadir (alpha) setelah jam yang ditentukan. Notifikasi dikirim 1x per hari.
                </p>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Kirim WA alpha jam:</Label>
                  <Input type="time" value={alphaNotifTime} onChange={e => setAlphaNotifTime(e.target.value)} className="w-[120px]" data-testid="input-alpha-notif-time" />
                </div>
                <Button onClick={() => updateMutation.mutate({ alphaNotifTime })} className="w-full" disabled={updateMutation.isPending} data-testid="button-save-alpha-notif">
                  Simpan Pengaturan Notifikasi Alpha
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="google">
          <Card>
            <CardHeader><CardTitle>Pengaturan Google Sheet & Drive</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Konfigurasi ID Google Sheet untuk sinkronisasi data absensi dan import user, serta ID Folder Google Drive untuk upload bukti izin/sakit.
              </p>
              <div>
                <Label>Google Sheet ID</Label>
                <Input
                  placeholder="1LgFgRFsgM_Rggu0ZegFBtHBIeh5gkVSnQ-rudSb_MvY"
                  value={googleSheetId}
                  onChange={e => setGoogleSheetId(e.target.value)}
                  data-testid="input-google-sheet-id"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ID spreadsheet dari URL: docs.google.com/spreadsheets/d/<span className="font-mono text-primary">ID_DISINI</span>/edit
                </p>
              </div>
              <div>
                <Label>Google Drive Folder ID</Label>
                <Input
                  placeholder="11vJgEVtglUa50h9P1hZcVf0ceqeVq5tJ"
                  value={googleDriveFolderId}
                  onChange={e => setGoogleDriveFolderId(e.target.value)}
                  data-testid="input-google-drive-folder-id"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ID folder dari URL: drive.google.com/drive/folders/<span className="font-mono text-primary">ID_DISINI</span>
                </p>
              </div>
              
              {/* Google Drive OAuth2 Authentication */}
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label className="text-base font-medium">Google Drive Authentication</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hubungkan Google Drive untuk upload gambar izin siswa secara otomatis
                    </p>
                  </div>
                  <Badge variant={googleDriveConnected ? "default" : "outline"} className="text-xs">
                    {googleDriveConnected ? "Terhubung" : "Belum terhubung"}
                  </Badge>
                </div>
                
                {!googleDriveConnected ? (
                  <div className="space-y-3">
                    <Button 
                      onClick={handleConnectGoogleDrive} 
                      disabled={googleDriveLoading}
                      className="w-full"
                      data-testid="button-connect-google-drive"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {googleDriveLoading ? "Menghubungkan..." : "Hubungkan Google Drive"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Klik tombol di atas untuk login dengan Google dan berikan akses ke Google Drive
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Google Drive terhubung
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-300">
                          Upload gambar izin siswa akan otomatis tersimpan di Google Drive
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleConnectGoogleDrive} 
                      disabled={googleDriveLoading}
                      variant="outline"
                      size="sm"
                      data-testid="button-reconnect-google-drive"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {googleDriveLoading ? "Menghubungkan ulang..." : "Hubungkan ulang"}
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between mb-1">
                  <Label>URL Webhook Google Apps Script</Label>
                  <Badge variant={sheetsWebhookUrl ? "default" : "outline"} className="text-xs" data-testid="badge-webhook-status">
                    {sheetsWebhookUrl ? "Aktif" : "Belum diset"}
                  </Badge>
                </div>
                <Input
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={sheetsWebhookUrl}
                  onChange={e => setSheetsWebhookUrl(e.target.value)}
                  data-testid="input-sheets-webhook-url"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL ini didapat setelah deploy Apps Script di Google Sheet. Data absensi akan otomatis dikirim ke sheet ini setiap scan.
                </p>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowScriptDialog(true)}
                    data-testid="button-show-script"
                    className="flex-1"
                  >
                    Lihat Kode Script
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestWebhook}
                    disabled={!sheetsWebhookUrl || webhookTestLoading}
                    data-testid="button-test-webhook"
                    className="flex-1"
                  >
                    {webhookTestLoading ? "Menguji..." : "Test Webhook"}
                  </Button>
                </div>
              </div>
              <Button onClick={handleSaveGoogle} className="w-full" disabled={updateMutation.isPending} data-testid="button-save-google">
                Simpan Pengaturan Google
              </Button>
              <div className="pt-3 border-t space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Status Konfigurasi:</p>
                <div className="flex gap-2">
                  <Badge variant={googleSheetId ? "default" : "outline"} data-testid="badge-sheet-status">
                    Sheet: {googleSheetId ? "Terpasang" : "Default"}
                  </Badge>
                  <Badge variant={googleDriveFolderId ? "default" : "outline"} data-testid="badge-drive-status">
                    Drive: {googleDriveFolderId ? "Terpasang" : "Default"}
                  </Badge>
                </div>
                {googleSheetId && (
                  <a href={`https://docs.google.com/spreadsheets/d/${googleSheetId}/edit`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline block" data-testid="link-open-sheet">
                    Buka Google Sheet
                  </a>
                )}
                {googleDriveFolderId && (
                  <a href={`https://drive.google.com/drive/folders/${googleDriveFolderId}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline block" data-testid="link-open-drive">
                    Buka Google Drive Folder
                  </a>
                )}
              </div>
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                <p className="font-medium">Format sheet untuk import user:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li><strong>Tab "Siswa"</strong>: Nama, NISN, Kelas, No HP Ortu, Nama Ortu</li>
                  <li><strong>Tab "Guru"</strong>: Nama, PegId, No WA</li>
                  <li><strong>Tab "Wali Kelas"</strong>: Nama, PegId, Kelas, No WA</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Auto Sinkronisasi dari URL CSV</CardTitle>
              <p className="text-sm text-muted-foreground">
                Simpan URL CSV publik masing-masing sheet. Data user akan otomatis disinkronisasi secara berkala — user baru ditambahkan, data lama diperbarui.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>URL CSV Siswa</Label>
                <Input
                  placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&output=csv"
                  value={csvUrlSiswa}
                  onChange={e => setCsvUrlSiswa(e.target.value)}
                  data-testid="input-csv-url-siswa"
                />
                <p className="text-xs text-muted-foreground mt-1">Kolom: NISN, Nama, Kelas, No HP Orang Tua, Nama Orang Tua</p>
              </div>
              <div>
                <Label>URL CSV Guru</Label>
                <Input
                  placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&output=csv"
                  value={csvUrlGuru}
                  onChange={e => setCsvUrlGuru(e.target.value)}
                  data-testid="input-csv-url-guru"
                />
                <p className="text-xs text-muted-foreground mt-1">Kolom: PegId, Nama, No WA</p>
              </div>
              <div>
                <Label>URL CSV Wali Kelas</Label>
                <Input
                  placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&output=csv"
                  value={csvUrlWaliKelas}
                  onChange={e => setCsvUrlWaliKelas(e.target.value)}
                  data-testid="input-csv-url-wali-kelas"
                />
                <p className="text-xs text-muted-foreground mt-1">Kolom: PegId, Nama, Kelas, No WA</p>
              </div>
              <div>
                <Label>URL CSV Riwayat Absensi</Label>
                <Input
                  placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&output=csv"
                  value={csvUrlRiwayatAbsensi}
                  onChange={e => setCsvUrlRiwayatAbsensi(e.target.value)}
                  data-testid="input-csv-url-riwayat-absensi"
                />
                <p className="text-xs text-muted-foreground mt-1">Kolom: Tanggal, Nama, NISN/PegId, Kelas, Jam Datang, Jam Pulang, Status</p>
              </div>
              <Button onClick={handleSaveCsvUrls} disabled={updateMutation.isPending} variant="outline" className="w-full" data-testid="button-save-csv-urls">
                Simpan URL CSV
              </Button>
              {csvUrlRiwayatAbsensi && (
                <>
                  <Button
                    onClick={handleImportAttendanceHistory}
                    disabled={importHistoryLoading}
                    variant="outline"
                    className="w-full"
                    data-testid="button-import-history"
                  >
                    {importHistoryLoading ? "Mengimport..." : "Import Riwayat Absensi"}
                  </Button>
                  <div className="pt-3 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Auto-Sinkronisasi Absensi</p>
                        <p className="text-xs text-muted-foreground">
                          {autoSyncAbsensi ? `Aktif — setiap ${syncAbsensiInterval} menit${lastSyncAbsensiTime ? ` • terakhir: ${lastSyncAbsensiTime}` : ""}` : "Sinkronkan absensi dari sheet secara otomatis"}
                        </p>
                      </div>
                      <Switch
                        checked={autoSyncAbsensi}
                        onCheckedChange={setAutoSyncAbsensi}
                        data-testid="switch-auto-sync-absensi"
                      />
                    </div>
                    {autoSyncAbsensi && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">Interval (menit):</Label>
                        <select
                          className="text-xs border rounded px-2 py-1 bg-background"
                          value={syncAbsensiInterval}
                          onChange={e => setSyncAbsensiInterval(parseInt(e.target.value))}
                          data-testid="select-sync-absensi-interval"
                        >
                          {[5, 10, 15, 30, 60, 120].map(m => (
                            <option key={m} value={m}>{m} menit</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <Button
                      onClick={handleSyncAbsensiFromSheet}
                      disabled={syncAbsensiLoading}
                      className="w-full"
                      data-testid="button-sync-absensi-now"
                    >
                      {syncAbsensiLoading ? "Menyinkronkan..." : "Sinkronkan Absensi Sekarang"}
                    </Button>
                  </div>
                </>
              )}

              <div className="pt-3 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Sinkronisasi Otomatis</p>
                    <p className="text-xs text-muted-foreground">
                      {autoSyncFromUrl ? `Aktif — setiap ${syncFromUrlInterval} menit${lastSyncFromUrlTime ? ` • terakhir: ${lastSyncFromUrlTime}` : ""}` : "Nonaktif"}
                    </p>
                  </div>
                  <Switch
                    checked={autoSyncFromUrl}
                    onCheckedChange={setAutoSyncFromUrl}
                    disabled={!csvUrlSiswa && !csvUrlGuru && !csvUrlWaliKelas}
                    data-testid="switch-auto-sync-url"
                  />
                </div>
                {autoSyncFromUrl && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs whitespace-nowrap">Interval (menit):</Label>
                    <select
                      className="text-xs border rounded px-2 py-1 bg-background"
                      value={syncFromUrlInterval}
                      onChange={e => setSyncFromUrlInterval(parseInt(e.target.value))}
                      data-testid="select-sync-interval"
                    >
                      {[15, 30, 60, 120, 240, 480].map(m => (
                        <option key={m} value={m}>{m} menit</option>
                      ))}
                    </select>
                  </div>
                )}
                <Button
                  onClick={handleSyncFromUrls}
                  disabled={syncFromUrlLoading || (!csvUrlSiswa && !csvUrlGuru && !csvUrlWaliKelas)}
                  className="w-full"
                  data-testid="button-sync-now"
                >
                  {syncFromUrlLoading ? "Menyinkronkan..." : "Sinkronkan Sekarang"}
                </Button>
                {!csvUrlSiswa && !csvUrlGuru && !csvUrlWaliKelas && (
                  <p className="text-xs text-muted-foreground text-center">Simpan minimal satu URL CSV terlebih dahulu</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fonnte">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Token API Fonnte</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Token API dari akun Fonnte Anda untuk mengirim notifikasi WhatsApp otomatis ke orang tua dan wali kelas.
                  Dapatkan token di <a href="https://fonnte.com" target="_blank" rel="noopener noreferrer" className="underline text-primary">fonnte.com</a>
                </p>
                <div>
                  <Label>Token API</Label>
                  <Input
                    type="password"
                    placeholder="Masukkan token Fonnte..."
                    value={fonnteToken}
                    onChange={e => setFonnteToken(e.target.value)}
                    data-testid="input-fonnte-token"
                  />
                </div>
                <Button onClick={handleSaveFonnte} className="w-full" disabled={updateMutation.isPending} data-testid="button-save-fonnte">
                  Simpan Token
                </Button>
                <div className="pt-2 border-t">
                  <Badge variant={fonnteToken ? "default" : "destructive"} data-testid="badge-fonnte-status">
                    {fonnteToken ? "Token Terpasang" : "Belum Dikonfigurasi"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Tes Kirim WhatsApp</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Kirim pesan tes untuk memastikan koneksi Fonnte berfungsi dengan benar.
                </p>
                <div>
                  <Label>Nomor HP Tujuan</Label>
                  <Input
                    placeholder="08xxxxxxxxxx"
                    value={fonnteTestPhone}
                    onChange={e => setFonnteTestPhone(e.target.value)}
                    data-testid="input-fonnte-test-phone"
                  />
                </div>
                <Button onClick={handleTestFonnte} variant="outline" className="w-full" disabled={fonnteTestLoading || !fonnteToken} data-testid="button-test-fonnte">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {fonnteTestLoading ? "Mengirim..." : "Kirim Pesan Tes"}
                </Button>
                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                  <p className="font-medium">Notifikasi WA dikirim saat:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Siswa scan QR (check-in/check-out) → ke orang tua</li>
                    <li>Admin input absen manual → ke orang tua</li>
                    <li>Siswa ajukan izin/sakit → ke wali kelas</li>
                    <li>Siswa tidak hadir hingga jam notif alpha → ke orang tua</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifikasi Alpha Manual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Paksa jalankan pengecekan siswa alpha sekarang (tanpa menunggu jam notifikasi). Berguna untuk uji coba atau kirim ulang jika gagal terkirim tadi.
                </p>
                <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg text-xs text-amber-700 dark:text-amber-300 space-y-1">
                  <p className="font-medium">Syarat agar notif alpha terkirim:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Token Fonnte sudah diisi & aktif</li>
                    <li>Nomor HP orang tua siswa sudah diisi di data siswa</li>
                    <li>Hari ini bukan hari libur</li>
                    <li>Jam notifikasi alpha sudah terlewat (default: 09:00)</li>
                    <li>Siswa belum scan QR dan bukan izin/sakit</li>
                  </ul>
                </div>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleTriggerAlpha}
                  disabled={alphaTriggerLoading}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {alphaTriggerLoading ? "Memproses..." : "Kirim Ulang Notif Alpha Hari Ini"}
                </Button>
              </CardContent>
            </Card>
          </div>

        </TabsContent>

        <TabsContent value="password">
          <ChangePasswordForm />
        </TabsContent>
      </Tabs>

      <Dialog open={showScriptDialog} onOpenChange={setShowScriptDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cara Pasang Google Apps Script</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <ol className="list-decimal pl-4 space-y-2 text-muted-foreground">
              <li>Buka Google Sheet absensi siswa di browser</li>
              <li>Klik menu <strong>Extensions</strong> → <strong>Apps Script</strong></li>
              <li>Hapus kode yang ada, lalu paste kode di bawah ini</li>
              <li>Klik tombol <strong>Save</strong> (ikon disket)</li>
              <li>Klik <strong>Deploy</strong> → <strong>New deployment</strong></li>
              <li>Pilih type: <strong>Web app</strong></li>
              <li>Execute as: <strong>Me</strong>, Who has access: <strong>Anyone</strong></li>
              <li>Klik <strong>Deploy</strong> → izinkan akses → salin URL yang muncul</li>
              <li>Paste URL tersebut di kolom "URL Webhook Google Apps Script" lalu klik Simpan</li>
            </ol>
            <div className="relative">
              <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all select-all border" data-testid="pre-script-code">{`// Google Sheets: Extensions → Apps Script → Code.gs
// Setelah paste, klik Deploy → New deployment → Web App → Anyone → Deploy
// Salin URL deployment dan paste di pengaturan aplikasi

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Sheet1") || ss.getSheets()[0];
    if (data.action === "ping") return ok("pong");
    if (data.action === "init_headers") {
      if (sheet.getLastRow() === 0) sheet.appendRow(["Tanggal","Nama","NISN/PegId","Kelas","Jam Datang","Jam Pulang","Status","Role"]);
      return ok("headers initialized");
    }
    if (data.action === "append") {
      sheet.appendRow([data.tanggal,data.nama,data.nisnNip,data.kelas,data.jamDatang,data.jamPulang,data.status,data.role]);
      return ok("appended");
    }
    if (data.action === "update") {
      var values = sheet.getDataRange().getValues();
      for (var i = values.length - 1; i >= 1; i--) {
        if (String(values[i][0]) === String(data.tanggal) && String(values[i][2]) === String(data.nisnNip)) {
          sheet.getRange(i+1,6).setValue(data.jamPulang);
          sheet.getRange(i+1,7).setValue(data.status);
          return ok("updated");
        }
      }
      return ok("not found");
    }
    if (data.action === "clear") {
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
      return ok("cleared");
    }
    return ok("unknown action");
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({success:false,error:err.message})).setMimeType(ContentService.MimeType.JSON);
  }
}
function ok(msg) {
  return ContentService.createTextOutput(JSON.stringify({success:true,message:msg})).setMimeType(ContentService.MimeType.JSON);
}`}</pre>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                const el = document.querySelector('[data-testid="pre-script-code"]');
                navigator.clipboard.writeText(el?.textContent || "").then(() =>
                  toast({ title: "Kode disalin!", description: "Paste di Google Apps Script editor" })
                );
              }}
              data-testid="button-copy-script"
            >
              Salin Kode Script
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BrandingTab() {
  const { toast } = useToast();
  const { data: fullSettings } = useQuery<any>({ queryKey: ["/api/scanner/full-settings"] });
  const branding = useBranding();

  const [schoolName, setSchoolName] = useState("");
  const [schoolSubtitle, setSchoolSubtitle] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (fullSettings) {
      setSchoolName(fullSettings.schoolName || "MTs Al Fatah Talun");
      setSchoolSubtitle(fullSettings.schoolSubtitle || "Sistem Absensi Digital");
    }
  }, [fullSettings]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("PUT", "/api/scanner/settings", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scanner/full-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/branding"] });
      toast({ title: "Pengaturan tampilan diperbarui" });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "landingBg") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      queryClient.invalidateQueries({ queryKey: ["/api/branding"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scanner/full-settings"] });
      toast({ title: type === "logo" ? "Logo berhasil diunggah" : "Gambar latar berhasil diunggah" });
    } catch (err: any) {
      toast({ title: "Gagal mengunggah", description: err.message, variant: "destructive" });
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  const handleRemove = async (type: "logo" | "landingBg") => {
    setRemoving(type);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error("Gagal menghapus");
      queryClient.invalidateQueries({ queryKey: ["/api/branding"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scanner/full-settings"] });
      toast({ title: "Berhasil dihapus" });
    } catch (err: any) {
      toast({ title: "Gagal menghapus", description: err.message, variant: "destructive" });
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="w-4 h-4" /> Identitas Sekolah</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nama Sekolah</Label>
            <Input value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="Nama sekolah..." />
          </div>
          <div>
            <Label>Subjudul / Tagline</Label>
            <Input value={schoolSubtitle} onChange={e => setSchoolSubtitle(e.target.value)} placeholder="Tagline atau keterangan singkat..." />
          </div>
          <Button onClick={() => updateMutation.mutate({ schoolName, schoolSubtitle })} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Menyimpan..." : "Simpan Teks"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="w-4 h-4" /> Logo Sekolah</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Logo ditampilkan di landing page dan sidebar dashboard. Format: PNG, JPG, SVG (maks 5MB).</p>
          {branding.logoUrl ? (
            <div className="flex items-center gap-4">
              <img src={branding.logoUrl} alt="Logo" className="h-20 w-20 object-contain border rounded-lg p-1 bg-muted" />
              <div className="space-y-2">
                <p className="text-sm text-green-600 font-medium">Logo terpasang</p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemove("logo")}
                  disabled={removing === "logo"}
                >
                  <X className="w-3 h-3 mr-1" />
                  {removing === "logo" ? "Menghapus..." : "Hapus Logo"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Belum ada logo terpasang</p>
          )}
          <div>
            <Label htmlFor="upload-logo" className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg hover:bg-muted transition-colors w-fit">
                <Upload className="w-4 h-4" />
                <span className="text-sm">{uploading === "logo" ? "Mengunggah..." : branding.logoUrl ? "Ganti Logo" : "Pilih File Logo"}</span>
              </div>
              <input
                id="upload-logo"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading === "logo"}
                onChange={e => handleUpload(e, "logo")}
              />
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="w-4 h-4" /> Gambar Latar Landing Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Gambar latar belakang untuk halaman login. Format: JPG, PNG (maks 5MB). Disarankan ukuran minimal 1920×1080px.</p>
          {branding.landingBgUrl ? (
            <div className="space-y-2">
              <div className="relative w-full h-36 rounded-lg overflow-hidden border">
                <img src={branding.landingBgUrl} alt="Background" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm">Preview</span>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemove("landingBg")}
                disabled={removing === "landingBg"}
              >
                <X className="w-3 h-3 mr-1" />
                {removing === "landingBg" ? "Menghapus..." : "Hapus Gambar Latar"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Belum ada gambar latar (menggunakan gradient default)</p>
          )}
          <div>
            <Label htmlFor="upload-bg" className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg hover:bg-muted transition-colors w-fit">
                <Upload className="w-4 h-4" />
                <span className="text-sm">{uploading === "landingBg" ? "Mengunggah..." : branding.landingBgUrl ? "Ganti Gambar Latar" : "Pilih Gambar Latar"}</span>
              </div>
              <input
                id="upload-bg"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading === "landingBg"}
                onChange={e => handleUpload(e, "landingBg")}
              />
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChangePasswordForm() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Password baru tidak cocok", variant: "destructive" });
      return;
    }
    if (newPassword.length < 4) {
      toast({ title: "Password baru minimal 4 karakter", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/change-password", { currentPassword, newPassword });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Password berhasil diubah" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({ title: data.message || "Gagal mengubah password", variant: "destructive" });
      }
    } catch (err: any) {
      const msg = err?.message || "Gagal mengubah password";
      toast({ title: msg, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Card className="max-w-md">
      <CardHeader><CardTitle>Ganti Password</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Password Lama</Label>
            <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required data-testid="input-current-password" />
          </div>
          <div>
            <Label>Password Baru</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required data-testid="input-new-password" />
          </div>
          <div>
            <Label>Konfirmasi Password Baru</Label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required data-testid="input-confirm-password" />
          </div>
          <Button type="submit" className="w-full" disabled={loading} data-testid="button-change-password">
            {loading ? "Menyimpan..." : "Ganti Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function UsersTab() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importTab, setImportTab] = useState<string>("");
  const [previewData, setPreviewData] = useState<string[][] | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importMode, setImportMode] = useState<"sheet" | "url">("url");
  const [csvUrl, setCsvUrl] = useState("");
  const [csvRole, setCsvRole] = useState<string>("siswa");
  const [autoSync, setAutoSync] = useState(() => localStorage.getItem("autoSyncUsers") === "true");
  const [syncInterval, setSyncInterval] = useState(() => parseInt(localStorage.getItem("autoSyncInterval") || "5"));
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const { data: users } = useQuery<any[]>({ queryKey: ["/api/admin/users"] });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/sync-from-urls");
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      const now = new Date().toLocaleTimeString("id-ID");
      setLastSyncTime(now);
      const parts = [];
      if (data.added > 0) parts.push(`${data.added} ditambahkan`);
      if (data.updated > 0) parts.push(`${data.updated} diperbarui`);
      if (data.deleted > 0) parts.push(`${data.deleted} dihapus`);
      if (data.unchanged > 0) parts.push(`${data.unchanged} tidak berubah`);
      toast({
        title: "Sinkronisasi selesai",
        description: parts.join(", ") + (data.errors?.length ? `\n${data.errors.slice(0, 3).join("; ")}` : ""),
      });
    },
    onError: (err: any) => toast({ title: "Gagal sinkronisasi", description: err.message, variant: "destructive" }),
  });

  useEffect(() => {
    localStorage.setItem("autoSyncUsers", autoSync.toString());
    localStorage.setItem("autoSyncInterval", syncInterval.toString());
    if (!autoSync) return;
    syncMutation.mutate();
    const interval = setInterval(() => {
      syncMutation.mutate();
    }, syncInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoSync, syncInterval]);

  const { data: sheetTabsData } = useQuery<{ tabs: string[] }>({
    queryKey: ["/api/admin/sheet-tabs"],
    enabled: showImport,
  });

  const handlePreview = async (tab: string) => {
    setImportTab(tab);
    try {
      const res = await apiRequest("GET", `/api/admin/sheet-preview?tab=${encodeURIComponent(tab)}`);
      const data = await res.json();
      setPreviewData(data.rows);
    } catch {
      toast({ title: "Gagal membaca data sheet", variant: "destructive" });
    }
  };

  const handleImport = async () => {
    if (!importTab) return;
    setImportLoading(true);
    try {
      const res = await apiRequest("POST", "/api/admin/import-users", { tab: importTab });
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: `Import selesai`,
        description: `${data.imported} berhasil, ${data.skipped} dilewati dari ${data.total} baris${data.errors?.length ? "\n" + data.errors.slice(0, 5).join("; ") : ""}`,
      });
      setShowImport(false);
      setPreviewData(null);
      setImportTab("");
    } catch (err: any) {
      toast({ title: "Gagal import", description: err.message, variant: "destructive" });
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportFromUrl = async () => {
    if (!csvUrl.trim()) return toast({ title: "URL CSV harus diisi", variant: "destructive" });
    setImportLoading(true);
    try {
      const res = await apiRequest("POST", "/api/admin/import-from-url", { csvUrl: csvUrl.trim(), role: csvRole });
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Import selesai",
        description: `${data.imported} berhasil, ${data.skipped} dilewati dari ${data.total} baris${data.errors?.length ? " — " + data.errors.slice(0, 3).join("; ") : ""}`,
      });
      setShowImport(false);
      setCsvUrl("");
    } catch (err: any) {
      toast({ title: "Gagal import", description: err.message, variant: "destructive" });
    } finally {
      setImportLoading(false);
    }
  };

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/admin/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowAdd(false);
      toast({ title: "User berhasil ditambahkan" });
    },
    onError: (err: any) => toast({ title: "Gagal", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      await apiRequest("PUT", `/api/admin/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditUser(null);
      toast({ title: "User berhasil diperbarui" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User dihapus" });
    },
  });

  const filtered = users?.filter(u => {
    if (filterRole !== "all" && u.role !== filterRole) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.identifier.includes(search) && !(u.className || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  })?.sort((a: any, b: any) => {
    const roleOrder: Record<string, number> = { admin: 0, wali_kelas: 1, guru: 2, siswa: 3 };
    const ra = roleOrder[a.role] ?? 9;
    const rb = roleOrder[b.role] ?? 9;
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name, 'id');
  }) || [];

  const grouped = filtered.reduce((acc: Record<string, any[]>, u: any) => {
    const key = u.className || (u.role === "admin" ? "Admin" : u.role === "guru" ? "Guru" : "Tanpa Kelas");
    if (!acc[key]) acc[key] = [];
    acc[key].push(u);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedGroups = Object.keys(grouped).sort((a, b) => {
    const special = ["Admin", "Guru", "Tanpa Kelas"];
    const aS = special.indexOf(a);
    const bS = special.indexOf(b);
    if (aS !== -1 && bS !== -1) return aS - bS;
    if (aS !== -1) return 1;
    if (bS !== -1) return 1;
    return a.localeCompare(b, 'id');
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Kelola User</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} user dari {users?.length || 0} total</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} data-testid="button-sync-sheet">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncMutation.isPending ? "animate-spin" : ""}`} /><span className="hidden sm:inline">{syncMutation.isPending ? "Sinkron..." : "Sinkron"}</span><span className="sm:hidden">{syncMutation.isPending ? "..." : "Sync"}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)} data-testid="button-import-sheet">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" /><span className="hidden sm:inline">Import</span><span className="sm:hidden">Import</span>
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)} data-testid="button-add-user">
            <UserPlus className="w-3.5 h-3.5 mr-1.5" /><span className="hidden sm:inline">Tambah</span><span className="sm:hidden">+</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mb-3 p-2.5 rounded-lg border bg-muted/30 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Switch checked={autoSync} onCheckedChange={setAutoSync} data-testid="switch-auto-sync" />
          <span className="text-xs sm:text-sm">
            Auto Sync {autoSync ? <span className="text-muted-foreground">• tiap {syncInterval}m{lastSyncTime ? ` • ${lastSyncTime}` : ""}</span> : <span className="text-muted-foreground">— off</span>}
          </span>
        </div>
        {autoSync && (
          <Select value={syncInterval.toString()} onValueChange={(v) => setSyncInterval(parseInt(v))}>
            <SelectTrigger className="w-24 h-8 text-xs" data-testid="select-sync-interval"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 menit</SelectItem>
              <SelectItem value="3">3 menit</SelectItem>
              <SelectItem value="5">5 menit</SelectItem>
              <SelectItem value="10">10 menit</SelectItem>
              <SelectItem value="15">15 menit</SelectItem>
              <SelectItem value="30">30 menit</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Cari nama, ID, atau kelas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-sm" data-testid="input-search-user" />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-28 sm:w-36 h-9 text-xs sm:text-sm" data-testid="select-filter-role"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="siswa">Siswa</SelectItem>
            <SelectItem value="guru">Guru</SelectItem>
            <SelectItem value="wali_kelas">Wali Kelas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-2 sm:px-3 py-2 text-left w-8">No</th>
                <th className="px-2 sm:px-3 py-2 text-left">Nama</th>
                <th className="px-2 sm:px-3 py-2 text-left hidden sm:table-cell">ID</th>
                <th className="px-2 sm:px-3 py-2 text-left">Kelas</th>
                <th className="px-2 sm:px-3 py-2 text-left">Role</th>
                <th className="px-2 sm:px-3 py-2 text-left w-16">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedGroups.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Tidak ada user yang cocok</td></tr>
              )}
              {sortedGroups.map(group => (
                <>
                  <tr key={`group-${group}`} className="bg-muted/30 border-t">
                    <td colSpan={6} className="px-2 sm:px-3 py-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs sm:text-sm" data-testid={`text-group-${group}`}>{group}</span>
                        <Badge variant="secondary" className="text-[10px] h-5">{grouped[group].length}</Badge>
                      </div>
                    </td>
                  </tr>
                  {grouped[group].map((u: any, idx: number) => (
                    <tr key={u.id} className="border-t hover:bg-muted/30" data-testid={`row-user-${u.id}`}>
                      <td className="px-2 sm:px-3 py-1.5 text-muted-foreground text-center">{idx + 1}</td>
                      <td className="px-2 sm:px-3 py-1.5 font-medium">{u.name}</td>
                      <td className="px-2 sm:px-3 py-1.5 font-mono text-[11px] text-muted-foreground hidden sm:table-cell">{u.identifier}</td>
                      <td className="px-2 sm:px-3 py-1.5">{u.className || "-"}</td>
                      <td className="px-2 sm:px-3 py-1.5"><Badge variant="outline" className="text-[10px]">{u.role === "wali_kelas" ? "wali" : u.role}</Badge></td>
                      <td className="px-2 sm:px-3 py-1.5">
                        <div className="flex gap-0.5">
                          <Button size="sm" variant="ghost" onClick={() => setEditUser(u)} data-testid={`button-edit-${u.id}`} className="h-6 w-6 p-0"><Edit className="w-3 h-3" /></Button>
                          {u.role !== "admin" && (
                            <Button size="sm" variant="ghost" className="text-destructive h-6 w-6 p-0" onClick={() => { if (confirm("Hapus user ini?")) deleteMutation.mutate(u.id); }} data-testid={`button-delete-${u.id}`}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UserFormDialog open={showAdd} onClose={() => setShowAdd(false)} onSubmit={(d) => addMutation.mutate(d)} title="Tambah User" />
      {editUser && (
        <UserFormDialog
          open={!!editUser}
          onClose={() => setEditUser(null)}
          onSubmit={(d) => updateMutation.mutate({ id: editUser.id, ...d })}
          title="Edit User"
          defaultValues={editUser}
        />
      )}

      <Dialog open={showImport} onOpenChange={(v) => { if (!v) { setShowImport(false); setPreviewData(null); setImportTab(""); setCsvUrl(""); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Import User</DialogTitle>
          </DialogHeader>

          <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4">
            <button
              className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${importMode === "url" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setImportMode("url")}
              data-testid="tab-import-url"
            >
              Import dari URL CSV
            </button>
            <button
              className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${importMode === "sheet" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setImportMode("sheet")}
              data-testid="tab-import-sheet"
            >
              Import dari Google Sheet
            </button>
          </div>

          {importMode === "url" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Masukkan URL CSV publik dari Google Sheets (File → Publikasikan ke web → Format CSV). User yang sudah terdaftar akan dilewati otomatis.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL CSV</label>
                <input
                  type="url"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="https://docs.google.com/spreadsheets/d/e/...output=csv"
                  value={csvUrl}
                  onChange={e => setCsvUrl(e.target.value)}
                  data-testid="input-csv-url"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Jenis Data</label>
                <div className="flex gap-2">
                  {[{ val: "siswa", label: "Siswa (NISN, Nama, Kelas, No HP Ortu, Nama Ortu)" }, { val: "guru", label: "Guru (Nama, PegId, No HP)" }, { val: "wali_kelas", label: "Wali Kelas (Nama, PegId, Kelas, No HP)" }].map(opt => (
                    <button
                      key={opt.val}
                      className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-colors ${csvRole === opt.val ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground hover:text-foreground"}`}
                      onClick={() => setCsvRole(opt.val)}
                      data-testid={`button-role-${opt.val}`}
                    >
                      {opt.val === "siswa" ? "Siswa" : opt.val === "guru" ? "Guru" : "Wali Kelas"}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {csvRole === "siswa" && "Kolom: NISN, Nama, Kelas, No HP Orang Tua, Nama Orang Tua"}
                  {csvRole === "guru" && "Kolom: Nama, PegId, No HP"}
                  {csvRole === "wali_kelas" && "Kolom: Nama, PegId, Kelas, No HP"}
                </p>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleImportFromUrl} disabled={importLoading || !csvUrl.trim()} data-testid="button-import-from-url">
                  {importLoading ? "Mengimport..." : "Import Sekarang"}
                </Button>
              </div>
            </div>
          )}

          {importMode === "sheet" && (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                Pilih tab sheet untuk melihat preview data, lalu klik "Import" untuk menambahkan user baru. User dengan ID yang sudah ada akan dilewati.
              </p>
              <div className="flex gap-2 mb-4 flex-wrap">
                {sheetTabsData?.tabs?.filter(t => ["Siswa", "Guru", "Wali Kelas"].includes(t)).map(tab => (
                  <Button
                    key={tab}
                    variant={importTab === tab ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePreview(tab)}
                    data-testid={`button-sheet-tab-${tab}`}
                  >
                    {tab}
                  </Button>
                ))}
                {!sheetTabsData?.tabs?.length && (
                  <p className="text-sm text-muted-foreground py-2">Google Sheet belum terhubung. Gunakan tab "Import dari URL CSV" di atas.</p>
                )}
              </div>
              {previewData && (
                <>
                  <div className="border rounded-lg overflow-auto max-h-[35vh]">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs">#</th>
                          {importTab.toLowerCase() === "siswa" && (
                            <><th className="px-3 py-2 text-left text-xs">Nama</th><th className="px-3 py-2 text-left text-xs">NISN</th><th className="px-3 py-2 text-left text-xs">Kelas</th><th className="px-3 py-2 text-left text-xs">No HP Ortu</th><th className="px-3 py-2 text-left text-xs">Nama Ortu</th></>
                          )}
                          {importTab.toLowerCase() === "guru" && (
                            <><th className="px-3 py-2 text-left text-xs">Nama</th><th className="px-3 py-2 text-left text-xs">PegId</th><th className="px-3 py-2 text-left text-xs">No WA</th></>
                          )}
                          {importTab.toLowerCase() === "wali kelas" && (
                            <><th className="px-3 py-2 text-left text-xs">Nama</th><th className="px-3 py-2 text-left text-xs">PegId</th><th className="px-3 py-2 text-left text-xs">Kelas</th><th className="px-3 py-2 text-left text-xs">No WA</th></>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-1.5 text-xs text-muted-foreground">{i + 2}</td>
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-1.5 text-xs">{cell || "-"}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-sm text-muted-foreground">{previewData.length} baris ditemukan</p>
                    <Button onClick={handleImport} disabled={importLoading || previewData.length === 0} data-testid="button-confirm-import">
                      {importLoading ? "Mengimport..." : `Import ${previewData.length} ${importTab}`}
                    </Button>
                  </div>
                </>
              )}
              {previewData?.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Sheet kosong - tidak ada data untuk diimport</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

function UserFormDialog({ open, onClose, onSubmit, title, defaultValues }: {
  open: boolean; onClose: () => void; onSubmit: (data: any) => void; title: string; defaultValues?: any;
}) {
  const [name, setName] = useState(defaultValues?.name || "");
  const [identifier, setIdentifier] = useState(defaultValues?.identifier || "");
  const [role, setRole] = useState(defaultValues?.role || "siswa");
  const [className, setClassName] = useState(defaultValues?.className || "");
  const [parentPhone, setParentPhone] = useState(defaultValues?.parentPhone || "");
  const [parentName, setParentName] = useState(defaultValues?.parentName || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, identifier, role, className: className || null, parentPhone: parentPhone || null, parentName: parentName || null });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Nama</Label><Input value={name} onChange={e => setName(e.target.value)} required data-testid="input-user-name" /></div>
          <div><Label>NISN/PegId/Username</Label><Input value={identifier} onChange={e => setIdentifier(e.target.value)} required data-testid="input-user-identifier" /></div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger data-testid="select-user-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="siswa">Siswa</SelectItem>
                <SelectItem value="guru">Guru</SelectItem>
                <SelectItem value="wali_kelas">Wali Kelas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(role === "siswa" || role === "wali_kelas") && (
            <div><Label>Kelas</Label><Input value={className} onChange={e => setClassName(e.target.value)} placeholder="contoh: XII-IPA-1" data-testid="input-user-class" /></div>
          )}
          {role === "siswa" && (
            <>
              <div><Label>No. HP Orang Tua</Label><Input value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder="08xxxxxxxxxx" data-testid="input-user-parent-phone" /></div>
              <div><Label>Nama Orang Tua</Label><Input value={parentName} onChange={e => setParentName(e.target.value)} data-testid="input-user-parent-name" /></div>
            </>
          )}
          {(role === "guru" || role === "wali_kelas") && (
            <div><Label>No. HP / WhatsApp</Label><Input value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder="08xxxxxxxxxx" data-testid="input-user-phone" /></div>
          )}
          <Button type="submit" className="w-full" data-testid="button-submit-user">Simpan</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ManualAttendanceTab() {
  const { toast } = useToast();
  const { data: users } = useQuery<any[]>({ queryKey: ["/api/admin/users"] });
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [type, setType] = useState("checkin");
  const [time, setTime] = useState("");
  const [sendWa, setSendWa] = useState(true);

  const allUsers = users?.filter(u => {
    if (u.role === "admin") return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name?.toLowerCase().includes(q) || u.identifier?.toLowerCase().includes(q);
    }
    return true;
  })?.sort((a: any, b: any) => {
    const ro: Record<string, number> = { wali_kelas: 0, guru: 1, siswa: 2 };
    const ra = ro[a.role] ?? 9, rb = ro[b.role] ?? 9;
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name, 'id');
  }) || [];

  const grouped = allUsers.reduce((acc: Record<string, any[]>, u: any) => {
    const key = u.className || (u.role === "guru" ? "Guru" : "Tanpa Kelas");
    if (!acc[key]) acc[key] = [];
    acc[key].push(u);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedGroups = Object.keys(grouped).sort((a, b) => {
    const special = ["Guru", "Tanpa Kelas"];
    const aS = special.indexOf(a), bS = special.indexOf(b);
    if (aS !== -1 && bS !== -1) return aS - bS;
    if (aS !== -1) return 1;
    if (bS !== -1) return 1;
    return a.localeCompare(b, 'id');
  });

  const manualMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/manual-attendance", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Berhasil", description: data.message });
      setSelectedUser(null);
      setTime("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/attendance"] });
    },
    onError: (err: any) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!selectedUser) return;
    manualMutation.mutate({
      userId: selectedUser.id,
      date,
      type,
      time: time || undefined,
      sendWa,
    });
  };

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mb-1">Absen Manual</h2>
      <p className="text-xs sm:text-sm text-muted-foreground mb-4">Pilih kelas, lalu klik nama untuk absen manual</p>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Cari nama atau ID..." value={search} onChange={e => { setSearch(e.target.value); if (e.target.value) setExpandedGroup("__search__"); else setExpandedGroup(null); }} className="pl-8 h-9 text-sm" data-testid="input-manual-search" />
          </div>

          {search ? (
            <div className="border rounded-lg max-h-[400px] overflow-auto">
              {allUsers.length === 0 ? (
                <p className="text-center py-6 text-sm text-muted-foreground">Tidak ditemukan</p>
              ) : (
                <div className="divide-y">
                  {allUsers.map((u: any) => (
                    <button key={u.id} onClick={() => setSelectedUser(u)} className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/50 transition-colors ${selectedUser?.id === u.id ? "bg-primary/10" : ""}`} data-testid={`row-manual-user-${u.id}`}>
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-[11px] text-muted-foreground">{u.className || "-"} &middot; {u.role === "wali_kelas" ? "Wali Kelas" : u.role === "guru" ? "Guru" : "Siswa"}</p>
                      </div>
                      {selectedUser?.id === u.id && <Badge className="text-[10px]">Dipilih</Badge>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {sortedGroups.map(group => (
                <div key={group} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedGroup(expandedGroup === group ? null : group)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/50 transition-colors ${expandedGroup === group ? "bg-muted/50" : ""}`}
                    data-testid={`button-group-${group}`}
                  >
                    <div>
                      <p className="text-sm font-semibold">{group}</p>
                      <p className="text-[11px] text-muted-foreground">{grouped[group].length} orang</p>
                    </div>
                    {expandedGroup === group ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {expandedGroup === group && (
                    <div className="border-t divide-y max-h-60 overflow-auto">
                      {grouped[group].map((u: any) => (
                        <button key={u.id} onClick={() => setSelectedUser(u)} className={`w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-muted/50 transition-colors ${selectedUser?.id === u.id ? "bg-primary/10" : ""}`} data-testid={`row-manual-user-${u.id}`}>
                          <div>
                            <p className="text-xs sm:text-sm font-medium">{u.name}</p>
                            {u.role !== "siswa" && <p className="text-[10px] text-muted-foreground">{u.role === "wali_kelas" ? "Wali Kelas" : "Guru"}</p>}
                          </div>
                          {selectedUser?.id === u.id && <Badge className="text-[10px] h-4">Dipilih</Badge>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Input Absensi</h3>
          {selectedUser ? (
            <>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="font-semibold" data-testid="text-selected-name">{selectedUser.name}</p>
                <p className="text-xs text-muted-foreground">{selectedUser.identifier} &middot; {selectedUser.className || "-"} &middot; {selectedUser.role === "wali_kelas" ? "Wali Kelas" : selectedUser.role === "guru" ? "Guru" : "Siswa"}</p>
              </div>
              <div>
                <Label>Tanggal</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} data-testid="input-manual-date" />
              </div>
              <div>
                <Label>Jenis Absensi</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger data-testid="select-manual-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checkin">Datang</SelectItem>
                    <SelectItem value="checkout">Pulang</SelectItem>
                    <SelectItem value="izin">Izin</SelectItem>
                    <SelectItem value="sakit">Sakit</SelectItem>
                    <SelectItem value="alpha">Alpha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(type === "checkin" || type === "checkout") && (
                <div>
                  <Label>Jam (opsional)</Label>
                  <Input type="time" value={time} onChange={e => setTime(e.target.value)} placeholder="Kosongkan untuk waktu sekarang" data-testid="input-manual-time" />
                  <p className="text-xs text-muted-foreground mt-1">Kosongkan untuk menggunakan waktu saat ini</p>
                </div>
              )}
              <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${sendWa ? "bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-800" : "hover:bg-muted"}`} data-testid="toggle-send-wa">
                <input type="checkbox" checked={sendWa} onChange={e => setSendWa(e.target.checked)} className="w-4 h-4 accent-green-600" />
                <MessageSquare className="w-4 h-4 text-green-600" />
                <div>
                  <span className={`text-sm font-medium ${sendWa ? "text-green-700 dark:text-green-400" : ""}`}>Kirim WA ke Orang Tua</span>
                  {selectedUser && !selectedUser.parentPhone && <p className="text-xs text-orange-500">No HP belum diisi</p>}
                </div>
              </label>
              <Button onClick={handleSubmit} className="w-full" disabled={manualMutation.isPending} data-testid="button-manual-submit">
                <ClipboardEdit className="w-4 h-4 mr-2" />
                {manualMutation.isPending ? "Memproses..." : "Simpan Absensi"}
              </Button>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              <ClipboardEdit className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Pilih nama dari daftar kelas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function printSingleQR(user: any) {
  const qrContainer = document.querySelector(`[data-testid="card-qr-${user.id}"] svg`);
  if (!qrContainer) {
    alert("QR Code tidak ditemukan. Pastikan QR sudah tampil di layar.");
    return;
  }
  if (!qrContainer.getAttribute("xmlns")) {
    qrContainer.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }
  const svgData = new XMLSerializer().serializeToString(qrContainer);
  const printWindow = window.open("", "_blank", "width=400,height=500");
  if (!printWindow) return;
  printWindow.document.write(`
    <html><head><title>QR Code - ${user.name}</title>
    <style>
      body{font-family:Arial,sans-serif;text-align:center;padding:40px;margin:0;}
      .qr-container{display:inline-block;padding:24px;border:2px solid #ccc;border-radius:12px;}
      .qr-container svg{width:200px;height:200px;}
      h2{margin:16px 0 4px;font-size:18px;}
      p{margin:2px 0;color:#666;font-size:13px;}
      @media print{body{padding:20px;}.qr-container{border:1px solid #999;}}
    </style>
    </head><body>
    <div class="qr-container">
      ${svgData}
      <h2>${user.name}</h2>
      <p>${user.identifier}</p>
      ${user.className ? `<p>${user.className}</p>` : ""}
    </div>
    <script>setTimeout(function(){ window.print(); }, 300);<\/script>
    </body></html>
  `);
  printWindow.document.close();
}

function QRCodesTab() {
  const [filterRole, setFilterRole] = useState("siswa");
  const [filterClass, setFilterClass] = useState("");
  const [search, setSearch] = useState("");
  const { data: users } = useQuery<any[]>({ queryKey: ["/api/admin/qrcodes"] });

  const filtered = users?.filter(u => {
    if (filterRole && u.role !== filterRole) return false;
    if (filterClass && filterClass !== "all" && u.className !== filterClass) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name?.toLowerCase().includes(q) || u.identifier?.toLowerCase().includes(q) || u.className?.toLowerCase().includes(q);
    }
    return true;
  }) || [];

  const classes = [...new Set(users?.filter(u => !filterRole || u.role === filterRole).map(u => u.className).filter(Boolean) || [])];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 no-print">
        <h2 className="text-2xl font-bold">Cetak QR Code</h2>
        <Button onClick={() => window.print()} data-testid="button-print-qr"><Printer className="w-4 h-4 mr-2" />Print</Button>
      </div>
      <div className="flex gap-2 mb-4 no-print flex-wrap">
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="siswa">Siswa</SelectItem>
            <SelectItem value="guru">Guru</SelectItem>
            <SelectItem value="wali_kelas">Wali Kelas</SelectItem>
          </SelectContent>
        </Select>
        {classes.length > 0 && (
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Semua Kelas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              {classes.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, NISN/PegId, atau kelas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-qr"
          />
        </div>
      </div>
      {search && <p className="text-sm text-muted-foreground mb-3 no-print" data-testid="text-search-count">Menampilkan {filtered.length} hasil untuk "{search}"</p>}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 qr-grid">
        {filtered.map((u: any, i: number) => (
          <div key={u.id} data-testid={`card-qr-${u.id}`} className="border rounded-lg p-2 flex flex-col items-center text-center bg-white qr-card">
            <span className="text-[10px] text-muted-foreground mb-1 no-print">#{i + 1}</span>
            <div className="bg-white p-1 rounded">
              <QRCode value={u.qrCode} size={90} />
            </div>
            <p className="text-[11px] font-semibold mt-1 leading-tight line-clamp-2">{u.name}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{u.identifier}</p>
            {u.className && <p className="text-[10px] text-muted-foreground leading-tight">{u.className}</p>}
            <Button size="sm" variant="outline" className="mt-2 h-6 text-[10px] px-2 no-print w-full" onClick={() => printSingleQR(u)} data-testid={`button-print-single-${u.id}`}>
              <Printer className="w-3 h-3 mr-1" />Cetak
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClearAttendanceButton() {
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState("all");

  const handleClear = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("DELETE", `/api/admin/attendance/clear?target=${target}`);
      const data = await res.json();
      toast({ title: `Data absensi dihapus. DB: ${data.dbDeleted} record, Sheet: ${data.sheetCleared} baris` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/attendance"] });
      setShowConfirm(false);
    } catch (err: any) {
      toast({ title: err?.message || "Gagal menghapus data", variant: "destructive" });
    }
    setLoading(false);
  };

  if (!showConfirm) {
    return (
      <Button variant="destructive" size="sm" onClick={() => setShowConfirm(true)} data-testid="button-clear-attendance">
        <Trash2 className="w-4 h-4 mr-1" />Hapus Data
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 border border-destructive rounded-lg bg-destructive/5">
      <Select value={target} onValueChange={setTarget}>
        <SelectTrigger className="w-[160px]" data-testid="select-clear-target"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Database + Sheet</SelectItem>
          <SelectItem value="db">Database saja</SelectItem>
          <SelectItem value="sheet">Sheet saja</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="destructive" size="sm" onClick={handleClear} disabled={loading} data-testid="button-confirm-clear">
        {loading ? "Menghapus..." : "Hapus"}
      </Button>
      <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)} data-testid="button-cancel-clear">Batal</Button>
    </div>
  );
}

function RecapTab() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  if (filterClass) queryParams.set("className", filterClass);
  if (filterRole) queryParams.set("role", filterRole);
  if (filterStatus) queryParams.set("status", filterStatus);

  const { data: records, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/attendance", `?${queryParams.toString()}`],
    enabled: !!(startDate || endDate),
  });

  const stats = {
    hadir: records?.filter(r => r.status === "hadir").length || 0,
    telat: records?.filter(r => r.status === "telat").length || 0,
    izin: records?.filter(r => r.status === "izin").length || 0,
    sakit: records?.filter(r => r.status === "sakit").length || 0,
    alpha: records?.filter(r => r.status === "alpha").length || 0,
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (filterClass) params.set("className", filterClass);
    if (filterRole) params.set("role", filterRole);
    if (filterStatus) params.set("status", filterStatus);
    try {
      const res = await fetch(`/api/admin/attendance/export?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Export gagal");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rekap-absensi.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Rekap Absensi</h2>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" data-testid="button-export-csv"><Download className="w-4 h-4 mr-2" />Export CSV</Button>
          <ClearAttendanceButton />
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div><Label>Dari Tanggal</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} data-testid="input-start-date" /></div>
            <div><Label>Sampai Tanggal</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} data-testid="input-end-date" /></div>
            <div>
              <Label>Kelas</Label>
              <Input placeholder="Kelas" value={filterClass} onChange={e => setFilterClass(e.target.value)} data-testid="input-filter-class" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={filterRole || "all"} onValueChange={v => setFilterRole(v === "all" ? "" : v)}>
                <SelectTrigger data-testid="select-filter-recap-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="siswa">Siswa</SelectItem>
                  <SelectItem value="guru">Guru</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus || "all"} onValueChange={v => setFilterStatus(v === "all" ? "" : v)}>
                <SelectTrigger data-testid="select-filter-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="hadir">Hadir</SelectItem>
                  <SelectItem value="telat">Telat</SelectItem>
                  <SelectItem value="izin">Izin</SelectItem>
                  <SelectItem value="sakit">Sakit</SelectItem>
                  <SelectItem value="alpha">Alpha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {records && records.length > 0 && (
        <div className="grid grid-cols-5 gap-2 mb-4">
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Hadir</p><p className="text-xl font-bold text-green-600">{stats.hadir}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Telat</p><p className="text-xl font-bold text-orange-600">{stats.telat}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Izin</p><p className="text-xl font-bold text-blue-600">{stats.izin}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Sakit</p><p className="text-xl font-bold text-yellow-600">{stats.sakit}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Alpha</p><p className="text-xl font-bold text-red-600">{stats.alpha}</p></CardContent></Card>
        </div>
      )}

      <div className="border rounded-lg overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">No</th>
              <th className="px-3 py-2 text-left">Tanggal</th>
              <th className="px-3 py-2 text-left">Nama</th>
              <th className="px-3 py-2 text-left">NISN/PegId</th>
              <th className="px-3 py-2 text-left">Kelas</th>
              <th className="px-3 py-2 text-left">Jam Datang</th>
              <th className="px-3 py-2 text-left">Jam Pulang</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">Memuat...</td></tr>
            ) : records && records.length > 0 ? (
              records.map((r: any, i: number) => (
                <tr key={r.id} className="border-t" data-testid={`row-attendance-${r.id}`}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{r.date}</td>
                  <td className="px-3 py-2">{r.user?.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.user?.identifier}</td>
                  <td className="px-3 py-2">{r.user?.className || "-"}</td>
                  <td className="px-3 py-2">{r.checkInTime || "-"}</td>
                  <td className="px-3 py-2">{r.checkOutTime || "-"}</td>
                  <td className="px-3 py-2">
                    <Badge variant={r.status === "hadir" ? "default" : r.status === "telat" ? "secondary" : "destructive"} className={r.status === "telat" ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" : ""}>{r.status}</Badge>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                {startDate || endDate ? "Tidak ada data" : "Pilih rentang tanggal untuk melihat data"}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
