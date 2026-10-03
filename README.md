# Undangan Online — Nafi' & Musa

Project ini dibuat dari `index.html` lama dan dipisahkan tanpa migrasi Tailwind agar visual existing tetap dipertahankan.

## Struktur

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── fallback.js
│   └── app.js
├── api/
│   ├── _lib/
│   │   └── store.js
│   ├── rsvp.js
│   ├── wishes.js
│   ├── export-rsvp.js
│   └── export-wishes.js
├── images/
├── audio/
├── package.json
└── .env.example
```

> Folder `images/` dan `audio/` tetap gunakan asset milik project lama kamu.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Lalu buka:

```text
http://localhost:3000
```

Untuk local development, RSVP dan doa/ucapan otomatis disimpan ke:

```text
.data/rsvp/
.data/wishes/
```

Satu submit menghasilkan satu file JSON. Folder `.data/` sudah masuk `.gitignore`.

## API

### Daftar kehadiran

```text
GET  /api/rsvp
POST /api/rsvp
```

Contoh body:

```json
{
  "name": "Ahmad",
  "status": "Hadir",
  "count": 2,
  "msg": "Insya Allah hadir."
}
```

### Doa dan ucapan

```text
GET  /api/wishes
POST /api/wishes
```

Contoh body:

```json
{
  "name": "Ahmad",
  "text": "Semoga menjadi keluarga sakinah, mawaddah, warahmah."
}
```

## Export CSV

Tambahkan environment variable:

```text
ADMIN_EXPORT_KEY=key-rahasia-kamu
```

Kemudian:

```bash
curl \
  -H "x-admin-key: key-rahasia-kamu" \
  http://localhost:3000/api/export-rsvp \
  -o daftar-kehadiran.csv
```

```bash
curl \
  -H "x-admin-key: key-rahasia-kamu" \
  http://localhost:3000/api/export-wishes \
  -o doa-ucapan.csv
```

Endpoint export juga menerima `?key=...`, tetapi header `x-admin-key` lebih disarankan.

## Deploy Vercel

1. Push project ke GitHub.
2. Import repository di Vercel.
3. Buat/connect **Private Vercel Blob** pada project.
4. Tambahkan `ADMIN_EXPORT_KEY` pada Environment Variables.
5. Deploy ulang.

Di local development project memakai `.data`. Pada Vercel Preview/Production, storage otomatis memakai Private Vercel Blob.

## Catatan asset CSS

Karena CSS dipindah ke `css/style.css`, semua `background-image` dari CSS sudah diarahkan ke `../images/...`.

Sementara `src="images/..."` di HTML dan JavaScript tetap sama karena path tersebut dihitung dari halaman `index.html`.

## Gallery

Loader galeri sekarang mencoba:

```text
images/galeri-1.jpg / .jpeg
...
images/galeri-11.jpg / .jpeg
```

File yang tidak tersedia akan dilewati otomatis.
