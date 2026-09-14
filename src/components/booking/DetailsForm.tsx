import { useId } from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";
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
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
  fieldErrors: Record<string, string>;
  banner: FormBanner | null;
  honeypot: string;
  onHoneypotChange: (value: string) => void;
};

const inputClass =
  "w-full rounded-xl border bg-card px-3.5 py-2.5 text-[15px] text-foreground transition-colors placeholder:text-muted-foreground/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60";

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: (ids: { id: string; describedBy?: string }) => React.ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[14px] font-medium text-foreground"
      >
        {label}
      </label>
      {children({ id, describedBy })}
      {hint && (
        <p id={hintId} className="mt-1 text-[13px] text-muted-foreground">
          {hint}
        </p>
      )}
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
  onSubmit,
  onBack,
  submitting,
  fieldErrors,
  banner,
  honeypot,
  onHoneypotChange,
}: Props) {
  const border = (field: keyof LeadForm) =>
    fieldErrors[field] ? "border-foreground/45" : "border-border";

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!submitting) onSubmit();
      }}
    >
      {banner && (
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
      )}

      <fieldset disabled={submitting} className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Your details</legend>

        <Field label="Full name" error={fieldErrors.name}>
          {({ id, describedBy }) => (
            <input
              id={id}
              name="name"
              type="text"
              autoComplete="name"
              value={value.name}
              aria-required
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={describedBy}
              onChange={(e) => onChange({ name: e.target.value })}
              className={`${inputClass} ${border("name")}`}
            />
          )}
        </Field>

        <Field label="Work email" error={fieldErrors.email}>
          {({ id, describedBy }) => (
            <input
              id={id}
              name="email"
              type="email"
              autoComplete="email"
              value={value.email}
              aria-required
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={describedBy}
              onChange={(e) => onChange({ email: e.target.value })}
              className={`${inputClass} ${border("email")}`}
            />
          )}
        </Field>

        <div className="sm:col-span-2">
          <Field label="Company" error={fieldErrors.company}>
            {({ id, describedBy }) => (
              <input
                id={id}
                name="company"
                type="text"
                autoComplete="organization"
                value={value.company}
                aria-required
                aria-invalid={Boolean(fieldErrors.company)}
                aria-describedby={describedBy}
                onChange={(e) => onChange({ company: e.target.value })}
                className={`${inputClass} ${border("company")}`}
              />
            )}
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field
            label="What's eating your time?"
            error={fieldErrors.painPoint}
            hint="The work you wish nobody had to do by hand. A sentence is plenty."
          >
            {({ id, describedBy }) => (
              <textarea
                id={id}
                name="painPoint"
                rows={4}
                value={value.painPoint}
                aria-required
                aria-invalid={Boolean(fieldErrors.painPoint)}
                aria-describedby={describedBy}
                onChange={(e) => onChange({ painPoint: e.target.value })}
                className={`${inputClass} ${border("painPoint")} resize-y`}
              />
            )}
          </Field>
        </div>
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

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-[15px] font-medium text-primary-foreground transition-[background-color,box-shadow,transform] duration-160 ease-out hover:bg-primary/90 hover:shadow-[0_6px_24px_-4px_hsl(222_84%_53%/0.45)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:shadow-none disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {submitting && (
            <LoaderCircle size={16} className="boot-spin" aria-hidden />
          )}
          {submitting ? "Booking…" : "Confirm booking"}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="rounded-xl px-2 py-3 text-[15px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Back to times
        </button>
      </div>
    </form>
  );
}
