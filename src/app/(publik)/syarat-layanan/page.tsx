import type { Metadata } from "next";
import { DokumenHukum, HeroDokumen, Kontak } from "@/components/ngebola/dokumen-hukum";
import { KerangkaPublik } from "@/components/ngebola/kerangka-publik";

export const metadata: Metadata = { title: "Syarat Layanan" };

export default async function Page() {
  return (
    <KerangkaPublik hero={<HeroDokumen judul="Syarat Layanan" />}>
      <DokumenHukum
        ringkas="Ngebola mempertemukan club fun football untuk sparring dan mencatat hasilnya secara adil. Dengan mendaftar, kamu setuju bermain jujur, mengonfirmasi hasil dengan benar, dan menerima keputusan sengketa dari Admin platform."
        lainnya={{ href: "/kebijakan-privasi", label: "Kebijakan Privasi" }}
        bagian={[
          {
            judul: "Tentang layanan",
            isi: <p>Ngebola adalah platform untuk mencari lawan sparring, menyepakati jadwal dan lapangan, mencatat skor, dan membangun reputasi club (rating, keandalan, sportivitas). Ngebola <b>bukan</b> penyedia lapangan, bukan layanan pembayaran atau pemesanan, dan bukan penyelenggara liga resmi.</p>,
          },
          {
            judul: "Akun",
            isi: (
              <ul>
                <li>Usia minimal 17 tahun. Data yang kamu isi harus benar.</li>
                <li>Satu akun Admin club mengelola satu club. Jaga kerahasiaan passwordmu; kamu bertanggung jawab atas aktivitas akunmu.</li>
                <li>Club baru harus disetujui Admin platform sebelum bisa bertanding.</li>
                <li>Pemain bergabung ke skuad lewat undangan atau kode dan disetujui admin club; satu pemain aktif di satu club.</li>
              </ul>
            ),
          },
          {
            judul: "Aturan bermain di Ngebola",
            isi: (
              <ul>
                <li>Hormati lawan dan sepakati jadwal dengan itikad baik. Pembatalan mendadak (kurang dari 24 jam) dan tidak hadir menurunkan skor keandalan club.</li>
                <li>Catat dan konfirmasi skor dengan jujur. Memalsukan skor atau bukti dapat berujung sanksi.</li>
                <li>Dilarang memanipulasi rating (mis. sengaja mengalah, akun ganda, penilaian berbalas), melakukan kekerasan, ancaman, atau pelecehan, dan memakai Ngebola untuk taruhan.</li>
                <li>Isi chat tidak boleh berisi ancaman, kata kasar, atau konten melanggar hukum. Pesan bisa dilaporkan dan disembunyikan moderator.</li>
              </ul>
            ),
          },
          {
            judul: "Hasil, rating, dan sengketa",
            isi: <p>Hasil menjadi resmi bila dikonfirmasi kedua club, atau bila lawan tidak merespons dalam 48 jam. Bila skor berbeda, Admin platform memutus berdasarkan bukti dan <b>keputusannya mengikat</b> untuk catatan di Ngebola. Rating dihitung dari hasil yang sah; hasil WO, sengketa yang dibatalkan, dan pola yang terdeteksi sebagai manipulasi tidak dihitung.</p>,
          },
          {
            judul: "Moderasi dan penangguhan",
            isi: <p>Admin platform dapat memberi peringatan, menangguhkan club, atau menonaktifkan akun yang melanggar syarat ini, dengan alasan yang tercatat. Match terjadwal club yang ditangguhkan dibatalkan tanpa penalti bagi lawan. Untuk moderasi dan sengketa, Admin platform dapat membaca chat match.</p>,
          },
          {
            judul: "Keselamatan dan tanggung jawab",
            isi: <p>Pertandingan berlangsung di dunia nyata, di luar kendali Ngebola. Kamu bermain atas tanggung jawabmu sendiri: pastikan kondisi fisik, kelayakan lapangan, dan kesepakatan biaya dengan lawan. Informasi lapangan dan slot bersifat panduan dan bisa berubah; lapangan manual ditandai belum terverifikasi. Sejauh diizinkan hukum, Ngebola tidak bertanggung jawab atas cedera, kerugian, atau perselisihan di luar aplikasi.</p>,
          },
          {
            judul: "Data pribadi",
            isi: <p>Pengolahan datamu dijelaskan di Kebijakan Privasi. Dengan mendaftar kamu menyatakan telah membacanya.</p>,
          },
          {
            judul: "Perubahan dan kontak",
            isi: <p>Syarat ini dapat berubah; perubahan berarti diumumkan di aplikasi dengan versi baru. Layanan tunduk pada hukum Indonesia. Pertanyaan: <Kontak />.</p>,
          },
        ]}
      />
    </KerangkaPublik>
  );
}
