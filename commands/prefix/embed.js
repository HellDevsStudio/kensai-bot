const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    name: 'embed',
    aliases: ['criar-embed'],
    description: 'Cria uma embed rápida no canal.',
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.Administrator)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const raw = args.join(' ');
        if (!raw) {
            return message.reply('❌ Uso: `k!embed [Título] | [Descrição] | [Banner opcional]`');
        }

        const parts = raw.split('|').map(s => s.trim());
        const title = parts[0] || 'Anúncio Kensai Store';
        const desc = parts[1] || '';
        const banner = parts[2] || null;

        const embed = criarEmbedPadrao(title, desc);
        if (banner && banner.startsWith('http')) {
            embed.setImage(banner);
        }

        await message.delete().catch(() => {});
        message.channel.send({ embeds: [embed] });
    }
};
