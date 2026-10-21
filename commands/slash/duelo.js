const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

const duelos = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('duelo')
        .setDescription('Duelo de lâminas de reflexo temático Kensai Store.')
        .addUserOption(opt => opt.setName('adversario').setDescription('Membro a desafiar').setRequired(true)),
    async execute(interaction) {
        const oponente = interaction.options.getUser('adversario');
        if (oponente.id === interaction.user.id || oponente.bot) {
            return interaction.reply({
                embeds: [criarEmbedErro('Inválido', 'Você não pode duelar consigo mesmo ou bots!')],
                ephemeral: true
            });
        }

        const dueloId = `duelo_${Date.now()}_${interaction.user.id}_${oponente.id}`;
        duelos.set(dueloId, {
            p1: interaction.user.id,
            p2: oponente.id,
            ready: false,
            winner: null
        });

        const embed = criarEmbedPadrao('⚔️ Duelo de Lâminas Kensai!')
            .setDescription(`⚔️ **<@${interaction.user.id}>** desafiou **<@${oponente.id}>** para um duelo de lâminas!\n\n⏳ Preparem os reflexos... O botão ficará verde a qualquer momento!`);

        const disabledRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`${dueloId}_attack`)
                .setLabel('⏳ Aguarde o sinal...')
                .setEmoji('⚔️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
        );

        await interaction.reply({ embeds: [embed], components: [disabledRow] });

        // Tempo aleatório entre 3 e 7 segundos
        const delay = Math.floor(Math.random() * 4000) + 3000;
        setTimeout(async () => {
            const duelo = duelos.get(dueloId);
            if (!duelo || duelo.winner) return;
            duelo.ready = true;

            const activeRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`${dueloId}_attack`)
                    .setLabel('🗡️ ATACAR AGORA!')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(false)
            );

            const embedAtacar = criarEmbedPadrao('⚡ GOLPE LIBERADO!')
                .setDescription('🚨 **A LÂMINA FOI DESBAINHADA! QUEM CLICAR PRIMEIRO VENCE!**');

            await interaction.editReply({ embeds: [embedAtacar], components: [activeRow] }).catch(() => {});
        }, delay);
    },
    async handleButton(interaction) {
        const cid = interaction.customId;
        const parts = cid.split('_');
        const dueloId = `${parts[0]}_${parts[1]}_${parts[2]}_${parts[3]}`;

        const duelo = duelos.get(dueloId);
        if (!duelo) {
            return interaction.reply({ content: 'Duelo encerrado!', ephemeral: true });
        }

        const uid = interaction.user.id;
        if (uid !== duelo.p1 && uid !== duelo.p2) {
            return interaction.reply({ content: '❌ Você não participa deste duelo!', ephemeral: true });
        }

        if (!duelo.ready) {
            return interaction.reply({ content: '⚠️ Muito cedo! Espere o botão ficar verde!', ephemeral: true });
        }

        if (duelo.winner) return;
        duelo.winner = uid;
        duelos.delete(dueloId);

        const loserId = uid === duelo.p1 ? duelo.p2 : duelo.p1;
        const embedVitoria = criarEmbedPadrao('🏆 Vitória no Duelo de Lâminas!')
            .setDescription(`👑 **<@${uid}>** foi mais rápido no reflexo e desferiu o golpe fatal em **<@${loserId}>**!\n\n🗡️ *Honra preservada na Kensai Store.*`);

        await interaction.update({ embeds: [embedVitoria], components: [] });
    }
};
