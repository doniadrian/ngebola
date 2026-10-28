"use client"

import { useFormStatus } from "react-dom"
import { Button, type ButtonProps } from "@/components/ui/button"

/** Tombol submit yang otomatis memuat selama form dikirim (cegah kirim dua kali). */
export function TombolKirim(props: Omit<ButtonProps, "type" | "loading">) {
  const { pending } = useFormStatus()
  return <Button type="submit" loading={pending} {...props} />
}
