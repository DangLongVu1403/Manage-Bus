import { fetchWithAuth } from "../../../utils.js";
import customDialog from "../../../dialog/dialog.js";

// Lưu trạng thái ban đầu của các trường
let initialStationDetails = {};

// Lấy tham số từ URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Chuẩn hóa dữ liệu
function normalizeStationDetails(station) {
    return {
        name: station.name || "",
        address: station.address || "",
        coordinates: {
            latitude: parseFloat(station.coordinates?.latitude) || 0,
            longitude: parseFloat(station.coordinates?.longitude) || 0
        }
    };
}

// Hiển thị thông tin bến xe lên các trường
async function fetchStationDetails(stationId) {
    try {
        const response = await fetch(`http://localhost:4500/api/stations/${stationId}`);
        if (!response.ok) throw new Error("Không thể lấy thông tin bến xe");

        const result = await response.json();
        const station = normalizeStationDetails(result.data);

        // Điền thông tin vào các trường
        document.getElementById("stationName").value = station.name;
        document.getElementById("address").value = station.address;
        document.getElementById("latitude").value = station.coordinates.latitude;
        document.getElementById("longitude").value = station.coordinates.longitude;

        // Lưu trạng thái ban đầu
        initialStationDetails = { ...station }; // Sao chép thông tin vào biến lưu trữ
    } catch (error) {
        console.error(error);
        customDialog.showAlert("Lỗi!", "Đã xảy ra lỗi khi tải thông tin bến xe.");
    }
}

// Kiểm tra sự thay đổi
function hasChanges() {
    const currentStationDetails = normalizeStationDetails({
        name: document.getElementById("stationName").value,
        address: document.getElementById("address").value,
        coordinates: {
            latitude: parseFloat(document.getElementById("latitude").value),
            longitude: parseFloat(document.getElementById("longitude").value)
        }
    });

    // So sánh từng trường
    if (initialStationDetails.name !== currentStationDetails.name ||
        initialStationDetails.address !== currentStationDetails.address ||
        initialStationDetails.coordinates.latitude !== currentStationDetails.coordinates.latitude ||
        initialStationDetails.coordinates.longitude !== currentStationDetails.coordinates.longitude) {
        return true; // Có thay đổi
    }
    return false; // Không có thay đổi
}

// Cập nhật thông tin bến xe
async function updateStationDetails(stationId) {
    try {
        if (!hasChanges()) {
            customDialog.showAlert("Thông báo!", "Không có thay đổi nào được thực hiện.");
            return;
        }

        const updatedStation = normalizeStationDetails({
            name: document.getElementById("stationName").value,
            address: document.getElementById("address").value,
            coordinates: {
                latitude: parseFloat(document.getElementById("latitude").value),
                longitude: parseFloat(document.getElementById("longitude").value)
            }
        });

        const response = await fetchWithAuth(`http://localhost:4500/api/stations/${stationId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
            body: JSON.stringify(updatedStation),
        });

        if (!response.ok) throw new Error("Không thể cập nhật thông tin bến xe");

        customDialog.showAlert("Thành công!", "Thông tin bến xe đã được cập nhật thành công.");
        window.location.href = "/BusManage/src/admin/manage_station/manage/manage_station.html";
    } catch (error) {
        console.error(error);
        customDialog.showAlert("Lỗi!", "Đã xảy ra lỗi khi cập nhật thông tin bến xe.");
    }
}

// Xử lý khi tải trang
window.onload = () => {
    const stationId = getQueryParam("id");

    if (!stationId) {
        customDialog.showAlert("Lỗi!", "Không tìm thấy ID của bến xe.");
        window.location.href = "/BusManage/src/admin/manage_station/manage/manage_station.html";
        return;
    }

    fetchStationDetails(stationId);

    document.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault(); // Ngăn form gửi lại trang
        updateStationDetails(stationId);
    });
};