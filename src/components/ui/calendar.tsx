"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { id } from "react-day-picker/locale"
import { CaretDownIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

const HARI_PENDEK = ["MG", "SN", "SL", "RB", "KM", "JM", "SB"]

// Form.html "Tanggal main": Senin di kiri, hari ini = bingkai hijau, terpilih = isi hijau + bayangan emas.
function Calendar({ className, classNames, showOutsideDays = true, ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={id}
      weekStartsOn={1}
      showOutsideDays={showOutsideDays}
      className={cn("w-[280px] text-[13px]", className)}
      formatters={{
        formatWeekdayName: (d) => HARI_PENDEK[d.getDay()],
        formatMonthDropdown: (d) => d.toLocaleString("id-ID", { month: "short" }),
      }}
      classNames={{
        months: "relative",
        month: "flex flex-col gap-3",
        month_caption: "flex h-9 items-center justify-center px-11",
        caption_label: "flex items-center gap-1 text-[15px] font-extrabold [&>svg]:size-4 [&>svg]:text-hijau",
        dropdowns: "flex items-center gap-1.5",
        dropdown_root:
          "relative flex h-9 items-center rounded-kecil border-2 border-hijau bg-krem-terang px-2 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-hijau",
        dropdown: "absolute inset-0 cursor-pointer opacity-0",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous:
          "inline-flex size-9 items-center justify-center rounded-kecil border-2 border-hijau text-hijau outline-none hover:bg-white focus-visible:outline-3 focus-visible:outline-hijau disabled:border-nonaktif-tepi disabled:text-nonaktif-teks",
        button_next:
          "inline-flex size-9 items-center justify-center rounded-kecil border-2 border-hijau text-hijau outline-none hover:bg-white focus-visible:outline-3 focus-visible:outline-hijau disabled:border-nonaktif-tepi disabled:text-nonaktif-teks",
        month_grid: "w-full border-separate border-spacing-1",
        weekdays: "",
        weekday: "text-center text-[11px] font-extrabold text-emas-tua",
        week: "",
        day: "p-0 text-center font-semibold",
        day_button:
          "inline-flex h-[34px] w-full items-center justify-center rounded-kecil border-2 border-transparent outline-none hover:border-nonaktif-tepi focus-visible:outline-3 focus-visible:outline-hijau disabled:hover:border-transparent",
        today: "[&>button]:border-hijau [&>button]:font-extrabold",
        selected:
          "[&>button]:border-hijau [&>button]:bg-hijau [&>button]:font-extrabold [&>button]:text-krem [&>button]:shadow-keras-sm [&>button]:shadow-emas",
        outside: "text-redup",
        disabled: "text-redup [&>button]:cursor-not-allowed",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: c }) =>
          orientation === "left" ? (
            <CaretLeftIcon weight="bold" className={cn("size-4", c)} />
          ) : orientation === "right" ? (
            <CaretRightIcon weight="bold" className={cn("size-4", c)} />
          ) : (
            <CaretDownIcon weight="bold" className={cn("size-4", c)} />
          ),
      }}
      {...props}
    />
  )
}

export { Calendar }
