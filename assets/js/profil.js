// Tunggu sampai DOM sepenuhnya dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Inisialisasi event listeners
    initializeEventListeners();
    
    // Load data dari localStorage
    loadSavedData();
});

function initializeEventListeners() {
    // Tombol Edit Profil
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', editProfil);
        console.log('Edit button listener added');
    } else {
        console.error('Edit button not found!');
    }

    // Tombol Close Modal
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', tutupModal);
    }

    // Tombol Cancel
    const cancelBtn = document.getElementById('cancelEdit');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', tutupModal);
    }

    // Form Submit
    const form = document.getElementById('form_edit_profil');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Upload Foto
    const uploadFoto = document.getElementById('upload_foto');
    if (uploadFoto) {
        uploadFoto.addEventListener('change', handlePhotoUpload);
    }

    // Klik di luar modal untuk menutup
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('modal_edit');
        if (event.target === modal) {
            tutupModal();
        }
    });
}

function editProfil() {
    console.log('Edit profile function called');
    
    const modal = document.getElementById('modal_edit');
    if (!modal) {
        console.error('Modal not found!');
        return;
    }

    // Isi form dengan data yang ada
    try {
        document.getElementById('edit_nama').value = document.getElementById('nama_pengguna').textContent;
        document.getElementById('edit_email').value = document.getElementById('email_pengguna').textContent;
        document.getElementById('edit_handphone').value = document.getElementById('handphone').textContent;
        
        const tglLahirText = document.getElementById('tgl_lahir').textContent;
        document.getElementById('edit_tgl_lahir').value = formatDateForInput(tglLahirText);
        
        document.getElementById('edit_gender').value = document.getElementById('gender').textContent;
        document.getElementById('edit_alamat').value = document.getElementById('alamat').textContent;

        // Tampilkan modal
        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        console.log('Modal should be visible now');
    } catch (error) {
        console.error('Error filling form:', error);
    }
}

function tutupModal() {
    const modal = document.getElementById('modal_edit');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        console.log('Modal closed');
    }
}

function handleFormSubmit(e) {
    e.preventDefault();
    console.log('Form submitted');

    try {
        // Update data di halaman
        const nama = document.getElementById('edit_nama').value;
        const email = document.getElementById('edit_email').value;
        const handphone = document.getElementById('edit_handphone').value;
        const tglLahir = document.getElementById('edit_tgl_lahir').value;
        const gender = document.getElementById('edit_gender').value;
        const alamat = document.getElementById('edit_alamat').value;

        document.getElementById('nama_pengguna').textContent = nama;
        document.getElementById('nama_lengkap').textContent = nama;
        document.getElementById('email_pengguna').textContent = email;
        document.getElementById('handphone').textContent = handphone;
        document.getElementById('tgl_lahir').textContent = formatDateForDisplay(tglLahir);
        document.getElementById('gender').textContent = gender;
        document.getElementById('jenis_kelamin').textContent = gender;
        document.getElementById('alamat').textContent = alamat;

        // Simpan ke localStorage
        const userData = {
            nama: nama,
            email: email,
            handphone: handphone,
            tgl_lahir: tglLahir,
            gender: gender,
            alamat: alamat
        };
        localStorage.setItem('userProfile', JSON.stringify(userData));

        // Tutup modal dan tampilkan pesan
        tutupModal();
        alert('Profil berhasil diperbarui!');
        
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Terjadi kesalahan saat memperbarui profil');
    }
}

function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        // Validasi tipe file
        if (!file.type.startsWith('image/')) {
            alert('Harap pilih file gambar');
            return;
        }

        // Validasi ukuran file (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Ukuran file terlalu besar. Maksimal 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const fotoProfil = document.getElementById('foto_profil');
            if (fotoProfil) {
                fotoProfil.src = event.target.result;
                localStorage.setItem('userPhoto', event.target.result);
                console.log('Photo uploaded successfully');
            }
        };
        
        reader.onerror = function() {
            console.error('Error reading file');
            alert('Terjadi kesalahan saat membaca file');
        };
        
        reader.readAsDataURL(file);
    }
}

function formatDateForInput(dateText) {
    console.log('Formatting date for input:', dateText);
    
    const months = {
        'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
        'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
        'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
    };
    
    const parts = dateText.split(' ');
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = months[parts[1]];
        const year = parts[2];
        const formattedDate = `${year}-${month}-${day}`;
        console.log('Formatted date:', formattedDate);
        return formattedDate;
    }
    return '';
}

function formatDateForDisplay(dateString) {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Tanggal tidak valid';
    }
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

function loadSavedData() {
    // Load profile data
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        try {
            const userData = JSON.parse(savedProfile);
            document.getElementById('nama_pengguna').textContent = userData.nama;
            document.getElementById('nama_lengkap').textContent = userData.nama;
            document.getElementById('email_pengguna').textContent = userData.email;
            document.getElementById('handphone').textContent = userData.handphone;
            document.getElementById('tgl_lahir').textContent = formatDateForDisplay(userData.tgl_lahir);
            document.getElementById('gender').textContent = userData.gender;
            document.getElementById('jenis_kelamin').textContent = userData.gender;
            document.getElementById('alamat').textContent = userData.alamat;
            console.log('Profile data loaded from localStorage');
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    }
    
    // Load photo
    const savedPhoto = localStorage.getItem('userPhoto');
    if (savedPhoto) {
        const fotoProfil = document.getElementById('foto_profil');
        if (fotoProfil) {
            fotoProfil.src = savedPhoto;
            console.log('Photo loaded from localStorage');
        }
    }
}