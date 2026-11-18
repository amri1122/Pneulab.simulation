# Pneulab — Media Simulasi Sistem Kendali Elektropneumatik

> **Media Pembelajaran Interaktif Siswa Kelas XI Teknik Instalasi Tenaga Listrik (TITL)**  
> **SMK Negeri 1 Padang**  
> Standar Baku: **ISO 1219-1** (Simbol Pneumatik) & **IEC 60617** (Simbol Kelistrikan)

---

## 📌 Ringkasan Proyek

**Pneulab** adalah aplikasi simulasi web murni (*zero-dependency, offline-first*) yang dirancang khusus untuk mendukung pembelajaran praktik sistem kontrol elektropneumatik pada kompetensi keahlian Teknik Instalasi Tenaga Listrik (TITL) di SMK Negeri 1 Padang.

Aplikasi ini memungkinkan siswa merancang, menyambungkan (*wiring & tubing*), serta menguji sirkuit pneumatik murni dan kontrol elektropneumatik (tangga kendali 24V DC / *ladder diagram*) secara interaktif langsung dari peramban web modern tanpa instalasi rumit.

---

## ⚡ Fitur Utama

1. **Mesin Simulasi Hybrid Real-Time (*SimEngine*)**:
   - Menghitung propagasi tekanan fluida udara kerja (6.0 bar) dan aliran arus kendali 24V DC secara simultan.
   - Mendukung penuh percabangan (*junction nets*) dua arah pada instalasi kelistrikan maupun pemipaan pneumatik.
   - Pemodelan fisika silinder kerja tunggal dan kerja ganda dengan mempertimbangkan perbedaan luas penampang piston (*area differential*).
   - Pengoperasian interaktif melalui tombol tekan manual di sirkuit maupun bar kendali bawah (*Press & Lock/Latch*).
2. **Kesesuaian Standar Industri (ISO & IEC)**:
   - **ISO 1219-1:** Simbol katup 3/2, katup 5/2, katup 5/3, katup logika AND/OR, kompresor, dan unit FRL dengan penomoran port baku `1(P)`, `2(A)`, `3(R)`, `4(B)`, `5(S)`, serta pilot `12`/`14`.
   - **IEC 60617:** Simbol catu daya 24V DC, tombol NO/NC, relay kontrol K1/K2, kontak bantu NO/NC, kumparan solenoid Y1/Y2, saklar batas mekanik (*limit switch*), dan lampu indikator panel.
3. **Orthogonal 90° Routing (Manhattan Style)**:
   - Jalur kabel dan selang digambar secara otomatis membentuk sudut siku-siku rapi standar gambar teknik industri.
4. **Validasi Aturan Keteknikan (*Domain Safety*)**:
   - Menolak koneksi silang berbahaya (misal: memasang selang angin bertekanan ke terminal listrik 24V DC).
5. **Mesin Diagnostik & Pemecahan Masalah (*Troubleshooting Engine*)**:
   - Menganalisis rangkaian secara otomatis untuk mendeteksi ketiadaan kompresor, ketiadaan catu daya DC, port katup 1(P) yang belum tersambung, dan ketidaksesuaian tag solenoid antara diagram daya dan kontrol.
6. **Dukungan Layar Sentuh & Tablet (*Pointer Events*)**:
   - Mendukung penggunaan mouse, jari pada layar sentuh (iPad/Android/Chromebook), serta stylus pen secara mulus dengan proteksi `touch-action: none`.
7. **Modul Pembelajaran & Kuis Formatif Terintegrasi**:
   - **Materi 1:** Rangkaian Pneumatik Langsung (*Direct Control* Katup 3/2 & Silinder Tunggal).
   - **Materi 2:** Rangkaian Pneumatik Tak Langsung (*Indirect Control* Pilot 5/2 & Silinder Ganda).
   - **Materi 3:** Rangkaian Elektropneumatik (Solenoid Valve 24V DC & Ladder Kelistrikan).
   - Dilengkapi kuis pengetahuan TITL dengan penilaian otomatis dan pembahasan jawaban.
