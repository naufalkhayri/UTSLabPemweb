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
/*     MULTI-CHART SYSTEM         */
/* ============================== */

console.log("=== MULTI-CHART SYSTEM DIMUAT ===");

let currentChart = null;
let chartData = {};

// Fungsi untuk mengumpulkan dan memproses data
function processChartData() {
    const transactions = JSON.parse(localStorage.getItem("transaksi")) || [];
    const timeRange = document.getElementById('timeRangeSelector')?.value || 'all';
    
    console.log("🔄 Memproses data chart...", { transactionCount: transactions.length, timeRange });

    // Filter berdasarkan waktu
    const filteredTransactions = filterByTimeRange(transactions, timeRange);
    
    // Data untuk berbagai jenis chart
    chartData = {
        // Pie/Donut Chart Data (Pengeluaran per kategori)
        pieData: processPieData(filteredTransactions),
        
        // Line/Bar Chart Data (Trend bulanan)
        trendData: processTrendData(filteredTransactions),
        
        // Summary data
        summary: {
            totalTransactions: filteredTransactions.length,
            totalIncome: filteredTransactions.filter(t => t.jumlah > 0)
                .reduce((sum, t) => sum + t.jumlah, 0),
            totalExpense: Math.abs(filteredTransactions.filter(t => t.jumlah < 0)
                .reduce((sum, t) => sum + t.jumlah, 0))
        }
    };
    
    return chartData;
}

// Filter berdasarkan range waktu
// Filter berdasarkan range waktu - TAMBAH DEBUGGING
function filterByTimeRange(transactions, range) {
    console.log("🔍 Filtering transactions by range:", range);
    console.log("📅 Total transactions before filter:", transactions.length);
    
    if (range === 'all') {
        console.log("✅ No filter applied, using all transactions");
        return transactions;
    }
    
    const now = new Date();
    let cutoffDate = new Date();
    
    switch(range) {
        case '3months':
            cutoffDate.setMonth(now.getMonth() - 3);
            break;
        case '6months':
            cutoffDate.setMonth(now.getMonth() - 6);
            break;
        case '1year':
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            console.log("⚠️ Unknown range, using all transactions");
            return transactions;
    }
    
    console.log("📅 Cutoff date:", cutoffDate.toLocaleDateString('id-ID'));
    
    const filteredTransactions = transactions.filter(transaction => {
        try {
            const [day, month, year] = transaction.tanggal.split('/');
            const transactionDate = new Date(year, month - 1, day);
            const isInRange = transactionDate >= cutoffDate;
            
            if (!isInRange) {
                console.log("❌ Transaction filtered out:", {
                    date: transaction.tanggal,
                    amount: transaction.jumlah,
                    description: transaction.keterangan
                });
            }
            
            return isInRange;
        } catch (error) {
            console.error("❌ Error parsing date:", transaction.tanggal, error);
            return false;
        }
    });
    
    console.log("✅ Transactions after filtering:", filteredTransactions.length);
    return filteredTransactions;
}

// Process data untuk Pie/Donut Chart
function processPieData(transactions) {
    const kategoriMap = {};
    
    transactions.forEach((t) => {
        if (Number(t.jumlah) < 0) {
            const kategori = (t.keterangan || "Lainnya").trim();
            const jumlah = Math.abs(Number(t.jumlah)) || 0;
            
            if (!kategoriMap[kategori]) kategoriMap[kategori] = 0;
            kategoriMap[kategori] += jumlah;
        }
    });

    const labels = Object.keys(kategoriMap);
    const values = Object.values(kategoriMap);
    
    return { labels, values };
}

