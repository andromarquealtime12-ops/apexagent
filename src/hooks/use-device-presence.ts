import { useEffect, useState } from "react";
import { actions, useApex } from "@/lib/apex/store";

const ID_KEY = "apex-device-id";
const SHARE_KEY = "apex-device-share";
const NAME_KEY = "apex-device-name";

export function thisDeviceId(): string {
  let id = localStorage.getItem(ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ID_KEY, id);
  }
  return id;
}

function defaultName() {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "PC Windows";
  return "Appareil";
}

export function getDeviceName() {
  return localStorage.getItem(NAME_KEY) || defaultName();
}
export function setDeviceName(n: string) {
  localStorage.setItem(NAME_KEY, n.slice(0, 60));
}

/** Location sharing is opt-in per device and only runs while the app is open. */
export function useLocationSharing() {
  const [sharing, setSharingState] = useState(false);
  useEffect(() => setSharingState(localStorage.getItem(SHARE_KEY) === "1"), []);
  const setSharing = (v: boolean) => {
    localStorage.setItem(SHARE_KEY, v ? "1" : "0");
    setSharingState(v);
    window.dispatchEvent(new Event("apex-share-change"));
  };
  return { sharing, setSharing };
}

export function useDevicePresence() {
  const userId = useApex((s) => s.session?.userId);
  useEffect(() => {
    if (!userId) return;
    const base = () => ({ id: thisDeviceId(), name: getDeviceName(), platform: navigator.userAgent });
    void actions.reportDevice(base());
    const beat = setInterval(() => void actions.reportDevice(base()), 5 * 60_000);

    let watch: number | null = null;
    let last = 0;
    const startWatch = () => {
      if (watch != null || localStorage.getItem(SHARE_KEY) !== "1" || !navigator.geolocation) return;
      watch = navigator.geolocation.watchPosition(
        (p) => {
          if (Date.now() - last < 60_000) return;
          last = Date.now();
          void actions.reportDevice({ ...base(), latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy_m: p.coords.accuracy });
        },
        () => {},
        { enableHighAccuracy: false, maximumAge: 60_000, timeout: 30_000 },
      );
    };
    const stopWatch = () => {
      if (watch != null) navigator.geolocation.clearWatch(watch);
      watch = null;
      last = 0;
    };
    const onChange = () => (localStorage.getItem(SHARE_KEY) === "1" ? startWatch() : stopWatch());
    startWatch();
    window.addEventListener("apex-share-change", onChange);
    return () => {
      clearInterval(beat);
      stopWatch();
      window.removeEventListener("apex-share-change", onChange);
    };
  }, [userId]);
}
