const form = document.getElementById("student-form");
const raInput = document.getElementById("ra");
const nameInput = document.getElementById("name");
const submit = document.getElementById("submit");
const formMessage = document.getElementById("form-message");
const listMessage = document.getElementById("list-message");
const studentsList = document.getElementById("students-list");
const studentsSection = document.getElementById("students");

async function request(options = {}) {
  const response = await fetch("/api/students", {
    ...options,
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "A solicitação não pôde ser finalizada.");
  }
  return data;
}

async function loadStudents() {
  studentsSection.setAttribute("aria-busy", "true");
  listMessage.textContent = "Consultando estudantes…";
  listMessage.dataset.state = "loading";
  try {
    const students = await request();
    const rows = students.map((student) => {
      const row = document.createElement("tr");
      row.dataset.testid = "student-row";
      for (const value of [student.ra, student.name]) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      }
      return row;
    });
    studentsList.replaceChildren(...rows);
    listMessage.textContent = students.length === 0 ? "Ainda não há estudantes registrados." : "";
    listMessage.dataset.state = "success";
  } catch (error) {
    listMessage.textContent = `A lista de estudantes não foi atualizada. ${error.message}`;
    listMessage.dataset.state = "error";
  } finally {
    studentsSection.setAttribute("aria-busy", "false");
  }
}

nameInput.addEventListener("input", () => nameInput.setCustomValidity(""));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submit.disabled) return;
  const name = nameInput.value.trim();
  nameInput.setCustomValidity(name.length < 3 ? "Digite um nome com no mínimo 3 caracteres." : "");
  if (!form.reportValidity()) return;

  submit.disabled = true;
  form.setAttribute("aria-busy", "true");
  formMessage.textContent = "Salvando estudante…";
  formMessage.dataset.state = "loading";
  try {
    await request({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ra: Number(raInput.value), name }),
    });
    form.reset();
    formMessage.textContent = "Estudante salvo com sucesso.";
    formMessage.dataset.state = "success";
    await loadStudents();
    raInput.focus();
  } catch (error) {
    formMessage.textContent = `O cadastro do estudante não foi concluído. ${error.message}`;
    formMessage.dataset.state = "error";
  } finally {
    submit.disabled = false;
    form.setAttribute("aria-busy", "false");
  }
});

loadStudents();
