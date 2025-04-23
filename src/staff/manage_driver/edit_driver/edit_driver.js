import { fetchWithAuth } from "../../../utils.js";

// Lưu trạng thái ban đầu của các trường
let initialDriverDetails = {};

// Lấy tham số từ URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Chuẩn hóa dữ liệu
function normalizeDriverDetails(driver) {
    return {
        name: driver.name || "",
        licenseNumber: driver.licenseNumber || "",
        phone: driver.phone || "",
    };
}

// Hiển thị thông tin xe lên các trường
async function fetchDriverDetails(driverId) {
    try {
        const response = await fetch(`http://localhost:4500/api/driver/${driverId}`);
        if (!response.ok) throw new Error("Không thể lấy thông tin tài xế");

        const result = await response.json();
        const driver = normalizeDriverDetails(result.data);

        // Điền thông tin vào các trường
        document.getElementById("nameDriver").value = driver.name;
        document.getElementById("licenseNumber").value = driver.licenseNumber;
        document.getElementById("phoneNumberDriver").value = driver.phone;

        // Lưu trạng thái ban đầu
        initialDriverDetails = { ...driver }; // Sao chép thông tin vào biến lưu trữ
    } catch (error) {
        console.error(error);
        alert("Đã xảy ra lỗi khi tải thông tin tài xế.");
    }
}

// Kiểm tra sự thay đổi
function hasChanges() {
    const currentDriverDetails = normalizeDriverDetails({
        name: document.getElementById("nameDriver").value,
        licenseNumber: document.getElementById("licenseNumber").value,
        phone: document.getElementById("phoneNumberDriver").value,
    });

    // So sánh từng trường
    for (const key in initialDriverDetails) {
        if (initialDriverDetails[key] !== currentDriverDetails[key]) {
            return true; // Có thay đổi
        }
    }
    return false; // Không có thay đổi
}

// Cập nhật thông tin xe 
async function updateDriverDetails(driverId) {
    try {
        if (!hasChanges()) {
            alert("Không có thay đổi nào được thực hiện.");
            return;
        }

        const updatedDriver = normalizeDriverDetails({
            name: document.getElementById("nameDriver").value,
            licenseNumber: document.getElementById("licenseNumber").value,
            phone: document.getElementById("phoneNumberDriver").value,
        });

        const response = await fetchWithAuth(`http://localhost:4500/api/driver/${driverId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
            },
            body: JSON.stringify(updatedDriver),
        });

        if (!response.ok) throw new Error("Không thể cập nhật thông tin tài xế");

        alert("Thông tin tài xế đã được cập nhật thành công.");
        window.location.href = "/BusManage/src/admin/manage_driver/manage_driver/manage_driver.html";
    } catch (error) {
        console.error(error);
        alert("Đã xảy ra lỗi khi cập nhật thông tin tài xế.");
    }
}

// Xử lý khi tải trang
window.onload = () => {
    const driverId = getQueryParam("id");

    if (!driverId) {
        alert("Không tìm thấy ID của tài xế.");
        window.location.href = "/BusManage/src/admin/manage_driver/manage_driver/manage_driver.html";
        return;
    }

    fetchDriverDetails(driverId);

    document.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault(); // Ngăn form gửi lại trang
        updateDriverDetails(driverId);
    });
};
