import { fetchWithAuth, refreshAccessToken, logoutUser } from "../../../utils.js";
import customDialog from "../../../dialog/dialog.js";
document.addEventListener('DOMContentLoaded', function () { 
  const scheduleTypeSelect = document.getElementById('scheduleType');
  const startDateContainer = document.getElementById('startDateContainer');
  const endDateContainer = document.getElementById('endDateContainer');
  const startDateLabel = document.getElementById('startDateLabel');
  const startDate = document.getElementById('startDate');
  const endDate = document.getElementById('endDate');
  const busSelect = document.getElementById('bus');
  const driverSelect = document.getElementById('driver');
  const startLocationSelect = document.getElementById('startLocation');
  const endLocationSelect = document.getElementById('endLocation');
  
  function createOptions(selectElement, data, textKey, valueKey, defaultText) {
    const defaultOption = document.createElement('option');
    defaultOption.textContent = defaultText;
    defaultOption.value = ""; // Giá trị rỗng cho tùy chọn mặc định
    selectElement.appendChild(defaultOption);
  
    data.forEach(item => {
      const option = document.createElement('option');
      option.textContent = item[textKey];
      option.value = item[valueKey];
      selectElement.appendChild(option);
    });
  }

  async function fetchData() {
    try {
      // Lấy danh sách xe
      const busResponse = await fetch('http://localhost:4500/api/bus/');
      const busData = await busResponse.json();
      createOptions(busSelect, busData.data.buses, 'licensePlate', '_id', 'Chọn xe');

      // Lấy danh sách tài xế
      const driverResponse = await fetch('http://localhost:4500/api/driver/');
      const driverData = await driverResponse.json();
      createOptions(driverSelect, driverData.data.drivers, 'name', '_id', 'Chọn tài xế');

      // Lấy danh sách trạm xe
      const stationResponse = await fetch('http://localhost:4500/api/stations');
      const stationData = await stationResponse.json();
      const stations = stationData.data;

      // Cập nhật điểm khởi hành và điểm đến
      createOptions(startLocationSelect, stations, 'name', '_id', 'Chọn điểm xuất phát');
      createOptions(endLocationSelect, stations, 'name', '_id', 'Chọn điểm đến');

      startLocationSelect.addEventListener('change', function () {
        const startLocationValue = startLocationSelect.value;

        const endOptions = endLocationSelect.querySelectorAll('option');
        endOptions.forEach(option => {
          if (option.value === startLocationValue) {
            option.disabled = true; 
          } else {
            option.disabled = false; 
          }
        });
      });

      endLocationSelect.addEventListener('change', function () {
        const startLocationValue = startLocationSelect.value;
        const endLocationValue = endLocationSelect.value;

        if (startLocationValue === endLocationValue) {
          customDialog.showAlert("Lỗi!","Điểm khởi hành và điểm đến không được trùng nhau.");
          endLocationSelect.value = ""; 
        }
      });

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  fetchData();

  scheduleTypeSelect.addEventListener('change', function () {
    const scheduleType = scheduleTypeSelect.value;

    if (scheduleType === 'just_one') {
      startDateLabel.innerText = 'Ngày Chạy';
      startDate.type = 'date'; 
      startDateContainer.style.display = 'block';
      endDateContainer.style.display = 'none'; 
    } else {
      startDateLabel.innerText = 'Ngày Bắt Đầu';
      startDate.type = 'datetime-local'; 
      startDateContainer.style.display = 'block';
      endDateContainer.style.display = 'block';
    }
  });

  scheduleTypeSelect.dispatchEvent(new Event('change'));

  startDate.addEventListener('input', function () {
    const today = new Date().toISOString().split('T')[0]; 
    startDate.min = today; 
    if (endDate.value && new Date(endDate.value) <= new Date(startDate.value)) {
      endDate.setCustomValidity("Ngày kết thúc phải sau ngày bắt đầu.");
    } else {
      endDate.setCustomValidity("");
    }
  });

  endDate.addEventListener('input', function () {
    if (new Date(endDate.value) <= new Date(startDate.value)) {
      endDate.setCustomValidity("Ngày kết thúc phải sau ngày bắt đầu.");
    } else {
      endDate.setCustomValidity("");
    }
  });

  const tripForm = document.getElementById('tripForm');
  
  tripForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const authToken = localStorage.getItem("authToken");  
    const departureTime = document.getElementById('departureTime').value;
    const estimatedHours = parseInt(document.getElementById('estimatedHours').value);
    const estimatedMinutes = parseInt(document.getElementById('estimatedMinutes').value);

    // Chuyển departureTime thành đối tượng Date
    const today = new Date();
    const [hours, minutes] = departureTime.split(':').map(Number);
    
    // Đảm bảo ngày khởi hành chính xác theo startDate đã chọn
    const startDateInput = document.getElementById('startDate').value;
    let startDate = new Date(startDateInput);
    startDate.setHours(hours, minutes, 0, 0); // Thiết lập giờ và phút theo departureTime

    // Tạo một bản sao của startDate để tính thời gian đến
    let arrivalDate = new Date(startDate);
    arrivalDate.setHours(arrivalDate.getHours() + estimatedHours);
    arrivalDate.setMinutes(arrivalDate.getMinutes() + estimatedMinutes);

    // Định dạng lại arriveTime thành HH:mm (24 giờ)
    const arriveTime = arrivalDate.toTimeString().slice(0, 5); // Cắt lấy "HH:mm"

    const scheduleType = document.getElementById('scheduleType').value;
    let endDate = null;
    
    if (scheduleType === 'just_one') {
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
    } else {
        endDate = document.getElementById('endDate').value ? new Date(document.getElementById('endDate').value) : null;
    }

    // Chuyển về định dạng ISO để lưu vào CSDL
    const tripData = {
        bus: document.getElementById('bus').value,
        driver: document.getElementById('driver').value,
        startLocation: document.getElementById('startLocation').value,
        endLocation: document.getElementById('endLocation').value,
        price: parseInt(document.getElementById('price').value),
        estimatedTravelTime: {
            hours: estimatedHours,
            minutes: estimatedMinutes
        },
        schedule: {
            startDate: startDate.toISOString(),
            endDate: endDate ? endDate.toISOString() : null,
            type: scheduleType,
            time: {
                departure: departureTime, // Lưu đúng giờ nhập vào
                arriveTime: arriveTime // Giờ đến được tính toán chính xác
            }
        }
    };

    try {
        const response = await fetchWithAuth('http://localhost:4500/api/trips/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}` 
            },
            body: JSON.stringify(tripData)
        });

        const result = await response.json();

        if (response.ok) {
            customDialog.showAlert("Thành công!","Chuyến xe đã được tạo thành công!");
            tripForm.reset();
        } else {
            customDialog.showAlert("Lỗi!",`Lỗi: ${result.message}`);
        }
    } catch (error) {
        console.error('Lỗi khi gửi dữ liệu:', error);
        customDialog.showAlert("Lỗi!",'Có lỗi xảy ra, vui lòng thử lại!');
    }
  });

});
