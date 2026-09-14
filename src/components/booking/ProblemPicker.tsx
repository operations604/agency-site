import { useEffect, useId, useRef } from "react";
import { ArrowLeft, LoaderCircle, TriangleAlert } from "lucide-react";
import { BookingBanner, type FormBanner } from "./DetailsForm";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
  error?: string;
  banner: FormBanner | null;
};

export default function ProblemPicker({
  value,
  onChange,
  onSubmit,
  onBack,
  submitting,
  error,
  banner,
}: Props) {
  const id = useId();
  const errorId = `${id}-error`;
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    areaRef.current?.focus();
  }, []);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!submitting) onSubmit();
      }}
    >
      {banner && <BookingBanner banner={banner} />}

      <label htmlFor={id} className="sr-only">
        Describe the problem, optional
      </label>
      <textarea
        ref={areaRef}
        id={id}
        name="painPoint"
        rows={8}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        placeholder="What's eating your time?"
        disabled={submitting}
        onChange={(e) => onChange(e.target.value)}
        className={`booking-problem ${error ? "booking-problem-error" : ""}`}
      />

      {error && (
        <p
          id={errorId}
          className="mt-3 flex items-start gap-1.5 text-[13px] font-medium text-foreground"
        >
          <TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-lg py-3 text-[15px] font-medium text-primary transition-colors hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft size={15} aria-hidden /> Back
        </button>
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
      </div>
    </form>
  );
}
