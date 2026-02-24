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

export default function Home() {
  return (
    <div className="page-shell space-y-8 md:space-y-10">
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
