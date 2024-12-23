document.addEventListener("DOMContentLoaded", function () {
  const username = localStorage.getItem('name');

  // Kiểm tra nếu tên tồn tại và gán vào phần tử HTML
  if (username) {
    document.getElementById('username').textContent = username;
  } else {
    document.getElementById('username').textContent = 'Tên người dùng';
  }

  // Khi nhấn nút "Sửa thông tin"
  document.getElementById('edit-profile').addEventListener('click', function () {
    // Điều hướng đến trang sửa thông tin
    window.location.href = '/profile/edit_profile.html';
  });

  // Khi nhấn nút "Đăng xuất"
  document.getElementById('logout').addEventListener('click', function () {
    localStorage.clear();
    window.location.href = '/login/login.html';
  });

  const navLinks = document.querySelectorAll('a[data-tab]');
  navLinks.forEach(link => {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      const url = this.getAttribute('data-tab');
      const iframe = document.getElementById('content-frame');
      iframe.src = url; // Đặt src của iframe để tải nội dung trang con
    });
  });
});

// let isLoggedIn = true;
// if (isLoggedIn) {
//   document.getElementById("profile-container").style.display = "block";
//   document.getElementById("login-btn").style.display = "none"; 
// } else {
//   document.getElementById("profile-container").classList.add("d-none");
//   document.getElementById("login-btn").style.display = "block";
// }


