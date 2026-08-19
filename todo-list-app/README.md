# ✅ To-Do List App

Aplikasi daftar tugas modern dengan penyimpanan lokal (Local Storage). Kelola tugas harian Anda dengan mudah, cepat, dan efisien langsung dari browser.

![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![JavaScript](https://img.shields.io/badge/Language-JavaScript-yellow)

---

## ✨ Fitur Utama

✅ **Tambah Tugas** - Input tugas dengan kategori dan prioritas
✅ **Edit Tugas** - Ubah teks, prioritas, dan kategori kapan saja
✅ **Hapus Tugas** - Hapus tugas individual atau semua yang selesai
✅ **Tandai Selesai** - Checkbox untuk menandai tugas sebagai completed
✅ **Kategori** - 5 kategori: Personal, Work, Shopping, Health, Other
✅ **Prioritas** - Tiga level: Rendah, Sedang, Tinggi
✅ **Filter** - Tampilkan semua, aktif, atau selesai
✅ **Urutkan** - Sort berdasarkan tanggal, prioritas, abjad, atau kategori
✅ **Statistik** - Tampilkan total, selesai, dan sisa tugas
✅ **Local Storage** - Semua data otomatis tersimpan di perangkat Anda
✅ **Responsive Design** - Bekerja sempurna di desktop, tablet, dan mobile
✅ **Modern UI** - Interface yang indah dan intuitif

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/toretoiyus-netizen/Sistem-Manajemen-Sekolah.git
cd Sistem-Manajemen-Sekolah/todo-list-app
```

### 2. Buka di Browser
```bash
# Linux/Mac
open index.html

# Windows
start index.html

# Atau double-click file index.html
```

### 3. Mulai Menggunakan
- 📝 Ketik tugas di input field
- 🏷️ Pilih kategori dari dropdown
- ➕ Klik "Tambah" atau tekan Enter
- ✏️ Edit tugas dengan tombol edit
- ✓ Tandai selesai dengan checkbox
- 🗑️ Hapus dengan tombol delete

---

## 📁 Struktur File

```
todo-list-app/
├── index.html          # Struktur HTML halaman
├── style.css           # Styling dan responsive design
├── script.js           # JavaScript logic & Local Storage
└── README.md           # Dokumentasi ini
```

---

## 🛠️ Teknologi yang Digunakan

| Teknologi | Deskripsi |
|-----------|-----------|
| **HTML5** | Struktur semantic halaman |
| **CSS3** | Styling modern dengan Flexbox & Grid |
| **JavaScript (ES6+)** | Logic dan Local Storage API |
| **Local Storage** | Penyimpanan data di browser |
| **Font Awesome** | Icon library untuk UI |

---

## 💾 Local Storage

Aplikasi ini menggunakan **Local Storage API** untuk menyimpan data:

### Storage Keys:
- `todoList` - Menyimpan semua tugas dalam format JSON
- `todoListSort` - Menyimpan preferensi sorting terakhir

### Data Task:
```javascript
{
  id: 1629302400000,           // Timestamp unik
  text: "Beli bahan makanan",   // Teks tugas
  category: "shopping",          // Kategori
  priority: "medium",            // Prioritas
  completed: false,              // Status selesai
  createdAt: "2026-08-19T..."    // ISO datetime
}
```

### Ukuran Penyimpanan:
- Rata-rata: ~150 bytes per tugas
- Limit Local Storage: ~5-10 MB (tergantung browser)
- Kapasitas: Bisa menyimpan ribuan tugas

---

## 🎯 Cara Menggunakan

### Menambah Tugas
```
1. Ketik deskripsi tugas di input field
2. Pilih kategori dari dropdown (default: Personal)
3. Klik tombol "Tambah" atau tekan Enter
4. Tugas akan muncul di daftar dengan prioritas Sedang
```

### Mengedit Tugas
```
1. Klik tombol Edit (pensil) pada tugas yang ingin diubah
2. Modal akan terbuka dengan form edit
3. Ubah teks, prioritas, atau kategori
4. Klik "Simpan" untuk menyimpan perubahan
```

### Menandai Selesai
```
1. Klik checkbox di sebelah kiri tugas
2. Tugas akan berubah warna dan text bercoret
3. Klik lagi untuk membatalkan status selesai
```

### Menghapus Tugas
```
1. Klik tombol Delete (sampah) pada tugas
2. Konfirmasi penghapusan
3. Tugas akan dihapus dari daftar
```

### Filter Tugas
```
1. Gunakan tombol filter di bagian atas
2. "Semua" - Tampilkan semua tugas
3. "Aktif" - Hanya tugas yang belum selesai
4. "Selesai" - Hanya tugas yang sudah selesai
```

### Urutkan Tugas
```
1. Klik tombol "Urutkan"
2. Pilih opsi sorting:
   - Berdasarkan Tanggal (terbaru)
   - Berdasarkan Prioritas
   - Berdasarkan Abjad (A-Z)
   - Berdasarkan Kategori
3. Klik "Terapkan"
```

### Hapus Tugas Selesai
```
1. Klik tombol "Hapus Selesai"
2. Konfirmasi jumlah tugas yang akan dihapus
3. Semua tugas yang completed akan dihapus
```

---

## 🎨 Kategori & Prioritas

### Kategori
| Icon | Kategori | Deskripsi |
|------|----------|-----------|
| 📱 | Personal | Tugas personal dan pribadi |
| 💼 | Work | Tugas pekerjaan dan bisnis |
| 🛒 | Shopping | Daftar belanja |
| 🏥 | Health | Tugas kesehatan dan olahraga |
| 📋 | Other | Tugas lainnya |

### Prioritas
| Level | Warna | Indikator |
|-------|-------|-----------|
| 🔴 Tinggi | Merah | Garis merah di sebelah kiri |
| 🟡 Sedang | Orange | Garis orange di sebelah kiri |
| 🟢 Rendah | Hijau | Garis hijau di sebelah kiri |

---

## 📊 Statistik

Aplikasi menampilkan 3 statistik utama:

- **Total Tugas** - Jumlah semua tugas yang dibuat
- **Selesai** - Jumlah tugas yang sudah completed
- **Sisa Tugas** - Jumlah tugas yang masih aktif

Statistik diperbarui secara real-time saat menambah, mengedit, atau menghapus tugas.

---

## 🔐 Data & Privacy

- ✅ **100% Local** - Semua data disimpan di browser Anda
- ✅ **No Cloud** - Tidak ada data yang dikirim ke server
- ✅ **No Tracking** - Tidak ada tracking atau analytics
- ✅ **Permanent Storage** - Data tetap ada meski browser ditutup
- ✅ **Safe Delete** - Hanya dihapus saat user menghapus manual

### Catatan Penting:
- Data disimpan per browser (tidak sinkron antar device)
- Jika browser di-clear cache, data akan hilang
- Export/import feature tidak tersedia di versi ini

---

## 📱 Responsive Design

Aplikasi fully responsive untuk:
- ✅ Desktop (1024px dan ke atas)
- ✅ Tablet (768px - 1023px)
- ✅ Mobile (< 768px)
- ✅ Small Mobile (< 480px)

---

## 🎓 Fitur Pembelajaran

Aplikasi ini sempurna untuk belajar:
- 📝 Manipulasi DOM dengan JavaScript
- 💾 Local Storage API
- 🎨 CSS Grid & Flexbox
- ⚛️ State management sederhana
- 🔄 Event handling
- 📱 Responsive web design
- 🎯 CRUD operations

---

## 🐛 Troubleshooting

### Data hilang setelah refresh
- Pastikan browser settings mengizinkan Local Storage
- Cek apakah ada setting "Clear storage on close"

### Tidak bisa menyimpan tugas baru
- Buka DevTools (F12) → Console
- Cek apakah ada error message
- Pastikan Local Storage tidak penuh

### Layout berantakan di mobile
- Refresh halaman (Ctrl+F5 atau Cmd+Shift+R)
- Cek ukuran viewport browser

### Tugas tidak muncul setelah edit
- Refresh halaman
- Atau coba tambah tugas baru untuk test

### Cara export data
```javascript
// Di console (F12):
console.log(JSON.stringify(JSON.parse(localStorage.getItem('todoList')), null, 2));
```

---

## 📚 Dokumentasi Kode

### Struktur JavaScript

#### State Management
```javascript
tasks = [];           // Array tugas
currentFilter = 'all'; // Filter aktif
currentSort = 'date';  // Sort aktif
editingTaskId = null;  // ID untuk edit
```

#### Main Functions
```javascript
addTask()              // Tambah tugas baru
deleteTask(id)         // Hapus tugas
toggleTaskComplete(id) // Toggle status selesai
openEditModal(id)      // Buka modal edit
saveEditedTask()       // Simpan edit
clearCompletedTasks()  // Hapus semua selesai
renderTasks()          // Render daftar tugas
sortTasks(arr)         // Urutkan tugas
updateStats()          // Update statistik
```

#### Storage Functions
```javascript
saveTasksToStorage()    // Simpan ke Local Storage
loadTasksFromStorage()  // Muat dari Local Storage
saveSort()              // Simpan preferensi sort
loadSort()              // Muat preferensi sort
```

---

## 🚀 Future Features (Roadmap)

- [ ] Export/Import as JSON
- [ ] Due date/deadline
- [ ] Reminder notifications
- [ ] Dark mode toggle
- [ ] Recurring tasks
- [ ] Task tags/labels
- [ ] Cloud sync (Firebase/Supabase)
- [ ] Collaborative lists
- [ ] Mobile app (React Native)
- [ ] PWA support (offline mode)
- [ ] Keyboard shortcuts
- [ ] Task search
- [ ] Undo/Redo
- [ ] Drag & drop reordering

---

## 🤝 Contributing

Kontribusi sangat diterima! Untuk berkontribusi:

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

**Q: Apakah data saya aman di Local Storage?**
A: Ya, data disimpan lokal di browser Anda dan tidak dikirim ke server. Hanya Anda yang bisa akses.

**Q: Berapa banyak tugas yang bisa disimpan?**
A: Ratusan hingga ribuan tugas tergantung ukuran teks. Limit Local Storage adalah 5-10 MB.

**Q: Bagaimana cara backup data?**
A: Buka DevTools (F12) → Console, jalankan:
```javascript
copy(localStorage.getItem('todoList'))
```

**Q: Bagaimana cara restore data?**
A: Jalankan di console:
```javascript
localStorage.setItem('todoList', '[paste data here]')
location.reload()
```

**Q: Apakah data sync antar device?**
A: Tidak. Local Storage hanya menyimpan di browser lokal. Untuk sync gunakan cloud backend.

**Q: Bisa ganti bahasa ke English?**
A: Ya, edit file script.js dan ganti label/text ke English.

---

## 📞 Support & Contact

Jika ada pertanyaan atau issue:
- 📧 Email: toretoiyus@gmail.com
- 🐛 Issues: https://github.com/toretoiyus-netizen/Sistem-Manajemen-Sekolah/issues
- 💬 Discussions: https://github.com/toretoiyus-netizen/Sistem-Manajemen-Sekolah/discussions

---

## 🙏 Acknowledgments

- Inspirasi dari Todoist, Microsoft To Do, Google Tasks
- Font Awesome untuk icons
- Open source community

---

## 📈 Project Status

✅ **Production Ready** - Aplikasi siap digunakan

**Version:** 1.0.0  
**Last Updated:** 19 Agustus 2026  
**Maintainer:** toretoiyus-netizen

---

<div align="center">

**Dibuat dengan ❤️ untuk productivity enthusiasts**

[⭐ Give a Star](https://github.com/toretoiyus-netizen/Sistem-Manajemen-Sekolah) | [🐛 Report Bug](https://github.com/toretoiyus-netizen/Sistem-Manajemen-Sekolah/issues) | [💡 Request Feature](https://github.com/toretoiyus-netizen/Sistem-Manajemen-Sekolah/issues)

</div>
