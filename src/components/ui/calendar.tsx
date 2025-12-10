import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-card border border-border/50 rounded-xl shadow-xl", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center gap-1",
        caption_label: "text-sm font-semibold text-foreground",
        caption_dropdowns: "flex items-center gap-2",
        dropdown_month: "relative",
        dropdown_year: "relative",
        dropdown: cn(
          "appearance-none bg-secondary border border-border/60 rounded-lg px-3 py-1.5 pr-8 text-sm font-medium text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
          "cursor-pointer hover:bg-muted/50 transition-colors",
          "[&>option]:bg-card [&>option]:text-foreground"
        ),
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 bg-secondary/50 p-0 hover:bg-secondary hover:text-foreground rounded-lg border border-border/40",
        ),
        nav_button_previous: "absolute left-2",
        nav_button_next: "absolute right-2",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-10 font-medium text-[11px] uppercase tracking-wider",
        row: "flex w-full mt-1",
        cell: cn(
          "h-10 w-10 text-center text-sm p-0 relative rounded-lg",
          "[&:has([aria-selected].day-range-end)]:rounded-r-lg",
          "[&:has([aria-selected].day-outside)]:bg-accent/50",
          "[&:has([aria-selected])]:bg-primary/10",
          "first:[&:has([aria-selected])]:rounded-l-lg",
          "last:[&:has([aria-selected])]:rounded-r-lg",
          "focus-within:relative focus-within:z-20"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-normal rounded-lg hover:bg-secondary hover:text-foreground aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
          "focus:bg-primary focus:text-primary-foreground font-semibold"
        ),
        day_today: "bg-accent/20 text-accent font-semibold ring-1 ring-accent/50",
        day_outside: "day-outside text-muted-foreground/40 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground/30",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        vhidden: "sr-only",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
