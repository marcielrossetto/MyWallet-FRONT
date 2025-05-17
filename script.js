const API_URL = "http://localhost:4000";
let token = "";
let editingTransaction = null;
let currentPage = 1;
let hasNextPage = false;

function showScreen(id) {
  document
    .querySelectorAll(".container")
    .forEach((div) => div.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function showRegister() {
  showScreen("register-screen");
}

function showLogin() {
  showScreen("login-screen");
}

function showHome() {
  showScreen("home-screen");
  loadTransactions();
}

function showTransactionForm(type) {
  document.getElementById("transaction-title").innerText =
    type === "deposit" ? "Nova entrada" : "Nova saída";
  document.getElementById("transaction-button").innerText =
    type === "deposit" ? "Salvar entrada" : "Salvar saída";
  document.getElementById("transaction-button").dataset.type = type;
  showScreen("transaction-form-screen");
}

async function login() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const res = await fetch(`${API_URL}/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) return alert("Erro ao fazer login");

    const data = await res.json();
    token = data.token;
    document.getElementById("user-name").innerText = email.split("@")[0];
    showHome();
  } catch (err) {
    alert("Erro de conexão");
  }
}

async function register() {
  const name = document.getElementById("register-name").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const confirm = document.getElementById("register-confirm").value;

  if (password !== confirm) return alert("As senhas não coincidem");

  try {
    const res = await fetch(`${API_URL}/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (res.status === 409) return alert("Usuário já existe");
    if (!res.ok) return alert("Erro ao cadastrar");

    alert("Cadastro realizado! Faça login.");
    showLogin();
  } catch (err) {
    alert("Erro de conexão");
  }
}

function logout() {
  token = "";
  showLogin();
}

async function saveTransaction() {
  const value = document.getElementById("transaction-value").value;
  const description = document.getElementById("transaction-description").value;
  const type = document.getElementById("transaction-button").dataset.type;

  try {
    const res = await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ value: parseFloat(value), description, type }),
    });

    if (!res.ok) return alert("Erro ao salvar transação");
    showHome();
  } catch (err) {
    alert("Erro de conexão");
  }
}

async function loadTransactions(page = 1) {
  try {
    const res = await fetch(`${API_URL}/transactions?page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return alert("Erro ao buscar transações");

    const transactions = await res.json();
    const ul = document.getElementById("transaction-list");
    ul.innerHTML = "";

    let total = 0;

    transactions.forEach((t) => {
      const li = document.createElement("li");
      const formattedDate = new Date(t.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });

      li.innerHTML = `
        <span style="width: 20%; font-size: 12px;">${formattedDate}</span>
        <span style="flex: 1; cursor: pointer;" onclick="editTransaction('${t._id}', ${t.value}, '${t.description}', '${t.type}')">${t.description}</span>
        <span class="${t.type}" style="width: 20%; text-align: right;">${parseFloat(t.value).toFixed(2).replace(".", ",")}</span>
        <span onclick="editTransaction('${t._id}', ${t.value}, '${t.description}', '${t.type}')" class="action-icon">✎</span>
        <span onclick="deleteTransaction('${t._id}')" class="action-icon delete">❌</span>
      `;

      ul.appendChild(li);

      if (t.type === "deposit") total += parseFloat(t.value);
      else total -= parseFloat(t.value);
    });

    document.getElementById("balance-value").innerText = total
      .toFixed(2)
      .replace(".", ",");

    // Paginação
    currentPage = page;
    hasNextPage = transactions.length === 10; // se veio 10, pode haver mais
    document.getElementById("page-info").innerText = `Página ${currentPage}`;
    document.getElementById("pagination").classList.remove("hidden");

    document.querySelector("#pagination button:nth-child(1)").disabled = currentPage === 1;
    document.querySelector("#pagination button:nth-child(3)").disabled = !hasNextPage;

  } catch (err) {
    alert("Erro de conexão");
  }
}

function editTransaction(id, value, description, type) {
  editingTransaction = { id, type };
  document.getElementById("edit-title").innerText = `Editar ${
    type === "deposit" ? "entrada" : "saída"
  }`;
  document.getElementById("edit-value").value = value;
  document.getElementById("edit-description").value = description;
  document.getElementById("edit-button").innerText = `Atualizar ${
    type === "deposit" ? "entrada" : "saída"
  }`;
  showScreen("edit-form-screen");
}

async function updateTransaction() {
  const value = document.getElementById("edit-value").value;
  const description = document.getElementById("edit-description").value;

  try {
    const res = await fetch(`${API_URL}/transactions/${editingTransaction.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        value: parseFloat(value),
        description,
        type: editingTransaction.type,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erro ${res.status}: ${errorText}`);
    }

    editingTransaction = null;
    showScreen("home-screen");
    await loadTransactions();
  } catch (err) {
    alert(`Erro ao atualizar: ${err.message}`);
    console.error(err);
  }
}
function nextPage() {
  if (hasNextPage) {
    loadTransactions(currentPage + 1);
  }
}

function previousPage() {
  if (currentPage > 1) {
    loadTransactions(currentPage - 1);
  }
}

function deleteTransaction(id) {
  if (!confirm("Deseja realmente excluir esta transação?")) return;

  fetch(`${API_URL}/transactions/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Erro ao excluir transação");
      showHome();
    })
    .catch((err) => alert(err.message));
}
