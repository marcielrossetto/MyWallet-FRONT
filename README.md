# 💰 MyWallet – Projeto Fullstack (Front + Back)
Page= https://marcielrossetto.github.io/MyWallet-FRONT/
Este projeto é uma aplicação de **controle financeiro pessoal** que permite ao usuário:

- Criar conta e fazer login com autenticação JWT
- Registrar entradas e saídas financeiras
- Ver o saldo atualizado automaticamente
- Interface simples baseada em layout no Figma

---

## 🚀 Tecnologias Utilizadas

- **Front-end**: HTML + CSS + JavaScript Puro
- **Back-end**: Node.js, Express, MongoDB Atlas, JWT, Joi
- **Hospedagem**: Render (backend)

---

## 🔧 Como Rodar Localmente

### 📦 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/MyWallet-frontend
cd MyWallet-frontend
🧪 2. Rodar o Front-end
Basta abrir o arquivo index.html no navegador.

🖥️ 3. Rodar o Back-end
bash
Copiar
Editar
git clone https://github.com/seu-usuario/MyWallet-backend
cd MyWallet-backend
npm install
npm run dev
Crie um arquivo .env com o seguinte conteúdo:

ini
Copiar
Editar
PORT=4000
DATABASE_URL=seu_link_do_mongo_atlas
JWT_SECRET=sua_chave_secreta
🌐 Usando com Back-end na Nuvem (Render)
Se o seu back-end estiver no Render, altere a seguinte linha no arquivo script.js:

js
Copiar
Editar
const API_URL = "https://mywallet-backend.onrender.com";
📁 Estrutura
🔹 Front-end
index.html – layout das telas

style.css – cores e estrutura visual

script.js – lógica de interação e chamadas à API

🔹 Back-end
src/controllers – lida com regras de negócio

src/routers – define rotas da API

src/middlewares – valida token e schemas

src/schemas – validação com Joi

MongoDB para persistência dos dados

✅ Funcionalidades
 Cadastro de usuário (/sign-up)

 Login com token JWT (/sign-in)

 Adicionar transações (/transactions)

 Listar transações paginadas

 Editar e excluir (em construção)