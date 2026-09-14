import Nav from "../components/nav/Nav";
import HoneycombStrip from "../components/sections/HoneycombStrip";
import BuildTimeline from "../components/sections/BuildTimeline";
import Booking from "../components/sections/Booking";
import BookingModal from "../components/booking/BookingModal";
import MobileHero from "./MobileHero";
import MobileHandoff from "./MobileHandoff";
import MobileLiveFeed from "./MobileLiveFeed";
import MobilePricing from "./MobilePricing";
import MobileFooter from "./MobileFooter";
import "./mobile.css";

export default function MobileHome() {
  return (
    <div className="mobile-shell min-h-[100dvh] min-w-0 bg-background">
      <div id="app-shell">
        <Nav />
        <main className="min-w-0">
          <MobileHero />
          <MobileHandoff />
          <HoneycombStrip />
          <BuildTimeline />
          <MobileLiveFeed />
          <MobilePricing />
          <Booking />
        </main>
        <MobileFooter />
      </div>
      <BookingModal />
    </div>
  );
}
