"use client";

import * as React from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { es } from "react-day-picker/locale";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Calendario (react-day-picker v9) en español, con lunes como primer día. */
function Calendar({
  className,
  classNames,
  showOutsideDays = false,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const d = getDefaultClassNames();
  return (
    <DayPicker
      locale={es}
      weekStartsOn={1}
      showOutsideDays={showOutsideDays}
      className={cn("w-full p-1 [--cell-size:2.75rem] sm:[--cell-size:3rem]", className)}
      classNames={{
        root: cn("w-fit", d.root),
        months: cn("relative flex flex-col gap-4", d.months),
        month: cn("flex w-full flex-col gap-3", d.month),
        nav: cn("absolute inset-x-0 top-0 flex items-center justify-between", d.nav),
        button_previous: cn(
          "inline-flex size-(--cell-size) cursor-pointer items-center justify-center rounded-full text-brand-900 hover:bg-brand-50 disabled:opacity-30",
          d.button_previous,
        ),
        button_next: cn(
          "inline-flex size-(--cell-size) cursor-pointer items-center justify-center rounded-full text-brand-900 hover:bg-brand-50 disabled:opacity-30",
          d.button_next,
        ),
        month_caption: cn(
          "flex h-(--cell-size) items-center justify-center font-serif text-xl font-semibold text-brand-900 capitalize",
          d.month_caption,
        ),
        month_grid: "w-full border-collapse",
        weekdays: cn("flex", d.weekdays),
        weekday: cn(
          "flex-1 text-[0.75rem] font-medium text-ink-500 capitalize select-none",
          d.weekday,
        ),
        week: cn("mt-1 flex w-full", d.week),
        day: cn("relative flex-1 p-0.5 text-center select-none", d.day),
        day_button: cn(
          "mx-auto flex size-(--cell-size) max-w-full cursor-pointer items-center justify-center rounded-full text-sm font-medium text-brand-900 transition-colors hover:bg-brand-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        ),
        selected:
          "[&>button]:bg-brand-900 [&>button]:text-white [&>button]:hover:bg-brand-800",
        today: "[&>button]:ring-1 [&>button]:ring-brand-300",
        outside: "opacity-40",
        disabled:
          "[&>button]:cursor-not-allowed [&>button]:font-normal [&>button]:text-ink-300 [&>button]:line-through [&>button]:decoration-ink-300/60 [&>button]:hover:bg-transparent",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: c }) =>
          orientation === "left" ? (
            <ChevronLeftIcon className={cn("size-5", c)} />
          ) : (
            <ChevronRightIcon className={cn("size-5", c)} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
