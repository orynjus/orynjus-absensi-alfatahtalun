import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export function PwaUpdateToast() {
  const { toast } = useToast();
  const shownRef = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleUpdate = (registration: ServiceWorkerRegistration) => {
      if (shownRef.current) return;
      shownRef.current = true;

      const { dismiss } = toast({
        title: "Pembaruan Tersedia",
        description: "Versi baru aplikasi tersedia. Muat ulang untuk mendapatkan fitur terbaru.",
        duration: 0,
        action: (
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 whitespace-nowrap"
            onClick={() => {
              registration.waiting?.postMessage({ type: "SKIP_WAITING" });
              dismiss();
              window.location.reload();
            }}
          >
            Perbarui
          </button>
        ),
      });
    };

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      if (reg.waiting) {
        handleUpdate(reg);
        return;
      }
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            handleUpdate(reg);
          }
        });
      });
    });
  }, [toast]);

  return null;
}
