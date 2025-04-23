import { logoutUser } from "../utils.js";
const hamBurger = document.querySelector(".toggle-btn");

hamBurger.addEventListener("click", function () {
  document.querySelector("#sidebar").classList.toggle("expand");
});

document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".sidebar-link").forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            let page = this.getAttribute("data-page");
            if (page) {
                document.getElementById("content-frame").src = page;
            }
        });
    });

    document.querySelector(".sidebar-footer .sidebar-link").addEventListener("click", function (event) {
        event.preventDefault();
        logoutUser();
    });
    
    function setActiveMenu(selectedLink) {
        // Xóa class "active" khỏi tất cả các mục sidebar
        document.querySelectorAll(".sidebar-item").forEach(item => {
            item.classList.remove("active");
        });

        // Thêm class "active" vào mục được chọn
        selectedLink.closest(".sidebar-item").classList.add("hover");
    }
});

function executeScripts(container) {
    container.querySelectorAll("script").forEach(oldScript => {
        const newScript = document.createElement("script");
        newScript.textContent = oldScript.textContent;
        document.body.appendChild(newScript).parentNode.removeChild(newScript);
    });
}
