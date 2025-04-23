import { fetchWithAuth, refreshAccessToken, logoutUser } from "../../../utils.js";
import customDialog from "../../../dialog/dialog.js";
let initialTripDetails = {};

// Lấy tham số từ URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Chuẩn hóa dữ liệu chuyến xe
function normalizeTripDetails(trip) {
    return {
        bus: trip.bus || "",
        driver: trip.driver || "",
        startLocation: trip.startLocation || "",
        endLocation: trip.endLocation || "",
        departureTime: trip.departureTime ? new Date(trip.departureTime).toISOString().slice(0, 16) : "",
        price: trip.price || 0,
        estimatedTravelTime: {
            hours: trip.estimatedTravelTime?.hours || 0,
            minutes: trip.estimatedTravelTime?.minutes || 0
        }
    };
}

// Lấy danh sách xe buýt từ API và điền vào <select>
async function populateBusOptions(selectedBusId) {
    try {
        const response = await fetch("http://localhost:4500/api/bus");
        if (!response.ok) throw new Error("Phản hồi API không thành công");
        
        const result = await response.json();

        const buses = Array.isArray(result.data.buses) ? result.data.buses : [];
        const busSelect = document.getElementById("bus");

        if (buses.length === 0) {
            console.warn("Không có xe nào được trả về từ API");
        }

        buses.forEach(bus => {
            const option = document.createElement("option");
            option.value = bus._id;
            option.text = bus.licensePlate || "Không có biển số";
            if (bus._id === selectedBusId) option.selected = true;
            busSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách xe:", error);
    }
}

// Lấy danh sách tài xế từ API và điền vào <select>
async function populateDriverOptions(selectedDriverId) {
    try {
        const response = await fetch("http://localhost:4500/api/driver");
        if (!response.ok) throw new Error("Phản hồi API không thành công");
        
        const result = await response.json();

        const drivers = Array.isArray(result.data.drivers) ? result.data.drivers : [];
        const driverSelect = document.getElementById("driver");

        if (drivers.length === 0) {
            console.warn("Không có tài xế nào được trả về từ API");
        }

        drivers.forEach(driver => {
            const option = document.createElement("option");
            option.value = driver._id;
            option.text = driver.name || "Không có tên";
            if (driver._id === selectedDriverId) option.selected = true;
            driverSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách tài xế:", error);
    }
}

// Lấy danh sách bến xe từ API và điền vào <select>
async function populateStationOptions(selectedStartId, selectedEndId) {
    try {
        const response = await fetchWithAuth("http://localhost:4500/api/stations");
        if (!response.ok) throw new Error("Phản hồi API không thành công");
        
        const result = await response.json();

        const stations = Array.isArray(result.data) ? result.data : [];
        const startSelect = document.getElementById("startLocation");
        const endSelect = document.getElementById("endLocation");

        if (stations.length === 0) {
            console.warn("Không có bến xe nào được trả về từ API");
        }

        stations.forEach(station => {
            const startOption = document.createElement("option");
            startOption.value = station._id;
            startOption.text = station.name || "Không có tên";
            if (station._id === selectedStartId) startOption.selected = true;
            startSelect.appendChild(startOption);

            const endOption = document.createElement("option");
            endOption.value = station._id;
            endOption.text = station.name || "Không có tên";
            if (station._id === selectedEndId) endOption.selected = true;
            endSelect.appendChild(endOption);
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách bến xe:", error);
    }
}

// Hiển thị thông tin chuyến xe lên form
async function fetchTripDetails(tripId) {
    try {
        const response = await fetchWithAuth(`http://localhost:4500/api/trips/${tripId}`);
        if (!response.ok) throw new Error("Không thể lấy thông tin chuyến xe");

        const result = await response.json();
        const trip = normalizeTripDetails(result.data);

        // Điền thông tin hiện tại và lấy danh sách lựa chọn từ API
        await populateBusOptions(trip.bus);
        await populateDriverOptions(trip.driver);
        await populateStationOptions(trip.startLocation, trip.endLocation);

        document.getElementById("departureTime").value = trip.departureTime;
        document.getElementById("price").value = trip.price;
        document.getElementById("estimatedHours").value = trip.estimatedTravelTime.hours;
        document.getElementById("estimatedMinutes").value = trip.estimatedTravelTime.minutes;

        // Lưu trạng thái ban đầu
        initialTripDetails = { ...trip };
    } catch (error) {
        console.error(error);
        customDialog.showAlert("Lỗi!","Đã xảy ra lỗi khi tải thông tin chuyến xe.");
    }
}

// Kiểm tra sự thay đổi
function hasChanges() {
    const currentTripDetails = normalizeTripDetails({
        bus: document.getElementById("bus").value,
        driver: document.getElementById("driver").value,
        startLocation: document.getElementById("startLocation").value,
        endLocation: document.getElementById("endLocation").value,
        departureTime: document.getElementById("departureTime").value,
        price: Number(document.getElementById("price").value),
        estimatedTravelTime: {
            hours: Number(document.getElementById("estimatedHours").value),
            minutes: Number(document.getElementById("estimatedMinutes").value)
        }
    });

    for (const key in initialTripDetails) {
        if (key === "estimatedTravelTime") {
            if (initialTripDetails[key].hours !== currentTripDetails[key].hours ||
                initialTripDetails[key].minutes !== currentTripDetails[key].minutes) {
                return true;
            }
        } else if (initialTripDetails[key] !== currentTripDetails[key]) {
            return true;
        }
    }
    return false;
}

// Tính thời gian đến dựa trên thời gian khởi hành và thời gian ước tính
function calculateArriveTime(departureTime, estimatedHours, estimatedMinutes) {
    const departure = new Date(departureTime);
    departure.setHours(departure.getHours() + Number(estimatedHours));
    departure.setMinutes(departure.getMinutes() + Number(estimatedMinutes));
    return departure;
}

// Cập nhật thông tin chuyến xe
async function updateTripDetails(tripId) {
    try {
        if (!hasChanges()) {
            customDialog.showAlert("Thông báo!","Không có thay đổi nào được thực hiện.");
            return;
        }
        const authToken = localStorage.getItem("authToken");  
        const estimatedHours = Number(document.getElementById("estimatedHours").value);
        const estimatedMinutes = Number(document.getElementById("estimatedMinutes").value);
        const arriveTime = calculateArriveTime(document.getElementById("departureTime").value, estimatedHours, estimatedMinutes);
        const departure = new Date(document.getElementById("departureTime").value);
        departure.setMinutes(departure.getMinutes() - departure.getTimezoneOffset()); 
        const departureTime = departure.getFullYear() + "-" +
                              String(departure.getMonth() + 1).padStart(2, "0") + "-" +
                              String(departure.getDate()).padStart(2, "0") + "T" +
                              String(departure.getHours()).padStart(2, "0") + ":" +
                              String(departure.getMinutes()).padStart(2, "0");

        const updatedTrip = {
            bus: document.getElementById("bus").value,
            driver: document.getElementById("driver").value,
            startLocation: document.getElementById("startLocation").value,
            endLocation: document.getElementById("endLocation").value,
            departureTime: departureTime,
            arriveTime: arriveTime,
            price: Number(document.getElementById("price").value),
            estimatedTravelTime: {
                hours: estimatedHours,
                minutes: estimatedMinutes
            }
        };

        const response = await fetchWithAuth(`http://localhost:4500/api/trips/${tripId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(updatedTrip),
        });

        if (!response.ok) throw new Error("Không thể cập nhật thông tin chuyến xe");

        customDialog.showAlert("Thành công!","Thông tin chuyến xe đã được cập nhật thành công.");
        window.location.href = "/BusManage/src/admin/manage_trip/manage/manage_trip.html";
    } catch (error) {
        console.error(error);
        customDialog.showAlert("Lỗi!","Đã xảy ra lỗi khi cập nhật thông tin chuyến xe.");
    }
}

// Xử lý khi tải trang
window.onload = () => {
    const tripId = getQueryParam("id");

    if (!tripId) {
        customDialog.showAlert("Lỗi!","Không tìm thấy ID của chuyến xe.");
        window.location.href = "/BusManage/src/admin/manage_trip/manage_trip.html";
        return;
    }

    fetchTripDetails(tripId);

    document.getElementById("editTripForm").addEventListener("submit", (event) => {
        event.preventDefault();
        updateTripDetails(tripId);
    });
};