import { fetchWithAuth } from "../utils.js";

document.getElementById("changePasswordBtn").addEventListener("click", async function () {
    let currentPassword = document.getElementById("currentPassword").value;
    let newPassword = document.getElementById("newPassword").value;
    let confirmPassword = document.getElementById("confirmPassword").value;

    let errorCurrentPassword = document.getElementById("errorCurrentPassword");
    let errorNewPassword = document.getElementById("errorNewPassword");
    let errorConfirmPassword = document.getElementById("errorConfirmPassword");
    let hintMessage = document.getElementById("hintMessage");
    

    // Xóa thông báo lỗi trước đó
    errorCurrentPassword.textContent = "";
    errorNewPassword.textContent = "";
    errorConfirmPassword.textContent = "";

    // Kiểm tra điều kiện nhập
    let isValid = true;
    
    if (!currentPassword) {
        errorCurrentPassword.textContent = "Vui lòng nhập mật khẩu hiện tại!";
        isValid = false;
    }
    
    if (!newPassword) {
        errorNewPassword.textContent = "Vui lòng nhập mật khẩu mới!";
        isValid = false;
    } else if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^a-zA-Z0-9]/.test(newPassword)) {
        errorNewPassword.textContent = "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, số và ký tự đặc biệt!";
        isValid = false;
    }

    if (!confirmPassword) {
        errorConfirmPassword.textContent = "Vui lòng xác nhận mật khẩu mới!";
        isValid = false;
    } else if (newPassword !== confirmPassword) {
        errorConfirmPassword.textContent = "Mật khẩu xác nhận không khớp!";
        isValid = false;
    }

    if (!isValid) return; // Dừng lại nếu có lỗi

    try {
        let response = await fetchWithAuth("http://localhost:4500/api/users/change-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("authToken")}`
            },
            body: JSON.stringify({
                oldPassword: currentPassword,
                newPassword: newPassword
            })
        });

        let data = await response.json();

        if (response.ok) {
            alert("Mật khẩu đã được thay đổi thành công!");
            // Hiển thị lại hint sau khi đổi mật khẩu thành công
            hintMessage.textContent = "Hãy đặt mật khẩu mạnh để bảo vệ tài khoản của bạn.";
            // Reset input fields
            document.getElementById("currentPassword").value = "";
            document.getElementById("newPassword").value = "";
            document.getElementById("confirmPassword").value = "";
        } else {
            errorCurrentPassword.textContent = "Lỗi: " + data.message;
        }
    } catch (error) {
        errorCurrentPassword.textContent = "Đã xảy ra lỗi, vui lòng thử lại!";
    }
});

document.getElementById("currentPasswordToggle").addEventListener("click", function () {
    let input = document.getElementById("currentPassword"); 
    input.type = input.type === "password" ? "text" : "password";
});

document.getElementById("newPasswordToggle").addEventListener("click", function () {
    let input = document.getElementById("newPassword"); 
    input.type = input.type === "password" ? "text" : "password";
});

document.getElementById("confirmPasswordToggle").addEventListener("click", function () {
    let input = document.getElementById("confirmPassword");
    input.type = input.type === "password" ? "text" : "password";
});