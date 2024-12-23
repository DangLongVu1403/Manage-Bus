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
        driverName: bus.driverName || "",
        driverPhone: bus.driverPhone || "",
        seatCapacity: parseInt(bus.seatCapacity, 10) || 0,
        busType: bus.busType || "",
        status: bus.status || "",
    };
}

// Hiển thị thông tin xe buýt lên các trường
async function fetchBusDetails(busId) {
    try {
        const response = await fetch(`http://192.168.1.175:4500/api/bus/${busId}`);
        if (!response.ok) throw new Error("Không thể lấy thông tin xe");

        const result = await response.json();
        const bus = normalizeBusDetails(result.data);

        // Điền thông tin vào các trường
        document.getElementById("busNumber").value = bus.busNumber;
        document.getElementById("licensePlate").value = bus.licensePlate;
        document.getElementById("driverName").value = bus.driverName;
        document.getElementById("driverPhone").value = bus.driverPhone;
        document.getElementById("seatCapacity").value = bus.seatCapacity;
        document.getElementById("busType").value = bus.busType;
        document.getElementById("status").value = bus.status;

        // Lưu trạng thái ban đầu
        initialBusDetails = { ...bus }; // Sao chép thông tin vào biến lưu trữ
    } catch (error) {
        console.error(error);
        alert("Đã xảy ra lỗi khi tải thông tin xe.");
    }
}

// Kiểm tra sự thay đổi
function hasChanges() {
    const currentBusDetails = normalizeBusDetails({
        busNumber: document.getElementById("busNumber").value,
        licensePlate: document.getElementById("licensePlate").value,
        driverName: document.getElementById("driverName").value,
        driverPhone: document.getElementById("driverPhone").value,
        seatCapacity: parseInt(document.getElementById("seatCapacity").value, 10),
        busType: document.getElementById("busType").value,
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
            alert("Không có thay đổi nào được thực hiện.");
            return;
        }

        const updatedBus = normalizeBusDetails({
            busNumber: document.getElementById("busNumber").value,
            licensePlate: document.getElementById("licensePlate").value,
            driverName: document.getElementById("driverName").value,
            driverPhone: document.getElementById("driverPhone").value,
            seatCapacity: parseInt(document.getElementById("seatCapacity").value, 10),
            busType: document.getElementById("busType").value,
            status: document.getElementById("status").value,
        });

        const response = await fetch(`http://192.168.1.175:4500/api/bus/${busId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedBus),
        });

        if (!response.ok) throw new Error("Không thể cập nhật thông tin xe");

        alert("Thông tin xe đã được cập nhật thành công.");
        window.location.href = "/admin/manage_bus/manage/manage_bus.html";
    } catch (error) {
        console.error(error);
        alert("Đã xảy ra lỗi khi cập nhật thông tin xe.");
    }
}

// Xử lý khi tải trang
window.onload = () => {
    const busId = getQueryParam("id");
    console.log(busId);

    if (!busId) {
        alert("Không tìm thấy ID của xe buýt.");
        window.location.href = "/admin/manage_bus/manage/manage_bus.html";
        return;
    }

    fetchBusDetails(busId);

    document.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault(); // Ngăn form gửi lại trang
        updateBusDetails(busId);
    });
};
