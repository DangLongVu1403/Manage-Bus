import { fetchWithAuth, refreshAccessToken, logoutUser } from "../../../utils.js";
import customDialog from "../../../dialog/dialog.js";
document.addEventListener("DOMContentLoaded", function () {
    const tripTableBody = document.getElementById("tripTableBody");
    const errorMessage = document.getElementById("errorMessage");
    const searchInput = document.getElementById("searchInput");

    let allTrips = []; // Lưu trữ dữ liệu gốc từ API
    let displayTrips = []; // Lưu trữ dữ liệu đã xử lý để hiển thị và lọc

    fetchTrips();

    searchInput.addEventListener("input", function () {
        const searchText = this.value.trim().toLowerCase();
        filterTrips(searchText);
    });

    async function fetchTrips() {
        try {
            const url = `http://localhost:4500/api/trips/`;
            const response = await fetch(url);
            const result = await response.json();

            if (response.ok) {
                allTrips = result.data.trips;
                await prepareDisplayTrips(); // Chuẩn bị dữ liệu hiển thị
                renderTrips(displayTrips);
                if (errorMessage) errorMessage.innerText = "";
            } else {
                throw new Error(result.message || "Không thể tải dữ liệu chuyến xe.");
            }
        } catch (error) {
            if (errorMessage) errorMessage.innerText = error.message;
            if (tripTableBody) tripTableBody.innerHTML = "";
        }
    }

    async function prepareDisplayTrips() {
        displayTrips = await Promise.all(allTrips.map(async trip => {
            return {
                ...trip,
                busLicensePlate: await fetchBusLicensePlate(trip.bus) || "Không có thông tin",
                driverName: await fetchNameDriver(trip.driver) || "Không có thông tin",
                startPointName: await fetchNameStation(trip.startLocation) || "Không có thông tin",
                endPointName: await fetchNameStation(trip.endLocation) || "Không có thông tin"
            };
        }));
    }

    function filterTrips(searchText) {
        if (searchText === "") {
            renderTrips(displayTrips); // Hiển thị lại toàn bộ danh sách nếu không có tìm kiếm
        } else {
            const now = new Date();
            now.setHours(now.getHours() + 7);
            const filteredTrips = displayTrips.filter(trip => {
                const departureTime = new Date(trip.departureTime);
                const status = departureTime < now ? "đã đi" : "chưa đi"; 
                return (
                    trip.busLicensePlate.toLowerCase().includes(searchText) ||
                    trip.driverName.toLowerCase().includes(searchText) ||
                    trip.startPointName.toLowerCase().includes(searchText) ||
                    trip.endPointName.toLowerCase().includes(searchText) ||
                    formatDateTime(trip.departureTime).toLowerCase().includes(searchText) ||
                    formatDateTime(trip.arriveTime).toLowerCase().includes(searchText) ||
                    trip.availableSeats.toString().includes(searchText) ||
                    trip.price.toString().includes(searchText) ||
                    status.includes(searchText) 
                );
            });
            renderTrips(filteredTrips); // Hiển thị danh sách đã lọc
        }
    }

    function renderTrips(trips) {
        tripTableBody.innerHTML = "";
        const now = new Date(); // Lấy thời gian hiện tại
        now.setHours(now.getHours() + 7); // Điều chỉnh về giờ Việt Nam nếu cần thiết
    
        for (const trip of trips) {
            const departureTime = new Date(trip.departureTime);
            const status = departureTime < now ? "Đã đi" : "Chưa đi";
    
            const row = `
                <tr data-trip-id="${trip._id}">
                    <td>${trip.busLicensePlate}</td>
                    <td>${trip.driverName}</td>
                    <td>${trip.startPointName}</td>
                    <td>${trip.endPointName}</td>
                    <td>${formatDateTime(trip.departureTime)}</td>
                    <td>${formatDateTime(trip.arriveTime)}</td>
                    <td>${trip.availableSeats}</td>
                    <td>${trip.price.toLocaleString()} VND</td>
                    <td>${status}</td>
                    <td><button class="btn btn-warning btn-sm btn-edit">Sửa</button></td>
                    <td><button class="btn btn-danger btn-sm btn-delete">Xóa</button></td>
                </tr>
            `;
            tripTableBody.innerHTML += row;
        }
        attachActionHandlers();
    }         

    async function fetchBusLicensePlate(busId) {
        try {
            const response = await fetch(`http://localhost:4500/api/bus/${busId}`);
            const result = await response.json();
            if (response.ok) {
                return result.data.licensePlate;
            } else {
                console.error(`Không tìm thấy bus với ID: ${busId}`);
                return null;
            }
        } catch (error) {
            console.error("Lỗi khi lấy biển số xe:", error);
            return null;
        }
    }

    async function fetchNameDriver(driverId) {
        try {
            const response = await fetch(`http://localhost:4500/api/driver/${driverId}`);
            const result = await response.json();
            if (response.ok) {
                return result.data.name;
            } else {
                console.error(`Không tìm thấy tài xế với ID: ${driverId}`);
                return null;
            }
        } catch (error) {
            console.error("Lỗi khi lấy tên tài xế:", error);
            return null;
        }
    }

    async function fetchNameStation(stationId) {
        try {
            const response = await fetch(`http://localhost:4500/api/stations/${stationId}`);
            const result = await response.json();
            if (response.ok) {
                return result.data.name;
            } else {
                console.error(`Không tìm thấy bến xe với ID: ${stationId}`);
                return null;
            }
        } catch (error) {
            console.error("Lỗi khi lấy bến xe:", error);
            return null;
        }
    }

    function formatDateTime(isoString) {
        const date = new Date(isoString);
        const hours = date.getUTCHours().toString().padStart(2, "0");
        const minutes = date.getUTCMinutes().toString().padStart(2, "0");
        const day = date.getUTCDate();
        const month = date.getUTCMonth() + 1;
        const year = date.getUTCFullYear();
        return `${hours}:${minutes} ${day}/${month}/${year}`;
    }

    function attachActionHandlers() {
        const editButtons = document.querySelectorAll(".btn-edit");
        editButtons.forEach(button => {
            button.addEventListener("click", function () {
                const tripId = this.closest("tr").dataset.tripId;
                editTrip(tripId);
            });
        });

        const deleteButtons = document.querySelectorAll(".btn-delete");
        deleteButtons.forEach(button => {
            button.addEventListener("click", function () {
                const tripId = this.closest("tr").dataset.tripId;
                deleteTrip(tripId);
            });
        });
    }

    function editTrip(tripId) {
        window.location.href = `../edit_trip/edit_trip.html?id=${tripId}`;
    }

    async function deleteTrip(tripId) {
        const confirmDelete = confirm("Bạn có chắc chắn muốn xóa chuyến xe này?");
        if (confirmDelete) {
            try {
                const token = localStorage.getItem("authToken");
                if (!token) {
                    customDialog.showAlert("Lỗi!","Lỗi: Không tìm thấy token.");
                    return;
                }
                const response = await fetchWithAuth(`http://localhost:4500/api/trips/${tripId}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    customDialog.showAlert("Thành công!","Xóa chuyến xe thành công!");
                    allTrips = allTrips.filter(trip => trip._id !== tripId);
                    await prepareDisplayTrips(); // Cập nhật lại displayTrips
                    filterTrips(searchInput.value.trim().toLowerCase()); // Hiển thị lại danh sách đã lọc
                } else {
                    const result = await response.json();
                    customDialog.showAlert("Lỗi!",result.message || "Không thể xóa chuyến xe.");
                }
            } catch (error) {
                console.error("Lỗi khi xóa chuyến xe:", error);
                customDialog.showAlert("Lỗi!","Đã xảy ra lỗi, vui lòng thử lại.");
            }
        }
    }
});