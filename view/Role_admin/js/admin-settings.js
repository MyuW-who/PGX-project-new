const categories = [
  { id: "ngs", name: "NGS Panel", code: "NGS-01", tat: 7 },
  { id: "qpcr", name: "qPCR", code: "QPCR-02", tat: 3 },
  { id: "histology", name: "Histology", code: "HIS-05", tat: 10 }
];

const categoryForm = document.getElementById("categoryForm");
const tatForm = document.getElementById("tatForm");
const specimenForm = document.getElementById("specimenForm");
const tatCategorySelect = document.getElementById("tatCategory");
const specimenCategorySelect = document.getElementById("specimenCategory");
const categoryTableBody = document.querySelector("#categoryTable tbody");

function renderCategoryTable() {
  if (!categoryTableBody) return;

  if (!categories.length) {
    categoryTableBody.innerHTML = '<tr><td colspan="4">ยังไม่มีข้อมูลที่จะแสดง</td></tr>';
    return;
  }

  categoryTableBody.innerHTML = categories
    .map(
      (cat) => `
        <tr data-category-id="${cat.id}">
          <td>${cat.code}</td>
          <td>${cat.name}</td>
          <td>${cat.tat}</td>
          <td class="actions-cell">
            <button type="button" class="btn ghost" data-action="focus" data-target="${cat.id}">เลือก</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderCategoryOptions() {
  if (!tatCategorySelect || !specimenCategorySelect) return;
  const options = categories
    .map(cat => `<option value="${cat.id}">${cat.name}</option>`)
    .join("");
  tatCategorySelect.innerHTML = `<option selected disabled value="">เลือกหมวดหมู่...</option>${options}`;
  specimenCategorySelect.innerHTML = `<option selected disabled value="">เลือกหมวดหมู่...</option>${options}`;
}

function handleCategorySubmit(event) {
  event.preventDefault();
  const formData = new FormData(categoryForm);
  const newCategory = {
    id: formData.get("code")?.toString().toLowerCase() || crypto.randomUUID(),
    name: formData.get("name"),
    code: formData.get("code"),
    tat: Number(formData.get("tat"))
  };
  const duplicate = categories.some((cat) => cat.code === newCategory.code || cat.name === newCategory.name);
  if (duplicate) {
    alert("มีหมวดหมู่หรือรหัสนี้อยู่แล้ว");
    return;
  }

  categories.push(newCategory);
  renderCategoryTable();
  renderCategoryOptions();
  alert("บันทึกหมวดหมู่สำเร็จ");
  categoryForm.reset();
}

function handleTatSubmit(event) {
  event.preventDefault();
  const formData = new FormData(tatForm);
  const selectedId = formData.get("category");
  const newTat = Number(formData.get("tat"));
  const target = categories.find(cat => cat.id === selectedId);
  if (target) {
    target.tat = newTat;
    alert(`อัปเดต TAT ของ ${target.name} เป็น ${newTat} วันแล้ว`);
    tatForm.reset();
    renderCategoryTable();
  } else {
    alert("ไม่พบหมวดหมู่ที่เลือก");
  }
}

function handleSpecimenSubmit(event) {
  event.preventDefault();
  const formData = new FormData(specimenForm);
  const payload = {
    name: formData.get("name"),
    category: formData.get("category"),
    remark: formData.get("remark")
  };
  console.log("เพิ่มสิ่งส่งตรวจ:", payload);
  alert("เพิ่มข้อมูลสิ่งส่งตรวจเรียบร้อย");
  specimenForm.reset();
}

if (categoryForm) {
  categoryForm.addEventListener("submit", handleCategorySubmit);
}
if (tatForm) {
  tatForm.addEventListener("submit", handleTatSubmit);
}
if (specimenForm) {
  specimenForm.addEventListener("submit", handleSpecimenSubmit);
}

categoryTableBody?.addEventListener("click", (event) => {
  const trigger = event.target;
  if (!(trigger instanceof HTMLButtonElement)) return;
  if (trigger.dataset.action !== "focus") return;

  const { target: categoryId } = trigger.dataset;
  if (!categoryId) return;

  if (tatCategorySelect) {
    tatCategorySelect.value = categoryId;
  }
  if (specimenCategorySelect) {
    specimenCategorySelect.value = categoryId;
  }
});

renderCategoryTable();
renderCategoryOptions();
