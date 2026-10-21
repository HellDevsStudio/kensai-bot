const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedSucesso, criarEmbedErro } = require('../../utils/embeds');
const { 
    getSuporteConfig, setSuporteConfig, 
    getTokensConfig, setTokensConfig, 
    getItensConfig, setItensConfig 
} = require('../../utils/ticketConfigs');
const { 
    gerarPainelSuportePayload, 
    gerarPainelTokensPayload, 
    gerarPainelItensPayload 
} = require('../../utils/ticketPanels');

module.exports = {
    name: 'config',
    aliases: ['setup', 'painelconfig', 'h!config', 'hconfig'],
    description: 'Configura os sistemas de Suporte, Tokens e Itens da loja.',
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.Administrator)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const sub = (args[0] || 'ver').toLowerCase();

        // 1. k!config ver
        if (sub === 'ver' || sub === 'status') {
            const sup = getSuporteConfig();
            const tok = getTokensConfig();
            const itn = getItensConfig();

            const embed = criarEmbedPadrao('⚙️ Configurações dos Sistemas • Kensai Store')
                .setDescription('Status dos 3 sistemas operacionais da loja (arquivos em `data/configs/`):\n\n' +
                    '• `k!config suporte [categoriaId] [logsId] [cargoId]`\n' +
                    '• `k!config tokens [preco1k] [chavePix] [categoriaId] [logsId]`\n' +
                    '• `k!config itens [categoriaId] [logsId] [cargoId]`\n' +
                    '• `k!config painel <suporte|tokens|itens>`')
                .addFields(
                    {
                        name: '🎫 1. Suporte (`suporte.json`)',
                        value: '• **Categoria:** ' + (sup.categoria_id ? '<#' + sup.categoria_id + '>' : 'N/A') + '\n' +
                               '• **Logs:** ' + (sup.canal_logs_id ? '<#' + sup.canal_logs_id + '>' : 'N/A') + '\n' +
                               '• **Staff:** ' + (sup.cargo_staff_id ? '<@&' + sup.cargo_staff_id + '>' : 'N/A'),
                        inline: false
                    },
                    {
                        name: '💰 2. Tokens (`tokens.json`)',
                        value: '• **Preço 1k:** `R$ ' + Number(tok.preco_por_1k || 18.5).toFixed(2).replace('.', ',') + '`\n' +
                               '• **Chave Pix:** `' + (tok.chave_pix || 'Não configurada') + '`\n' +
                               '• **Categoria:** ' + (tok.categoria_id ? '<#' + tok.categoria_id + '>' : 'N/A') + '\n' +
                               '• **Logs:** ' + (tok.canal_logs_id ? '<#' + tok.canal_logs_id + '>' : 'N/A'),
                        inline: false
                    },
                    {
                        name: '⚔️ 3. Itens (`itens.json`)',
                        value: '• **Itens:** ' + (itn.itens ? itn.itens.length : 0) + ' cadastrados\n' +
                               '• **Categoria:** ' + (itn.categoria_id ? '<#' + itn.categoria_id + '>' : 'N/A') + '\n' +
                               '• **Logs:** ' + (itn.canal_logs_id ? '<#' + itn.canal_logs_id + '>' : 'N/A'),
                        inline: false
                    }
                );

            return message.reply({ embeds: [embed] });
        }

        // 2. k!config painel <suporte|tokens|itens>
        if (sub === 'painel') {
            const tipo = (args[1] || '').toLowerCase();
            let payload;
            if (tipo === 'suporte') payload = gerarPainelSuportePayload();
            else if (tipo === 'tokens') payload = gerarPainelTokensPayload();
            else if (tipo === 'itens') payload = gerarPainelItensPayload();
            else {
                return message.reply({
                    embeds: [criarEmbedErro('Tipo Inválido', 'Especifique o painel: `k!config painel <suporte|tokens|itens>`')]
                });
            }

            const msgEnviada = await message.channel.send(payload);
            if (tipo === 'suporte') setSuporteConfig({ canal_painel_id: message.channel.id, mensagem_painel_id: msgEnviada.id });
            if (tipo === 'tokens') setTokensConfig({ canal_painel_id: message.channel.id, mensagem_painel_id: msgEnviada.id });
            if (tipo === 'itens') setItensConfig({ canal_painel_id: message.channel.id, mensagem_painel_id: msgEnviada.id });

            return message.reply({
                embeds: [criarEmbedSucesso('Painel Enviado', 'O **Painel de ' + tipo.toUpperCase() + '** foi enviado com sucesso!')]
            });
        }

        // 3. k!config suporte [categoriaId] [logsId] [cargoId]
        if (sub === 'suporte') {
            const catId = args[1]?.replace(/[^0-9]/g, '') || null;
            const logId = args[2]?.replace(/[^0-9]/g, '') || null;
            const rolId = args[3]?.replace(/[^0-9]/g, '') || null;

            const updates = {};
            if (catId) updates.categoria_id = catId;
            if (logId) updates.canal_logs_id = logId;
            if (rolId) updates.cargo_staff_id = rolId;

            const updated = setSuporteConfig(updates);
            return message.reply({
                embeds: [criarEmbedSucesso(
                    'Suporte Atualizado',
                    'Configurações de Suporte salvas em `data/configs/suporte.json`!\n\n' +
                    '• Categoria: ' + (updated.categoria_id ? '<#' + updated.categoria_id + '>' : 'N/A') + '\n' +
                    '• Logs: ' + (updated.canal_logs_id ? '<#' + updated.canal_logs_id + '>' : 'N/A') + '\n' +
                    '• Staff: ' + (updated.cargo_staff_id ? '<@&' + updated.cargo_staff_id + '>' : 'N/A')
                )]
            });
        }

        // 4. k!config tokens [preco1k] [chavePix] [categoriaId] [logsId]
        if (sub === 'tokens') {
            const preco = parseFloat(args[1]?.replace(',', '.'));
            const pix = args[2] || null;
            const catId = args[3]?.replace(/[^0-9]/g, '') || null;
            const logId = args[4]?.replace(/[^0-9]/g, '') || null;

            const updates = {};
            if (!isNaN(preco) && preco > 0) updates.preco_por_1k = preco;
            if (pix) updates.chave_pix = pix;
            if (catId) updates.categoria_id = catId;
            if (logId) updates.canal_logs_id = logId;

            const updated = setTokensConfig(updates);
            return message.reply({
                embeds: [criarEmbedSucesso(
                    'Tokens Atualizado',
                    'Configurações de Tokens salvas em `data/configs/tokens.json`!\n\n' +
                    '• Preço 1k: R$ ' + Number(updated.preco_por_1k).toFixed(2).replace('.', ',') + '\n' +
                    '• Chave Pix: `' + updated.chave_pix + '`\n' +
                    '• Categoria: ' + (updated.categoria_id ? '<#' + updated.categoria_id + '>' : 'N/A') + '\n' +
                    '• Logs: ' + (updated.canal_logs_id ? '<#' + updated.canal_logs_id + '>' : 'N/A')
                )]
            });
        }

        // 5. k!config itens [categoriaId] [logsId] [cargoId]
        if (sub === 'itens') {
            const catId = args[1]?.replace(/[^0-9]/g, '') || null;
            const logId = args[2]?.replace(/[^0-9]/g, '') || null;
            const rolId = args[3]?.replace(/[^0-9]/g, '') || null;

            const updates = {};
            if (catId) updates.categoria_id = catId;
            if (logId) updates.canal_logs_id = logId;
            if (rolId) updates.cargo_staff_id = rolId;

            const updated = setItensConfig(updates);
            return message.reply({
                embeds: [criarEmbedSucesso(
                    'Itens Atualizado',
                    'Configurações de Itens salvas em `data/configs/itens.json`!\n\n' +
                    '• Categoria: ' + (updated.categoria_id ? '<#' + updated.categoria_id + '>' : 'N/A') + '\n' +
                    '• Logs: ' + (updated.canal_logs_id ? '<#' + updated.canal_logs_id + '>' : 'N/A') + '\n' +
                    '• Staff: ' + (updated.cargo_staff_id ? '<@&' + updated.cargo_staff_id + '>' : 'N/A')
                )]
            });
        }

        return message.reply({
            embeds: [criarEmbedErro('Subcomando Desconhecido', 'Use `k!config` para ver as opções disponíveis.')]
        });
    }
};
