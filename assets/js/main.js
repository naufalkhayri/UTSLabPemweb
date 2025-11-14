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
        <button onclick="Bukti.lihat(${index})">🖼️</button>
      </td>
    `;
  },

  perbaruiRingkasan() {
    document.getElementById("incomeDisplay").textContent =
      "Total Pemasukan: " + Transaksi.pemasukan().toLocaleString("id-ID", { style: "currency", currency: "IDR" });

    document.getElementById("expenseDisplay").textContent =
      "Total Pengeluaran: " + Transaksi.pengeluaran().toLocaleString("id-ID", { style: "currency", currency: "IDR" });

    document.getElementById("totalDisplay").textContent =
      "Saldo Akhir: " + Transaksi.saldo().toLocaleString("id-ID", { style: "currency", currency: "IDR" });
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
  bukti: document.getElementById("buktiInput"), // <input type="file" id="buktiInput">

  ambilNilai() {
    return {
      keterangan: Form.description.value,
      jumlah: Form.amount.value,
      tanggal: Form.date.value,
      bukti: Form.bukti.files[0] || null
    };
  },

  validasi() {
    const { keterangan, jumlah, tanggal } = Form.ambilNilai();
    if (!keterangan.trim() || !jumlah.trim() || !tanggal.trim()) {
      throw new Error("Mohon isi semua kolom data transaksi!");
    }
  },

  async formatData() {
    let { keterangan, jumlah, tanggal, bukti } = Form.ambilNilai();
    jumlah = Number(jumlah);

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

// Ganti bukti transaksi
document.getElementById("inputGantiBukti").addEventListener("change", function () {
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

// ⚡ Jalankan Aplikasi
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
  window.location.href = "profil.html";
}
