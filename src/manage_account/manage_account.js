import { fetchWithAuth, refreshAccessToken, logoutUser } from "../utils.js";

// Định nghĩa hàm cập nhật thông tin người dùng toàn cục
function updateGlobalUserInfo(name, avatarUrl) {
    // Cập nhật localStorage
    if (name) localStorage.setItem("name", name);
    if (avatarUrl) localStorage.setItem("avatar", avatarUrl);

    // Cập nhật UI của navbar trong trang index
    if (name) document.getElementById('username').textContent = name;
    if (avatarUrl) {
        const avatarElements = document.querySelectorAll('.dropdown-toggle img');
        avatarElements.forEach(elem => elem.src = avatarUrl);
    }
}

async function initializeManageAccount() {
    const editNameBtn = document.getElementById("editNameBtn");
    const editAvatarBtn = document.getElementById("editAvatarBtn");
    const avatarInput = document.getElementById("avatarInput");
    const editName = document.getElementById("editName");
    const editPhone = document.getElementById("editPhone");
    const updateNameBtn = document.getElementById("updateBtn"); // Nút mới cho cập nhật tên
    const userAvatar = document.getElementById("userAvatar");
    const errorName = document.getElementById("errorName");

    // Kiểm tra các phần tử
    if (!editNameBtn || !editAvatarBtn || !avatarInput || !editName || !editPhone || !updateNameBtn || !userAvatar || !errorName) {
        console.error("Không tìm thấy các phần tử cần thiết trong DOM");
        return;
    }

    let initialName, initialAvatar;

    // Hàm gọi API để lấy dữ liệu người dùng
    async function fetchUserProfile() {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                throw new Error("Không tìm thấy token");
            }

            const response = await fetchWithAuth("http://localhost:4500/api/users/profile", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`Không thể lấy thông tin người dùng: ${response.status}`);
            }

            const data = await response.json();
            const userName = data.data.user.name || "Chưa có tên";
            const userPhone = data.data.user.phone || "Chưa có số điện thoại";
            const userAvatarUrl = data.data.user.avatar || "../images/boy.png";
            
            // Cập nhật UI trang manage_account
            editName.value = userName;
            editPhone.value = userPhone;
            userAvatar.src = userAvatarUrl;

            // Cập nhật thông tin người dùng toàn cục
            updateGlobalUserInfo(userName, userAvatarUrl);

            initialName = editName.value;
            initialAvatar = userAvatar.src;
            toggleUpdateButtons();
        } catch (error) {
            console.error("Lỗi khi lấy thông tin người dùng:", error);
            editName.value = "Nguyen Van A";
            editPhone.value = "0123456789";
            userAvatar.src = "../images/boy.png";
            initialName = editName.value;
            initialAvatar = userAvatar.src;
        }
    }

    // Gọi API ngay khi khởi tạo
    await fetchUserProfile();

    // Hàm kiểm tra thay đổi và hiển thị nút cập nhật tương ứng
    function toggleUpdateButtons() {
        if (editName.value !== initialName) {
            updateNameBtn.classList.remove("d-none");
        } else {
            updateNameBtn.classList.add("d-none");
        }
    }

    // Hàm cập nhật ảnh đại diện
    async function updateAvatar(file) {
        try {
            // Hiển thị trạng thái đang tải
            editAvatarBtn.disabled = true;
            editAvatarBtn.innerHTML = '<i class="bi bi-hourglass"></i>';
            
            const formData = new FormData();
            formData.append("avatar", file);

            const response = await fetchWithAuth("http://localhost:4500/api/users/upload-avatar", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("authToken")}`
                },
                body: formData
            });

            if (response.ok) {
                alert("Ảnh đại diện đã được cập nhật thành công!");
                
                // Lấy URL từ response nếu có
                const data = await response.json();
                const newAvatarUrl = data.data?.avatarUrl || userAvatar.src;
                
                // Cập nhật thông tin người dùng toàn cục
                updateGlobalUserInfo(null, newAvatarUrl);
                
                // Cập nhật lại các thông tin ban đầu
                await fetchUserProfile();
            } else {
                const responseText = await response.text();
                console.error("API response:", responseText);
                alert(`Lỗi: Không thể cập nhật ảnh (HTTP ${response.status})`);
                userAvatar.src = initialAvatar;
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật ảnh:", error);
            alert(`Đã xảy ra lỗi: ${error.message || "Vui lòng thử lại!"}`);
            userAvatar.src = initialAvatar;
        } finally {
            // Khôi phục trạng thái nút
            editAvatarBtn.disabled = false;
            editAvatarBtn.innerHTML = '<i class="bi bi-camera"></i>';
        }
    }

    // Sự kiện chỉnh sửa tên
    editNameBtn.addEventListener("click", function() {
        editName.disabled = false;
        editName.focus();
        errorName.style.display = "none";
    });

    // Sự kiện chọn ảnh
    editAvatarBtn.addEventListener("click", function() {
        avatarInput.click();
    });

    // Xử lý khi người dùng chọn file ảnh
    avatarInput.addEventListener("change", function(event) {
        const file = event.target.files[0];
        if (file) {
            // Hiển thị ảnh trước khi upload
            const reader = new FileReader();
            reader.onload = function(e) {
                userAvatar.src = e.target.result;
                // Gọi API upload ảnh ngay sau khi hiển thị ảnh preview
                updateAvatar(file);
            };
            reader.readAsDataURL(file);
        }
    });

    editName.addEventListener("input", function() {
        errorName.style.display = "none";
        toggleUpdateButtons();
    });

    // Cập nhật tên
    updateNameBtn.addEventListener("click", async function() {
        let isValid = true;
        errorName.style.display = "none";

        if (!editName.value.trim()) {
            errorName.textContent = "Tên không được để trống!";
            errorName.style.display = "block";
            isValid = false;
        }

        if (!isValid) return;

        try {
            const response = await fetchWithAuth("http://localhost:4500/api/users/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("authToken")}`
                },
                body: JSON.stringify({ name: editName.value })
            });

            if (response.ok) {
                // Cập nhật thông tin người dùng toàn cục
                updateGlobalUserInfo(editName.value, null);
                
                alert("Tên đã được cập nhật thành công!");
                await fetchUserProfile();
                editName.disabled = true;
            } else {
                const data = await response.json();
                alert(`Lỗi: ${data.message || "Không thể cập nhật tên"}`);
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật tên:", error);
            alert(`Đã xảy ra lỗi: ${error.message || "Vui lòng thử lại!"}`);
        }
    });
}

export { initializeManageAccount };