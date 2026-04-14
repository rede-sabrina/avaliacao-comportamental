# Avaliação Comportamental — Next.js

Setup rápido (local):

1. Copie `.env.example` para `.env` e preencha as variáveis.
2. Instale dependências:

```bash
npm install
```

3. Rode em desenvolvimento:

```bash
npm run dev
```

Endpoints úteis:
- `POST /api/submit` — salva submissão no MongoDB.
- `POST /api/admin/login` — recebe `{user,pass}` e cria sessão via cookie HttpOnly.
- `GET /api/admin/list` — lista submissões (requer sessão admin).
- `POST /api/admin/pdf` — gera PDF de um relatório por `id` (requer sessão admin).

Notas de segurança:
- Este scaffold usa JWT com segredo definido em `.env` (`JWT_SECRET`).
- Em produção, proteja o acesso ao Puppeteer (geração de PDF) e use variáveis de ambiente seguras.