// Process data untuk Line/Bar Chart (Trend bulanan)
function processTrendData(transactions) {
    const monthlyData = {};
    
    transactions.forEach((t) => {
        const [day, month, year] = t.tanggal.split('/');
        const monthYear = `${month}/${year}`;
        const key = `${year}-${month.padStart(2, '0')}`; // Untuk sorting
        
        if (!monthlyData[key]) {
            monthlyData[key] = {
                label: `Bulan ${month}/${year}`,
                income: 0,
                expense: 0,
                sortKey: key
            };
        }
        
        if (t.jumlah > 0) {
            monthlyData[key].income += t.jumlah;
        } else {
            monthlyData[key].expense += Math.abs(t.jumlah);
        }
    });
    
    // Sort by date
    const sortedMonths = Object.values(monthlyData)
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    
    return {
        labels: sortedMonths.map(m => m.label),
        income: sortedMonths.map(m => m.income),
        expense: sortedMonths.map(m => m.expense)
    };
}

// Palette warna
const chartColors = {
    pie: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
    ],
    income: '#3B82F6',
    expense: '#EF4444',
    background: 'rgba(255, 255, 255, 0.1)'
};

// Konfigurasi untuk setiap jenis chart
const chartConfigs = {
    pie: {
        type: "pie",
        data: (chartData) => ({
            labels: chartData.pieData.labels,
            datasets: [{
                data: chartData.pieData.values,
                backgroundColor: chartData.pieData.labels.map((_, index) => 
                    chartColors.pie[index % chartColors.pie.length]
                ),
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverBorderWidth: 3,
                hoverOffset: 8
            }]
        }),
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
                duration: 1200
            }
        }
    },

    doughnut: {
        type: "doughnut",
        data: (chartData) => ({
            labels: chartData.pieData.labels,
            datasets: [{
                data: chartData.pieData.values,
                backgroundColor: chartData.pieData.labels.map((_, index) => 
                    chartColors.pie[index % chartColors.pie.length]
                ),
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverBorderWidth: 3,
                hoverOffset: 8
            }]
        }),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '50%',
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
                duration: 1200
            }
        }
    },

    line: {
        type: "line",
        data: (chartData) => ({
            labels: chartData.trendData.labels,
            datasets: [
                {
                    label: "Pemasukan",
                    data: chartData.trendData.income,
                    borderColor: chartColors.income,
                    backgroundColor: chartColors.income + '20',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3
                },
                {
                    label: "Pengeluaran",
                    data: chartData.trendData.expense,
                    borderColor: chartColors.expense,
                    backgroundColor: chartColors.expense + '20',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3
                }
            ]
        }),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "top",
                    labels: {
                        font: {
                            family: "'Poppins', sans-serif",
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: Rp ${context.parsed.y.toLocaleString('id-ID')}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + value.toLocaleString('id-ID');
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            }
        }
    },

    bar: {
        type: "bar",
        data: (chartData) => ({
            labels: chartData.trendData.labels,
            datasets: [
                {
                    label: "Pemasukan",
                    data: chartData.trendData.income,
                    backgroundColor: chartColors.income + 'CC',
                    borderColor: chartColors.income,
                    borderWidth: 1
                },
                {
                    label: "Pengeluaran",
                    data: chartData.trendData.expense,
                    backgroundColor: chartColors.expense + 'CC',
                    borderColor: chartColors.expense,
                    borderWidth: 1
                }
            ]
        }),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "top",
                    labels: {
                        font: {
                            family: "'Poppins', sans-serif",
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: Rp ${context.parsed.y.toLocaleString('id-ID')}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + value.toLocaleString('id-ID');
                        }
                    }
                }
            }
        }
    }
};

