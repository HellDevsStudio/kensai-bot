const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ship')
        .setDescription('Mede a porcentagem de química entre dois membros.')
        .addUserOption(opt => opt.setName('usuario1').setDescription('Primeiro membro').setRequired(true))
        .addUserOption(opt => opt.setName('usuario2').setDescription('Segundo membro').setRequired(false)),
    async execute(interaction) {
        const u1 = interaction.options.getUser('usuario1');
        const u2 = interaction.options.getUser('usuario2') || interaction.user;

        // Gerar porcentagem determinística para o par de IDs
        const ids = [u1.id, u2.id].sort().join('');
        let hash = 0;
        for (let i = 0; i < ids.length; i++) {
            hash = (hash << 5) - hash + ids.charCodeAt(i);
            hash |= 0;
        }
        const pct = Math.abs(hash) % 101;

        const barrasRoxas = Math.round(pct / 10);
        const barrasBrancas = 10 - barrasRoxas;
        const progressBar = '🟪'.repeat(barrasRoxas) + '⬜'.repeat(barrasBrancas);

        const nomeMisto = u1.username.slice(0, Math.ceil(u1.username.length / 2)) +
                          u2.username.slice(Math.floor(u2.username.length / 2));

        let veredito = '';
        if (pct >= 85) veredito = '💍 Casamento perfeito marcado pela Kensai!';
        else if (pct >= 60) veredito = '💖 Tem futuro, o clima tá quente!';
        else if (pct >= 40) veredito = '👀 Talvez dê certo com um pouco de esforço...';
        else veredito = '💔 Melhor continuarem só na amizade mesmo.';

        const embed = criarEmbedPadrao(`💘 Medidor de Química: ${nomeMisto}`)
            .addFields(
                { name: '👥 Casal', value: `<@${u1.id}> + <@${u2.id}>`, inline: true },
                { name: '📊 Afinidade', value: `**${pct}%**`, inline: true },
                { name: 'Barra de Conexão', value: `${progressBar}` },
                { name: '🔮 Veredito do Ken', value: veredito }
            );

        await interaction.reply({ embeds: [embed] });
    }
};
