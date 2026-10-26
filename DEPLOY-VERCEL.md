# Deploy Undangan Nafi' & Musa ke Vercel

Project ini adalah HTML/CSS/JavaScript statis + 4 Node.js Vercel Functions di folder `api/`.
Tidak perlu Next.js, Express, server Node permanen, atau build frontend.

## Yang sudah diimplementasikan

- `api/rsvp.js`: baca dan simpan RSVP ke `rsvp/*.json`.
- `api/wishes.js`: baca dan simpan ucapan ke `wishes/*.json`.
- `api/_lib/store.js`: menyimpan ke folder `.data/` saat development lokal, dan menggunakan **Private Vercel Blob** saat Vercel Preview/Production (`VERCEL_ENV`).
- `api/export-rsvp.js` dan `api/export-wishes.js`: ekspor CSV dengan header `x-admin-key`, menggunakan secret `ADMIN_EXPORT_KEY`.
- `@vercel/blob` sudah ada di `package.json`, sehingga **tidak perlu kode Next.js `AvatarUploadPage`**.

## 1. Deploy melalui GitHub

1. Extract ZIP dan upload **isi folder**, bukan file ZIP, ke root repository GitHub (`index.html`, `api/`, `css/`, `js/`, `images/`, `audio/`, `package.json`, `vercel.json`).
2. Buka https://vercel.com/new dan import repository tersebut.
3. Gunakan **Framework Preset: Other**, **Root Directory: `./`**, **Build Command: kosong/default**, dan **Output Directory: default**. Jangan memilih `dist` atau `build`.
4. Deploy project. Perubahan selanjutnya ke branch Production akan memicu deployment otomatis jika integrasi Git aktif.

## 2. Hubungkan Private Blob Storage

1. Pada dashboard Vercel, buka **Storage**, buat Blob store dengan access **Private** (jika belum ada), lalu **connect** ke project undangan.
2. Di halaman Blob Store, cek bagian **Projects** dan pastikan nama project undangan muncul serta terhubung untuk **Production** (Preview bila dibutuhkan).
3. Di **Project > Settings > Environment Variables**, integrasi **OIDC** yang lebih baru biasanya menyertakan `BLOB_STORE_ID` dan, bila digunakan, `BLOB_WEBHOOK_PUBLIC_KEY`. `VERCEL_OIDC_TOKEN` merupakan kredensial sementara yang dikelola otomatis oleh Vercel, tidak perlu dibuat atau disalin manual ke project.
4. Alternatif untuk setup yang menggunakan token lama: tambahkan `BLOB_READ_WRITE_TOKEN` yang benar dari Vercel Blob ke environment **Production**, **tanpa** memasukkannya ke file kode atau repository.
5. Setelah membuat/mengubah koneksi Blob atau environment variables, lakukan **Deployments > Production deployment > ... > Redeploy**, dan pastikan status deployment baru **Ready**.

**Penting:** `BLOB_STORE_ID` saja bukan kredensial untuk mengakses Blob. Jika runtime tidak menerima token OIDC dan tidak ada token read/write, API akan gagal dengan `BlobError: No blob credentials found`. Source code tidak dapat membuat kredensial secara otomatis; koneksi harus disediakan oleh Vercel.

## 3. Konfigurasi export

Buka **Project > Settings > Environment Variables** dan tambahkan `ADMIN_EXPORT_KEY` untuk Production. Gunakan secret kuat, lalu redeploy. Secret ini **hanya untuk export**, tidak diperlukan agar RSVP dapat menyimpan data.

## 4. Uji setelah deployment

1. Buka `https://DOMAIN-ANDA/`, pastikan halaman dan gambar tampil.
2. Buka `https://DOMAIN-ANDA/api/rsvp` dan `https://DOMAIN-ANDA/api/wishes`. Respons awal di store kosong: `{ "data": [] }`.
3. Kirim satu RSVP, lalu satu ucapan dari website; refresh halaman untuk memastikan data terbaca.
4. Pada Blob Store > **Manage Blobs**, seharusnya muncul file baru pada folder `rsvp/` dan `wishes/`.
5. Jika ada error `500`, buka **Project > Logs**, cari request `POST /api/rsvp` atau `POST /api/wishes`, lalu baca error backend. Jangan pernah membagikan nilai token.

### Ekspor CSV (admin)

```bash
curl -H 'x-admin-key: SECRET_ADMIN_ANDA' \
  'https://DOMAIN-ANDA/api/export-rsvp' \
  -o daftar-kehadiran.csv

curl -H 'x-admin-key: SECRET_ADMIN_ANDA' \
  'https://DOMAIN-ANDA/api/export-wishes' \
  -o doa-ucapan.csv
```

## Development lokal (opsional)

```bash
npm ci
npx vercel dev
```

Jalankan di root project. Data development akan ditulis pada `.data/rsvp/` dan `.data/wishes/`; folder ini tidak ikut di-commit. Vercel CLI tidak perlu dipasang global jika deploy via GitHub.

## Catatan keamanan

Private Blob menjaga agar file JSON tidak bisa diakses langsung tanpa autentikasi Blob. Namun pada implementasi website ini, endpoint `GET /api/rsvp` dan `GET /api/wishes` **saat ini tetap publik** untuk mendukung UI. Jangan menganggap seluruh data tamu pribadi hanya karena Blob Store menggunakan Private.
