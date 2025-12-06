/* ============================== */
/* LOGIKA APLIKASI KEUANGANKU */
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

// 🔐 API Helper Functions - DIUPDATE UNTUK BACKEND BARU
const API = {
    baseURL: 'https://simanja-backend.vercel.app/api',
    
    async getHeaders(isFormData = false) {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Token tidak ditemukan. Silakan login kembali.');
        }
        
        const headers = {
            'Authorization': `Bearer ${token}`
        };
        
        // PENTING: Jangan set Content-Type untuk FormData agar browser bisa mengatur boundary
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        
        return headers;
    },

    async get(url) {
        try {
            console.log(`🔍 GET ${url}`);
            const response = await fetch(`${this.baseURL}${url}`, {
                headers: await this.getHeaders()
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            return response.json();
        } catch (error) {
            console.error('❌ API GET Error:', error);
            throw error;
        }
    },

    async post(url, data, isFormData = false) {
        try {
            const options = {
                method: 'POST',
            };
            
            if (isFormData) {
                // Untuk FormData, kita hanya perlu menambahkan header Authorization
                options.headers = { 'Authorization': await API.getHeaders(true).then(h => h.Authorization) };
                options.body = data;
            } else {
                // Untuk JSON, kita perlu Content-Type: application/json
                options.headers = await this.getHeaders(isFormData);
                options.body = JSON.stringify(data);
            }
            
            console.log(`🔍 POST ${url}`, { data: !isFormData ? data : 'FormData', isFormData });
            
            const response = await fetch(`${this.baseURL}${url}`, options);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            return response.json();
        } catch (error) {
            console.error('❌ API POST Error:', error);
            throw error;
        }
    },

    async delete(url) {
        try {
            console.log(`🔍 DELETE ${url}`);
            const response = await fetch(`${this.baseURL}${url}`, {
                method: 'DELETE',
                headers: await this.getHeaders()
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            return response.json();
        } catch (error) {
            console.error('❌ API DELETE Error:', error);
            throw error;
        }
    }
};

// 💰 Data Transaksi - DIUPDATE
const Transaksi = {
    semua: [],

    async load() {
        try {
            console.log('🔍 Loading transactions dari backend...');
            const data = await API.get('/transactions?limit=1000');
            
            // Pastikan format data sesuai
            this.semua = data.transactions || [];
            console.log(`✅ ${this.semua.length} transaksi loaded`);
            
            return this.semua;
        } catch (error) {
            console.error('❌ Error loading transactions:', error);
            showNotification('Gagal memuat data transaksi', 'error');
            this.semua = [];
            return [];
        }
    },

    async tambah(transaksiFormData) {
        try {
            console.log('🔍 Adding transaction ke backend...');
            const response = await API.post('/transactions', transaksiFormData, true);
            console.log('✅ Transaction added:', response);
            
            // Reload data terbaru dari server
            await this.load(); // PENTING: Memastikan data 'semua' terupdate
            return response;
        } catch (error) {
            console.error('❌ Error adding transaction:', error);
            throw error;
        }
    },

    async hapus(id) {
        try {
            console.log(`🔍 Deleting transaction ID ${id} dari backend...`);
            const response = await API.delete(`/transactions/${id}`);
            
            // Update local data
            this.semua = this.semua.filter(t => t.id !== id);
            console.log('✅ Transaction deleted');
            return response;
        } catch (error) {
            console.error('❌ Error deleting transaction:', error);
            throw error;
        }
    },

    async getRingkasan() {
        try {
            console.log('🔍 Getting summary dari backend...');
            // PASTIKAN ENDPOINT SUDAH DIPERBAIKI DARI /summary MENJADI /summary/summary
            const data = await API.get('/transactions/summary/summary'); 
            
            // Format data untuk frontend
            return {
                totalIncome: data.totalIncome || 0,
                totalExpense: data.totalExpense || 0,
                balance: data.balance || 0
            };
        } catch (error) {
            console.error('❌ Error loading summary:', error);
            // Fallback ke perhitungan lokal
            return {
                totalIncome: this.pemasukan(),
                totalExpense: this.pengeluaran(),
                balance: this.saldo()
            };
        }
    },

    pemasukan() {
        return this.semua
            .filter(t => t.jenis === 'income')
            .reduce((total, t) => total + parseFloat(t.jumlah || 0), 0);
    },

    pengeluaran() {
        return this.semua
            .filter(t => t.jenis === 'expense')
            .reduce((total, t) => total + parseFloat(t.jumlah || 0), 0);
    },

    saldo() {
        return this.pemasukan() - this.pengeluaran();
    }
};

// 🧾 Manipulasi Tabel - DIUPDATE
const DOM = {
    wadahTabel: document.querySelector("#data-table tbody"),

    renderTransactions() {
        this.hapusSemuaTransaksi();
        
        if (Transaksi.semua.length === 0) {
            this.tampilkanPesanKosong();
            return;
        }
        
        // Urutkan berdasarkan tanggal terbaru
        const sortedTransactions = [...Transaksi.semua].sort((a, b) => 
            new Date(b.tanggal) - new Date(a.tanggal)
        );
        
        sortedTransactions.forEach((transaksi) => this.tambahTransaksi(transaksi));
    },

    tampilkanPesanKosong() {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td colspan="4" class="text-center py-4 text-gray-500">
                <i class="fas fa-receipt text-3xl mb-2"></i>
                <p>Belum ada data transaksi</p>
                <small>Klik tombol "+" untuk menambah transaksi</small>
            </td>
        `;
        this.wadahTabel.appendChild(tr);
    },

    tambahTransaksi(transaksi) {
        const tr = document.createElement("tr");
        tr.innerHTML = this.isiBarisTransaksi(transaksi);
        this.wadahTabel.appendChild(tr);
    },

    isiBarisTransaksi(transaksi) {
        const kelasCSS = transaksi.jenis === 'income' ? "pemasukan" : "pengeluaran";
        const jumlahFormat = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(transaksi.jumlah || 0);

        // Format tanggal
        let tanggalDisplay = '-';
        if (transaksi.tanggal) {
            const date = new Date(transaksi.tanggal);
            tanggalDisplay = date.toLocaleDateString('id-ID');
        }
        
        return `
            <td class="px-4 py-3">${transaksi.keterangan || '-'}</td>
            <td class="px-4 py-3 ${kelasCSS}">${jumlahFormat}</td>
            <td class="px-4 py-3">${tanggalDisplay}</td>
            <td class="px-4 py-3">
                <button onclick="hapusTransaksi(${transaksi.id})" class="btn-hapus">
                    <i class="fas fa-trash"></i>
                </button>
                ${transaksi.buktiTransaksi ? `
                    <button onclick="Bukti.lihat('${transaksi.buktiTransaksi}')" class="btn-bukti ml-2">
                        <i class="fas fa-image"></i>
                    </button>
                ` : ''}
            </td>
        `;
    },

    async perbaruiRingkasan() {
        try {
            const ringkasan = await Transaksi.getRingkasan();
            
            document.getElementById("incomeDisplay").textContent = 
                "Rp " + Math.round(ringkasan.totalIncome || 0).toLocaleString("id-ID");
            
            document.getElementById("expenseDisplay").textContent = 
                "Rp " + Math.round(ringkasan.totalExpense || 0).toLocaleString("id-ID");
            
            document.getElementById("totalDisplay").textContent = 
                "Rp " + Math.round(ringkasan.balance || 0).toLocaleString("id-ID");
                
        } catch (error) {
            console.error('Error updating summary:', error);
            // Fallback lokal
            document.getElementById("incomeDisplay").textContent = "Rp " + Math.round(Transaksi.pemasukan()).toLocaleString("id-ID");
            document.getElementById("expenseDisplay").textContent = "Rp " + Math.round(Transaksi.pengeluaran()).toLocaleString("id-ID");
            document.getElementById("totalDisplay").textContent = "Rp " + Math.round(Transaksi.saldo()).toLocaleString("id-ID");
        }
    },

    hapusSemuaTransaksi() {
        if (this.wadahTabel) {
            this.wadahTabel.innerHTML = "";
        }
    }
};

// 📤 Form Tambah Transaksi - DIUPDATE
const Form = {
    get description() { return document.getElementById("description"); },
    get amount() { return document.getElementById("amount"); },
    get date() { return document.getElementById("dateInput"); },
    get bukti() { return document.getElementById("buktiInput"); },

    ambilNilai() {
        const jenis = document.querySelector('input[name="type"]:checked').value;
        return {
            keterangan: this.description.value.trim(),
            jumlah: parseFloat(this.amount.value),
            jenis: jenis,
            tanggal: this.date.value
        };
    },

    validasi() {
        const { keterangan, jumlah, tanggal } = this.ambilNilai();
        
        if (!keterangan) throw new Error("Keterangan harus diisi!");
        if (isNaN(jumlah) || jumlah <= 0) throw new Error("Jumlah harus lebih dari 0!");
        if (!tanggal) throw new Error("Tanggal harus diisi!");
    },

    buatFormData() {
        const formData = new FormData();
        const { keterangan, jumlah, jenis, tanggal } = this.ambilNilai();
        
        // Tambahkan field text
        formData.append('keterangan', keterangan);
        formData.append('jumlah', jumlah.toString());
        formData.append('jenis', jenis);
        formData.append('tanggal', tanggal);
        
        // Tambahkan file jika ada
        const file = this.bukti.files[0];
        if (file) {
            // PENTING: Nama field 'buktiTransaksi' harus sesuai dengan backend Multer
            formData.append('buktiTransaksi', file);
        }
        
        console.log('🔍 FormData untuk transaksi:', {
            keterangan, jumlah, jenis, tanggal, 
            hasFile: !!file
        });
        
        return formData;
    },

    hapusIsi() {
        this.description.value = "";
        this.amount.value = "";
        this.date.value = "";
        this.bukti.value = "";
        // Set default ke pengeluaran
        document.getElementById('expenseRadio').checked = true;
    },

    async submit(event) {
        event.preventDefault();
        
        const submitBtn = event.target.querySelector('.save');
        const originalText = submitBtn.textContent;
        
        try {
            console.log('🔍 Starting form submission...');
            
            // Validasi
            this.validasi();
            
            // Loading state
            submitBtn.textContent = 'Menyimpan...';
            submitBtn.disabled = true;
            
            // Buat dan kirim FormData
            const formData = this.buatFormData();
            const response = await Transaksi.tambah(formData);
            
            // Update UI
            DOM.renderTransactions();
            await DOM.perbaruiRingkasan();
            await updateChart(); // BARIS INI DITAMBAHKAN UNTUK AUTO-REFRESH CHART
            
            // Reset & close
            this.hapusIsi();
            Modal.close();
            
            showNotification('Transaksi berhasil ditambahkan!', 'success');
            
        } catch (error) {
            console.error('❌ Form error:', error);
            showNotification(error.message, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
};

// 📸 Popup Bukti Transaksi
const Bukti = {
    lihat(buktiPath) {
        const previewImg = document.getElementById("previewBukti");
        const popup = document.getElementById("popupBuktiArea");
        
        // Handle URL Cloudinary atau local
        if (buktiPath.startsWith('http')) {
            previewImg.src = buktiPath;
        } else if (buktiPath.startsWith('data:')) {
            previewImg.src = buktiPath;
        } else {
            // Default ke URL asli
            previewImg.src = buktiPath;
        }
        
        popup.classList.add("aktif");
    },

    close() {
        document.getElementById("popupBuktiArea").classList.remove("aktif");
    }
};

// 📊 Chart System - DIUPDATE
let currentMainChart = null;

async function updateChart() {
    const canvas = document.getElementById("mainChart");
    const noDataBox = document.querySelector('.no-data-box');
    const chartType = document.getElementById('chartTypeSelector')?.value || 'pie';
    const timeRange = document.getElementById('timeRangeSelector')?.value || 'all';
    
    if (!canvas) return;

    try {
        // Data untuk chart dari transaksi yang sudah ada
        const pemasukan = Transaksi.pemasukan();
        const pengeluaran = Transaksi.pengeluaran();
        const hasData = pemasukan > 0 || pengeluaran > 0;

        if (!hasData) {
            if (currentMainChart) currentMainChart.destroy();
            canvas.style.display = "none";
            if (noDataBox) noDataBox.style.display = "flex";
            return;
        }

        canvas.style.display = "block";
        if (noDataBox) noDataBox.style.display = "none";

        const chartData = {
            labels: ['Pemasukan', 'Pengeluaran'],
            datasets: [{
                label: 'Jumlah (Rp)',
                data: [pemasukan, pengeluaran],
                backgroundColor: ['#3B82F6', '#EF4444'],
                borderColor: ['#2563EB', '#DC2626'],
                borderWidth: 2
            }]
        };

        // Hancurkan chart sebelumnya
        if (currentMainChart) currentMainChart.destroy();
        
        // Buat chart baru
        currentMainChart = new Chart(canvas, {
            type: chartType,
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                return `${label}: Rp ${value.toLocaleString('id-ID')}`;
                            }
                        }
                    }
                },
                scales: chartType === 'bar' ? {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rp ' + value.toLocaleString('id-ID');
                            }
                        }
                    }
                } : {}
            }
        });
        
    } catch (error) {
        console.error('Chart error:', error);
    }
}

// 🆕 FUNGSI RESET DATA
async function resetData() {
    if (confirm('Apakah Anda yakin ingin menghapus semua riwayat transaksi? Tindakan ini tidak dapat dibatalkan!')) {
        try {
            const submitBtn = document.querySelector('#resetData');
            const originalText = submitBtn.textContent;
            
            // Loading state
            submitBtn.textContent = 'Menghapus...';
            submitBtn.disabled = true;
            
            // Hapus semua transaksi satu per satu
            const deletePromises = Transaksi.semua.map(transaksi => 
                API.delete(`/transactions/${transaksi.id}`)
            );
            
            await Promise.all(deletePromises);
            
            // Reload data
            await Transaksi.load();
            DOM.renderTransactions();
            await DOM.perbaruiRingkasan();
            await updateChart();
            
            showNotification('Semua riwayat transaksi berhasil dihapus!', 'success');
            
        } catch (error) {
            console.error('Error resetting data:', error);
            showNotification('Gagal menghapus data: ' + error.message, 'error');
        } finally {
            const submitBtn = document.querySelector('#resetData');
            submitBtn.textContent = 'Atur Ulang';
            submitBtn.disabled = false;
        }
    }
}

// Helper function untuk hapus transaksi
async function hapusTransaksi(id) {
    if (confirm('Hapus transaksi ini?')) {
        try {
            await Transaksi.hapus(id);
            DOM.renderTransactions();
            await DOM.perbaruiRingkasan();
            await updateChart();
            showNotification('Transaksi dihapus!', 'success');
        } catch (error) {
            showNotification('Gagal menghapus: ' + error.message, 'error');
        }
    }
}

// ⚡ Jalankan Aplikasi
const Aplikasi = {
    async mulai() {
        try {
            console.log('🚀 Starting app...');
            await Transaksi.load();
            DOM.renderTransactions();
            await DOM.perbaruiRingkasan();
            await updateChart();
            console.log('✅ App started successfully');
        } catch (error) {
            console.error('❌ App error:', error);
            showNotification('Gagal memuat aplikasi', 'error');
        }
    }
};

// 👤 FUNGSI PROFIL DAN NAVIGASI
async function loadProfilePhoto() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const profileCircle = document.getElementById('profileCircle');
        
        if (user && user.fotoProfil) {
            profileCircle.innerHTML = `<img src="${user.fotoProfil}" alt="Foto Profil" class="profile-image">`;
        } else {
            const nama = user.namaLengkap || user.username || 'User';
            const initial = nama.charAt(0).toUpperCase();
            profileCircle.innerHTML = `<div class="profile-default">${initial}</div>`;
        }
    } catch (error) {
        console.error('Error loading profile photo:', error);
        const profileCircle = document.getElementById('profileCircle');
        profileCircle.innerHTML = `<div class="profile-default">U</div>`;
    }
}

// Fungsi untuk logout
function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('transaksi');
        window.location.href = 'index.html';
    }
}

// 🛠 Utility Functions
function showNotification(message, type = 'info') {
    // Hapus notifikasi lama
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    // Buat notifikasi baru
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;

    // Style notifikasi
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 16px 20px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                border-left: 4px solid #16a34a;
                max-width: 400px;
            }
            .notification.success { border-left-color: #16a34a; }
            .notification.error { border-left-color: #ef4444; }
            .notification.info { border-left-color: #3b82f6; }
            .notification.show { transform: translateX(0); }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #374151;
                font-weight: 500;
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Animasi
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 📋 Event Listeners
function setupEventListeners() {
    // Form transaction
    const formTransaction = document.getElementById("formTransaction");
    if (formTransaction) {
        formTransaction.addEventListener("submit", (event) => Form.submit(event));
    }
    
    // Modal buttons
    const showFormBtn = document.getElementById("showForm");
    const closeBtn = document.getElementById("close");
    const cancelBtn = document.querySelector(".cancel");
    
    if (showFormBtn) showFormBtn.addEventListener("click", Modal.open);
    if (closeBtn) closeBtn.addEventListener("click", Modal.close);
    if (cancelBtn) cancelBtn.addEventListener("click", Modal.close);
    
    // Bukti popup
    const buktiCloseBtn = document.querySelector("#popupBuktiArea .btn_close");
    const buktiBlur = document.querySelector("#popupBuktiArea .popupblur");
    
    if (buktiCloseBtn) buktiCloseBtn.addEventListener("click", Bukti.close);
    if (buktiBlur) buktiBlur.addEventListener("click", Bukti.close);
    
    // Chart controls
    const chartTypeSelector = document.getElementById('chartTypeSelector');
    const timeRangeSelector = document.getElementById('timeRangeSelector');
    
    if (chartTypeSelector) {
        chartTypeSelector.addEventListener('change', updateChart);
    }
    
    if (timeRangeSelector) {
        timeRangeSelector.addEventListener('change', updateChart);
    }
    
    // Tombol reset data
    const resetDataBtn = document.getElementById('resetData');
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', resetData);
    }
    
    // NAVIGASI PROFIL & DROPDOWN
    const profileCircle = document.getElementById("profileCircle");
    const profileDropdown = document.getElementById("profileDropdown");
    const logoutBtn = document.getElementById("logoutBtn");
    
    // Toggle dropdown profil
    if (profileCircle) {
        profileCircle.addEventListener("click", function(e) {
            e.stopPropagation();
            if (profileDropdown) {
                profileDropdown.classList.toggle('active');
            }
        });
    }
    
    // Logout function
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }
    
    // Close dropdown ketika klik di luar
    document.addEventListener("click", function() {
        const profileDropdown = document.getElementById("profileDropdown");
        if (profileDropdown) {
            profileDropdown.classList.remove("active");
        }
    });
}

// 🎯 Inisialisasi Aplikasi
document.addEventListener("DOMContentLoaded", async function() {
    console.log("📄 DOM Loaded");
    
    // Cek login
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = "index.html";
        return;
    }
    
    // Setup
    perbaruiTanggalWaktu();
    setInterval(perbaruiTanggalWaktu, 1000);
    
    // Setup profil dan navigasi
    await loadProfilePhoto();
    setupEventListeners();
    
    // Set tanggal default ke hari ini
    const dateInput = document.getElementById("dateInput");
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    
    // Jalankan app
    await Aplikasi.mulai();
});

// Handle page visibility change
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Page is visible, refresh data
        Aplikasi.mulai();
    }

});
