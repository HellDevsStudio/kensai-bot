const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    ChannelType,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionsBitField,
    MessageFlags
} = require('discord.js');
const { criarEmbedPadrao, criarEmbedSucesso, criarEmbedErro } = require('./embeds');
const { checkPermission, NO_PERMISSION_MSG } = require('./permissions');

/**
 * Gera o payload do Painel de Clonagem de Canais e Categorias
 */
function gerarPainelCopyPayload() {
    const embed = criarEmbedPadrao('📋 CLONAGEM DE CANAIS & CATEGORIAS • KENSAI STORE')
        .setDescription(
            '**Duplique qualquer canal ou categoria com fidelidade máxima.**\n' +
            'O novo canal ou categoria herdará **100% das permissões de cargos e membros**, ' +
            'tópicos, filtros de slowmode, configurações de NSFW e hierarquia.\n\n' +
            '📁 **Clonar Canal Específico:**\n' +
            'Selecione no primeiro menu qualquer canal de texto, voz, anúncio ou fórum.\n\n' +
            '🗂️ **Clonar Categoria Inteira:**\n' +
            'Selecione no segundo menu a categoria desejada (com opção de clonar todos os canais internos).\n\n' +
            '💡 *Ao selecionar uma opção, um formulário abrirá na tela para você definir o novo nome.*'
        )
        .setFooter({ text: 'Kensai Store • Sistema de Clonagem & Segurança' });

    // Menu 1: Canais Individuais (Texto, Voz, Anúncios, Palco, Fórum)
    const rowCanal = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('copy_sel_channel')
            .setPlaceholder('📁 Selecione um canal para clonar...')
            .setChannelTypes([
                ChannelType.GuildText,
                ChannelType.GuildVoice,
                ChannelType.GuildAnnouncement,
                ChannelType.GuildStageVoice,
                ChannelType.GuildForum
            ])
    );

    // Menu 2: Categorias
    const rowCategoria = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('copy_sel_category')
            .setPlaceholder('🗂️ Selecione uma categoria para clonar...')
            .setChannelTypes([
                ChannelType.GuildCategory
            ])
    );

    // Botão de Fechar / Cancelar
    const rowBotoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('copy_btn_fechar')
            .setLabel('Fechar Painel')
            .setEmoji('❌')
            .setStyle(ButtonStyle.Secondary)
    );

    return {
        embeds: [embed],
        components: [rowCanal, rowCategoria, rowBotoes]
    };
}

/**
 * Trata as seleções nos ChannelSelectMenus de clonagem
 */
async function handleCopySelect(interaction) {
    if (!checkPermission(interaction.member, PermissionsBitField.Flags.ManageChannels)) {
        return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
    }

    const guild = interaction.guild;
    const selectedId = interaction.values[0];
    const target = guild.channels.cache.get(selectedId) || await guild.channels.fetch(selectedId).catch(() => null);

    if (!target) {
        return interaction.reply({ content: '❌ Canal ou categoria não encontrado no servidor.', flags: [MessageFlags.Ephemeral] });
    }

    // Caso 1: Clonar Canal
    if (interaction.customId === 'copy_sel_channel') {
        const modal = new ModalBuilder()
            .setCustomId('modal_copy_chan_' + target.id)
            .setTitle(`Clonar: #${target.name.slice(0, 20)}`);

        const inputNome = new TextInputBuilder()
            .setCustomId('copy_novo_nome')
            .setLabel('Novo Nome do Canal')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(`ex: ${target.name}-copia`)
            .setValue(`${target.name}-copia`)
            .setRequired(true)
            .setMaxLength(100);

        const inputParent = new TextInputBuilder()
            .setCustomId('copy_manter_cat')
            .setLabel('Manter na mesma categoria? (sim/nao)')
            .setStyle(TextInputStyle.Short)
            .setValue('sim')
            .setRequired(false)
            .setMaxLength(10);

        modal.addComponents(
            new ActionRowBuilder().addComponents(inputNome),
            new ActionRowBuilder().addComponents(inputParent)
        );

        return interaction.showModal(modal);
    }

    // Caso 2: Clonar Categoria
    if (interaction.customId === 'copy_sel_category') {
        const modal = new ModalBuilder()
            .setCustomId('modal_copy_cat_' + target.id)
            .setTitle(`Clonar Categoria: ${target.name.slice(0, 16)}`);

        const inputNome = new TextInputBuilder()
            .setCustomId('copy_novo_nome')
            .setLabel('Novo Nome da Categoria')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(`ex: ${target.name} (Cópia)`)
            .setValue(`${target.name} (Cópia)`)
            .setRequired(true)
            .setMaxLength(100);

        const inputFilhos = new TextInputBuilder()
            .setCustomId('copy_clonar_filhos')
            .setLabel('Clonar canais internos também? (sim/nao)')
            .setStyle(TextInputStyle.Short)
            .setValue('sim')
            .setRequired(false)
            .setMaxLength(10);

        modal.addComponents(
            new ActionRowBuilder().addComponents(inputNome),
            new ActionRowBuilder().addComponents(inputFilhos)
        );

        return interaction.showModal(modal);
    }
}

/**
 * Trata o envio dos Modais de Clonagem
 */
