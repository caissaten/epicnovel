# EpicNovel - Platform Membaca & CMS Novel Modern

EpicNovel adalah website membaca novel modern, cepat, dan responsif dengan sistem CMS (Content Management System) mandiri terintegrasi penuh menggunakan **React**, **Vite**, **Tailwind CSS**, dan **Firebase** (Authentication, Firestore, Storage). 

Website ini dirancang khusus untuk kemudahan pengelolaan mandiri. Admin dapat mengunggah novel baru, menulis chapter, mengatur kategori, genre, tag, dan mengunggah gambar cover/banner langsung melalui halaman Dashboard Admin berbasis web tanpa perlu menyentuh file HTML atau coding sama sekali.

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

Ikuti langkah demi langkah di bawah ini untuk menginstalasi dan menjalankan website EpicNovel di perangkat komputer Anda (Localhost).

### Langkah 1: Install Node.js
Jika komputer Anda belum memiliki Node.js:
1. Unduh Node.js versi LTS terbaru dari website resmi: [nodejs.org](https://nodejs.org/).
2. Jalankan berkas installer dan ikuti petunjuk instalasi sampai selesai.
3. Untuk memverifikasi instalasi, buka Terminal (macOS/Linux) atau Command Prompt (Windows) dan jalankan perintah:
   ```bash
   node -v
   npm -v
   ```

### Langkah 2: Download & Extract Kode Project
Ekstrak folder project EpicNovel di direktori kerja komputer Anda.

### Langkah 3: Jalankan Perintah npm install
Buka Terminal atau Command Prompt di dalam direktori root project EpicNovel, kemudian jalankan perintah berikut untuk mengunduh semua library dependencies yang dibutuhkan:
```bash
npm install
```

---

## 🔥 Cara Membuat & Mengonfigurasi Firebase Project

Semua data novel, chapter, akun user, dan gambar disimpan langsung secara aman di serverless Firebase milik Anda. Ikuti panduan ini untuk membuat database Firebase:

### Langkah 1: Buat Project di Firebase Console
1. Buka [console.firebase.google.com](https://console.firebase.google.com/) dan login menggunakan akun Google Anda.
2. Klik tombol **"Add Project"** (Tambah Project).
3. Masukkan nama project Anda (misalnya: `my-epicnovel-app`), klik **Continue**.
4. Anda dapat memilih untuk menonaktifkan Google Analytics jika tidak diperlukan, lalu klik **Create Project**.
5. Tunggu sampai Firebase selesai menyiapkan project Anda, kemudian klik **Continue**.

### Langkah 2: Daftarkan Aplikasi Web & Dapatkan Firebase Config
1. Pada halaman Dashboard Firebase Project Anda, klik ikon **Web (`</>`)** di bagian tengah halaman untuk membuat aplikasi baru.
2. Masukkan nama samaran aplikasi (misalnya: `epicnovel-web`), lalu klik **Register app**.
3. Firebase akan menampilkan objek konfigurasi berisi kode-kode unik. Contoh tampilannya adalah sebagai berikut:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyDKUi70u...",
     authDomain: "my-epicnovel-app.firebaseapp.com",
     projectId: "my-epicnovel-app",
     storageBucket: "my-epicnovel-app.firebasestorage.app",
     messagingSenderId: "780653338717",
     appId: "1:780653338717:web:354ec0e45b7c60836cedb4"
   };
   ```
4. Salin semua nilai di dalam objek konfigurasi tersebut. Kita akan memasukkannya ke file `.env.local` nanti.

### Langkah 3: Aktifkan Firestore Database
1. Pada menu sidebar Firebase Console sebelah kiri, klik **Firestore Database** di bawah tab *Build*.
2. Klik tombol **"Create database"** (Buat database).
3. Pilih lokasi server database terdekat (disarankan memilih region yang paling dekat dengan target pembaca Anda, misalnya `asia-east1` untuk wilayah Indonesia/Asia).
4. Klik **Next**, pilih **"Start in test mode"** (Mulai dalam mode pengujian), lalu klik **Create**.

### Langkah 4: Aktifkan Firebase Storage (Tempat Menyimpan Gambar Cover/Banner)
1. Pada menu sidebar Firebase Console sebelah kiri, klik **Storage** di bawah tab *Build*.
2. Klik tombol **"Get started"** (Mulai).
3. Pilih **"Start in test mode"** (Mulai dalam mode pengujian) agar dapat langsung diunggah dari localhost, klik **Next**.
4. Klik **Done** untuk membuat storage bucket Anda.

### Langkah 5: Aktifkan Firebase Authentication (Login Google)
1. Pada menu sidebar Firebase Console sebelah kiri, klik **Authentication** di bawah tab *Build*.
2. Klik tombol **"Get started"** (Mulai).
3. Pada tab **Sign-in method**, pilih penyedia **Google**.
4. Klik tombol toggle **Enable** (Aktifkan).
5. Pilih email dukungan project Anda, lalu klik **Save** (Simpan).

---

## 🛠️ Cara Mengisi File Konfigurasi `.env.local`

Untuk menghubungkan website lokal Anda dengan database Firebase yang baru saja dibuat, Anda harus membuat berkas konfigurasi bernama `.env.local`.

1. Di dalam folder root project EpicNovel, buat file baru bernama `.env.local` (atau duplikasi `.env.example` dan ubah namanya menjadi `.env.local`).
2. Masukkan konfigurasi Firebase Anda dengan format berikut (pastikan tidak ada spasi di sekitar tanda `=`):

```env
# .env.local

# Masukkan Firebase API Key milik Anda
VITE_FIREBASE_API_KEY="API_KEY_FIREBASE_MILIK_SAYA"

# Masukkan Auth Domain Firebase milik Anda
VITE_FIREBASE_AUTH_DOMAIN="AUTH_DOMAIN_FIREBASE_MILIK_SAYA"

# Masukkan Project ID Firebase milik Anda
VITE_FIREBASE_PROJECT_ID="PROJECT_ID_FIREBASE_MILIK_SAYA"

# Masukkan Storage Bucket Firebase milik Anda
VITE_FIREBASE_STORAGE_BUCKET="STORAGE_BUCKET_FIREBASE_MILIK_SAYA"

# Masukkan Messaging Sender ID Firebase milik Anda
VITE_FIREBASE_MESSAGING_SENDER_ID="MESSAGING_SENDER_ID_FIREBASE_MILIK_SAYA"

# Masukkan App ID Firebase milik Anda
VITE_FIREBASE_APP_ID="APP_ID_FIREBASE_MILIK_SAYA"
```

**CONTOH SEBELUM:**
```env
VITE_FIREBASE_API_KEY="MY_GEMINI_API_KEY"
```

**CONTOH SESUDAH DIGANTI:**
```env
VITE_FIREBASE_API_KEY="AIzaSyDKUi70uKj6TSsTkSgWh_ZD-GDBOs35tpw"
```

---

## 👑 Konfigurasi Email Administrator (Menentukan Siapa Adminnya)

Untuk mengamankan website agar tidak sembarang pengunjung dapat mengunggah atau menghapus novel, Anda harus menambahkan email Google Anda ke dalam daftar Administrator:

1. Buka file `/src/config/admin.ts`.
2. Cari variabel array `ADMIN_EMAILS` di baris 37:
   ```typescript
   export const ADMIN_EMAILS = [
     "caissaorg@gmail.com",   // Ganti dengan email Google Anda
     "admin@example.com",     // Ganti atau hapus
   ];
   ```
3. Ganti `"caissaorg@gmail.com"` atau tambahkan email Google milik Anda di dalam array tersebut.
4. Simpan file `/src/config/admin.ts`.
5. Pengguna yang login menggunakan email tersebut melalui tombol **Login** otomatis akan melihat tombol menu **Admin Dashboard** di pojok kanan atas layar dan memiliki akses penuh untuk menulis novel/chapter, menambah kategori/genre/tag, serta mengubah pengaturan situs!

---

## 💻 Cara Menjalankan Website Secara Lokal

Untuk menjalankan server pengembangan lokal EpicNovel, buka Terminal di folder project dan jalankan perintah:
```bash
npm run dev
```
Website Anda sekarang dapat diakses secara langsung melalui browser di alamat:
👉 **`http://localhost:3000`** atau **`http://localhost:5173`** (sesuai port yang ditampilkan di Terminal).

---

## 🚀 Cara Deploy ke Vercel

EpicNovel sangat kompatibel dan dapat dideploy ke Vercel secara gratis dengan sangat cepat!

### Langkah 1: Persiapan Project ke GitHub
1. Hubungkan folder project Anda ke repositori GitHub pribadi Anda.
2. Commit semua kode ke cabang `main` repositori GitHub tersebut.

### Langkah 2: Import Project di Vercel Dashboard
1. Buka [vercel.com](https://vercel.com/) dan login menggunakan akun GitHub Anda.
2. Klik tombol **"Add New"** -> **"Project"** di pojok kanan atas Vercel Dashboard.
3. Hubungkan akun GitHub Anda, cari nama repositori `epicnovel` Anda, lalu klik **Import**.

### Langkah 3: Masukkan Environment Variables di Vercel
Pada bagian konfigurasi sebelum menekan Deploy, buka tab **Environment Variables** dan masukkan variabel-variabel berikut satu persatu (sama seperti isi berkas `.env.local` Anda):

1. Key: `VITE_FIREBASE_API_KEY` | Value: `AIzaSyDKUi70u...`
2. Key: `VITE_FIREBASE_AUTH_DOMAIN` | Value: `my-epicnovel-app.firebaseapp.com`
3. Key: `VITE_FIREBASE_PROJECT_ID` | Value: `my-epicnovel-app`
4. Key: `VITE_FIREBASE_STORAGE_BUCKET` | Value: `my-epicnovel-app.firebasestorage.app`
5. Key: `VITE_FIREBASE_MESSAGING_SENDER_ID` | Value: `780653338717`
6. Key: `VITE_FIREBASE_APP_ID` | Value: `1:780653338717:web:354ec0e45b7c60836cedb4`

### Langkah 4: Deploy!
1. Klik tombol **Deploy**.
2. Vercel akan mem-build project Anda dalam waktu kurang dari 1 menit.
3. Selamat! Website EpicNovel Anda sudah online dan dapat diakses publik dengan subdomain gratis dari Vercel (misalnya: `https://epicnovel.vercel.app`).

---

## 🛡️ Aturan Keamanan Firebase (Firestore Security Rules)

Untuk mengamankan database Firebase Anda di server production, salin konfigurasi keamanan berikut dan tempelkan di menu **Firestore Database** -> **Rules** di Firebase Console:

1. Buka file `/firestore.rules` di folder project Anda.
2. Salin seluruh isinya.
3. Di Firebase Console, buka menu **Firestore Database** -> tab **Rules**.
4. Hapus seluruh isi rules bawaan, paste-kan rules dari `/firestore.rules`, lalu klik **Publish**.

---

## 🔄 Cara Memperbarui Website di Masa Depan

Setelah website dideploy, Anda **TIDAK PERLU MENYENTUH KODE LAGI** saat ingin:
- Menambah novel baru.
- Menulis chapter baru atau mengedit sinopsis.
- Mengubah cover/banner novel.
- Mengelola genre, kategori, dan tag.

Semua kegiatan tersebut dilakukan secara visual dan instan langsung melalui **Admin Dashboard** berbasis web di alamat `https://website-anda.vercel.app/#/admin` setelah Anda login menggunakan email Google Anda yang sudah terdaftar di `src/config/admin.ts`.

Jika Anda ingin mengubah kode (misalnya mengubah desain tata letak atau menambahkan fitur baru):
1. Lakukan perubahan pada kode lokal Anda.
2. Test di localhost untuk memastikan tidak ada error.
3. Jalankan `git add .`, `git commit -m "Update design"`, dan `git push origin main` ke GitHub.
4. Vercel secara otomatis akan mendeteksi perubahan tersebut dan memperbarui website online Anda dalam hitungan detik secara otomatis!
