export const CALENDLY_URL =
  "https://calendly.com/operations-unlimitedholdings/30min";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
      initInlineWidget: (options: {
        url: string;
        parentElement: HTMLElement;
        resize?: boolean;
      }) => void;
    };
  }
}

let loaderPromise: Promise<void> | null = null;

export function loadCalendly(): Promise<void> {
  if (window.Calendly) return Promise.resolve();
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<void>((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://assets.calendly.com/assets/external/widget.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loaderPromise = null;
      reject(new Error("Calendly failed to load"));
    };
    document.body.appendChild(script);
  });

  return loaderPromise;
}

export function openCalendly(url: string = CALENDLY_URL) {
  loadCalendly()
    .then(() => {
      window.Calendly?.initPopupWidget({ url });
    })
    .catch(() => {
      window.open(url, "_blank");
    });
}
