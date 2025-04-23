import { fetchWithAuth, refreshAccessToken, logoutUser } from "../../utils.js";
import customDialog from "../../dialog/dialog.js";
document.addEventListener("DOMContentLoaded", async function() {
    const socket = io("http://localhost:4500");
    let currentChatId = null;
    const authToken = localStorage.getItem('authToken');
    const endChatBtn = this.getElementById("end-chat-btn");
    endChatBtn.style.display = "none"; 

    await loadPendingHelps();
    loadConfirmedHelps();

    // // Nhận tin nhắn mới từ server
    // socket.on("newMessage", (msg) => {
    //     console.log("Nhận tin nhắn realtime:", msg); 
    //     if (msg.chatId === currentChatId) {
    //         addMessage(msg.content, 'other');
    //     }
    // });    
    // socket.on("connect", () => {
    //     console.log("Đã kết nối với server qua Socket.io:", socket.id);
    // });
    
    socket.on("newMessage", (data) => {
        const userId = localStorage.getItem('id'); 
        if (data.senderId !== userId) {
            addMessage(data.message, 'other');
        }
    });

    socket.on("helpCreated", (data) => {
        loadPendingHelps();
    });
    
    

    // Gán sự kiện cho nút gửi tin nhắn
    const sendButton = document.getElementById("sendBtn");
    if (sendButton) {
        sendButton.addEventListener("click", sendMessage);
    } else {
        console.error("Không tìm thấy nút gửi!");
    }

    async function loadUsers(id) {
        try {
            const response = await fetch(`http://localhost:4500/api/users/profile/${id}`);
            const data = await response.json();
            if (response.ok) {
                return data.data.user;
            } else {
                console.error(`Không tìm thấy người dùng với ID: ${id}`);
                return null;
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách người dùng:", error);
            return null;
        }
    }

    async function loadPendingHelps() {
        try {
            const response = await fetchWithAuth(`http://localhost:4500/api/help/pending`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`
                }
            });
            const data = await response.json();
            console.log(data);
            const pendingList = document.getElementById("pending-list");
            pendingList.innerHTML = "";

            const helps = data.data.helps;
            const userIds = helps.map(help => help.userId);
            const users = await Promise.all(userIds.map(id => loadUsers(id)));

            helps.forEach((help, index) => {
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";

                const user = users[index];
                li.textContent = user ? user.name : "Không tìm thấy người dùng";

                const button = document.createElement("button");
                button.className = "btn btn-success btn-sm";
                button.textContent = "Xác nhận";
                button.onclick = () => acceptHelpRequest(help._id);

                li.appendChild(button);
                pendingList.appendChild(li);
            });

        } catch (error) {
            console.error("Lỗi khi tải danh sách hỗ trợ đang chờ:", error);
        }
    }

    async function acceptHelpRequest(helpId) {
        try {
            const authToken = localStorage.getItem('authToken');
            const response = await fetchWithAuth(`http://localhost:4500/api/help/accept/${helpId}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    Authorization: `Bearer ${authToken}`
                },
            });
            const data = await response.json();
            if (data.data.help) {
                document.getElementById('messages').innerHTML = '';
                const staffId = localStorage.getItem('id');
                // await loadMessages(helpId);
                socket.emit("acceptedHelp", helpId, staffId);
                await loadPendingHelps();
                await loadConfirmedHelps();
            }
        } catch (error) {
            console.error('Lỗi khi chấp nhận hỗ trợ:', error);
        }
    }

    async function loadMessages(helpId) {
        try {
            const response = await fetch(`http://localhost:4500/api/help/messages/${helpId}`);
            const data = await response.json();
            const userId = localStorage.getItem('id');
            currentChatId = helpId;
            socket.emit("joinRoom", helpId);
            const messages = data.data.messages || [];
            document.getElementById('messages').innerHTML = '';
            messages.forEach(msg => addMessage(msg.content, msg.senderId === userId ? 'staff' : 'other'));
            endChatBtn.style.display = "block";
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn:', error);
        }
    }

    async function loadConfirmedHelps() {
        try {
            const response = await fetchWithAuth(`http://localhost:4500/api/help/accepted`,
            {
                method: 'GET',
                headers: {
                     'Content-Type': 'application/json',
                     Authorization: `Bearer ${authToken}`
                }
            });
            const data = await response.json();
            console.log(data);
            const confirmedList = document.getElementById("user-list");
            confirmedList.innerHTML = "";

            const helps = data.data.helps;
            const userIds = helps.map(help => help.userId);
            const users = await Promise.all(userIds.map(id => loadUsers(id)));

            helps.forEach((help, index) => {
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";

                const user = users[index];
                li.textContent = user ? user.name : "Không tìm thấy người dùng";
                li.onclick = () => {
                    document.getElementById("user-name").innerText = user.name;
                    loadMessages(help._id);
                };

                confirmedList.appendChild(li);
            });

        } catch (error) {
            console.error("Lỗi khi tải danh sách hỗ trợ đã xác nhận:", error);
        }
    }

    async function sendMessage() {
        const message = document.getElementById("message-input").value;
        if (!message.trim() || !currentChatId) return;
    
        try {
            const response = await fetchWithAuth('http://localhost:4500/api/help/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    helpId: currentChatId, // ID của cuộc trò chuyện
                    content: message
                })
            });
    
            const data = await response.json();
            if (response.ok) {
                const userId = localStorage.getItem('id');
                const helpId = currentChatId;
                addMessage(message, 'staff'); // Hiển thị tin nhắn trên giao diện
                socket.emit("sendMessage", { helpId, userId, message });
                document.getElementById("message-input").value = ''; // Xóa nội dung input
            } else {
                console.error("Lỗi khi gửi tin nhắn:", data.message);
            }
        } catch (error) {
            console.error("Lỗi kết nối API gửi tin nhắn:", error);
        }
    }
    
    document.getElementById("end-chat-btn").addEventListener("click", function() {
        customDialog.showConfirm("Xác nhận", "Bạn có chắc chắn muốn kết thúc cuộc trò chuyện?", async function(result) {
            if (!result) return; // Nếu người dùng chọn "Hủy", dừng lại
    
            try {
                const response = await fetchWithAuth(`http://localhost:4500/api/help/close/${currentChatId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${authToken}`
                    }
                });
    
                const data = await response.json();
                if (response.ok) {
                    customDialog.showAlert("Thông báo!","Cuộc trò chuyện đã kết thúc!");
                    document.getElementById('messages').innerHTML = ''; // Xóa tin nhắn
                    socket.emit("closedHelp", { currentChatId });
                    currentChatId = null;
                    loadConfirmedHelps();
                    document.getElementById("end-chat-btn").style.display = "none"; 
                } else {
                    console.error("Lỗi khi kết thúc cuộc trò chuyện:", data.message);
                }
            } catch (error) {
                console.error("Lỗi kết nối API kết thúc trò chuyện:", error);
            }
        });
    });
    
     

    function addMessage(content, sender) {
        const chatBox = document.getElementById("messages");
        const newMsg = document.createElement("div");
        newMsg.className = `message ${sender}`;
        newMsg.textContent = content;
        
        if (sender === "staff") {
            newMsg.style.alignSelf = "flex-end"; // Đẩy tin nhắn của mình sang phải
        } else {
            newMsg.style.alignSelf = "flex-start"; // Đẩy tin nhắn người khác sang trái
        }
    
        chatBox.appendChild(newMsg);
        chatBox.scrollTop = chatBox.scrollHeight;
    }    
});
