import { useEffect, useState } from "react";

export const DESKTOP_MQ = "(min-width: 1024px)";

export function useDesktop() {
  const [desktop, setDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia(DESKTOP_MQ).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const sync = () => setDesktop(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return desktop;
}
