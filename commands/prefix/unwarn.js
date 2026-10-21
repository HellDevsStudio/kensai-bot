const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { readData, writeData } = require('../../utils/db');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'unwarn',
    aliases: ['removeraviso'],
    description: 'Apaga uma advertência específica de um membro.',
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.Administrator)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const targetArg = args[0];
        const warnId = (args[1] || '').trim().toUpperCase();

        if (!targetArg || !warnId) {
            return message.reply('❌ Uso correto: `k!unwarn [@user] [ID_warn]`');
        }

        const targetId = targetArg.replace(/[^0-9]/g, '');
        const warnsDb = readData('warns', {});
        let userWarns = warnsDb[targetId] || [];

        const warnIndex = userWarns.findIndex(w => w.id === warnId);
        if (warnIndex === -1) {
            return message.reply({
                embeds: [criarEmbedErro('Aviso Não Encontrado', 'Nenhuma advertência com ID `' + warnId + '` encontrada.')]
            });
        }

        userWarns.splice(warnIndex, 1);
        warnsDb[targetId] = userWarns;
        writeData('warns', warnsDb);

        const embed = criarEmbedPadrao(
            '✅ Advertência Removida',
            'A advertência com ID `' + warnId + '` foi removida da ficha com sucesso.'
        ).addFields(
            { name: '🛡️ Administrador Responsável', value: message.author.tag, inline: true },
            { name: '📊 Advertências Restantes', value: String(userWarns.length), inline: true }
        );

        message.reply({ embeds: [embed] });
    }
};
