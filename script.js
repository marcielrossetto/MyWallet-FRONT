// script.js

// --- Referências aos elementos HTML ---
const telas = {
  inicial: document.getElementById('tela-inicial'),
  cadastro: document.getElementById('tela-cadastro'),
  homeSemDados: document.getElementById('tela-home-sem-dados'),
  homeComDados: document.getElementById('tela-home-com-dados'),
  novaTransacao: document.getElementById('tela-nova-transacao'),
  editarTransacao: document.getElementById('tela-editar-transacao'),
};

const elementos = {
  entrarBtn: document.getElementById('entrar'),
  cadastrarLink: document.getElementById('cadastrar-se'),
  cadastrarBtn: document.getElementById('cadastrar'),
  jaTemContaLink: document.getElementById('ja-tem-conta'),

  novaEntradaBtn: document.getElementById('nova-entrada'),
  novaSaidaBtn: document.getElementById('nova-saida'),
  novaEntradaComDadosBtn: document.getElementById('nova-entrada-com-dados'),
  novaSaidaComDadosBtn: document.getElementById('nova-saida-com-dados'),

  salvarTransacaoBtn: document.getElementById('salvar-transacao'),

  valorTransacaoInput: document.getElementById('valor-transacao'),
  descricaoTransacaoInput: document.getElementById('descricao-transacao'),

  valorEditarInput: document.getElementById('valor-editar'),
  descricaoEditarInput: document.getElementById('descricao-editar'),
  atualizarTransacaoBtn: document.getElementById('atualizar-transacao'),

  listaTransacoes: document.querySelector('.lista-transacoes'),
  saldoValor: document.getElementById('saldo-valor'),

  tituloTransacao: document.querySelector('.titulo-transacao'),
};

// --- Estado do aplicativo ---
let transacoes = [];
let saldo = 0;
let transacaoParaEditar = null;

// --- Utilitários ---
const mostrarTela = (tela) => {
  Object.values(telas).forEach(t => t.style.display = 'none');
  tela.style.display = 'block';
};

const formatarValor = valor =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const obterToken = () => localStorage.getItem('token');

const apiFetch = async (url, options = {}) => {
  const token = obterToken();
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error('Erro na requisição');
    error.status = response.status;
    error.body = errorBody;
    throw error;
  }
  return response.json().catch(() => ({}));
};

// --- Funções principais ---

// Login
const login = async () => {
  const email = document.getElementById('email-login').value.trim();
  const senha = document.getElementById('senha-login').value.trim();

  if (!email || !senha) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  try {
    const data = await apiFetch('http://localhost:4000/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: senha }),
    });
    localStorage.setItem('token', data.token);
    await carregarTransacoes();
  } catch (error) {
    if (error.status === 401) alert('Email e/ou senha inválidos.');
    else alert('Erro no login.');
    console.error(error);
  }
};

// Cadastro
const cadastrar = async () => {
  const nome = document.getElementById('nome-cadastro').value.trim();
  const email = document.getElementById('email-cadastro').value.trim();
  const senha = document.getElementById('senha-cadastro').value.trim();
  const confirmarSenha = document.getElementById('confirmar-senha').value.trim();

  if (!nome || !email || !senha || !confirmarSenha) {
    alert('Por favor, preencha todos os campos.');
    return;
  }
  if (senha !== confirmarSenha) {
    alert('As senhas não coincidem.');
    return;
  }

  try {
    await apiFetch('http://localhost:4000/auth/sign-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: nome,
        email,
        password: senha,
        confirmPassword: confirmarSenha,
      }),
    });
    alert('Cadastro realizado com sucesso!');
    mostrarTela(telas.inicial);
  } catch (error) {
    if (error.status === 409) alert('Usuário já cadastrado.');
    else alert('Erro no cadastro.');
    console.error(error);
  }
};

// Definir tela de nova transação (entrada ou saída)
const abrirNovaTransacao = (tipo) => {
  elementos.tituloTransacao.textContent = tipo === 'deposit' ? 'Nova Entrada' : 'Nova Saída';
  elementos.salvarTransacaoBtn.textContent = tipo === 'deposit' ? 'Salvar Entrada' : 'Salvar Saída';
  elementos.valorTransacaoInput.value = '';
  elementos.descricaoTransacaoInput.value = '';
  mostrarTela(telas.novaTransacao);
};

// Salvar nova transação
const salvarTransacao = async () => {
  const valor = parseFloat(elementos.valorTransacaoInput.value);
  const descricao = elementos.descricaoTransacaoInput.value.trim();
  const tipo = elementos.tituloTransacao.textContent.includes('Entrada') ? 'deposit' : 'withdraw';

  if (isNaN(valor) || valor <= 0 || !descricao) {
    alert('Preencha todos os campos corretamente.');
    return;
  }

  try {
    await apiFetch('http://localhost:4000/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: valor, description: descricao, type: tipo }),
    });
    await carregarTransacoes();
  } catch (error) {
    alert('Erro ao adicionar transação.');
    console.error(error);
  }
};

