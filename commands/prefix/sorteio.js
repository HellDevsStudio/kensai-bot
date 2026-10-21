const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { parseDuration } = require('../../utils/timeParser');
const { readData, writeData } = require('../../utils/db');
const { criarEmbedPadrao } = require('../../utils/embeds');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const crypto = require('crypto');

module.exports = {
    name: 'sorteio',
    aliases: ['giveaway'],
    description: 'Cria ou gerencia sorteios da loja.',
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.ManageGuild)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const action = (args[0] || '').toLowerCase();
        if (action === 'reroll' || action === 'encerrar') {
            const giveId = args[1];
            const sorteios = readData('sorteios', {});
            const s = sorteios[giveId];
            if (!s) return message.reply('❌ Sorteio não encontrado com esse ID.');

            const participants = s.participants || [];
            if (participants.length === 0) return message.reply('❌ Sem participantes para sortear.');

            const shuffled = [...participants].sort(() => 0.5 - Math.random());
            const winners = shuffled.slice(0, s.winnersCount || 1);
            return message.reply(`🎉 Novo(s) ganhador(es): ${winners.map(w => `<@${w}>`).join(', ')} para **${s.prize}**!`);
        }

        // Criar: k!sorteio [tempo] [ganhadores] [prêmio]
        const tempoStr = args[0];
        const winnersCount = parseInt(args[1], 10) || 1;
        const premio = args.slice(2).join(' ');

        if (!tempoStr || !premio) {
            return message.reply('❌ Uso: `k!sorteio [tempo] [ganhadores] [prêmio]` (Ex: `k!sorteio 1h 1 500 Robux`)');
        }

        const durationMs = parseDuration(tempoStr);
        if (!durationMs) {
            return message.reply('❌ Tempo inválido! Ex: `10m`, `1h`, `1d`.');
        }

        const giveId = crypto.randomBytes(3).toString('hex');
        const endsAt = Date.now() + durationMs;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`giveaway_enter_${giveId}`)
                .setLabel('🎉 Participar (0)')
                .setStyle(ButtonStyle.Primary)
        );

        const embed = criarEmbedPadrao('🎉 SORTEIO KENSAI STORE 🎉')
            .setDescription(`Clique no botão abaixo para concorrer a **${premio}**!\\n\\n` +
                `🎁 **Prêmio:** ${premio}\\n` +
                `👑 **Patrocinador:** ${message.author}\\n` +
                `🏆 **Ganhadores:** ${winnersCount}\\n` +
                `⏰ **Encerra em:** <t:${Math.floor(endsAt / 1000)}:R> (<t:${Math.floor(endsAt / 1000)}:f>)\\n` +
                `👥 **Participantes:** 0\\n\\n` +
                `*ID do Sorteio: ${giveId}*`
            );

        const msg = await message.channel.send({ embeds: [embed], components: [row] });
        const sorteios = readData('sorteios', {});
        sorteios[giveId] = {
            id: giveId,
            guildId: message.guild.id,
            channelId: message.channel.id,
            messageId: msg.id,
            prize: premio,
            sponsorId: message.author.id,
            winnersCount: winnersCount,
            endsAt: endsAt,
            participants: [],
            ended: false
        };
        writeData('sorteios', sorteios);
    }
};
