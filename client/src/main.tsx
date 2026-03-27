import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // Cek update setiap 60 menit
        setInterval(() => registration.update(), 60 * 60 * 1000);

        // Reload otomatis saat SW baru aktif
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!refreshing) {
            refreshing = true;
            // Biarkan PwaUpdateToast yang menangani reload
          }
        });
      })
      .catch(() => {});
  });
}
