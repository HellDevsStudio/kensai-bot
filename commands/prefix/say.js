const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');

module.exports = {
    name: 'say',
    aliases: ['falar', 'dizer'],
    description: 'Faz o Ken falar no chat.',
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.Administrator)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        let targetChannel = message.mentions.channels.first();
        let textArgs = args;

        if (targetChannel) {
            textArgs = args.filter(a => !a.startsWith('<#'));
        } else {
            targetChannel = message.channel;
        }

        let text = textArgs.join(' ');
        if (!text) {
            return message.reply('❌ Informe a mensagem a ser enviada. Ex: `k!say Olá a todos!`');
        }

        text = text.replace(/@(everyone|here)/gi, '@​$1');

        await message.delete().catch(() => {});
        await targetChannel.send(text);
    }
};
