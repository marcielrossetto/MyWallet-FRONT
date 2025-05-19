const API_URL = "http://localhost:4000";
// const API_URL = "https://mywallet-backend-qmpl.onrender.com";

let token = "";
let editingTransaction = null;

// Exibe a tela desejada e oculta as demais
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
  const value = parseFloat(
    document.getElementById("transaction-value").value
  );
  const description = document.getElementById("transaction-description").value;
  const type = document.getElementById("transaction-button").dataset.type;

  try {
    const res = await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ value, description, type }),
    });

    if (!res.ok) return alert("Erro ao salvar transação");
    showHome();
  } catch (err) {
    alert("Erro de conexão");
  }
}

async function loadTransactions() {
  try {
    const res = await fetch(`${API_URL}/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return alert("Erro ao buscar transações");

    const transactions = await res.json();
    const ul = document.getElementById("transaction-list");
    ul.innerHTML = "";

    transactions.forEach((t) => {
      const li = document.createElement("li");
      li.classList.add(t.type === "deposit" ? "deposit" : "withdraw");

      const dateSpan = document.createElement("span");
      dateSpan.classList.add("date");
      dateSpan.textContent = new Date(t.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });

      const descSpan = document.createElement("span");
      descSpan.classList.add("desc");
      descSpan.textContent = t.description;
      descSpan.onclick = () =>
        editTransaction(t._id, t.value, t.description, t.type);

      const valueSpan = document.createElement("span");
      valueSpan.classList.add("value", t.type);
      valueSpan.textContent = formatValue(t.value);

      const editIcon = document.createElement("span");
      editIcon.classList.add("action-icon");
      editIcon.textContent = "✎";
      editIcon.onclick = () =>
        editTransaction(t._id, t.value, t.description, t.type);

      const deleteIcon = document.createElement("span");
      deleteIcon.classList.add("action-icon", "delete");
      deleteIcon.textContent = "❌";
      deleteIcon.onclick = () => deleteTransaction(t._id);

      li.append(dateSpan, descSpan, valueSpan, editIcon, deleteIcon);
      ul.appendChild(li);
    });

    // Atualiza e estiliza o saldo
    updateBalance(transactions);
  } catch (err) {
    alert("Erro de conexão");
  }
}

async function editTransaction(id, value, description, type) {
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
  const value = parseFloat(
    document.getElementById("edit-value").value
  );
  const description = document.getElementById("edit-description").value;

  try {
    const res = await fetch(
      `${API_URL}/transactions/${editingTransaction.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          value,
          description,
          type: editingTransaction.type,
        }),
      }
    );

    if (!res.ok) throw new Error(await res.text());

    editingTransaction = null;
    showHome();
  } catch (err) {
    alert(`Erro ao atualizar: ${err.message}`);
    console.error(err);
  }
}

async function deleteTransaction(id) {
  if (!confirm("Deseja realmente excluir esta transação?")) return;

  try {
    const res = await fetch(`${API_URL}/transactions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erro ao excluir transação");
    showHome();
  } catch (err) {
    alert(err.message);
  }
}

// Atualiza o saldo e aplica a cor conforme valor
function updateBalance(transactions) {
  const balanceEl = document.getElementById("balance");
  const total = transactions.reduce((sum, tx) => {
    return sum + (tx.type === "deposit" ? tx.value : -tx.value);
  }, 0);

  balanceEl.textContent = `Saldo: R$ ${total.toFixed(2).replace('.', ',')}`;

  balanceEl.classList.remove("positive", "negative");
  if (total >= 0) balanceEl.classList.add("positive");
  else balanceEl.classList.add("negative");
}

// Helper para formatar valores em reais
function formatValue(val) {
  return parseFloat(val).toFixed(2).replace(".", ",");
}
