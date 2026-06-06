/*
    - đọc/ghi dữ liệu lên localStorage
    - hiển thị danh sách và thống kê
    - xử lý thêm, sửa, xóa và kiểm tra dữ liệu form
*/
const storageKey = "libraryBorrows";
const borrowListEl = document.getElementById("borrowList");
const totalCountEl = document.getElementById("totalCount");
const borrowedCountEl = document.getElementById("borrowedCount");
const returnedCountEl = document.getElementById("returnedCount");
const emptyMessageEl = document.getElementById("emptyMessage");
const modal = document.getElementById("borrowModal");
const modalTitle = document.getElementById("modalTitle");
const btnAddBorrow = document.getElementById("btnAddBorrow");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const borrowForm = document.getElementById("borrowForm");

const formFields = {
    borrowId: document.getElementById("borrowId"),
    borrowerName: document.getElementById("borrowerName"),
    bookCode: document.getElementById("bookCode"),
    category: document.getElementById("category"),
    borrowDate: document.getElementById("borrowDate"),
    dueDate: document.getElementById("dueDate"),
    phone: document.getElementById("phone"),
    email: document.getElementById("email"),
    status: document.getElementById("status"),
    note: document.getElementById("note"),
};

const errorFields = {
    borrowId: document.getElementById("errorBorrowId"),
    borrowerName: document.getElementById("errorBorrowerName"),
    bookCode: document.getElementById("errorBookCode"),
    category: document.getElementById("errorCategory"),
    borrowDate: document.getElementById("errorBorrowDate"),
    dueDate: document.getElementById("errorDueDate"),
    phone: document.getElementById("errorPhone"),
    email: document.getElementById("errorEmail"),
    status: document.getElementById("errorStatus"),
    note: document.getElementById("errorNote"),
};

let borrows = [];
let editingId = null;

/* Tải dữ liệu phiếu mượn từ localStorage hoặc dữ liệu mẫu ban đầu */
function loadBorrows() {
    const raw = localStorage.getItem(storageKey);
    try {
        borrows = raw ? JSON.parse(raw) : [];
    } catch {
        borrows = [];
    }

    if (!borrows.length && window.initialBorrows && Array.isArray(window.initialBorrows)) {
        borrows = window.initialBorrows;
        saveBorrows();
    }
}

