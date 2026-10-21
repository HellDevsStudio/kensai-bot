const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
    name: 'userinfo',
    aliases: ['ui', 'perfil', 'usuario'],
    description: 'Exibe informações sobre você ou outro membro do servidor.',
    async execute(message, args, client) {
        let targetUser = message.mentions.users.first();
        if (!targetUser && args[0]) {
            const id = args[0].replace(/[^0-9]/g, '');
            targetUser = await client.users.fetch(id).catch(() => null);
        }
        if (!targetUser) {
            targetUser = message.author;
        }

        const member = await message.guild.members.fetch(targetUser.id).catch(() => null);

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
        message.reply({ embeds: [embed] });
    }
};
