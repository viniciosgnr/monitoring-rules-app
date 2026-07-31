# Guia de Deploy Unificado na Vercel em 3 Passos

Este guia orienta o deploy completo da aplicação **Monitoring Rules App (Next.js 14 + Supabase PostgreSQL)** na plataforma **Vercel**. Como a aplicação é Full-Stack, tanto o Frontend quanto o Backend Serverless serão implantados de forma unificada e gratuita.

---

## 📋 Pré-requisitos
- Conta gratuita na [Vercel](https://vercel.com).
- Repositório do projeto publicado no **GitHub**, **GitLab** ou **Bitbucket**.

---

## 🚀 Passo 1: Importar o Projeto na Vercel

1. Acesse o painel da Vercel em [vercel.com/new](https://vercel.com/new).
2. Conecte sua conta do GitHub/GitLab.
3. Selecione o repositório **Monitoring Rules Management** (ou `monitoring-rules-app`).
4. Na tela de configuração:
   - **Framework Preset**: Selecione `Next.js`.
   - **Root Directory**: Se o código Next.js estiver na pasta `monitoring-rules-app`, clique em **Edit** e selecione a pasta `monitoring-rules-app`.

---

## 🔑 Passo 2: Configurar a Variável de Ambiente do Banco de Dados

Na mesma tela de deploy na Vercel, abra a seção **Environment Variables** e adicione:

| Key | Value |
| :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres.chqyjsyvvdteydrdfjpj:26599489Abc@aws-1-us-east-1.pooler.supabase.com:5432/postgres` |

> 💡 **Nota**: Esta variável é a conexão direta com o banco **Supabase PostgreSQL** na nuvem, garantindo que os dados, regras e histórico fiquem 100% sincronizados.

---

## ⚡ Passo 3: Concluir o Deploy e Compartilhar

1. Clique no botão **Deploy**.
2. A Vercel executará o `npm run build` e em cerca de **1 a 2 minutos** gerará o link público oficial da aplicação (exemplo: `https://monitoring-rules-app.vercel.app`).
3. **Compartilhamento**: Envie essa URL pública para sua equipe. Qualquer pessoa com a URL poderá acessar a aplicação diretamente pelo navegador de qualquer dispositivo.

---

## 🔄 Atualizações Automáticas (CI/CD)
Toda vez que você fizer um `git push` no repositório, a Vercel compilará e atualizará a versão de produção automaticamente!
