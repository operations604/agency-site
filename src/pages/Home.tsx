import Nav from "../components/nav/Nav";
import HeroScene from "../components/hero/HeroScene";
import HandoffStage from "../components/sections/HandoffStage";
import HoneycombStrip from "../components/sections/HoneycombStrip";
import BuildTimeline from "../components/sections/BuildTimeline";
import LiveFeed from "../components/sections/LiveFeed";
import Pricing from "../components/sections/Pricing";
import Booking from "../components/sections/Booking";
import Footer from "../components/sections/Footer";

// Everything renders in the first pass. The sections are small, so splitting
// them into lazy chunks only added a round trip before anything below the
// hero appeared. Heavy things pause themselves when off-screen instead.
export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
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
  );
}
