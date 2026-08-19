# 🌤️ Weather Dashboard

Aplikasi web modern untuk menampilkan informasi cuaca real-time dari seluruh dunia. Dibuat dengan HTML, CSS, dan JavaScript vanilla dengan integrasi **Open-Meteo API** (gratis, tanpa API key).

![Weather Dashboard](https://img.shields.io/badge/Status-Active-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![JavaScript](https://img.shields.io/badge/Language-JavaScript-yellow)

---

## ✨ Fitur Utama

✅ **Cuaca Saat Ini**
- Menampilkan suhu, kondisi cuaca, kelembaban, kecepatan angin
- Tekanan udara, visibilitas, dan suhu terasa
- Update real-time dengan timestamp

✅ **Prakiraan 7 Hari**
- Forecast lengkap untuk 7 hari ke depan
- Suhu maksimal dan minimal
- Probabilitas hujan per hari
- Deskripsi kondisi cuaca

✅ **Pencarian Kota**
- Search dengan auto-complete suggestions
- Mendukung pencarian dalam berbagai bahasa
- Nama kota + provinsi + negara

✅ **Geolocation (Lokasi Otomatis)**
- Tombol untuk mendapatkan cuaca berdasarkan lokasi saat ini
- Memerlukan izin dari browser

✅ **Design Modern & Responsive**
- Interface yang indah dan intuitif
- Fully responsive untuk desktop, tablet, dan mobile
- Animasi smooth dan transisi halus
- Dark mode gradient background

✅ **API Gratis Tanpa Registrasi**
- Menggunakan Open-Meteo API
- Tidak perlu API key
- Unlimited requests

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/toretoiyus-netizen/Sistem-Manajemen-Sekolah.git
cd Sistem-Manajemen-Sekolah/weather-dashboard
```

### 2. Buka di Browser
Cukup buka file `index.html` di browser Anda:
```bash
# Linux/Mac
open index.html

# Windows (Command Prompt)
start index.html

# Atau double-click file index.html
```

### 3. Gunakan Aplikasi
- 🔍 Ketik nama kota di search bar
- 📍 Klik tombol "Lokasi Saya" untuk mendapat cuaca berdasarkan lokasi saat ini
- 📊 Lihat detail cuaca dan prakiraan 7 hari

---

## 📁 Struktur File

```
weather-dashboard/
├── index.html          # Struktur HTML halaman
├── style.css           # Styling dan responsive design
├── script.js           # JavaScript logic dan API integration
└── README.md           # Dokumentasi ini
```

---

## 🛠️ Teknologi yang Digunakan

| Teknologi | Deskripsi |
|-----------|-----------|
| **HTML5** | Struktur semantic halaman |
| **CSS3** | Styling modern dengan Flexbox & Grid |
| **JavaScript (ES6+)** | Logic dan API integration |
| **Open-Meteo API** | API cuaca gratis tanpa registrasi |
| **Font Awesome** | Icon library untuk UI |
| **Geolocation API** | Fitur lokasi browser |

---

## 📊 Data yang Ditampilkan

### Cuaca Saat Ini
- 🌡️ Suhu (°C)
- 💧 Kelembaban (%)
- 💨 Kecepatan Angin (m/s)
- 🔽 Tekanan Udara (hPa)
- 👁️ Visibilitas (km)
- 🤔 Suhu Terasa (°C)
- 🌧️ Kemungkinan Hujan (%)

### Prakiraan 7 Hari
- 📅 Tanggal dan hari
- 🌡️ Suhu max/min
- 🌧️ Probabilitas hujan
- ☁️ Kondisi cuaca

---

## 🔌 API Integration

### Open-Meteo Forecast API
```
GET https://api.open-meteo.com/v1/forecast
```

**Parameters:**
- `latitude` - Garis lintang
- `longitude` - Garis bujur
- `current` - Data cuaca saat ini
- `daily` - Data cuaca harian (max 7 hari)
- `timezone` - Zona waktu otomatis

### Open-Meteo Geocoding API
```
GET https://geocoding-api.open-meteo.com/v1/search
```

**Parameters:**
- `name` - Nama kota yang dicari
- `count` - Jumlah hasil (max 6)
- `language` - Bahasa hasil (id untuk Indonesia)

**Dokumentasi:** https://open-meteo.com/en/docs

---

## 💻 Cara Menggunakan

### 1. Mencari Cuaca Kota
```
1. Ketik nama kota di kolom search (misal: Jakarta, Tokyo, New York)
2. Tekan Enter atau klik tombol "Cari"
3. Pilih dari suggestions yang muncul
4. Data cuaca akan ditampilkan dalam beberapa detik
```

### 2. Menggunakan Lokasi Saat Ini
```
1. Klik tombol "Lokasi Saya" (ikon map pin hijau)
2. Izinkan browser untuk mengakses lokasi Anda
3. Cuaca untuk lokasi Anda akan langsung ditampilkan
```

### 3. Membaca Data Cuaca
```
- Bagian atas menampilkan cuaca saat ini dengan suhu besar
- Bawahnya ada 6 detail cuaca (kelembaban, angin, dll)
- Bagian bawah menampilkan prakiraan 7 hari
- Setiap kartu prakiraan menunjukkan suhu dan kondisi per hari
```

---

## 🎨 Design & UI

### Color Palette
```
Primary Blue:    #3498db
Secondary Green: #2ecc71
Warning Orange:  #f39c12
Danger Red:      #e74c3c
Dark Background: #1a1a1a
Light Background: #f8f9fa
```

### Responsive Breakpoints
```
Desktop:  > 1024px (Full layout)
Tablet:   768px - 1024px (2-column forecast)
Mobile:   < 768px (1-column forecast)
Small:    < 480px (Adjusted font sizes)
```

---

## 📱 Responsive Design

Aplikasi ini fully responsive dan bekerja sempurna di:
- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Tablet (iPad, Android tablets)
- ✅ Mobile (iPhone, Android phones)
- ✅ Smart TV (supported)

---

## 🔐 Privacy & Security

- ✅ **Tanpa Tracking** - Tidak ada cookie atau tracking
- ✅ **HTTPS Only** - API menggunakan HTTPS
- ✅ **No Data Storage** - Data tidak disimpan di server
- ✅ **Geolocation Consent** - Meminta izin eksplisit
- ✅ **No Personal Data** - Hanya koordinat lokasi yang digunakan

---

## 🐛 Troubleshooting

### "Kota tidak ditemukan"
- Coba ketik nama kota dengan benar
- Tambahkan nama negara (misal: "Jakarta, Indonesia")
- Beberapa kota kecil mungkin tidak tersedia

### Geolocation tidak bekerja
- Pastikan browser mendukung Geolocation API
- Berikan izin lokasi saat diminta
- Gunakan HTTPS (geolocation hanya bekerja di HTTPS atau localhost)

### API tidak merespons
- Periksa koneksi internet Anda
- Coba refresh halaman
- Open-Meteo API sangat stabil, tapi bisa ada downtime

### Forecast tidak muncul
- Tunggu beberapa detik, data sedang diproses
- Coba search kota lain
- Refresh halaman browser

---

## 📚 Dokumentasi Lengkap

### JavaScript Functions

#### `searchWeather(city: string)`
Mencari cuaca berdasarkan nama kota
```javascript
searchWeather('Jakarta');
```

#### `getGeolocation()`
Menggunakan geolocation untuk mendapat cuaca lokasi saat ini
```javascript
getGeolocation();
```

#### `fetchWeatherByCoordinates(lat: number, lon: number)`
Fetch cuaca berdasarkan koordinat
```javascript
fetchWeatherByCoordinates(-6.2088, 106.8456);
```

#### `fetchCitySuggestions(query: string)`
Mengambil suggestions kota saat user mengetik
```javascript
fetchCitySuggestions('jaka');
```

---

## 🚀 Future Features (Roadmap)

- [ ] Unit temperature toggle (Celsius ↔ Fahrenheit)
- [ ] Dark mode toggle
- [ ] Favorite cities saved in localStorage
- [ ] Weather alerts untuk kondisi ekstrem
- [ ] Historical weather data
- [ ] Air quality index (AQI)
- [ ] UV index information
- [ ] Sunrise/Sunset times
- [ ] Map integration
- [ ] PWA support (offline mode)

---

## 🤝 Contributing

Kontribusi selalu welcome! Untuk berkontribusi:

1. Fork repository
2. Buat branch fitur: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push ke branch: `git push origin feature/AmazingFeature`
5. Buka Pull Request

---

## 📄 License

Project ini dilisensikan di bawah **MIT License** - lihat file [LICENSE](LICENSE) untuk detail.

---

## 🙋 FAQ

**Q: Apakah saya perlu API key untuk menggunakan aplikasi ini?**
A: Tidak! Open-Meteo API gratis dan tidak memerlukan registrasi atau API key.

**Q: Seberapa akurat data cuaca di aplikasi ini?**
A: Data cuaca berasal dari model prakiraan meteorologi profesional. Akurasi sangat tinggi untuk 1-3 hari ke depan, berkurang untuk 4-7 hari.

**Q: Apakah aplikasi ini menyimpan data saya?**
A: Tidak. Aplikasi ini 100% client-side. Tidak ada data yang disimpan di server.

**Q: Bisakah saya menggunakan aplikasi ini offline?**
A: Tidak untuk sekarang. Aplikasi memerlukan internet untuk fetch data API. PWA offline support akan ditambahkan di versi mendatang.

**Q: Apakah aplikasi ini support mobile?**
A: Ya, 100% responsive dan bekerja sempurna di semua perangkat mobile.

---

## 📞 Support & Contact

Jika ada pertanyaan atau issue:
- 📧 Email: toretoiyus@gmail.com
- 🐛 Issues: https://github.com/toretoiyus-netizen/Sistem-Manajemen-Sekolah/issues
- 💬 Discussions: https://github.com/toretoiyus-netizen/Sistem-Manajemen-Sekolah/discussions

---

## 🙏 Acknowledgments

- **Open-Meteo** - Untuk API cuaca yang gratis dan reliable
- **Font Awesome** - Untuk icon library yang indah
- **Inspiration** - Dari berbagai weather apps modern

---

## 📈 Project Status

✅ **Production Ready** - Aplikasi siap digunakan di production

**Version:** 1.0.0  
**Last Updated:** 19 Agustus 2026  
**Maintainer:** toretoiyus-netizen

---

<div align="center">

**Dibuat dengan ❤️ untuk weather enthusiasts**

[⭐ Give a Star](https://github.com/toretoiyus-netizen/Sistem-Manajemen-Sekolah) | [🐛 Report Bug](https://github.com/toretoiyus-netizen/Sistem-Manajemen-Sekolah/issues) | [💡 Request Feature](https://github.com/toretoiyus-netizen/Sistem-Manajemen-Sekolah/issues)

</div>
