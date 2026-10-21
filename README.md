# 🤖 Kensai Bot

Base profissional, modular e escalável em **Discord.js v14**.

---

## 📁 Estrutura de Arquivos

```text
kensai-bot/
├── commands/
│   ├── slash/              # Comandos Slash (/ping, /ajuda, /userinfo, /serverinfo)
│   └── prefix/             # Comandos de Prefixo (k!ping)
├── events/                 # Eventos do Discord (ready, interactionCreate, messageCreate)
├── utils/                  # Utilitários (embeds, permissions)
├── data/                   # Arquivos de persistência local (JSON/SQLite)
├── .env                    # Tokens e chaves de ambiente
├── .env.example            # Modelo de variáveis de ambiente
├── config.js               # Central de configurações
├── ecosystem.config.js     # Configuração PM2 para produção
├── index.js                # Arquivo principal de inicialização
└── package.json            # Dependências e scripts
```

---

## 🚀 Como Iniciar

1. Instalar as dependências:
   ```bash
   npm install
   ```

2. Preencher o arquivo `.env` com o seu Token e Client ID do Discord:
   ```env
   TOKEN=seu_token_aqui
   CLIENT_ID=seu_client_id_aqui
   PREFIX=k!
   ```

3. Rodar localmente:
   ```bash
   node index.js
   ```
   Ou via PM2:
   ```bash
   pm2 start ecosystem.config.js
   ```
