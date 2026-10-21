const { SlashCommandBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { parseDuration } = require('../../utils/timeParser');
const { readData, writeData } = require('../../utils/db');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sorteio')
        .setDescription('Gerencia sorteios oficiais na Kensai Store.')
        .addSubcommand(sub =>
            sub.setName('criar')
                .setDescription('Cria um novo sorteio')
                .addStringOption(opt => opt.setName('premio').setDescription('Item ou Robux a sortear').setRequired(true))
                .addStringOption(opt => opt.setName('tempo').setDescription('Duração (ex: 10m, 1h, 1d)').setRequired(true))
                .addIntegerOption(opt => opt.setName('ganhadores').setDescription('Quantidade de ganhadores').setMinValue(1).setMaxValue(20).setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('reroll')
                .setDescription('Sorteia novos ganhadores para um sorteio encerrado')
                .addStringOption(opt => opt.setName('id_sorteio').setDescription('ID do sorteio').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('encerrar')
                .setDescription('Encerra um sorteio antecipadamente')
                .addStringOption(opt => opt.setName('id_sorteio').setDescription('ID do sorteio').setRequired(true))
        ),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const sub = interaction.options.getSubcommand();
        const sorteios = readData('sorteios', {});

        if (sub === 'criar') {
            const premio = interaction.options.getString('premio');
            const tempoStr = interaction.options.getString('tempo');
            const winnersCount = interaction.options.getInteger('ganhadores') || 1;

            const durationMs = parseDuration(tempoStr);
            if (!durationMs || durationMs < 5000) {
                return interaction.reply({ content: '❌ Duração inválida! Ex: `10m`, `2h`, `1d`.', flags: [MessageFlags.Ephemeral] });
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
                .setDescription(`Clique no botão abaixo para concorrer a **${premio}**!\n\n` +
                    `🎁 **Prêmio:** ${premio}\n` +
                    `👑 **Patrocinador:** ${interaction.user}\n` +
                    `🏆 **Ganhadores:** ${winnersCount}\n` +
                    `⏰ **Encerra em:** <t:${Math.floor(endsAt / 1000)}:R> (<t:${Math.floor(endsAt / 1000)}:f>)\n` +
                    `👥 **Participantes:** 0\n\n` +
                    `*ID do Sorteio: ${giveId}*`
                );

            await interaction.reply({ content: '✅ Sorteio criado com sucesso!', flags: [MessageFlags.Ephemeral] });
            const msg = await interaction.channel.send({ embeds: [embed], components: [row] });

            sorteios[giveId] = {
                id: giveId,
                guildId: interaction.guild.id,
                channelId: interaction.channel.id,
                messageId: msg.id,
                prize: premio,
                sponsorId: interaction.user.id,
                winnersCount: winnersCount,
                endsAt: endsAt,
                participants: [],
                ended: false
            };
            writeData('sorteios', sorteios);

            // Agendar finalização
            setTimeout(async () => {
                const currentSorteios = readData('sorteios', {});
                const s = currentSorteios[giveId];
                if (s && !s.ended) {
                    s.ended = true;
                    currentSorteios[giveId] = s;
                    writeData('sorteios', currentSorteios);

                    const ch = await interaction.guild.channels.fetch(s.channelId).catch(() => null);
                    if (ch) {
                        const targetMsg = await ch.messages.fetch(s.messageId).catch(() => null);
                        const participants = s.participants || [];
                        let winners = [];
                        if (participants.length > 0) {
                            const shuffled = [...participants].sort(() => 0.5 - Math.random());
                            winners = shuffled.slice(0, s.winnersCount);
                        }

                        const winnerMentions = winners.length > 0 ? winners.map(w => `<@${w}>`).join(', ') : 'Nenhum participante';

                        const finalEmbed = criarEmbedPadrao('🎉 SORTEIO ENCERRADO 🎉')
                            .setDescription(`**${s.prize}**\n\n👑 **Patrocinador:** <@${s.sponsorId}>\n🏆 **Vencedor(es):** ${winnerMentions}\n👥 **Total de Participantes:** ${participants.length}`);

                        if (targetMsg) {
                            await targetMsg.edit({ embeds: [finalEmbed], components: [] }).catch(() => {});
                            if (winners.length > 0) {
                                await ch.send(`🎉 Parabéns ${winnerMentions}! Você(s) ganharam **${s.prize}** no sorteio da Kensai Store!`);
                            } else {
                                await ch.send(`⚠️ O sorteio de **${s.prize}** foi encerrado sem participantes válidos.`);
                            }
                        }
                    }
                }
            }, durationMs);
            return;
        }

        if (sub === 'encerrar' || sub === 'reroll') {
            const giveId = interaction.options.getString('id_sorteio');
            const s = sorteios[giveId];
            if (!s) {
                return interaction.reply({ content: '❌ Sorteio não encontrado!', flags: [MessageFlags.Ephemeral] });
            }

            const participants = s.participants || [];
            if (participants.length === 0) {
                return interaction.reply({ content: '❌ Nenhum participante registrado neste sorteio.', flags: [MessageFlags.Ephemeral] });
            }

            const shuffled = [...participants].sort(() => 0.5 - Math.random());
            const winners = shuffled.slice(0, s.winnersCount);
            const winnerMentions = winners.map(w => `<@${w}>`).join(', ');

            s.ended = true;
            sorteios[giveId] = s;
            writeData('sorteios', sorteios);

            await interaction.reply({
                content: `🎉 ${sub === 'reroll' ? 'Reroll realizado!' : 'Sorteio encerrado!'} Novo(s) vencedor(es): ${winnerMentions} para **${s.prize}**!`
            });
        }
    }
};
