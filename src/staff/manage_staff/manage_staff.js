import { fetchWithAuth } from "../../utils.js";
import customDialog from "../../dialog/dialog.js";
document.addEventListener('DOMContentLoaded', function () { 
  const staffTableBody = document.getElementById("staffTableBody");
  const addNewBtn = document.getElementById("addNewBtn"); // Nút thêm mới
  let isEditing = false;
  let isAdding = false;
  const authToken = localStorage.getItem("authToken");

  // 🚀 Lấy danh sách nhân viên từ API
  async function fetchStaffList() {
    try {
      const response = await fetchWithAuth("http://localhost:4500/api/users/staff",
        { method: "GET",
          headers: { 
            "Content-Type": "application/json",
            'Authorization': `Bearer ${authToken}`  
          }
        }
      );
      const result = await response.json();
      const staffList = result.data.staffList;
      renderTable(staffList);
    } catch (error) {
      customDialog.showAlert("Lỗi!","Không thể tải danh sách nhân viên. Hãy thử lại!");
    }
  }

  function searchStaff() {
    const searchValue = document.getElementById("searchInput").value.toLowerCase();
    const rows = staffTableBody.getElementsByTagName("tr");

    for (let row of rows) {
      const name = row.querySelector("td:nth-child(2)").innerText.toLowerCase();
      const phone = row.querySelector("td:nth-child(3)").innerText.toLowerCase();
      if (name.includes(searchValue) || phone.includes(searchValue)) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    }
  }

  function renderTable(staffList) {
    staffTableBody.innerHTML = "";
    staffList.forEach((staff, index) => {
      const row = document.createElement("tr");
      row.id = `row-${staff._id}`;
      row.innerHTML = `
        <td>${index + 1}</td>
        <td id="name-${staff._id}">${staff.name}</td>
        <td id="phone-${staff._id}">${staff.phone}</td>
        <td>
          <button id="edit-btn-${staff._id}" class="btn btn-warning btn-sm">Sửa</button>
          <button id="confirm-btn-${staff._id}" class="btn btn-success btn-sm d-none">Xác nhận</button>
          <button id="cancel-btn-${staff._id}" class="btn btn-secondary btn-sm d-none">Hủy</button>
        </td>
        <td><button id="delete-btn-${staff._id}" class="btn btn-danger btn-sm">Xóa</button></td>
        <td><button id="reset-btn-${staff._id}" class="btn btn-info btn-sm">Reset Mật khẩu</button></td>
      `;
      staffTableBody.appendChild(row);
  
      // Gán sự kiện cho các nút bằng addEventListener
      document.getElementById(`edit-btn-${staff._id}`).addEventListener("click", () => enableEdit(staff._id));
      document.getElementById(`confirm-btn-${staff._id}`).addEventListener("click", () => confirmUpdate(staff._id));
      document.getElementById(`cancel-btn-${staff._id}`).addEventListener("click", () => cancelEdit(staff._id));
      document.getElementById(`delete-btn-${staff._id}`).addEventListener("click", () => deleteStaff(staff._id));
      document.getElementById(`reset-btn-${staff._id}`).addEventListener("click", () => resetPassword(staff._id));
    });
  }

  addNewBtn.addEventListener("click", addNewRow);

  function enableEdit(id) {
    if (isEditing) return; // Nếu đang sửa hoặc thêm mới, không cho phép chỉnh sửa khác

    isEditing = true;

    const nameCell = document.getElementById(`name-${id}`);
    const phoneCell = document.getElementById(`phone-${id}`);
    const editBtn = document.getElementById(`edit-btn-${id}`);
    const confirmBtn = document.getElementById(`confirm-btn-${id}`);
    const cancelBtn = document.getElementById(`cancel-btn-${id}`);
    const deleteBtn = document.getElementById(`delete-btn-${id}`);
    const resetBtn = document.getElementById(`reset-btn-${id}`);

    // Lưu giá trị cũ để khôi phục nếu cần
    const currentName = nameCell.innerText;
    const currentPhone = phoneCell.innerText;

    // Thay thế nội dung bằng input
    nameCell.innerHTML = `<input type="text" id="input-name-${id}" class="form-control" value="${currentName}">`;
    phoneCell.innerHTML = `<input type="text" id="input-phone-${id}" class="form-control" value="${currentPhone}">`;

    // Hiển thị nút "Xác nhận" và "Hủy", ẩn "Sửa", "Xóa", "Reset"
    editBtn.classList.add("d-none");
    confirmBtn.classList.remove("d-none");
    cancelBtn.classList.remove("d-none");
    deleteBtn.classList.add("d-none");
    resetBtn.classList.add("d-none");
  }

  function cancelEdit(id) {
    isEditing = false;
    fetchStaffList();
  }

  async function confirmUpdate(id) {
    const nameInput = document.getElementById(`input-name-${id}`).value.trim();
    const phoneInput = document.getElementById(`input-phone-${id}`).value.trim();

    if (!nameInput || !phoneInput) {
      customDialog.showAlert("Lỗi!","Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      const response = await fetchWithAuth(`http://localhost:4500/api/users/staff/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${authToken}`
          },
        body: JSON.stringify({ name: nameInput, phone: phoneInput })
      });

      if (!response.ok) throw new Error("Lỗi khi cập nhật nhân viên");

      // Cập nhật giao diện
      document.getElementById(`name-${id}`).innerText = nameInput;
      document.getElementById(`phone-${id}`).innerText = phoneInput;

      cancelEdit(id); // Hoàn tác UI về trạng thái bình thường
    } catch (error) {
      console.error("Lỗi khi cập nhật nhân viên:", error);
      customDialog.showAlert("Lỗi!","Cập nhật thất bại, vui lòng thử lại!");
    }
  }

  // 🚀 Thêm một hàng mới để nhập thông tin nhân viên
  function addNewRow() {
    if (isEditing) return;
  
    isEditing = true;
    document.querySelectorAll('[id^="edit-btn"]').forEach(btn => btn.classList.add("d-none"));
  
    const newRow = document.createElement("tr");
    newRow.id = "new-row";
    newRow.innerHTML = `
      <td>#</td>
      <td><input type="text" id="newName" class="form-control" placeholder="Nhập tên"></td>
      <td><input type="text" id="newPhone" class="form-control" placeholder="Nhập số điện thoại"></td>
      <td colspan="3">
        <button id="confirm-add-btn" class="btn btn-success btn-sm">Xác nhận</button>
        <button id="cancel-add-btn" class="btn btn-secondary btn-sm">Hủy</button>
      </td>
    `;
  
    staffTableBody.appendChild(newRow);
  
    // Gán sự kiện bằng addEventListener
    document.getElementById("confirm-add-btn").addEventListener("click", confirmAddStaff);
    document.getElementById("cancel-add-btn").addEventListener("click", cancelAdd);
  }
  

  function cancelAdd() {
    isEditing = false;
    document.getElementById("new-row").remove();
    document.querySelectorAll('[id^="edit-btn"]').forEach(btn => btn.classList.remove("d-none"));
  }

  // 🚀 Gọi API để thêm nhân viên
  async function confirmAddStaff() {
    const name = document.getElementById("newName").value.trim();
    const phone = document.getElementById("newPhone").value.trim();

    if (!name || !phone) {
      customDialog.showAlert("Lỗi!","Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      const response = await fetchWithAuth("http://localhost:4500/api/users/staff", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${authToken}` 
        },
        body: JSON.stringify({ name, phone })
      });
      if (!response.ok) throw new Error("Lỗi khi thêm nhân viên");
      fetchStaffList();
    } catch (error) {
      console.error("Lỗi khi thêm nhân viên:", error);
      customDialog.showAlert("Lỗi!","Thêm nhân viên thất bại, vui lòng thử lại!");
    }
  }


  async function deleteStaff(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) return;

    try {
      const response = await fetchWithAuth(`http://localhost:4500/api/users/staff/${id}`, { 
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${authToken}`
          }
      });
      if (!response.ok) throw new Error("Lỗi khi xóa nhân viên");
      fetchStaffList();
    } catch (error) {
      console.error("Lỗi khi xóa nhân viên:", error);
      customDialog.showAlert("Lỗi!","Xóa nhân viên thất bại, vui lòng thử lại!");
    }
  }

  // 🚀 Gọi API để reset mật khẩu nhân viên
  async function resetPassword(id) {
    if (!confirm("Bạn có chắc chắn muốn reset mật khẩu nhân viên này?")) return;

    try {
      const response = await fetchWithAuth(`http://localhost:4500/api/users/staff/${id}/reset-password`, { 
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${authToken}`
          }
        });
      if (!response.ok) throw new Error("Lỗi khi reset mật khẩu");
      customDialog.showAlert("Thành công!","Mật khẩu đã được reset thành công!");
    } catch (error) {
      console.error("Lỗi khi reset mật khẩu:", error);
      customDialog.showAlert("Lỗi!","Reset mật khẩu thất bại, vui lòng thử lại!");
    }
  }

  // 🚀 Lấy dữ liệu khi trang tải
  fetchStaffList();
});