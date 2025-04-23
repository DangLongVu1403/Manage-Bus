// import { logoutUser } from "../utils.js";
// const hamBurger = document.querySelector(".toggle-btn");

// hamBurger.addEventListener("click", function () {
//   document.querySelector("#sidebar").classList.toggle("expand");
// });

// document.addEventListener("DOMContentLoaded", function () {
//     document.querySelectorAll(".sidebar-link").forEach(link => {
//         link.addEventListener("click", function (event) {
//             event.preventDefault();
//             let page = this.getAttribute("data-page");
//             if (page) {
//                 document.getElementById("content-frame").src = page;
//             }
//         });
//     });

//     document.querySelector(".sidebar-footer .sidebar-link").addEventListener("click", function (event) {
//         event.preventDefault();
//         logoutUser();
//     });
    
//     function setActiveMenu(selectedLink) {
//         // Xóa class "active" khỏi tất cả các mục sidebar
//         document.querySelectorAll(".sidebar-item").forEach(item => {
//             item.classList.remove("active");
//         });

//         // Thêm class "active" vào mục được chọn
//         selectedLink.closest(".sidebar-item").classList.add("hover");
//     }
// });

// function executeScripts(container) {
//     container.querySelectorAll("script").forEach(oldScript => {
//         const newScript = document.createElement("script");
//         newScript.textContent = oldScript.textContent;
//         document.body.appendChild(newScript).parentNode.removeChild(newScript);
//     });
// }



document.addEventListener('DOMContentLoaded', () => {
  const startPointSelect = document.getElementById('diemKhoiHanh');
  const endPointSelect = document.getElementById('diemDen');
  const form = document.querySelector('#search-ticket form');

  // Fetch danh sách trạm
  const fetchStations = async () => {
    try {
      const response = await fetch(`http://localhost:4500/api/stations`);
      const data = await response.json();
      populateStations(data.data);
    } catch (error) {
      console.error('Error fetching stations:', error);
    }
  };

  // Điền dữ liệu vào select
  const populateStations = (stations) => {
    // Xóa các option mặc định
    startPointSelect.innerHTML = '<option selected disabled>Chọn Điểm Khởi Hành</option>';
    endPointSelect.innerHTML = '<option selected disabled>Chọn Điểm Đến</option>';

    // Thêm các option từ API vào điểm khởi hành
    stations.forEach(station => {
      const option = document.createElement('option');
      option.value = station.id;
      option.textContent = station.name;
      startPointSelect.appendChild(option);
    });

    // Ban đầu disable điểm đến
    endPointSelect.disabled = true;
  };

  // Xử lý khi chọn điểm khởi hành
  startPointSelect.addEventListener('change', (e) => {
    const selectedStartPoint = e.target.value;
    endPointSelect.disabled = false;
    endPointSelect.innerHTML = '<option selected disabled>Chọn Điểm Đến</option>';

    // Fetch lại dữ liệu để lọc điểm đến
    fetch(`${BASE_URL}/stations`)
      .then(response => response.json())
      .then(data => {
        const availableEndPoints = data.data.filter(
          station => station.id !== selectedStartPoint
        );

        // Thêm các option vào điểm đến
        availableEndPoints.forEach(station => {
          const option = document.createElement('option');
          option.value = station.id;
          option.textContent = station.name;
          endPointSelect.appendChild(option);
        });
      })
      .catch(error => console.error('Error fetching stations:', error));
  });

  // Xử lý submit form
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const startPoint = startPointSelect.value;
    const endPoint = endPointSelect.value;
    const departureDate = document.getElementById('ngayKhoiHanh').value;

    if (!startPoint || !endPoint || !departureDate) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    console.log({
      startPoint,
      endPoint,
      departureDate
    });
    // Gọi API tìm vé xe ở đây nếu cần
  });

  // Gọi fetch khi load trang
  fetchStations();
});