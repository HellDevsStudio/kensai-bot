const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Exibe informações sobre você ou outro membro do servidor.')
        .addUserOption(opt => opt.setName('usuario').setDescription('O membro a consultar').setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario') || interaction.user;
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        const embed = new EmbedBuilder()
            .setColor(config.EMBED_COLOR)
            .setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '🆔 ID', value: `\`${targetUser.id}\``, inline: true },
                { name: '🤖 É Bot?', value: targetUser.bot ? 'Sim' : 'Não', inline: true },
                { name: '📅 Conta Criada', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true }
            );

        if (member) {
            embed.addFields(
                { name: '📥 Entrou no Servidor', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '🏷️ Maior Cargo', value: member.roles.highest ? `${member.roles.highest}` : 'Nenhum', inline: true }
            );
        }

        embed.setTimestamp();
        await interaction.reply({ embeds: [embed] });
    }
};
