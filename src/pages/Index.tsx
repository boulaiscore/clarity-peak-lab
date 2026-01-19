import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { AppMockup } from "@/components/landing/AppMockup";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhyPay } from "@/components/landing/WhyPay";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <AppMockup />
      <HowItWorks />
      <WhyPay />
      <Pricing />
      <Footer />
    </div>
  );
};

export default Index;
