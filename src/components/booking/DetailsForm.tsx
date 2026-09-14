import { useId } from "react";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import type { LeadForm } from "./types";

export type FormBanner = {
  title: string;
  body: string;
  onRetry?: () => void;
  retryLabel?: string;
};

type Props = {
  value: LeadForm;
  onChange: (patch: Partial<LeadForm>) => void;
  onContinue: () => void;
  onBack: () => void;
  submitting: boolean;
  fieldErrors: Record<string, string>;
  banner: FormBanner | null;
  honeypot: string;
  onHoneypotChange: (value: string) => void;
};

export function BookingBanner({ banner }: { banner: FormBanner }) {
  return (
    <div
      role="alert"
      className="mb-5 rounded-xl border border-border bg-muted px-4 py-3"
    >
      <p className="flex items-start gap-2 text-[15px] font-semibold text-foreground">
        <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
        {banner.title}
      </p>
      <p className="mt-1 pl-6 text-[14px] text-muted-foreground">
        {banner.body}
      </p>
      {banner.onRetry && (
        <button
          type="button"
          onClick={banner.onRetry}
          className="ml-6 mt-2 rounded-lg text-[14px] font-medium text-primary underline underline-offset-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {banner.retryLabel ?? "Try again"}
        </button>
      )}
    </div>
  );
}

function LineField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: (ids: { id: string; describedBy?: string }) => React.ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : undefined;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[13px] font-medium text-muted-foreground"
      >
        {label}
      </label>
      {children({ id, describedBy })}
      {error && (
        <p
          id={errorId}
          className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium text-foreground"
        >
          <TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

export default function DetailsForm({
  value,
  onChange,
  onContinue,
  onBack,
  submitting,
  fieldErrors,
  banner,
  honeypot,
  onHoneypotChange,
}: Props) {
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!submitting) onContinue();
      }}
    >
      {banner && <BookingBanner banner={banner} />}

      <fieldset disabled={submitting} className="grid gap-8">
        <legend className="sr-only">Who are we talking to</legend>

        <LineField label="Full name" error={fieldErrors.name}>
          {({ id, describedBy }) => (
            <input
              id={id}
              name="name"
              type="text"
              autoComplete="name"
              autoCapitalize="words"
              value={value.name}
              aria-required
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={describedBy}
              onChange={(e) => onChange({ name: e.target.value })}
              className={`booking-line ${fieldErrors.name ? "booking-line-error" : ""}`}
            />
          )}
        </LineField>

        <LineField label="Work email" error={fieldErrors.email}>
          {({ id, describedBy }) => (
            <input
              id={id}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={value.email}
              aria-required
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={describedBy}
              onChange={(e) => onChange({ email: e.target.value })}
              className={`booking-line ${fieldErrors.email ? "booking-line-error" : ""}`}
            />
          )}
        </LineField>
      </fieldset>

      {/* Honeypot. Off-screen, never announced, never tab-reachable: a human
          cannot fill it in, so anything that does is a bot. Phase 2's server
          reads context.honeypot alongside context.formMs to throttle spam. */}
      <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor="company-fax">Company fax</label>
        <input
          id="company-fax"
          name="company_fax"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => onHoneypotChange(e.target.value)}
        />
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-lg py-3 text-[15px] font-medium text-primary transition-colors hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft size={15} aria-hidden /> Back
        </button>
        <button type="submit" className="sr-only">
          Continue
        </button>
      </div>
    </form>
  );
}
