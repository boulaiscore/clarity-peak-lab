import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Gamepad2, Headphones, BookOpen, ChevronRight, Clock, 
  Brain, Target, Lightbulb, Play, X, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTENT_LIBRARY, ContentItem, ContentDifficulty } from "@/lib/contentLibrary";
import { NEURO_LAB_AREAS, NeuroLabArea } from "@/lib/neuroLab";

interface SessionPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionName: string;
  sessionDescription: string;
  recommendedAreas: NeuroLabArea[];
  contentDifficulty: ContentDifficulty;
}

const AREA_ICONS: Record<string, React.ElementType> = {
  focus: Target,
  reasoning: Brain,
  creativity: Lightbulb,
};

const DIFFICULTY_LABELS: Record<ContentDifficulty, string> = {
  light: "Light",
  medium: "Medium",
  dense: "Deep",
};

type ActivityType = "game" | "podcast" | "reading" | "book";

interface ActivityOption {
  type: ActivityType;
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  icon: React.ElementType;
  area?: NeuroLabArea;
}

export function SessionPicker({
  open,
  onOpenChange,
  sessionName,
  sessionDescription,
  recommendedAreas,
  contentDifficulty,
}: SessionPickerProps) {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);

  // Get recommended games
  const gameOptions: ActivityOption[] = recommendedAreas.map((areaId) => {
    const area = NEURO_LAB_AREAS.find((a) => a.id === areaId);
    return {
      type: "game" as const,
      id: areaId,
      title: area?.title || areaId,
      subtitle: area?.subtitle || "",
      duration: "5-15 min",
      icon: AREA_ICONS[areaId] || Brain,
      area: areaId,
    };
  });

  // Get recommended content based on difficulty
  const getContentOptions = (format: "podcast" | "reading" | "book"): ActivityOption[] => {
    const content = CONTENT_LIBRARY.filter(
      (c) => c.format === format && c.difficulty === contentDifficulty
    ).slice(0, 2);

    const iconMap = {
      podcast: Headphones,
      reading: BookOpen,
      book: BookOpen,
    };

    return content.map((c) => ({
      type: format as ActivityType,
      id: c.id,
      title: c.title,
      subtitle: c.author || c.description,
      duration: `${c.durationMinutes} min`,
      icon: iconMap[format],
    }));
  };

  const podcastOptions = getContentOptions("podcast");
  const readingOptions = getContentOptions("reading");
  const bookOptions = getContentOptions("book");

  const handleSelectGame = (areaId: NeuroLabArea) => {
    onOpenChange(false);
    navigate(`/neuro-lab/${areaId}?daily=true`);
  };

  const handleSelectContent = (content: ActivityOption) => {
    // For now, just close - you can add content tracking later
    onOpenChange(false);
    // Could navigate to content player or mark as started
  };

  const categories = [
    {
      type: "game" as const,
      label: "Cognitive Games",
      icon: Gamepad2,
      options: gameOptions,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      type: "podcast" as const,
      label: "Podcasts",
      icon: Headphones,
      options: podcastOptions,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
    },
    {
      type: "reading" as const,
      label: "Readings",
      icon: BookOpen,
      options: readingOptions,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
    },
    {
      type: "book" as const,
      label: "Book Chapters",
      icon: BookOpen,
      options: bookOptions,
      color: "text-violet-400",
      bgColor: "bg-violet-400/10",
    },
  ].filter((cat) => cat.options.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto p-0 gap-0 bg-background border-border/50 overflow-hidden max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/30 p-4">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-[10px] text-primary font-medium uppercase tracking-wide">
                Today's Session
              </span>
            </div>
            <DialogTitle className="text-[16px] font-semibold">
              {sessionName}
            </DialogTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {sessionDescription} • Choose an activity
            </p>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5">
          {/* Difficulty indicator */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/30">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-muted-foreground">
                Recommended difficulty
              </p>
              <p className="text-[13px] font-medium">
                {DIFFICULTY_LABELS[contentDifficulty]} cognitive load
              </p>
            </div>
          </div>

          {/* Activity Categories */}
          {categories.map((category) => (
            <div key={category.type} className="space-y-2">
              <div className="flex items-center gap-2">
                <category.icon className={cn("w-4 h-4", category.color)} />
                <h3 className="text-[12px] font-semibold text-foreground">
                  {category.label}
                </h3>
              </div>

              <div className="space-y-2">
                {category.options.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      option.type === "game" && option.area
                        ? handleSelectGame(option.area)
                        : handleSelectContent(option)
                    }
                    className={cn(
                      "w-full p-3 rounded-xl border transition-all duration-200 text-left",
                      "bg-card/50 hover:bg-card/80 border-border/30 hover:border-primary/30",
                      "flex items-center gap-3"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        category.bgColor
                      )}
                    >
                      <option.icon className={cn("w-5 h-5", category.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-medium line-clamp-1">
                        {option.title}
                      </h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {option.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {option.duration}
                      </span>
                      {option.type === "game" ? (
                        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                          <Play className="w-3.5 h-3.5 text-primary-foreground fill-current" />
                        </div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
