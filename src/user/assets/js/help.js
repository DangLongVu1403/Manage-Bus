import { fetchWithAuth, refreshAccessToken, logoutUser } from "../../../utils.js";
import customDialog from "../../../dialog/dialog.js";

// Hàm khởi tạo chính
export function initializeHelp() {
    const supportForm = document.getElementById("support-form");
    const contactBox = document.getElementById("contact-box");
    const chatBox = document.getElementById("chat-box");
    const chatMessages = document.getElementById("chat-messages");
    const chatAgentName = document.getElementById("chat-agent-name");
    const chatSendBtn = document.getElementById("chat-send-btn");
    const chatInputField = document.getElementById("chat-input-field");
    let socket;
    let helpId = null;
    let staffName = null;
    const userId = localStorage.getItem("id");

    // Khởi tạo Socket.IO an toàn
    initializeSocket();

    function initializeSocket() {
        // Kiểm tra xem Socket.IO đã được tải chưa
        if (typeof io === 'undefined') {
            // Tải script Socket.IO nếu chưa có
            const socketScript = document.createElement('script');
            socketScript.src = "http://localhost:4500/socket.io/socket.io.js";
            socketScript.onload = () => {
                // Sau khi tải xong, khởi tạo socket
                socket = io("http://localhost:4500");
                setupSocketListeners();
                // Kiểm tra hội thoại hiện có
                checkExistingHelp();
            };
            socketScript.onerror = () => {
                console.error("Không thể tải Socket.IO");
                customDialog.showAlert("Lỗi", "Không thể kết nối đến máy chủ chat. Vui lòng tải lại trang.");
            };
            document.head.appendChild(socketScript);
        } else {
            // Socket.IO đã tải, khởi tạo trực tiếp
            socket = io("http://localhost:4500");
            setupSocketListeners();
            // Kiểm tra hội thoại hiện có
            checkExistingHelp();
        }
    }

    // Thiết lập các sự kiện Socket.IO
    function setupSocketListeners() {
        socket.on("newMessage", (data) => {
            if (data.senderId !== userId) {
                chatMessages.innerHTML += `<p class="message other">${data.message}</p>`;
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        });

        socket.on("helpClosed", (data) => {
            if (data._id === helpId) {
                chatBox.style.display = "none";
                contactBox.classList.remove("shrink");
                chatMessages.innerHTML = "";
                helpId = null;
                staffName = null;
                chatAgentName.innerText = "";
            }
        });

        socket.on("helpAccepted", async (data) => {
            if (data._id === helpId) {
                getMessages(helpId);
        
                try {
                    staffName = await loadUsers(data.staffId); 
                    chatAgentName.innerText = `Nhân viên: ${staffName || "Đang chờ nhân viên..."}`;
                } catch (error) {
                    console.error("Lỗi khi tải tên nhân viên:", error);
                    chatAgentName.innerText = "Đang chờ nhân viên...";
                }
            }
        });
    }

    // Hàm kiểm tra hội thoại hiện tại
    async function checkExistingHelp() {
        try {
            const response = await fetch(`http://localhost:4500/api/help/${userId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.data) {
                    const help = data.data;
                    helpId = help._id;
                    socket.emit("joinRoom", helpId);
                    
                    // Hiển thị hộp chat
                    contactBox.classList.add("shrink");
                    chatBox.style.display = "block";
                    
                    if (help.status === "pending") {
                        chatAgentName.innerText = `Nhân viên: Đang chờ nhân viên...`;
                    } else {
                        staffName = await loadUsers(help.staffId);
                        chatAgentName.innerText = `Nhân viên: ${staffName || "Đang chờ nhân viên..."}`;
                    }
                    
                    // Tải tin nhắn
                    await getMessages(help._id);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }
        } catch (error) {
            console.error("Lỗi khi kiểm tra hội thoại:", error);
        }
    }

    // Hàm tải tin nhắn
    async function getMessages(helpId) {
        try {
            const response = await fetch(`http://localhost:4500/api/help/messages/${helpId}`);
            const data = await response.json();
            if (response.ok) {
                chatMessages.innerHTML = ""; // Xóa tin nhắn cũ
                const messages = data.data.messages;
                messages.forEach(message => {
                    const senderClass = message.senderId === userId ? "me" : "other";
                    chatMessages.innerHTML += `<p class="message ${senderClass}">${message.content}</p>`;
                });
                chatMessages.scrollTop = chatMessages.scrollHeight;
                return messages;
            }
        } catch (error) {
            console.error("Lỗi khi tải tin nhắn:", error);
            return [];
        }
    }
    
    // Hàm tải thông tin người dùng
    async function loadUsers(id) {
        try {
            const response = await fetch(`http://localhost:4500/api/users/profile/${id}`);
            const data = await response.json();
            if (response.ok) {
                return data.data.user.name;
            } else {
                console.error(`Không tìm thấy người dùng với ID: ${id}`);
                return null;
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách người dùng:", error);
            return null;
        }
    }

    // Xử lý sự kiện submit form
    if (supportForm) {
        supportForm.addEventListener("submit", async function (event) {
            event.preventDefault(); // Ngăn chặn hành vi mặc định của form
            
            // Kiểm tra xem socket đã sẵn sàng chưa
            if (!socket) {
                customDialog.showAlert("Lỗi", "Đang kết nối đến máy chủ chat, vui lòng thử lại sau.");
                return;
            }
            
            const supportInput = document.getElementById("support-input");
            const content = supportInput.value.trim();
            if (!content) return;

            try {
                const response = await fetchWithAuth("http://localhost:4500/api/help/create", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`
                    },
                    body: JSON.stringify({ content })
                });

                const data = await response.json();
                if (response.ok) {
                    helpId = data.data.help._id;
                    contactBox.classList.add("shrink");
                    chatBox.style.display = "block";
                    chatAgentName.innerText = "Đang chờ nhân viên...";
                    supportInput.value = ""; // Xóa nội dung đã nhập
                    
                    // Hiển thị tin nhắn đầu tiên
                    chatMessages.innerHTML += `<p class="message me">${content}</p>`;
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    
                    // Tham gia phòng chat
                    socket.emit("joinRoom", helpId);
                } else {
                    customDialog.showAlert("Lỗi!", "Không thể tạo yêu cầu hỗ trợ.");
                }
            } catch (error) {
                console.error("Lỗi:", error);
                customDialog.showAlert("Lỗi!", "Kết nối server thất bại.");
            }
        });
    }

    // Xử lý sự kiện gửi tin nhắn
    if (chatSendBtn) {
        chatSendBtn.addEventListener("click", sendMessage);
        
        // Thêm sự kiện nhấn Enter để gửi tin nhắn
        chatInputField.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Hàm gửi tin nhắn
    async function sendMessage() {
        const message = chatInputField.value.trim();
        if (!message || !helpId || !socket) return;
    
        try {
            const response = await fetchWithAuth("http://localhost:4500/api/help/send-message", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`
                },
                body: JSON.stringify({ 
                    helpId: helpId,
                    content: message 
                })
            });
    
            if (response.ok) {
                chatMessages.innerHTML += `<p class="message me">${message}</p>`;
                chatMessages.scrollTop = chatMessages.scrollHeight;
                chatInputField.value = "";
                socket.emit("sendMessage", { helpId, userId, message });
            } else {
                customDialog.showAlert("Lỗi!", "Gửi tin nhắn thất bại.");
            }
        } catch (error) {
            console.error("Lỗi:", error);
            customDialog.showAlert("Lỗi!", "Kết nối server thất bại.");
        }
    }
}

// Khởi tạo module nếu được gọi trực tiếp
document.addEventListener("DOMContentLoaded", function() {
    // Chỉ khởi tạo nếu không được gọi từ main.js (kiểm tra nếu không phải là trang index)
    if (!window.isIndexPage) {
        initializeHelp();
    }
});

// Xuất hàm để có thể gọi từ main.js
export default { initializeHelp };