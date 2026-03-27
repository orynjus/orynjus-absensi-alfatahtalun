import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Share, Plus } from "lucide-react";

type Platform = "android" | "ios" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

let deferredPrompt: any = null;

export function PwaInstallPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (localStorage.getItem("pwa-install-dismissed")) return;

    const p = detectPlatform();
    setPlatform(p);

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (p === "ios") {
      setTimeout(() => setShowBanner(true), 3000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setShowBanner(false);
    setShowIosGuide(false);
    localStorage.setItem("pwa-install-dismissed", "1");
  };

  const handleInstall = async () => {
    if (platform === "ios") {
      setShowBanner(false);
      setShowIosGuide(true);
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (result.outcome === "accepted") {
        dismiss();
      } else {
        setShowBanner(false);
      }
    }
  };

  if (!showBanner && !showIosGuide) return null;

  return (
    <>
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                <img src="/icons/icon-72.png" alt="App Icon" className="w-8 h-8 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white">Install Aplikasi</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Tambahkan ke layar utama untuk akses lebih cepat tanpa buka browser.
                </p>
              </div>
              <button
                onClick={dismiss}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mt-0.5"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="flex-1 h-8 text-xs" onClick={handleInstall}>
                {platform === "ios" ? (
                  <><Share className="w-3 h-3 mr-1" /> Cara Install</>
                ) : (
                  <><Download className="w-3 h-3 mr-1" /> Install Sekarang</>
                )}
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs px-3" onClick={dismiss}>
                Nanti
              </Button>
            </div>
          </div>
        </div>
      )}

      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Cara Install di iPhone/iPad</h3>
              <button onClick={dismiss} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-300 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Ketuk tombol Share</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tombol <Share className="w-3 h-3 inline" /> di bagian bawah Safari (atau atas di iPad)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-300 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Gulir ke bawah</p>
                  <p className="text-xs text-gray-500 mt-0.5">Cari dan ketuk <strong>"Add to Home Screen"</strong></p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-300 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Ketuk Add / Tambahkan</p>
                  <p className="text-xs text-gray-500 mt-0.5">Ikon aplikasi akan muncul di layar utama</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-xl">
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                Pastikan menggunakan Safari untuk install di iPhone/iPad
              </p>
            </div>

            <Button className="w-full mt-4" onClick={dismiss}>Mengerti</Button>
          </div>
        </div>
      )}
    </>
  );
}
