const { Events } = require('discord.js');
const config = require('../config');
const { readData, writeData } = require('../utils/db');
const { formatDuration } = require('../utils/timeParser');
const { criarEmbedPadrao, criarEmbedErro } = require('../utils/embeds');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(message, client) {
        if (!message || message.author?.bot || !message.guild) return;

        const afkData = readData('afk', {});

        // 1. Verificar se o autor da mensagem estava AFK -> Remover AFK
        if (afkData[message.author.id]) {
            const afkInfo = afkData[message.author.id];
            delete afkData[message.author.id];
            writeData('afk', afkData);

            const tempoFora = formatDuration(Date.now() - afkInfo.timestamp);
            message.reply({
                embeds: [
                    criarEmbedPadrao(
                        '👋 Bem-vindo(a) de volta!',
                        '**' + message.author.username + '**, seu status **AFK** foi removido. Você ficou ausente por `' + tempoFora + '`.'
                    )
                ]
            }).catch(() => {});
        }

        // 2. Verificar se a mensagem mencionou alguém que está AFK
        if (message.mentions.users.size > 0) {
            for (const [mentionedId, mentionedUser] of message.mentions.users) {
                if (mentionedId === message.author.id) continue;
                if (afkData[mentionedId]) {
                    const afkInfo = afkData[mentionedId];
                    const tempoFora = formatDuration(Date.now() - afkInfo.timestamp);
                    const embed = criarEmbedPadrao(
                        '💤 Membro Ausente',
                        '**' + mentionedUser.username + '** está ausente há `' + tempoFora + '`\n📝 **Motivo:** ' + (afkInfo.reason || 'Sem motivo informado')
                    );
                    message.reply({ embeds: [embed] }).catch(() => {});
                    break;
                }
            }
        }

        // 3. Processamento de comandos de prefixo
        const prefix = config.PREFIX;
        if (!message.content.toLowerCase().startsWith(prefix.toLowerCase())) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        if (!commandName) return;

        const command = client.prefixCommands.get(commandName);
        if (!command) return;

        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error('❌ Erro ao executar comando de prefixo ' + prefix + commandName + ':', error);
            const embedErro = criarEmbedErro('Erro no Comando', 'Ocorreu um erro ao executar este comando.');
            message.reply({ embeds: [embedErro] }).catch(() => {});
        }
    }
};
