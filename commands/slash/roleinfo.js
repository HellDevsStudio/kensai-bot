const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleinfo')
        .setDescription('Mostra detalhes técnicos sobre um cargo específico.')
        .addRoleOption(opt => opt.setName('cargo').setDescription('O cargo a consultar').setRequired(true)),
    async execute(interaction) {
        const role = interaction.options.getRole('cargo');
        const hex = role.hexColor !== '#000000' ? role.hexColor : '#9a2ea6';

        const embed = criarEmbedPadrao(`🏷️ Informações do Cargo: ${role.name}`)
            .setColor(hex)
            .addFields(
                { name: '🆔 ID do Cargo', value: `\`${role.id}\``, inline: true },
                { name: '🎨 Cor HEX', value: `\`${role.hexColor}\``, inline: true },
                { name: '👥 Membros com o Cargo', value: `\`${role.members.size}\``, inline: true },
                { name: '📢 Mencionável?', value: role.mentionable ? 'Sim' : 'Não', inline: true },
                { name: '🛡️ Separado na Lista?', value: role.hoist ? 'Sim' : 'Não', inline: true },
                { name: '📅 Criado em', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:D>`, inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    }
};
