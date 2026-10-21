const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { parseDuration, formatDuration } = require('../../utils/timeParser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lembrete')
        .setDescription('Configura um despertador/lembrete.')
        .addStringOption(opt => opt.setName('tempo').setDescription('Ex: 10s, 5m, 1h').setRequired(true))
        .addStringOption(opt => opt.setName('mensagem').setDescription('O que deseja ser lembrado').setRequired(true)),
    async execute(interaction) {
        const tempoStr = interaction.options.getString('tempo');
        const texto = interaction.options.getString('mensagem');
        const ms = parseDuration(tempoStr);

        if (!ms || ms < 5000 || ms > 7 * 24 * 60 * 60 * 1000) {
            return interaction.reply({
                embeds: [criarEmbedErro('Tempo Inválido', 'Informe um tempo válido entre 5 segundos e 7 dias (ex: `10s`, `15m`, `2h`, `1d`).')],
                ephemeral: true
            });
        }

        const embedConfirm = criarEmbedPadrao(
            '⏰ Lembrete Configurado',
            `Vou te lembrar em **${formatDuration(ms)}** sobre:\n> ${texto}`
        );
        await interaction.reply({ embeds: [embedConfirm] });

        setTimeout(async () => {
            const embedAlerta = criarEmbedPadrao(
                '⏰ Alarme do Lembrete!',
                `Olá <@${interaction.user.id}>! Você pediu para ser lembrado de:\n\n> **${texto}**`
            );
            interaction.channel.send({ content: `<@${interaction.user.id}>`, embeds: [embedAlerta] }).catch(() => {
                interaction.user.send({ embeds: [embedAlerta] }).catch(() => {});
            });
        }, ms);
    }
};