async function handleCopyModal(interaction) {
    if (!checkPermission(interaction.member, PermissionsBitField.Flags.ManageChannels)) {
        return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
    }

    const guild = interaction.guild;
    const botMember = guild.members.me;
    if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return interaction.reply({
            content: '❌ O bot não possui a permissão **Gerenciar Canais** necessária para clonar.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    // Modal de Clonar Canal
    if (interaction.customId.startsWith('modal_copy_chan_')) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        const targetId = interaction.customId.replace('modal_copy_chan_', '');
        const target = guild.channels.cache.get(targetId) || await guild.channels.fetch(targetId).catch(() => null);

        if (!target) {
            return interaction.editReply({ content: '❌ O canal de origem não foi encontrado.' });
        }

        const novoNome = interaction.fields.getTextInputValue('copy_novo_nome').trim() || `${target.name}-copia`;
        const manterCatStr = (interaction.fields.getTextInputValue('copy_manter_cat') || 'sim').toLowerCase().trim();
        const parentId = (manterCatStr === 'nao' || manterCatStr === 'não') ? null : target.parentId;

        try {
            const cloned = await target.clone({
                name: novoNome,
                parent: parentId
            });

            // Posiciona logo abaixo do canal original se estiverem no mesmo parent
            if (target.rawPosition !== undefined) {
                await cloned.setPosition(target.rawPosition + 1).catch(() => {});
            }

            const embed = criarEmbedSucesso('Canal Clonado com Sucesso!')
                .setDescription(
                    `O canal foi duplicado com **100% de precisão de permissões** e configurações.\n\n` +
                    `• 📁 **Canal Original:** \`#${target.name}\` (<#${target.id}>)\n` +
                    `• ✨ **Novo Canal:** <#${cloned.id}> (\`#${cloned.name}\`)\n` +
                    `• 🔒 **Permissões Copiadas:** \`${cloned.permissionOverwrites.cache.size} regras de cargos/membros\`\n` +
                    `• 📂 **Categoria:** ${cloned.parent ? `\`${cloned.parent.name}\`` : '*Nenhuma*'}\n` +
                    `• 🛡️ **Responsável:** ${interaction.user.toString()}`
                );

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro ao clonar canal:', error);
            return interaction.editReply({
                content: `❌ Ocorreu um erro ao clonar o canal: \`${error.message}\`. Verifique o limite de 500 canais do Discord.`
            });
        }
    }

    // Modal de Clonar Categoria
    if (interaction.customId.startsWith('modal_copy_cat_')) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        const targetId = interaction.customId.replace('modal_copy_cat_', '');
        const target = guild.channels.cache.get(targetId) || await guild.channels.fetch(targetId).catch(() => null);

        if (!target || target.type !== ChannelType.GuildCategory) {
            return interaction.editReply({ content: '❌ A categoria de origem não foi encontrada.' });
        }

        const novoNome = interaction.fields.getTextInputValue('copy_novo_nome').trim() || `${target.name} (Cópia)`;
        const clonarFilhosStr = (interaction.fields.getTextInputValue('copy_clonar_filhos') || 'sim').toLowerCase().trim();
        const deveClonarFilhos = clonarFilhosStr !== 'nao' && clonarFilhosStr !== 'não';

        try {
            const clonedCategory = await target.clone({
                name: novoNome
            });

            let canaisClonadosCount = 0;
            const canaisLista = [];

            if (deveClonarFilhos) {
                const allChannels = Array.from(guild.channels.cache.values());
                const children = allChannels
                    .filter(c => c.parentId === target.id)
                    .sort((a, b) => (a.position || 0) - (b.position || 0));

                for (const child of children) {
                    try {
                        const childCloned = await child.clone({
                            parent: clonedCategory.id
                        });
                        canaisClonadosCount++;
                        canaisLista.push(`<#${childCloned.id}> (\`${childCloned.name}\`)`);
                    } catch (childErr) {
                        console.error(`Erro ao clonar canal interno #${child.name}:`, childErr);
                    }
                }
            }

            const embed = criarEmbedSucesso('Categoria Clonada com Sucesso!')
                .setDescription(
                    `A categoria foi duplicada com **todas as permissões idênticas**.\n\n` +
                    `• 🗂️ **Categoria Original:** \`${target.name}\`\n` +
                    `• ✨ **Nova Categoria:** \`${clonedCategory.name}\` (<#${clonedCategory.id}>)\n` +
                    `• 🔒 **Permissões Copiadas:** \`${clonedCategory.permissionOverwrites.cache.size} regras de cargos/membros\`\n` +
                    `• 📦 **Canais Internos Duplicados:** \`${canaisClonadosCount} canais\`\n` +
                    (canaisLista.length > 0 ? `\n**Canais Criados:**\n${canaisLista.slice(0, 10).join('\n')}${canaisLista.length > 10 ? `\n*... e mais ${canaisLista.length - 10} canais.*` : ''}\n` : '') +
                    `• 🛡️ **Responsável:** ${interaction.user.toString()}`
                );

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro ao clonar categoria:', error);
            return interaction.editReply({
                content: `❌ Ocorreu um erro ao clonar a categoria: \`${error.message}\`.`
            });
        }
    }
}

/**
 * Trata o clique no botão de fechar painel
 */
async function handleCopyButton(interaction) {
    if (interaction.customId === 'copy_btn_fechar') {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }
        return interaction.update({
            content: '🔒 Painel de clonagem encerrado.',
            embeds: [],
            components: []
        });
    }
}

module.exports = {
    gerarPainelCopyPayload,
    handleCopySelect,
    handleCopyModal,
    handleCopyButton
};