function saveBorrows() {
    localStorage.setItem(storageKey, JSON.stringify(borrows));
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

/* Vẽ nội dung bảng danh sách phiếu mượn */
function renderTable() {
    borrowListEl.innerHTML = "";
    if (!borrows.length) {
        emptyMessageEl.style.display = "block";
        return;
    }

    emptyMessageEl.style.display = "none";

    borrows.forEach((borrow) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${borrow.borrowId}</td>
            <td>${borrow.borrowerName}</td>
            <td>${borrow.bookCode}</td>
            <td>${borrow.category}</td>
            <td>${formatDate(borrow.borrowDate)}</td>
            <td>${formatDate(borrow.dueDate)}</td>
            <td>${borrow.status}</td>
            <td>
                <button class="action-btn edit-btn" type="button" data-id="${borrow.borrowId}">Sửa</button>
                <button class="action-btn delete-btn" type="button" data-id="${borrow.borrowId}">Xóa</button>
            </td>
        `;
        borrowListEl.appendChild(row);
    });
}

/* Cập nhật số liệu thống kê bên trên */
function renderStats() {
    totalCountEl.textContent = borrows.length;
    borrowedCountEl.textContent = borrows.filter((item) => item.status === "Đang mượn").length;
    returnedCountEl.textContent = borrows.filter((item) => item.status === "Đã trả").length;
}

/* Mở modal để thêm hoặc sửa một phiếu mượn */
function openFormModal(mode = "add", borrow = null) {
    modal.classList.remove("hidden");
    modal.scrollTop = 0;
    if (mode === "edit" && borrow) {
        modalTitle.textContent = "Sửa phiếu mượn";
        editingId = borrow.borrowId;
        formFields.borrowId.value = borrow.borrowId;
        formFields.borrowId.disabled = true;
        formFields.borrowerName.value = borrow.borrowerName;
        formFields.bookCode.value = borrow.bookCode;
        formFields.category.value = borrow.category;
        formFields.borrowDate.value = borrow.borrowDate;
        formFields.dueDate.value = borrow.dueDate;
        formFields.phone.value = borrow.phone;
        formFields.email.value = borrow.email;
        formFields.status.value = borrow.status;
        formFields.note.value = borrow.note || "";
    } else {
        modalTitle.textContent = "Thêm phiếu mượn";
        editingId = null;
        borrowForm.reset();
        formFields.borrowId.disabled = false;
    }
    clearErrors();
}
// đóng cửa sổ nhập 
function closeFormModal() {
    modal.classList.add("hidden");
    editingId = null;
    formFields.borrowId.disabled = false;
    borrowForm.reset();
    clearErrors();
}

function clearErrors() {
    Object.values(errorFields).forEach((el) => {
        el.textContent = "";
    });
}

function todayString() {
    const now = new Date();
    return now.toISOString().split("T")[0];
}

/* Kiểm tra lỗi cho từng trường dữ liệu trong form */
function validateField(name, value) {
    switch (name) {
        case "borrowId": {
            if (!value.trim()) return "Mã phiếu mượn không được để trống.";
            if (!/^PM-\d{4}$/.test(value.trim())) return "Mã phải theo định dạng PM-XXXX.";
            if (!editingId || editingId !== value.trim()) {
                const duplicate = borrows.some((item) => item.borrowId === value.trim());
                if (duplicate) return "Mã phiếu mượn đã tồn tại.";
            }
            return "";
        }
        case "borrowerName": {
            const text = value.trim();
            if (!text) return "Họ tên người mượn không được để trống.";
            if (text.length < 2 || text.length > 40) return "Họ tên phải có 2 đến 40 ký tự.";
            if (!/^[\p{L} ]+$/u.test(text)) return "Họ tên chỉ chứa chữ và khoảng trắng.";
            return "";
        }
        case "bookCode": {
            if (!value.trim()) return "Mã sách không được để trống.";
            if (!/^BK\d{5}$/.test(value.trim())) return "Mã sách phải theo định dạng BKxxxxx.";
            return "";
        }
        case "category": {
            if (!value) return "Vui lòng chọn thể loại sách.";
            return "";
        }
        case "borrowDate": {
            if (!value) return "Ngày mượn không được để trống.";
            if (value > todayString()) return "Ngày mượn không được lớn hơn ngày hiện tại.";
            return "";
        }
        case "dueDate": {
            const borrowDateValue = formFields.borrowDate.value;
            if (!value) return "Hạn trả không được để trống.";
            if (!borrowDateValue) return "Vui lòng nhập ngày mượn trước.";
            if (value < borrowDateValue) return "Hạn trả phải lớn hơn hoặc bằng ngày mượn.";
            const borrowDay = new Date(borrowDateValue);
            const dueDay = new Date(value);
            const diffDays = Math.ceil((dueDay - borrowDay) / (1000 * 60 * 60 * 24));
            if (diffDays > 30) return "Hạn trả không được vượt quá 30 ngày kể từ ngày mượn.";
            return "";
        }
        case "phone": {
            if (!value.trim()) return "Số điện thoại không được để trống.";
            if (!/^(03|05|07|08|09)\d{8}$/.test(value.trim())) return "Số điện thoại phải đúng 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09.";
            return "";
        }
        case "email": {
            if (!value.trim()) return "Email không được để trống.";
            if (!/^[^\s@]+@library\.vn$/.test(value.trim())) return "Email phải đúng định dạng và kết thúc bằng @library.vn.";
            return "";
        }
        case "status": {
            if (!value) return "Vui lòng chọn trạng thái mượn.";
            return "";
        }
        case "note": {
            const text = value.trim();
            if (!text) return "";
            if (text.length > 120) return "Ghi chú không được vượt quá 120 ký tự.";
            if (/(<\s*script|<\s*iframe|<\s*img)/i.test(text)) return "Ghi chú không được chứa thẻ HTML cơ bản.";
            return "";
        }
        default:
            return "";
    }
}

function validateForm() {
    let isValid = true;
    Object.entries(formFields).forEach(([name, input]) => {
        const errorMessage = validateField(name, input.value);
        errorFields[name].textContent = errorMessage;
        if (errorMessage) isValid = false;
    });
    return isValid;
}

function getBorrowData() {
    return {
        borrowId: formFields.borrowId.value.trim(),
        borrowerName: formFields.borrowerName.value.trim(),
        bookCode: formFields.bookCode.value.trim(),
        category: formFields.category.value,
        borrowDate: formFields.borrowDate.value,
        dueDate: formFields.dueDate.value,
        phone: formFields.phone.value.trim(),
        email: formFields.email.value.trim(),
        status: formFields.status.value,
        note: formFields.note.value.trim(),
    };
}

function handleEdit(id) {
    const borrow = borrows.find((item) => item.borrowId === id);
    if (borrow) {
        openFormModal("edit", borrow);
    }
}

function handleDelete(id) {
    const borrow = borrows.find((item) => item.borrowId === id);
    if (!borrow) return;
    const confirmed = window.confirm(`Xác nhận xóa phiếu mượn ${id}?`);
    if (!confirmed) return;
    borrows = borrows.filter((item) => item.borrowId !== id);
    saveBorrows();
    renderTable();
    renderStats();
}

function attachRowActions() {
    borrowListEl.querySelectorAll(".edit-btn").forEach((button) => {
        button.addEventListener("click", () => handleEdit(button.dataset.id));
    });
    borrowListEl.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", () => handleDelete(button.dataset.id));
    });
}

/* Gán sự kiện người dùng cho các nút và tương tác */
btnAddBorrow.addEventListener("click", () => openFormModal());
closeModal.addEventListener("click", closeFormModal);
cancelBtn.addEventListener("click", closeFormModal);
window.addEventListener("click", (event) => {
    if (event.target === modal) {
        closeFormModal();
    }
});

borrowForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    const borrowData = getBorrowData();

    if (editingId) {
        borrows = borrows.map((item) => (item.borrowId === editingId ? borrowData : item));
    } else {
        borrows.push(borrowData);
    }

    saveBorrows();
    renderTable();
    renderStats();
    closeFormModal();
});

borrowForm.addEventListener("input", (event) => {
    const fieldName = event.target.name;
    if (fieldName && errorFields[fieldName]) {
        errorFields[fieldName].textContent = validateField(fieldName, event.target.value);
    }
});

/* Khởi tạo ứng dụng khi trang được tải */
function initialize() {
    loadBorrows();
    renderTable();
    renderStats();
    borrowListEl.addEventListener("click", (event) => {
        const target = event.target;
        if (target.matches(".edit-btn")) {
            handleEdit(target.dataset.id);
        }
        if (target.matches(".delete-btn")) {
            handleDelete(target.dataset.id);
        }
    });
}

initialize();
