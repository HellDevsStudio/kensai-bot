const { Events } = require('discord.js');
const { setSnipe } = require('../utils/snipeManager');

module.exports = {
    name: Events.MessageDelete,
    once: false,
    async execute(message) {
        if (!message || message.partial || message.author?.bot || !message.guild) return;

        setSnipe(message.channelId, {
            author: message.author,
            content: message.content || '[Sem texto / Apenas anexo]',
            attachments: message.attachments.map(a => a.url),
            deletedAt: Date.now()
        });
    }
};
