import {
  HomeCta,
  HomeFaq,
  HomeFeatures,
  HomeHero,
  HomeHowItWorks,
  HomePricing,
  HomeStats,
  HomeTrust,
} from "@/components/home";

export const metadata = {
  title: "DRPY - Temporary File Sharing",
};

export default function Home() {
  return (
    <div className="space-y-8">
      <HomeHero />
      <HomeStats />
      <HomeFeatures />
      <HomeHowItWorks />
      <HomeTrust />
      <HomePricing />
      <HomeFaq />
      <HomeCta />
    </div>
  );
}
