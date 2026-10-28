// Template dibuat ulang tiap pindah halaman: isi halaman memudar masuk (tanpa bergeser), sidebar/navigasi (di layout) tetap diam.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-5 animate-masuk">{children}</div>;
}
