import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Book, Headphones, FileText, Clock, Check, Play, Loader2, Sparkles } from "lucide-react";
import { ContentAssignment, ContentType } from "@/hooks/useMonthlyContent";

interface MonthlyContentCardProps {
  assignments: ContentAssignment[];
  completedContent: number;
  totalContent: number;
  totalReadingTime: number;
  requiredPerWeek: number;
  isLoading?: boolean;
  onStartReading?: (contentId: string) => void;
  className?: string;
}

const getContentIcon = (type: ContentType) => {
  switch (type) {
    case "podcast": return Headphones;
    case "reading": return FileText;
    case "book": return Book;
  }
};

const getContentColor = (type: ContentType) => {
  switch (type) {
    case "podcast": return "text-violet-400 bg-violet-500/15";
    case "reading": return "text-cyan-400 bg-cyan-500/15";
    case "book": return "text-amber-400 bg-amber-500/15";
  }
};

const formatTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export function MonthlyContentCard({
  assignments,
  completedContent,
  totalContent,
  totalReadingTime,
  requiredPerWeek,
  isLoading = false,
  onStartReading,
  className
}: MonthlyContentCardProps) {
  const currentMonth = new Date().toLocaleString("default", { month: "long" });
  const progressPercent = totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0;

  // Group by type
  const byType = {
    podcast: assignments.filter(a => a.content_type === "podcast"),
    reading: assignments.filter(a => a.content_type === "reading"),
    book: assignments.filter(a => a.content_type === "book"),
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("p-4 rounded-xl bg-card/50 border border-border/30", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">Content Plan</h3>
          <p className="text-[10px] text-muted-foreground">{currentMonth} • {requiredPerWeek}/week</p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-medium text-foreground">{formatTime(totalReadingTime)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted/30 rounded-full mb-4 overflow-hidden">
        <motion.div 
          className={cn(
            "h-full rounded-full",
            progressPercent === 100 ? "bg-emerald-500" : "bg-primary"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Content list */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
          <p className="text-[11px] text-muted-foreground">Generazione contenuti con AI...</p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">Basato sul tuo piano {requiredPerWeek}/settimana</p>
        </div>
      ) : assignments.length > 0 ? (
        <div className="space-y-2">
          {assignments.slice(0, 4).map((content) => {
            const Icon = getContentIcon(content.content_type);
            const colorClass = getContentColor(content.content_type);
            const isCompleted = content.status === "completed";
            
            return (
              <div 
                key={content.id}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-lg transition-colors",
                  isCompleted ? "bg-emerald-500/10" : "bg-muted/20 hover:bg-muted/30"
                )}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-[12px] font-medium truncate",
                    isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                  )}>
                    {content.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground capitalize">
                      {content.content_type}
                    </span>
                    {content.duration_minutes && (
                      <span className="text-[9px] text-muted-foreground">
                        • {formatTime(content.duration_minutes)}
                      </span>
                    )}
                    {content.time_spent_minutes > 0 && !isCompleted && (
                      <span className="text-[9px] text-primary">
                        • {formatTime(content.time_spent_minutes)} spent
                      </span>
                    )}
                  </div>
                </div>
                {!isCompleted && content.content_type === "book" && onStartReading && (
                  <button
                    onClick={() => onStartReading(content.id)}
                    className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-primary" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <Book className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-[11px] text-muted-foreground">No content assigned yet</p>
          <p className="text-[10px] text-muted-foreground/70">Content will be suggested based on your plan</p>
        </div>
      )}

      {/* Type summary */}
      {assignments.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border/20">
          {Object.entries(byType).map(([type, items]) => {
            if (items.length === 0) return null;
            const completed = items.filter(i => i.status === "completed").length;
            return (
              <div key={type} className="flex items-center gap-1.5">
                <div className={cn("w-2 h-2 rounded-full", getContentColor(type as ContentType).split(" ")[1])} />
                <span className="text-[9px] text-muted-foreground capitalize">
                  {type}: {completed}/{items.length}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
