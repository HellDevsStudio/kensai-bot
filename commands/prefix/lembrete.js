const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { parseDuration, formatDuration } = require('../../utils/timeParser');

module.exports = {
    name: 'lembrete',
    description: 'Configura um lembrete.',
    async execute(message, args) {
        if (!args[0] || !args[1]) {
            return message.reply({ embeds: [criarEmbedErro('Uso Correto', 'Use: `k!lembrete [tempo] [texto]` (ex: `k!lembrete 10m sorteio`)')] });
        }

        const tempoStr = args[0];
        const texto = args.slice(1).join(' ');
        const ms = parseDuration(tempoStr);

        if (!ms || ms < 5000 || ms > 7 * 24 * 60 * 60 * 1000) {
            return message.reply({
                embeds: [criarEmbedErro('Tempo Inválido', 'Informe um tempo válido entre 5 segundos e 7 dias (ex: `10s`, `15m`, `2h`).')]
            });
        }

        const embedConfirm = criarEmbedPadrao(
            '⏰ Lembrete Configurado',
            `Vou te lembrar em **${formatDuration(ms)}** sobre:\n> ${texto}`
        );
        await message.reply({ embeds: [embedConfirm] });

        setTimeout(async () => {
            const embedAlerta = criarEmbedPadrao(
                '⏰ Alarme do Lembrete!',
                `Olá <@${message.author.id}>! Você pediu para ser lembrado de:\n\n> **${texto}**`
            );
            message.channel.send({ content: `<@${message.author.id}>`, embeds: [embedAlerta] }).catch(() => {
                message.author.send({ embeds: [embedAlerta] }).catch(() => {});
            });
        }, ms);
    }
};
