// Peran Pemain ditahan dulu: pendaftaran & promosi publik disembunyikan. Nyalakan lagi dengan FITUR_PEMAIN=1.
// Akun pemain yang sudah ada tetap bisa masuk; kodenya tidak dihapus.
export const PEMAIN_AKTIF = process.env.FITUR_PEMAIN === "1"
