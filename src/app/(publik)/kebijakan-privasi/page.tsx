import type { Metadata } from "next";
import { DokumenHukum, HeroDokumen, Kontak } from "@/components/ngebola/dokumen-hukum";
import { KerangkaPublik } from "@/components/ngebola/kerangka-publik";

export const metadata: Metadata = { title: "Kebijakan Privasi" };

export default async function Page() {
  return (
    <KerangkaPublik hero={<HeroDokumen judul="Kebijakan Privasi" />}>
      <DokumenHukum
        ringkas="Kami hanya meminta data yang dibutuhkan untuk mempertemukan club, mencatat hasil, dan menjaga kepercayaan. Profil pemain tidak pernah tampil di halaman publik, lokasimu hanya diambil saat kamu mengetuk tombolnya, dan kamu bisa menghapus akun kapan saja."
        lainnya={{ href: "/syarat-layanan", label: "Syarat Layanan" }}
        bagian={[
          {
            judul: "Data yang kami kumpulkan",
            isi: (
              <>
                <p>
                  <b>Semua akun:</b> nama, email, tanggal lahir (hanya untuk memastikan usia minimal 17 tahun), password (disimpan dalam bentuk hash, tidak bisa dibaca siapa pun), peran, serta waktu dan versi persetujuanmu.
                </p>
                <p>
                  <b>Admin club:</b> data club (nama, area, level, tahun berdiri, deskripsi, logo, warna, galeri) dan <b>nomor HP pengurus</b> yang hanya dilihat Admin platform untuk verifikasi.
                </p>
                <p>
                  <b>Pemain:</b> foto (opsional), posisi, kaki dominan, area, keanggotaan skuad, dan konfirmasi ikut/tidak ikut tiap match.
                </p>
                <p>
                  <b>Aktivitas:</b> match, jadwal, skor, hasil, sengketa beserta bukti tautan, penilaian sportivitas, isi chat antar admin club, laporan pengguna, dan pemberitahuan.
                </p>
                <p>
                  <b>Lokasi (GPS):</b> hanya bila kamu mencentang opsi saat check-in atau mengetuk tombol bagikan lokasi di chat. Kami tidak melacak lokasimu di latar belakang.
                </p>
                <p>
                  <b>Teknis:</b> cookie sesi masuk, langganan notifikasi push perangkatmu (bila kamu mengaktifkannya), dan catatan percobaan masuk/reset password untuk mencegah penyalahgunaan.
                </p>
              </>
            ),
          },
          {
            judul: "Untuk apa data dipakai",
            isi: (
              <ul>
                <li>Membuat dan mengelola akun, club, dan skuad.</li>
                <li>Mencari lawan, mengatur jadwal, mencatat skor, dan menghitung rating, keandalan, serta sportivitas club.</li>
                <li>Mengirim pemberitahuan dan pengingat match (dalam aplikasi, push, dan email untuk hal penting).</li>
                <li>Memverifikasi club, memutus sengketa, dan menangani laporan penyalahgunaan.</li>
                <li>Menjaga keamanan dan integritas catatan (log audit).</li>
              </ul>
            ),
          },
          {
            judul: "Siapa yang bisa melihat datamu",
            isi: (
              <>
                <p>
                  <b>Publik (tanpa login)</b> hanya melihat club: profil, statistik, match terbuka, dan leaderboard. <b>Profil pemain tidak pernah tampil di halaman publik.</b>
                </p>
                <p>
                  Profil pemain terlihat oleh dirimu sendiri, admin club tempatmu bergabung, sesama anggota skuad, dan Admin platform. Chat match hanya bisa ditulis kedua admin club peserta; Admin platform dapat membacanya untuk moderasi dan sengketa. Nomor HP pengurus hanya terlihat Admin platform.
                </p>
              </>
            ),
          },
          {
            judul: "Pihak ketiga",
            isi: (
              <ul>
                <li>
                  <b>Layanan email (Resend)</b> untuk mengirim tautan reset password, status registrasi, dan keputusan sengketa. Alamat emailmu diteruskan ke layanan ini hanya untuk pengiriman.
                </li>
                <li>
                  <b>Layanan push peramban/sistem</b> (mis. Google, Apple, Mozilla) mengantar notifikasi bila kamu mengaktifkannya. Isi push singkat dan umum, tanpa isi chat atau bukti.
                </li>
                <li>Penyedia hosting yang menyimpan data aplikasi.</li>
              </ul>
            ),
          },
          {
            judul: "Berapa lama data disimpan",
            isi: (
              <>
                <p>Data akun disimpan selama akunmu aktif. Sesi masuk berakhir otomatis setelah 30 hari; tautan reset password berlaku 30 menit.</p>
                <p>
                  Saat kamu menghapus akun, nama, email, tanggal lahir, foto, profil, dan pemberitahuanmu dihapus atau dianonimkan. <b>Hasil match, skor, keputusan sengketa, rating, dan log audit tetap tersimpan tanpa identitas pribadi</b>, karena catatan itu menjadi dasar kepercayaan club lain dan tidak boleh diubah.
                </p>
              </>
            ),
          },
          {
            judul: "Hakmu",
            isi: (
              <ul>
                <li>
                  <b>Mengakses dan memperbaiki</b> datamu: ubah profil di menu Profil (pemain) atau Club (admin club).
                </li>
                <li>
                  <b>Menghapus akun:</b> pemain dapat menghapusnya sendiri di menu Profil (butuh password). Admin club dan Admin platform menghubungi kami karena akunnya terkait club dan log audit.
                </li>
                <li>
                  <b>Menarik persetujuan:</b> menghapus akun berarti menarik persetujuan. Notifikasi push bisa dimatikan kapan saja di halaman Pemberitahuan.
                </li>
                <li>
                  <b>Mengajukan pertanyaan atau keberatan</b> tentang pengolahan datamu ke <Kontak />.
                </li>
              </ul>
            ),
          },
          {
            judul: "Keamanan",
            isi: <p>Password disimpan sebagai hash, sesi memakai cookie yang tidak bisa dibaca skrip halaman, setiap akses data diperiksa di server sesuai perannya, dan tindakan Admin platform dicatat di log audit. Tidak ada sistem yang sepenuhnya kebal; bila terjadi kebocoran yang berdampak padamu, kami akan memberi tahu.</p>,
          },
          {
            judul: "Usia dan perubahan kebijakan",
            isi: <p>Ngebola untuk pengguna berusia 17 tahun ke atas. Bila kebijakan ini berubah secara berarti, kami memberi tahu di aplikasi dan menaikkan versinya. Pertanyaan? Hubungi <Kontak />.</p>,
          },
        ]}
      />
    </KerangkaPublik>
  );
}
