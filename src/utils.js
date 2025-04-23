let isRefreshing = false;
let refreshSubscribers = [];

async function fetchWithAuth(url, options = {}) {
    let accessToken = localStorage.getItem("authToken");
    let refreshToken = localStorage.getItem("refreshToken");

    if (!accessToken) {
        window.location.href = "/BusManage/src/login/login.html";
        return null;
    }

    options.headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`
    };

    let response = await fetch(url, options);

    if (response.status === 401 && refreshToken) {
        console.warn("Token hết hạn. Đang thực hiện refresh token...");
        const newToken = await refreshAccessToken(refreshToken);
        if (newToken) {
            options.headers.Authorization = `Bearer ${newToken}`;
            response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`Request failed after token refresh: ${response.status}`);
            }
        } else {
            await logoutUser();
            return null;
        }
    }

    return response;
}

async function refreshAccessToken(refreshToken) {
    if (isRefreshing) {
        return new Promise((resolve) => {
            refreshSubscribers.push(resolve);
        });
    }

    isRefreshing = true;
    try {
        const response = await fetch(`http://localhost:4500/api/users/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('refreshToken', data.data.refreshToken);
            localStorage.setItem('authToken', data.data.accessToken);
            refreshSubscribers.forEach(cb => cb(data.data.accessToken));
            refreshSubscribers = [];
            return data.data.accessToken;
        } else {
            console.error("Refresh token thất bại:", data.message);
            refreshSubscribers.forEach(cb => cb(null));
            refreshSubscribers = [];
            return null;
        }
    } catch (error) {
        console.error("Lỗi khi refresh token:", error);
        refreshSubscribers.forEach(cb => cb(null));
        refreshSubscribers = [];
        return null;
    } finally {
        isRefreshing = false;
    }
}

async function logoutUser() {
    const accessToken = localStorage.getItem("authToken");
    // localStorage.clear();
    if (!accessToken) {
        localStorage.clear();
        window.location.href = "/BusManage/src/login/login.html";
        return;
    }

    try {
        const response = await fetchWithAuth(`http://localhost:4500/api/users/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: localStorage.getItem("id") })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Logout thất bại");
        }

        const data = await response.json();
        console.log("Logout thành công:", data.message);
        localStorage.clear();
        window.location.href = "/BusManage/src/login/login.html";
    } catch (error) {
        console.error("Lỗi khi logout:", error.message);
    }
}

export { logoutUser, fetchWithAuth, refreshAccessToken };