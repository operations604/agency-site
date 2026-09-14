import Nav from "../components/nav/Nav";
import HeroScene from "../components/hero/HeroScene";
import HandoffStage from "../components/sections/HandoffStage";
import HoneycombStrip from "../components/sections/HoneycombStrip";
import BuildTimeline from "../components/sections/BuildTimeline";
import LiveFeed from "../components/sections/LiveFeed";
import Pricing from "../components/sections/Pricing";
import Booking from "../components/sections/Booking";
import Footer from "../components/sections/Footer";
import BookingModal from "../components/booking/BookingModal";
import { useDesktop } from "../lib/use-desktop";
import MobileHome from "../mobile/MobileHome";

// Everything renders in the first pass. The sections are small, so splitting
// them into lazy chunks only added a round trip before anything below the
// hero appeared. Heavy things pause themselves when off-screen instead.

export default function Home() {
  const desktop = useDesktop();
  if (!desktop) return <MobileHome />;

  return (
    <div className="min-h-screen min-w-0 bg-background">
      <div id="app-shell">
        <Nav />
        <main className="min-w-0">
          <HeroScene />
          <HandoffStage />
          <HoneycombStrip />
          <BuildTimeline />
          <LiveFeed />
          <Pricing />
          <Booking />
        </main>
        <Footer />
      </div>
      <BookingModal />
    </div>
  );
}