// Fungsi utama untuk update chart
function updateChart() {
    console.log("🔄 Memperbarui chart...");
    
    const canvas = document.getElementById("mainChart");
    const wrap = document.querySelector('.chart-wrap');
    const noDataBox = document.querySelector('.no-data-box');
    const chartTypeSelector = document.getElementById('chartTypeSelector');
    const timeRangeSelector = document.getElementById('timeRangeSelector');

    
    console.log("🔍 Element check:", {
        canvas: !!canvas,
        wrap: !!wrap,
        noDataBox: !!noDataBox,
        chartTypeSelector: !!chartTypeSelector,
        timeRangeSelector: !!timeRangeSelector,
        timeRangeValue: timeRangeSelector ? timeRangeSelector.value : 'not found'
    });
    
    if (!canvas || !wrap) {
        console.error("❌ Canvas chart atau wrapper tidak ditemukan!");
        return;
    }

    // Process data
    const data = processChartData();
    
    // Cek apakah ada data
    const hasData = data.summary.totalTransactions > 0;
    
    if (!hasData) {
        console.log("ℹ️ Tidak ada data transaksi untuk chart");
        
        if (currentChart) {
            try { currentChart.destroy(); } catch(e){ /* ignore */ }
            currentChart = null;
        }

        canvas.style.display = "none";
        if (noDataBox) noDataBox.style.display = "block";
        return;
    }

    // Ada data -> tampilkan chart
    canvas.style.display = "block";
    if (noDataBox) noDataBox.style.display = "none";

    // Hapus chart lama
    if (currentChart) {
        try { 
            currentChart.destroy(); 
        } catch(e){ 
            console.warn("Gagal destroy chart lama:", e); 
        }
        currentChart = null;
    }

    // Dapatkan jenis chart yang dipilih
    const chartType = chartTypeSelector ? chartTypeSelector.value : 'pie';
    const config = chartConfigs[chartType];
    
    if (!config) {
        console.error("❌ Konfigurasi chart tidak ditemukan:", chartType);
        return;
    }

    try {
        // Buat chart baru
        currentChart = new Chart(canvas, {
            type: config.type,
            data: config.data(data),
            options: config.options
        });
        
        console.log("✅ Chart berhasil dibuat!", { type: chartType });
        
    } catch (error) {
        console.error("❌ Error membuat chart:", error);
        if (noDataBox) {
            noDataBox.innerHTML = '<div class="no-data"><i class="fas fa-exclamation-triangle"></i><p>Error memuat chart</p></div>';
            noDataBox.style.display = "block";
        }
        canvas.style.display = "none";
    }
}

// Event listeners untuk chart controls - DIPERBAIKI
function initChartControls() {
    const chartTypeSelector = document.getElementById('chartTypeSelector');
    const timeRangeSelector = document.getElementById('timeRangeSelector');
    
    console.log("🔄 Inisialisasi chart controls...");
    console.log("📊 Chart type selector:", chartTypeSelector);
    console.log("⏰ Time range selector:", timeRangeSelector);
    
    if (chartTypeSelector) {
        chartTypeSelector.addEventListener('change', function() {
            console.log("🎯 Chart type changed to:", this.value);
            updateChart();
        });
    } else {
        console.error("❌ Chart type selector tidak ditemukan!");
    }
    
    if (timeRangeSelector) {
        timeRangeSelector.addEventListener('change', function() {
            console.log("⏰ Time range changed to:", this.value);
            updateChart();
        });
    } else {
        console.error("❌ Time range selector tidak ditemukan!");
    }
}





// 💰 Data Transaksi - YANG INI PERLU DITAMBAHKAN
const Transaksi = {
  semua: Penyimpanan.ambil(),

  tambah(transaksi) {
    Transaksi.semua.push(transaksi);
    Penyimpanan.simpan(Transaksi.semua);
    
    // UPDATE SEMUA TAMPILAN LANGSUNG
    DOM.hapusSemuaTransaksi();
    Transaksi.semua.forEach((transaksi, index) => DOM.tambahTransaksi(transaksi, index));
    DOM.perbaruiRingkasan();
    
    // UPDATE CHART LANGSUNG
    updateChart();
  },

  hapus(index) {
    Transaksi.semua.splice(index, 1);
    Penyimpanan.simpan(Transaksi.semua);
    
    // UPDATE SEMUA TAMPILAN LANGSUNG
    DOM.hapusSemuaTransaksi();
    Transaksi.semua.forEach((transaksi, index) => DOM.tambahTransaksi(transaksi, index));
    DOM.perbaruiRingkasan();
    
    // UPDATE CHART LANGSUNG
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
  
  // Setup chart controls
  initChartControls();
  
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
  
  // Initial chart load
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