import { createCn } from "cn/config"

// Daftarkan token kustom dari globals.css supaya penggabung kelas tahu grupnya.
// Tanpa ini `shadow-keras shadow-emas` dianggap bentrok dan bayangan kerasnya terbuang.
export const cn = createCn({
  extend: {
    theme: {
      shadow: ["keras-xs", "keras-sm", "keras", "keras-lg", "keras-xl"],
      radius: ["badge", "kecil", "tombol", "besar", "popover", "kartu", "dialog", "sheet"],
      color: [
        "hijau", "hijau-hover", "hijau-tua", "hijau-garis", "emas", "emas-hover", "emas-tekan", "emas-tua",
        "krem", "krem-terang", "krem-tekan", "krem-redup", "tinta", "teks-2", "placeholder", "redup",
        "merah", "merah-hover", "merah-tekan", "merah-gelap", "kuning-kartu", "nonaktif-bg", "nonaktif-tepi",
        "nonaktif-teks", "kilau", "bg-menunggu", "bg-ditawar", "bg-saran", "bg-error",
      ],
    },
  },
})
