class CustomDialog {
    constructor() {
        this.createDialog();
    }

    createDialog() {
        this.dialog = document.createElement("div");
        this.dialog.id = "customDialog";
        this.dialog.className = "dialog-overlay";
        this.dialog.innerHTML = `
            <style>
                .dialog-overlay {
                    position: fixed;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    display: none;
                }
                .dialog-box {
                    background: white;
                    padding: 20px;
                    width: 300px;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
                    text-align: center;
                }
                .dialog-buttons {
                    margin-top: 15px;
                }
                .btn {
                    padding: 8px 15px;
                    border: none;
                    cursor: pointer;
                    border-radius: 5px;
                    margin: 5px;
                }
                .btn-ok { background: #4CAF50; color: white; }
                .btn-cancel { background: #f44336; color: white; }
            </style>
            <div class="dialog-box">
                <h3 id="dialogTitle">Tiêu đề</h3>
                <p id="dialogMessage">Nội dung thông báo...</p>
                <div class="dialog-buttons">
                    <button id="dialogOk" class="btn btn-ok">OK</button>
                    <button id="dialogCancel" class="btn btn-cancel">Hủy</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.dialog);

        this.dialogTitle = this.dialog.querySelector("#dialogTitle");
        this.dialogMessage = this.dialog.querySelector("#dialogMessage");
        this.btnOk = this.dialog.querySelector("#dialogOk");
        this.btnCancel = this.dialog.querySelector("#dialogCancel");

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && this.dialog.style.display === "flex") {
                this.dialog.style.display = "none";
            }
        });
    }

    showAlert(title, message) {
        this.dialogTitle.innerText = title;
        this.dialogMessage.innerText = message;
        this.btnCancel.style.display = "none";
        this.dialog.style.display = "flex";

        this.btnOk.onclick = () => {
            this.dialog.style.display = "none";
        };
    }

    showConfirm(title, message, callback) {
        this.dialogTitle.innerText = title;
        this.dialogMessage.innerText = message;
        this.btnCancel.style.display = "inline-block";
        this.dialog.style.display = "flex";

        this.btnOk.onclick = () => {
            this.dialog.style.display = "none";
            callback(true);
        };

        this.btnCancel.onclick = () => {
            this.dialog.style.display = "none";
            callback(false);
        };
    }
}

const customDialog = new CustomDialog();
export default customDialog;
