require('dotenv').config({ path: require('path').join(__dirname, '.env'), override: true });

// Tratamento global de erros para evitar quedas inesperadas do processo
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [Unhandled Promise Rejection]:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('⚠️ [Uncaught Exception]:', error);
});

const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    Collection 
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.GuildMember,
        Partials.User
    ]
});

client.slashCommands = new Collection();
client.prefixCommands = new Collection();

// 1. Carregador dinâmico de Comandos Slash
const slashCommandsPath = path.join(__dirname, 'commands', 'slash');
if (fs.existsSync(slashCommandsPath)) {
    const slashFiles = fs.readdirSync(slashCommandsPath).filter(f => f.endsWith('.js'));
    for (const file of slashFiles) {
        const cmd = require(path.join(slashCommandsPath, file));
        if (cmd.data && cmd.execute) {
            client.slashCommands.set(cmd.data.name, cmd);
            console.log(`[SlashCommand] ✓ Carregado: /${cmd.data.name}`);
        } else {
            console.warn(`[SlashCommand] ⚠️ O arquivo ${file} não exporta data ou execute válidos.`);
        }
    }
}

// 2. Carregador dinâmico de Comandos de Prefixo
const prefixCommandsPath = path.join(__dirname, 'commands', 'prefix');
if (fs.existsSync(prefixCommandsPath)) {
    const prefixFiles = fs.readdirSync(prefixCommandsPath).filter(f => f.endsWith('.js'));
    for (const file of prefixFiles) {
        const cmd = require(path.join(prefixCommandsPath, file));
        if (cmd.name && cmd.execute) {
            client.prefixCommands.set(cmd.name, cmd);
            if (Array.isArray(cmd.aliases)) {
                for (const alias of cmd.aliases) {
                    client.prefixCommands.set(alias, cmd);
                }
            }
            console.log(`[PrefixCommand] ✓ Carregado: ${config.PREFIX}${cmd.name}`);
        }
    }
}

// 3. Carregador dinâmico de Eventos
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
    for (const file of eventFiles) {
        const evt = require(path.join(eventsPath, file));
        if (evt.name && evt.execute) {
            if (evt.once) {
                client.once(evt.name, (...args) => evt.execute(...args, client));
            } else {
                client.on(evt.name, (...args) => evt.execute(...args, client));
            }
            console.log(`[Event] ✓ Registrado: ${evt.name}`);
        }
    }
}

// Inicialização
if (!config.TOKEN) {
    console.error('❌ ERRO: O TOKEN do bot não foi informado no arquivo .env!');
    console.error('Abra o arquivo .env e insira: TOKEN=seu_token_aqui');
    process.exit(1);
}

client.login(config.TOKEN);
