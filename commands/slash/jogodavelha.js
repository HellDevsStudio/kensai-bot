const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

const games = new Map();

function checkWin(board) {
    const lines = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    for (const [a, b, c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    if (board.every(cell => cell !== null)) return 'tie';
    return null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jogodavelha')
        .setDescription('Partida de Jogo da Velha com botões 3x3.')
        .addUserOption(opt => opt.setName('adversario').setDescription('Quem deseja desafiar?').setRequired(true)),
    async execute(interaction) {
        const oponente = interaction.options.getUser('adversario');
        if (oponente.id === interaction.user.id || oponente.bot) {
            return interaction.reply({
                embeds: [criarEmbedErro('Inválido', 'Você não pode jogar contra si mesmo ou contra bots!')],
                ephemeral: true
            });
        }

        const gameId = `ttt_${Date.now()}_${interaction.user.id}_${oponente.id}`;
        const board = Array(9).fill(null);
        games.set(gameId, {
            p1: interaction.user.id,
            p2: oponente.id,
            turn: interaction.user.id,
            board: board
        });

        const rows = [];
        for (let r = 0; r < 3; r++) {
            const row = new ActionRowBuilder();
            for (let c = 0; c < 3; c++) {
                const idx = r * 3 + c;
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${gameId}_${idx}`)
                        .setLabel('-')
                        .setStyle(ButtonStyle.Secondary)
                );
            }
            rows.push(row);
        }

        const embed = criarEmbedPadrao('⭕ Jogo da Velha ❌')
            .setDescription(`Vez de: <@${interaction.user.id}> (❌)\nAdversário: <@${oponente.id}> (⭕)`);

        await interaction.reply({ embeds: [embed], components: rows });
    },
    async handleButton(interaction) {
        const parts = interaction.customId.split('_');
        const gameId = `${parts[0]}_${parts[1]}_${parts[2]}_${parts[3]}`;
        const cellIdx = parseInt(parts[4], 10);

        const game = games.get(gameId);
        if (!game) {
            return interaction.reply({ content: 'Partida encerrada ou não encontrada.', ephemeral: true });
        }

        if (interaction.user.id !== game.turn) {
            return interaction.reply({ content: '❌ Não é a sua vez de jogar!', ephemeral: true });
        }

        if (game.board[cellIdx] !== null) {
            return interaction.reply({ content: '❌ Esta casa já foi marcada!', ephemeral: true });
        }

        const symbol = interaction.user.id === game.p1 ? '❌' : '⭕';
        game.board[cellIdx] = symbol;

        const winner = checkWin(game.board);
        if (winner) {
            games.delete(gameId);
            let desc = '';
            if (winner === 'tie') desc = '⚖️ O jogo terminou em **Empate (Deu Velha)!**';
            else desc = `👑 Parabéns <@${interaction.user.id}>! Você venceu a partida de Jogo da Velha!`;

            const embedFinal = criarEmbedPadrao('🏆 Fim de Jogo da Velha').setDescription(desc);
            return interaction.update({ embeds: [embedFinal], components: [] });
        }

        // Alternar turno
        game.turn = game.turn === game.p1 ? game.p2 : game.p1;
        const nextSymbol = game.turn === game.p1 ? '❌' : '⭕';

        const rows = [];
        for (let r = 0; r < 3; r++) {
            const row = new ActionRowBuilder();
            for (let c = 0; c < 3; c++) {
                const idx = r * 3 + c;
                const val = game.board[idx];
                const btn = new ButtonBuilder().setCustomId(`${gameId}_${idx}`);
                if (val === '❌') {
                    btn.setLabel('❌').setStyle(ButtonStyle.Danger).setDisabled(true);
                } else if (val === '⭕') {
                    btn.setLabel('⭕').setStyle(ButtonStyle.Primary).setDisabled(true);
                } else {
                    btn.setLabel('-').setStyle(ButtonStyle.Secondary);
                }
                row.addComponents(btn);
            }
            rows.push(row);
        }

        const embedNext = criarEmbedPadrao('⭕ Jogo da Velha ❌')
            .setDescription(`Vez de: <@${game.turn}> (${nextSymbol})`);

        await interaction.update({ embeds: [embedNext], components: rows });
    }
};
