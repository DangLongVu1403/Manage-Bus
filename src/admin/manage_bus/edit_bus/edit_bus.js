import { fetchWithAuth } from "../../../utils.js";
import customDialog from "../../../dialog/dialog.js";

// Lưu trạng thái ban đầu của các trường
let initialBusDetails = {};

// Lấy tham số từ URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Chuẩn hóa dữ liệu
function normalizeBusDetails(bus) {
    return {
        busNumber: bus.busNumber || "",
        licensePlate: bus.licensePlate || "",
        seatCapacity: parseInt(bus.seatCapacity, 10) || 0,
        busType: "",
        status: bus.status || "",
    };
}

// Hiển thị thông tin xe buýt lên các trường
async function fetchBusDetails(busId) {
    try {
        const response = await fetch(`http://localhost:4500/api/bus/${busId}`);
        if (!response.ok) throw new Error("Không thể lấy thông tin xe");

        const result = await response.json();
        const bus = normalizeBusDetails(result.data);

        // Điền thông tin vào các trường
        document.getElementById("busNumber").value = bus.busNumber;
        document.getElementById("licensePlate").value = bus.licensePlate;
        document.getElementById("seatCapacity").value = bus.seatCapacity;
        document.getElementById("status").value = bus.status;

        // Lưu trạng thái ban đầu
        initialBusDetails = { ...bus }; // Sao chép thông tin vào biến lưu trữ
    } catch (error) {
        console.error(error);
        customDialog.showAlert("Lỗi!","Đã xảy ra lỗi khi tải thông tin xe.");
    }
}

// Kiểm tra sự thay đổi
function hasChanges() {
    const currentBusDetails = normalizeBusDetails({
        busNumber: document.getElementById("busNumber").value,
        licensePlate: document.getElementById("licensePlate").value,
        seatCapacity: parseInt(document.getElementById("seatCapacity").value, 10),
        status: document.getElementById("status").value,
    });

    // So sánh từng trường
    for (const key in initialBusDetails) {
        if (initialBusDetails[key] !== currentBusDetails[key]) {
            return true; // Có thay đổi
        }
    }
    return false; // Không có thay đổi
}

// Cập nhật thông tin xe buýt
async function updateBusDetails(busId) {
    try {
        if (!hasChanges()) {
           customDialog.showAlert("Thông báo!","Không có thay đổi nào được thực hiện.");
            return;
        }

        const busType = document.getElementById('seatCapacity').value;

        const updatedBus = normalizeBusDetails({
            busNumber: document.getElementById("busNumber").value,
            licensePlate: document.getElementById("licensePlate").value,
            seatCapacity: parseInt(document.getElementById("seatCapacity").value, 10),
            bustype: busType,
            status: document.getElementById("status").value,
        });

        const response = await fetchWithAuth(`http://localhost:4500/api/bus/${busId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
            body: JSON.stringify(updatedBus),
        });

        if (!response.ok) throw new Error("Không thể cập nhật thông tin xe");

        customDialog.showAlert("Thành công!","Thông tin xe đã được cập nhật thành công.");
        window.location.href = "/BusManage/src/admin/manage_bus/manage/manage_bus.html";
    } catch (error) {
        console.error(error);
        customDialog.showAlert("Lỗi!","Đã xảy ra lỗi khi cập nhật thông tin xe.");
    }
}

// Xử lý khi tải trang
window.onload = () => {
    const busId = getQueryParam("id");

    if (!busId) {
        customDialog.showAlert("Lỗi!","Không tìm thấy ID của xe buýt.");
        window.location.href = "/BusManage/src/admin/manage_bus/manage/manage_bus.html";
        return;
    }

    fetchBusDetails(busId);

    document.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault(); // Ngăn form gửi lại trang
        updateBusDetails(busId);
    });
};
