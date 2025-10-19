# CMS - Sistema de Gestão Acadêmica

Sistema completo de gestão acadêmica desenvolvido em React e Firebase, focado no gerenciamento de disciplinas, aulas e relatórios para laboratórios educacionais.

![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-12.2.1-FFCA28?logo=firebase)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)

## Índice

- [Características](#características)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Execução](#execução)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Licença](#licença)

## Características

- Autenticação com Firebase Authentication
- Calendário interativo para visualização de aulas
- CRUD completo de disciplinas
- Sistema de agendamento de aulas
- Relatórios acadêmicos com timeline
- Design responsivo para desktop e mobile
- Persistência de dados com Firestore
- Sistema de cache automático
- Deploy integrado com Vercel

## Tecnologias

### Frontend
- React 19.1.1
- React Router DOM 7.9.1
- FullCalendar 6.1.19
- Firebase SDK 12.2.1
- CSS3 responsivo

### Backend
- Firebase Firestore (banco de dados)
- Firebase Authentication (autenticação)
- Firebase Functions (serverless)
- Firebase Hosting (hospedagem)

### DevOps
- Vercel (deploy frontend)
- Firebase Tools (CLI)
- Git (versionamento)

## Pré-requisitos

- Node.js 18.0 ou superior
- npm 8.0 ou superior
- Conta no Firebase (plano gratuito)
- Conta no Vercel (opcional)

## Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/colavitepedro/cms-agenda.git
cd cms-agenda
```

### 2. Instale as dependências
```bash
npm run install-all
```

Isso instalará as dependências do frontend e das functions do Firebase.

## Configuração

### 1. Firebase

Crie um arquivo `frontend/src/firebase/config.js` com suas credenciais:

```javascript
export const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "seu-messaging-sender-id",
  appId: "seu-app-id"
};
```

### 2. Regras do Firestore

As regras de segurança estão definidas em `firestore.rules` e serão aplicadas automaticamente ao fazer deploy.

### 3. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (se necessário para configurações locais).

## Execução

### Desenvolvimento

```bash
# Iniciar frontend em modo de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

### Emuladores Firebase (opcional)

```bash
# Iniciar emuladores do Firebase
npm run serve
```

### Build de Produção

```bash
# Criar build otimizado
npm run build
```

### Deploy

```bash
# Deploy para Firebase
npm run deploy
```

## Estrutura do Projeto

```
cms-agenda/
├── frontend/
│   ├── public/              # Arquivos públicos
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── contexts/        # Contextos (AuthContext)
│   │   ├── firebase/        # Configuração Firebase
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # Serviços de API
│   │   └── utils/           # Utilitários
│   └── package.json
├── functions/               # Firebase Functions
├── backend/                 # Backend legado (deprecado)
├── firebase.json           # Configuração Firebase
├── firestore.rules         # Regras de segurança
├── firestore.indexes.json  # Índices Firestore
├── storage.rules           # Regras do Storage
└── package.json
```

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                  # Inicia frontend em dev

# Build
npm run build               # Build de produção

# Instalação
npm run install-all         # Instala todas as dependências
npm run install-frontend    # Instala deps do frontend
npm run install-functions   # Instala deps das functions

# Deploy
npm run deploy              # Deploy para Firebase

# Limpeza
npm run clean              # Remove node_modules e build
```

## Funcionalidades Principais

### Autenticação
- Login com email e senha
- Recuperação de senha
- Registro de novos usuários
- Sessão persistente

### Disciplinas
- Criar, editar e excluir disciplinas
- Listagem com busca e filtros
- Validação de dados

### Agendamento de Aulas
- Formulário completo de agendamento
- Seleção de horários e laboratórios
- Associação com disciplinas
- Sistema de observações

### Calendário
- Visualização mensal
- Navegação entre meses
- Detalhes das aulas em modais
- Indicadores de status

### Relatórios
- Timeline de próximas aulas
- Contador de dias restantes
- Alertas de urgência
- Status das aulas

## Compatibilidade

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Browsers (iOS/Android)

## Autor

**Pedro Colavite Conilho**
- GitHub: [@colavitepedro](https://github.com/colavitepedro)
- LinkedIn: [Pedro Colavite Conilho](https://www.linkedin.com/in/pedro-colavite-conilho)
- Instagram: [@colavite.pedro](https://www.instagram.com/colavite.pedro/)

## Licença


Desenvolvido por Pedro Colavite Conilho