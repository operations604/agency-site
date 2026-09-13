export default function Logo() {
  return (
    <a
      href="#top"
      className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
    >
      <img src="/favicon.svg?v=4" alt="" className="h-7 w-7" />
      <span className="text-[18px] font-semibold tracking-tight text-foreground">
        Applied
        <span className="text-muted-foreground font-normal"> Systems</span>
      </span>
    </a>
  );
}
