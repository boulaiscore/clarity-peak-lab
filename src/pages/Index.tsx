import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Footer } from "@/components/landing/Footer";
import {
  SubscriptionsSection,
  HowItWorksSection,
  AssessmentSection,
  WhyNeuroloopSection,
  ProtocolsSection,
  FAQSection,
} from "@/components/landing/sections";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <SubscriptionsSection />
      <HowItWorksSection />
      <AssessmentSection />
      <WhyNeuroloopSection />
      <ProtocolsSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;
