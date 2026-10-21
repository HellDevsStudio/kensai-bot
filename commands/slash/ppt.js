const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

const activeGames = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ppt')
        .setDescription('Desafie um amigo para uma partida de Pedra, Papel e Tesoura!')
        .addUserOption(opt => opt.setName('adversario').setDescription('Quem deseja desafiar?').setRequired(true)),
    async execute(interaction) {
        const oponente = interaction.options.getUser('adversario');
        if (oponente.id === interaction.user.id || oponente.bot) {
            return interaction.reply({
                embeds: [criarEmbedErro('Desafio Inválido', 'Você não pode jogar contra si mesmo ou contra bots!')],
                ephemeral: true
            });
        }

        const gameId = `ppt_${Date.now()}_${interaction.user.id}_${oponente.id}`;
        activeGames.set(gameId, {
            p1: interaction.user.id,
            p2: oponente.id,
            choice1: null,
            choice2: null
        });

        const embed = criarEmbedPadrao('⚔️ Pedra, Papel ou Tesoura!')
            .setDescription(`**<@${interaction.user.id}>** desafiou **<@${oponente.id}>**!\n\nAmbos cliquem no botão secreto abaixo com sua jogada:`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`${gameId}_pedra`).setLabel('Pedra').setEmoji('🪨').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`${gameId}_papel`).setLabel('Papel').setEmoji('📄').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`${gameId}_tesoura`).setLabel('Tesoura').setEmoji('✂️').setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
    async handleButton(interaction) {
        const parts = interaction.customId.split('_');
        const gameId = `${parts[0]}_${parts[1]}_${parts[2]}_${parts[3]}`;
        const move = parts[4];

        const game = activeGames.get(gameId);
        if (!game) {
            return interaction.reply({ content: '❌ Partida não encontrada ou já encerrada.', ephemeral: true });
        }

        const uid = interaction.user.id;
        if (uid !== game.p1 && uid !== game.p2) {
            return interaction.reply({ content: '❌ Você não participa deste duelo!', ephemeral: true });
        }

        if (uid === game.p1) {
            if (game.choice1) return interaction.reply({ content: 'Você já escolheu sua jogada!', ephemeral: true });
            game.choice1 = move;
        } else if (uid === game.p2) {
            if (game.choice2) return interaction.reply({ content: 'Você já escolheu sua jogada!', ephemeral: true });
            game.choice2 = move;
        }

        await interaction.reply({ content: `✅ Você escolheu **${move.toUpperCase()}**!`, ephemeral: true });

        // Ambos escolheram
        if (game.choice1 && game.choice2) {
            activeGames.delete(gameId);

            let vencedor = 'Empate';
            const c1 = game.choice1;
            const c2 = game.choice2;

            if (c1 === c2) vencedor = 'Empate!';
            else if (
                (c1 === 'pedra' && c2 === 'tesoura') ||
                (c1 === 'papel' && c2 === 'pedra') ||
                (c1 === 'tesoura' && c2 === 'papel')
            ) {
                vencedor = `<@${game.p1}> Venceu!`;
            } else {
                vencedor = `<@${game.p2}> Venceu!`;
            }

            const embedFinal = criarEmbedPadrao('🏆 Fim do Duelo de PPT!')
                .setDescription(
                    `<@${game.p1}> jogou: **${c1.toUpperCase()}**\n` +
                    `<@${game.p2}> jogou: **${c2.toUpperCase()}**\n\n` +
                    `👑 **Resultado:** ${vencedor}`
                );

            await interaction.message.edit({ embeds: [embedFinal], components: [] }).catch(() => {});
        }
    }
};
