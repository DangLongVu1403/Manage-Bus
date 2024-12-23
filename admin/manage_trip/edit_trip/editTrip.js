document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("tripForm");
  const responseMessage = document.getElementById("responseMessage");

  // Kiểm tra nếu form hoặc phần tử phản hồi không tồn tại
  if (!form || !responseMessage) {
    console.error("Không tìm thấy form hoặc phần tử hiển thị phản hồi trong DOM.");
    return;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault(); // Ngăn form reload trang

    // Lấy dữ liệu từ form
    const tripData = {
      bus: document.getElementById("bus").value || "",
      startLocation: document.getElementById("startLocation").value || "",
      endLocation: document.getElementById("endLocation").value || "",
      departureTime: document.getElementById("departureTime").value || "",
      price: parseFloat(document.getElementById("price").value) || 0,
      schedule: {
        startDate: document.getElementById("startDate").value || "",
        endDate: document.getElementById("endDate").value || "",
        type: document.getElementById("type").value || "",
        customSchedule:
          parseInt(document.getElementById("customSchedule").value) || undefined,
        time: {
          departure: document.getElementById("departure").value || "",
          drive: parseInt(document.getElementById("drive").value) || 0,
        },
      },
    };

    try {
      // Lấy token từ localStorage (hoặc nguồn khác)
      const token = localStorage.getItem("authToken"); // Giả sử token được lưu trong localStorage

      if (!token) {
        responseMessage.innerText = "Lỗi: Không tìm thấy token.";
        responseMessage.style.color = "red";
        return;
      }

      // Gửi dữ liệu qua API với token trong header
      const response = await fetch("http://192.168.1.175:4500/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Thêm token vào header
        },
        body: JSON.stringify(tripData),
      });

      const result = await response.json();

      if (response.ok) {
        responseMessage.innerText = "Tạo chuyến thành công!";
        responseMessage.style.color = "green";
      } else {
        responseMessage.innerText = `Lỗi: ${result.error || "Không xác định"}`;
        responseMessage.style.color = "red";
      }
    } catch (error) {
      console.error("Lỗi khi gửi request:", error);
      responseMessage.innerText = "Lỗi không kết nối được với server.";
      responseMessage.style.color = "red";
    }
  });
});
