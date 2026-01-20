import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is NeuroLoop Pro?",
    answer: "NeuroLoop Pro is a cognitive performance platform designed for high-performing professionals. It uses a dual-process training methodology based on System 1 (fast, intuitive) and System 2 (slow, deliberate) thinking to measurably improve decision-making, focus, and mental clarity."
  },
  {
    question: "How much time does training require?",
    answer: "Most users train 10-15 minutes per day, 4-5 days per week. The platform uses a rolling 7-day window to track progress, so you have flexibility in when you train. Consistency matters more than duration."
  },
  {
    question: "Is the methodology scientifically validated?",
    answer: "Yes. Our training protocols are grounded in decades of cognitive science research, including dual-process theory (Kahneman), working memory training, and executive function development. We continuously refine our approach based on aggregated performance data."
  },
  {
    question: "What results can I expect?",
    answer: "Users typically report improved mental clarity, faster pattern recognition, and better decision-making under pressure within 4-6 weeks of consistent training. The platform tracks your Reasoning Quality, Sharpness, and Recovery metrics so you can measure progress objectively."
  },
  {
    question: "Is there a free version?",
    answer: "Yes. The Free plan gives you access to core training features with a weekly XP cap. Pro and Elite plans unlock unlimited training, advanced analytics, clinical reports, and personalized coaching insights."
  },
  {
    question: "Can I use NeuroLoop on mobile?",
    answer: "NeuroLoop Pro is designed as a mobile-first experience. The app will be available on iOS (coming soon to the App Store). You can also access all features through any modern web browser."
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-24 bg-white">
      <div className="container px-6 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-black/60 text-lg">
            Everything you need to know about training your mind.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border-b border-black/10"
            >
              <AccordionTrigger className="text-left text-black hover:text-black/70 py-5 text-base font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-black/60 pb-5 text-base leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}