8. **Penyimpanan Lokal (*Local Storage*)**:
   - Skema rangkaian dapat disimpan ke memori peramban dan dimuat kembali kapan saja.

---

## 📂 Struktur Berkas

```text
electropneusim/
│
├── assets/             # Berkas aset visual & identitas merek Pneulab
│   ├── logo-pneulab.png       # Logo resolusi penuh acuan desain (1536x1024)
│   ├── logo-pneulab-full.png  # Logo lengkap (lambang + tipografi Pneulab)
│   └── logo-pneulab-icon.png  # Ikon/mark Pneulab (favicon & header mobile)
│
├── index.html          # Halaman utama aplikasi (modular, memuat CSS & JS terpisah)
├── style.css           # Desain tampilan & layout responsif (CSS variables)
├── script.js           # Mesin utama (State, SVG Generator, Routing, SimEngine, Kuis)
│
├── index_single.html   # Distribusi berkas tunggal (All-in-one HTML + inlined CSS & JS)
│                       # Siap pakai langsung tanpa dependensi & bebas mojibake
│
├── build.ps1           # Skrip build PowerShell untuk kompilasi index_single.html
├── build.js            # Skrip build Node.js alternatif untuk kompilasi index_single.html
└── README.md           # Dokumentasi teknis dan panduan operasional proyek
```

---

## 🚀 Panduan Menjalankan

### Cara 1: Menggunakan Berkas Mandiri (Paling Mudah)
Cukup klik ganda (*double-click*) pada berkas **[`index_single.html`](./index_single.html)**. Berkas ini sudah menggabungkan seluruh stylesheet dan skrip dalam satu file ber-encoding UTF-8 murni.

### Cara 2: Menjalankan Berkas Modular
Buka berkas **[`index.html`](./index.html)** di peramban web modern (Google Chrome, Microsoft Edge, Mozilla Firefox, atau Safari).

---

## ⌨️ Pintasan Keyboard (*Shortcuts*)

| Tombol / Pintasan | Fungsi |
| :--- | :--- |
| `Del` / `Backspace` | Menghapus komponen atau garis koneksi yang sedang dipilih (Mode Edit) |
| `Esc` | Membatalkan penarikan koneksi, menutup modal, atau membatalkan pilihan |
| `+` / `=` | Memperbesar tampilan kanvas (*Zoom In*) |
| `-` / `_` | Memperkecil tampilan kanvas (*Zoom Out*) |
| `0` | Menyesuaikan ukuran tampilan (*Zoom to Fit*) |
| `Ctrl + S` | Menyimpan rangkaian ke memori browser (*Local Storage*) |
| `Roda Mouse (Scroll)` | Zoom kanvas secara halus |
| `Klik & Geser Kanvas` | Menggeser area kerja (*Pan Canvas*) |

---

## 🛠️ Panduan Build / Kompilasi Ulang Distribusi

Jika Anda melakukan perubahan pada [`style.css`](./style.css) atau [`script.js`](./script.js), Anda dapat mengompilasi ulang berkas distribusi tunggal [`index_single.html`](./index_single.html) secara otomatis:

### Menggunakan PowerShell (Windows):
```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

### Menggunakan Node.js:
```bash
node build.js
```

Kedua skrip ini menjamin file output [`index_single.html`](./index_single.html) ditulis dalam format **UTF-8 murni** tanpa menimbulkan kerusakan karakter Unicode (*mojibake*).

---

## 🎓 Kurikulum & Capaian Pembelajaran

Dikembangkan untuk memenuhi Capaian Pembelajaran (CP) dan Tujuan Pembelajaran (TP) pada mata pelajaran Konsentrasi Keahlian **Teknik Instalasi Tenaga Listrik (TITL)**:
- Memahami prinsip kerja dan simbol komponen sistem pneumatik dan elektropneumatik.
- Merangkai dan menguji sistem kendali pneumatik langsung dan tak langsung.
- Merancang dan memecahkan masalah (*troubleshooting*) sirkuit kendali elektropneumatik industri.

---
*Pneulab © SMK Negeri 1 Padang — Teknik Instalasi Tenaga Listrik (TITL)*
