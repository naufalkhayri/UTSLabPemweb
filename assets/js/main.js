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
setInterval(perbaruiTanggalWaktu, 1000);
perbaruiTanggalWaktu();

// ⚙️ Pengendali Modal (Pop-up)
const Modal = {
  open() {
    document.querySelector(".popup_area").classList.add("aktif");
  },
  close() {
    document.querySelector(".popup_area").classList.remove("aktif");
  },
};

// 💾 Penyimpanan Data di Local Storage
const Penyimpanan = {
  ambil() {
    return JSON.parse(localStorage.getItem("transaksi")) || [];
  },
  simpan(dataTransaksi) {
    localStorage.setItem("transaksi", JSON.stringify(dataTransaksi));
  },
};

// 💰 Data Transaksi
const Transaksi = {
  semua: Penyimpanan.ambil(),

  tambah(transaksi) {
    Transaksi.semua.push(transaksi);
    Aplikasi.muattUlang();
  },

  hapus(index) {
    Transaksi.semua.splice(index, 1);
    Aplikasi.muattUlang();
  },

  pemasukan() {
    let totalMasuk = 0;
    Transaksi.semua.forEach(t => {
      if (t.jumlah > 0) totalMasuk += t.jumlah;
    });
    return totalMasuk;
  },

  pengeluaran() {
    let totalKeluar = 0;
    Transaksi.semua.forEach(t => {
      if (t.jumlah < 0) totalKeluar += t.jumlah;
    });
    return totalKeluar;
  },

  saldo() {
    return Transaksi.pemasukan() + Transaksi.pengeluaran();
  }
};

// 🧾 Manipulasi Tabel di Halaman
const DOM = {
  wadahTabel: document.querySelector("#data-table tbody"),

  tambahTransaksi(transaksi, index) {
    const tr = document.createElement("tr");
    tr.innerHTML = DOM.isiBarisTransaksi(transaksi, index);
    tr.dataset.index = index;
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
      <td><button onclick="Transaksi.hapus(${index})">🗑️</button></td>
    `;
  },

  perbaruiRingkasan() {
    document.getElementById("incomeDisplay").textContent =
      "Total Pemasukan: " +
      Transaksi.pemasukan().toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
      });

    document.getElementById("expenseDisplay").textContent =
      "Total Pengeluaran: " +
      Transaksi.pengeluaran().toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
      });

    document.getElementById("totalDisplay").textContent =
      "Saldo Akhir: " +
      Transaksi.saldo().toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
      });
  },

  hapusSemuaTransaksi() {
    DOM.wadahTabel.innerHTML = "";
  }
};

// 🧮 Formulir Tambah Transaksi
const Form = {
  description: document.getElementById("description"),
  amount: document.getElementById("amount"),
  date: document.getElementById("dateInput"),

  ambilNilai() {
    return {
      keterangan: Form.description.value,
      jumlah: Form.amount.value,
      tanggal: Form.date.value,
    };
  },

  validasi() {
    const { keterangan, jumlah, tanggal } = Form.ambilNilai();
    if (keterangan.trim() === "" || jumlah.trim() === "" || tanggal.trim() === "") {
      throw new Error("Mohon isi semua kolom data transaksi!");
    }
  },

  formatData() {
    let { keterangan, jumlah, tanggal } = Form.ambilNilai();
    jumlah = Number(jumlah);
    const [tahun, bulan, hari] = tanggal.split("-");
    tanggal = `${hari}/${bulan}/${tahun}`;
    return { keterangan, jumlah, tanggal };
  },

  hapusIsi() {
    Form.description.value = "";
    Form.amount.value = "";
    Form.date.value = "";
  },

  submit(event) {
    event.preventDefault();
    try {
      Form.validasi();
      const transaksi = Form.formatData();
      Transaksi.tambah(transaksi);
      Form.hapusIsi();
      Modal.close();
    } catch (error) {
      alert(error.message);
    }
  }
};

// ⚡ Jalannya Aplikasi
const Aplikasi = {
  mulai() {
    Transaksi.semua.forEach(DOM.tambahTransaksi);
    DOM.perbaruiRingkasan();
    Penyimpanan.simpan(Transaksi.semua);
  },

  muattUlang() {
    DOM.hapusSemuaTransaksi();
    Aplikasi.mulai();
  }
};

Aplikasi.mulai();

function bukaProfil() {
    window.location.href = "profil.html"; // arahkan ke halaman profil
  }
