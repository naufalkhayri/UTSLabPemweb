/* ============================== */
/*     LOGIKA APLIKASI KEUANGANKU */
/* ============================== */

// 📅 Tanggal & Waktu Real-Time
function perbaruiTanggalWaktu() {
  const sekarang = new Date();
  document.getElementById("date").textContent = sekarang.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  document.getElementById("time").textContent = sekarang.toLocaleTimeString("id-ID");
}

// ⚙️ Modal
const Modal = {
  open() {
    document.querySelector(".popup_area").classList.add("aktif");
  },
  close() {
    document.querySelector(".popup_area").classList.remove("aktif");
  },
};

// 💾 Local Storage
const Penyimpanan = {
  ambil() {
    return JSON.parse(localStorage.getItem("transaksi")) || [];
  },
  simpan(dataTransaksi) {
    localStorage.setItem("transaksi", JSON.stringify(dataTransaksi));
  },
};

/* ============================== */
/*     INTEGRASI PIE CHART        */
/* ============================== */

console.log("=== CHART.JS DIMUAT ===");

let currentChart = null;

// Fungsi untuk update chart pengeluaran (DISESUAIKAN: tidak merusak DOM chart-wrap)
function updateChart() {
    console.log("🔄 Memperbarui chart...");
    
    const transactions = JSON.parse(localStorage.getItem("transaksi")) || [];
    const canvas = document.getElementById("chartPengeluaran");
    const wrap = document.querySelector('.chart-wrap');
    const noDataBox = document.querySelector('.no-data-box');

    if (!canvas || !wrap) {
        console.error("❌ Canvas chart atau wrapper tidak ditemukan!");
        return;
    }

    // Kumpulkan data pengeluaran per kategori
    const kategoriMap = {};
    
    transactions.forEach((t) => {
        // Hanya proses pengeluaran (jumlah negatif)
        if (Number(t.jumlah) < 0) {
            // gunakan field keterangan sebagai kategori fallback
            const kategori = (t.keterangan || "Lainnya").trim();
            const jumlah = Math.abs(Number(t.jumlah)) || 0;
            
            if (!kategoriMap[kategori]) kategoriMap[kategori] = 0;
            kategoriMap[kategori] += jumlah;
        }
    });

    const labels = Object.keys(kategoriMap);
    const values = Object.values(kategoriMap);
    
    console.log("📊 Data chart:", { labels, values });

    // Jika tidak ada data pengeluaran -> Tampilkan no-data-box (jangan hapus canvas)
    if (!labels.length || values.every(v => v === 0)) {
        console.log("ℹ️ Tidak ada data pengeluaran untuk chart");

        // Hancurkan chart lama jika ada
        if (currentChart) {
            try { currentChart.destroy(); } catch(e){ /* ignore */ }
            currentChart = null;
        }

        // sembunyikan canvas, tunjukkan pesan no-data
        canvas.style.display = "none";
        if (noDataBox) noDataBox.style.display = "block";

        return;
    }

    // Ada data -> pastikan canvas tampil dan pesan no-data disembunyikan
    canvas.style.display = "block";
    if (noDataBox) noDataBox.style.display = "none";

    // Hapus chart lama jika ada (prevent memory leak)
    if (currentChart) {
        try { currentChart.destroy(); } catch(e){ console.warn("Gagal destroy chart lama:", e); }
        currentChart = null;
    }

    // Palette warna
    const colorfulPalette = [
        '#FF6B6B', '#FF9E7D', '#FFB74D', '#FF9800', '#F44336', '#E53935',
        '#42A5F5', '#64B5F6', '#4FC3F7', '#29B6F6', '#26C6DA', '#00BCD4',
        '#66BB6A', '#81C784', '#4CAF50', '#8BC34A', '#CDDC39', '#9CCC65',
        '#BA68C8', '#CE93D8', '#AB47BC', '#EC407A', '#F48FB1', '#E91E63',
        '#FFD54F', '#FFEE58', '#FFF176', '#FFEB3B', '#FFC107', '#FFA000'
    ];

    try {
        // Buat chart baru
        currentChart = new Chart(canvas, {
            type: "pie",
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: labels.map((_, index) => 
                        colorfulPalette[index % colorfulPalette.length]
                    ),
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    hoverBorderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { 
                            boxWidth: 15, 
                            padding: 15,
                            font: { 
                                size: 12,
                                family: "'Poppins', sans-serif",
                                weight: '500'
                            },
                            color: '#374151',
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#16a34a',
                        bodyColor: '#374151',
                        borderColor: '#e5e7eb',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total ? Math.round((value / total) * 100) : 0;
                                return `${label}: Rp ${value.toLocaleString('id-ID')} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 1200,

                    // ⭐ Tambahan animasi custom
                    onProgress: function(animation) {
                        const ctx = animation.chart.ctx;
                        ctx.save();
                        ctx.globalAlpha = Math.min(animation.currentStep / animation.numSteps + 0.2, 1);
                        ctx.restore();
                    }
                },

                elements: {
                    arc: {
                        borderWidth: 2
                    }
                }
            }
        });
        
        console.log("✅ Chart berhasil dibuat!");
        
    } catch (error) {
        console.error("❌ Error membuat chart:", error);
        // Tampilkan pesan error di noDataBox jika tersedia
        if (noDataBox) {
            noDataBox.innerHTML = '<div class="no-data"><i class="fas fa-exclamation-triangle"></i><p>Error memuat chart</p></div>';
            noDataBox.style.display = "block";
        }
        // sembunyikan canvas jika error
        canvas.style.display = "none";
    }
}

// 💰 Data Transaksi - DIMODIFIKASI untuk include chart update
const Transaksi = {
  semua: Penyimpanan.ambil(),

  tambah(transaksi) {
    Transaksi.semua.push(transaksi);
    Penyimpanan.simpan(Transaksi.semua);
    
    // UPDATE SEMUA TAMPILAN LANGSUNG
    DOM.hapusSemuaTransaksi();
    Transaksi.semua.forEach((transaksi, index) => DOM.tambahTransaksi(transaksi, index));
    DOM.perbaruiRingkasan();
    
    // UPDATE CHART LANGSUNG - TANPA TIMEOUT
    updateChart();
  },

  hapus(index) {
    Transaksi.semua.splice(index, 1);
    Penyimpanan.simpan(Transaksi.semua);
    
    // UPDATE SEMUA TAMPILAN LANGSUNG
    DOM.hapusSemuaTransaksi();
    Transaksi.semua.forEach((transaksi, index) => DOM.tambahTransaksi(transaksi, index));
    DOM.perbaruiRingkasan();
    
    // UPDATE CHART LANGSUNG - TANPA TIMEOUT
    updateChart();
  },

  pemasukan() {
    return Transaksi.semua.filter(t => t.jumlah > 0).reduce((a, b) => a + b.jumlah, 0);
  },

  pengeluaran() {
    return Transaksi.semua.filter(t => t.jumlah < 0).reduce((a, b) => a + b.jumlah, 0);
  },

  saldo() {
    return Transaksi.pemasukan() + Transaksi.pengeluaran();
  }
};

// 🧾 Manipulasi Tabel
const DOM = {
  wadahTabel: document.querySelector("#data-table tbody"),

  tambahTransaksi(transaksi, index) {
    const tr = document.createElement("tr");
    tr.innerHTML = DOM.isiBarisTransaksi(transaksi, index);
    DOM.wadahTabel.appendChild(tr);
  },

  isiBarisTransaksi(transaksi, index) {
    const kelasCSS = transaksi.jumlah > 0 ? "pemasukan" : "pengeluaran";
    const jumlahFormat = transaksi.jumlah.toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
    });

    return `
      <td>${transaksi.keterangan}</td>
      <td class="${kelasCSS}">${jumlahFormat}</td>
      <td>${transaksi.tanggal}</td>
      <td>
        <button onclick="Transaksi.hapus(${index})">🗑️</button>
        ${transaksi.bukti ? `<button onclick="Bukti.lihat(${index})">🖼️</button>` : ''}
      </td>
    `;
  },

  perbaruiRingkasan() {
    document.getElementById("incomeDisplay").textContent =
      "Rp " + Transaksi.pemasukan().toLocaleString("id-ID");

    document.getElementById("expenseDisplay").textContent =
      "Rp " + Math.abs(Transaksi.pengeluaran()).toLocaleString("id-ID");

    document.getElementById("totalDisplay").textContent =
      "Rp " + Transaksi.saldo().toLocaleString("id-ID");
  },

  hapusSemuaTransaksi() {
    DOM.wadahTabel.innerHTML = "";
  }
};

// 📤 Form Tambah Transaksi (dengan upload bukti)
const Form = {
  description: document.getElementById("description"),
  amount: document.getElementById("amount"),
  date: document.getElementById("dateInput"),
  bukti: document.getElementById("buktiInput"),

  ambilNilai() {
    return {
      keterangan: Form.description.value,
      jumlah: parseFloat(Form.amount.value),
      tanggal: Form.date.value,
      bukti: Form.bukti.files[0] || null
    };
  },

  validasi() {
    const { keterangan, jumlah, tanggal } = Form.ambilNilai();
    if (!keterangan.trim() || isNaN(jumlah) || !tanggal.trim()) {
      throw new Error("Mohon isi semua kolom data transaksi dengan benar!");
    }
  },

  async formatData() {
    let { keterangan, jumlah, tanggal, bukti } = Form.ambilNilai();
    
    // Tentukan apakah pemasukan atau pengeluaran
    const isExpense = document.getElementById('expenseRadio').checked;
    if (isExpense) {
      jumlah = -Math.abs(jumlah);
    } else {
      jumlah = Math.abs(jumlah);
    }

    // Format tanggal
    const [y, m, d] = tanggal.split("-");
    tanggal = `${d}/${m}/${y}`;

    // Jika ada bukti, convert ke base64
    let buktiBase64 = null;
    if (bukti) {
      buktiBase64 = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(bukti);
      });
    }

    return { keterangan, jumlah, tanggal, bukti: buktiBase64 };
  },

  hapusIsi() {
    Form.description.value = "";
    Form.amount.value = "";
    Form.date.value = "";
    Form.bukti.value = "";
  },

  async submit(event) {
    event.preventDefault();
    try {
      Form.validasi();
      const transaksi = await Form.formatData();
      Transaksi.tambah(transaksi);
      Form.hapusIsi();
      Modal.close();
      showNotification('Transaksi berhasil ditambahkan!', 'success');
    } catch (error) {
      alert(error.message);
    }
  }
};

// 📸 Popup Bukti Transaksi
const Bukti = {
  _index: null,

  lihat(index) {
    const data = Transaksi.semua[index];
    if (!data.bukti) return alert("Tidak ada bukti untuk transaksi ini.");

    document.getElementById("previewBukti").src = data.bukti;
    document.getElementById("popupBuktiArea").classList.add("aktif");
    Bukti._index = index;
  },

  close() {
    document.getElementById("popupBuktiArea").classList.remove("aktif");
  },

  gantiBukti() {
    document.getElementById("inputGantiBukti").click();
  }
};

// ⚡ Jalankan Aplikasi
const Aplikasi = {
  mulai() {
    Transaksi.semua.forEach((transaksi, index) => DOM.tambahTransaksi(transaksi, index));
    DOM.perbaruiRingkasan();
    Penyimpanan.simpan(Transaksi.semua);
  }
};

/* ============================== */
/*     EVENT LISTENERS & INIT     */
/* ============================== */

// Fungsi untuk memuat foto profil
function loadProfilePhoto() {
  const savedPhoto = localStorage.getItem('userPhoto');
  const profileCircle = document.getElementById('profileCircle');
  
  if (savedPhoto) {
    profileCircle.innerHTML = `<img src="${savedPhoto}" alt="Foto Profil" class="profile-image">`;
  } else {
    // Gunakan default avatar jika tidak ada foto
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    const nama = userData.namaLengkap || 'User';
    const initial = nama.charAt(0).toUpperCase();
    
    profileCircle.innerHTML = `<div class="profile-default">${initial}</div>`;
  }
}

// Fungsi untuk toggle dropdown
function toggleProfileDropdown() {
  const dropdown = document.getElementById('profileDropdown');
  dropdown.classList.toggle('active');
}

// Fungsi untuk logout
function logout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'info') {
  // Hapus notifikasi sebelumnya
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Buat elemen notifikasi
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  // Tambahkan ke body
  document.body.appendChild(notification);
  
  // Tampilkan notifikasi
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // Sembunyikan setelah 3 detik
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Inisialisasi aplikasi saat DOM siap
document.addEventListener("DOMContentLoaded", function() {
  console.log("🚀 DOM Content Loaded");
  
  // Setup tanggal & waktu
  perbaruiTanggalWaktu();
  setInterval(perbaruiTanggalWaktu, 1000);
  
  // EVENT LISTENERS UNTUK FORM
  const formTransaction = document.getElementById("formTransaction");
  if (formTransaction) {
    formTransaction.addEventListener("submit", function(event) {
      Form.submit(event);
    });
  }
  
  // Event listener untuk tombol tambah
  const showFormBtn = document.getElementById("showForm");
  if (showFormBtn) {
    showFormBtn.addEventListener("click", function() {
      Modal.open();
    });
  }
  
  // Event listener untuk tombol close modal
  const closeBtn = document.getElementById("close");
  if (closeBtn) {
    closeBtn.addEventListener("click", function() {
      Modal.close();
    });
  }
  
  // Event listener untuk tombol batal
  const cancelBtn = document.querySelector(".cancel");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", function() {
      Modal.close();
    });
  }
  
  // Event listener untuk tombol bukti close
  const buktiCloseBtn = document.querySelector("#popupBuktiArea .btn_close");
  if (buktiCloseBtn) {
    buktiCloseBtn.addEventListener("click", function() {
      Bukti.close();
    });
  }
  
  // Event listener untuk tombol ganti bukti
  const gantiBuktiBtn = document.querySelector("#popupBuktiArea .save");
  if (gantiBuktiBtn) {
    gantiBuktiBtn.addEventListener("click", function() {
      Bukti.gantiBukti();
    });
  }
  
  // Event listener untuk blur popup bukti
  const buktiBlur = document.querySelector("#popupBuktiArea .popupblur");
  if (buktiBlur) {
    buktiBlur.addEventListener("click", function() {
      Bukti.close();
    });
  }
  
  // NAVBAR EVENT LISTENERS
  const profileCircle = document.getElementById("profileCircle");
  const profileDropdown = document.getElementById("profileDropdown");
  const logoutBtn = document.getElementById("logoutBtn");
  
  if (profileCircle) {
    profileCircle.addEventListener("click", function(e) {
      e.stopPropagation();
      toggleProfileDropdown();
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
  
  // Tutup dropdown saat klik di luar
  document.addEventListener("click", function() {
    if (profileDropdown) {
      profileDropdown.classList.remove("active");
    }
  });
  
  // Setup profil
  loadProfilePhoto();
  
  // Cek status login
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  if (isLoggedIn !== "true") {
    window.location.href = "index.html";
    return;
  }
  
  // Jalankan aplikasi
  Aplikasi.mulai();
  
  // Initial chart load - PASTIKAN INI DIPANGGIL SETELAH APLIKASI.MULAI()
  updateChart();
});

// Event listener untuk reset data
document.getElementById("resetData")?.addEventListener("click", function(e) {
  e.preventDefault();
  if (confirm("Apakah Anda yakin ingin mengatur ulang semua data transaksi?")) {
    localStorage.removeItem("transaksi");
    Aplikasi.mulai();
    updateChart();
    showNotification("Semua data transaksi telah direset", "success");
  }
});

// Ganti bukti transaksi
document.getElementById("inputGantiBukti")?.addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    const base64 = e.target.result;
    const index = Bukti._index;

    Transaksi.semua[index].bukti = base64;
    Penyimpanan.simpan(Transaksi.semua);

    document.getElementById("previewBukti").src = base64;
  };
  reader.readAsDataURL(file);
});

// Tambahkan CSS ke head
document.head.insertAdjacentHTML("beforeend", appCSS);
