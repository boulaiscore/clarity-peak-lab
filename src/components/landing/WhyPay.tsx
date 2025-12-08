import { TrendingUp, Infinity, Zap } from "lucide-react";

export function WhyPay() {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="container px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-5">
              <span className="text-gradient">Cognitive Longevity</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Your brain is your competitive advantage. NeuroLoop Pro helps you refine it through consistent, high-quality cognitive practice designed to compound over time.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mb-16">
            <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border">
              <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Compounding Returns</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Small, consistent improvements in thinking quality multiply over years of decisions.
              </p>
            </div>
            
            <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border">
              <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center mb-4">
                <Infinity className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Long-Term Sharpness</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Maintain peak cognitive performance longer. Protect your most valuable asset.
              </p>
            </div>
            
            <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border">
              <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">On-Demand Precision</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Access structured thinking protocols exactly when you need them most.
              </p>
            </div>
          </div>

          {/* Quote */}
          <div className="text-center p-8 sm:p-12 rounded-2xl bg-gradient-surface border border-border">
            <blockquote className="text-xl sm:text-2xl font-medium mb-4 leading-relaxed">
              "Train your thinking. <span className="text-gradient">Compound your edge.</span>"
            </blockquote>
            <p className="text-muted-foreground text-sm">— The NeuroLoop Philosophy</p>
          </div>
        </div>
      </div>
    </section>
  );
}