// Carregar transações da API
const carregarTransacoes = async () => {
  const token = obterToken();
  if (!token) {
    alert('Você precisa estar logado para ver as transações.');
    mostrarTela(telas.inicial);
    return;
  }

  try {
    transacoes = await apiFetch('http://localhost:4000/transactions', {
      method: 'GET',
    });
    calcularSaldo();
    renderizarTransacoes();
    mostrarTela(transacoes.length ? telas.homeComDados : telas.homeSemDados);
  } catch (error) {
    if (error.status === 401) {
      alert('Sessão expirada. Faça login novamente.');
      localStorage.removeItem('token');
      mostrarTela(telas.inicial);
    } else {
      alert('Erro ao obter transações.');
    }
    console.error(error);
  }
};

// Calcular saldo total
const calcularSaldo = () => {
  saldo = transacoes.reduce((acc, t) => {
    return t.type === 'deposit' ? acc + t.value : acc - t.value;
  }, 0);
  elementos.saldoValor.textContent = formatarValor(saldo);
};

// Renderizar lista de transações
const renderizarTransacoes = () => {
  elementos.listaTransacoes.innerHTML = '';
  transacoes.forEach(transacao => {
    const div = document.createElement('div');
    div.classList.add('transacao');

    const descSpan = document.createElement('span');
    descSpan.textContent = transacao.description;

    const valorSpan = document.createElement('span');
    valorSpan.textContent = formatarValor(transacao.value);
    if (transacao.type === 'withdraw') valorSpan.classList.add('transacao-valor-negativo');

    // Clique para editar
    descSpan.addEventListener('click', () => abrirEditarTransacao(transacao));

    div.appendChild(descSpan);
    div.appendChild(valorSpan);
    elementos.listaTransacoes.appendChild(div);
  });
};
const atualizarNomeUsuario = (nome) => {
  const nomeSemDados = document.getElementById('nome-usuario-sem-dados');
  const nomeComDados = document.getElementById('nome-usuario-com-dados');
  if (nomeSemDados) nomeSemDados.textContent = `Olá, ${nome}`;
  if (nomeComDados) nomeComDados.textContent = `Olá, ${nome}`;
};

// Abrir tela de edição de transação
const abrirEditarTransacao = (transacao) => {
  transacaoParaEditar = transacao;
  elementos.valorEditarInput.value = transacao.value;
  elementos.descricaoEditarInput.value = transacao.description;
  mostrarTela(telas.editarTransacao);
};

// Atualizar transação
const atualizarTransacao = async () => {
  if (!transacaoParaEditar) {
    alert('Selecione uma transação para editar.');
    return;
  }

  const valor = parseFloat(elementos.valorEditarInput.value);
  const descricao = elementos.descricaoEditarInput.value.trim();

  if (isNaN(valor) || valor <= 0 || !descricao) {
    alert('Preencha todos os campos corretamente.');
    return;
  }

  try {
    await apiFetch(`http://localhost:4000/transactions/${transacaoParaEditar._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: valor, description: descricao }),
    });
    transacaoParaEditar = null;
    await carregarTransacoes();
  } catch (error) {
    alert('Erro ao atualizar transação.');
    console.error(error);
  }
};

// --- Eventos ---
elementos.entrarBtn.addEventListener('click', login);
elementos.cadastrarBtn.addEventListener('click', cadastrar);
elementos.cadastrarLink.addEventListener('click', () => mostrarTela(telas.cadastro));
elementos.jaTemContaLink.addEventListener('click', () => mostrarTela(telas.inicial));
elementos.novaEntradaBtn.addEventListener('click', () => abrirNovaTransacao('deposit'));
elementos.novaSaidaBtn.addEventListener('click', () => abrirNovaTransacao('withdraw'));
elementos.novaEntradaComDadosBtn.addEventListener('click', () => abrirNovaTransacao('deposit'));
elementos.novaSaidaComDadosBtn.addEventListener('click', () => abrirNovaTransacao('withdraw'));
elementos.salvarTransacaoBtn.addEventListener('click', salvarTransacao);
elementos.atualizarTransacaoBtn.addEventListener('click', atualizarTransacao);

// Se quiser, ao carregar a página, checar se já tem token e tentar carregar transações
window.addEventListener('load', () => {
  if (obterToken()) {
    carregarTransacoes();
  } else {
    mostrarTela(telas.inicial);
  }
});
