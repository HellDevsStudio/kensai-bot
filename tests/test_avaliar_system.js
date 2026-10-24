const assert = require('assert');
const path = require('path');
const fs = require('fs');

const root = 'C:\\Users\\kaleb\\Downloads\\HellDevs Bots\\kensai-bot';
const avaliarCore = require(path.join(root, 'utils/avaliarCore'));
const slashAvaliar = require(path.join(root, 'commands/slash/avaliar'));
const prefixAvaliar = require(path.join(root, 'commands/prefix/avaliar'));

async function testAvaliarSystem() {
    console.log('🧪 Iniciando Testes do Sistema de Avaliação (Feedback) - Kensai Store');

    // 1. Identificação de partes no ticket
    console.log('1. Testando identificação de cliente e staff no ticket...');
    const partes = avaliarCore.identificarPartesTicket('1563292609013882943', null, { id: '1447683390261166352' });
    console.log('  Partes identificadas:', partes);
    assert.strictEqual(partes.clienteId, '481153760865812482');

    // 2. Painel de Avaliação
    console.log('2. Testando geração do painel de avaliação (botão Avalie Aqui)...');
    const painel = avaliarCore.gerarPainelAvaliacaoPayload({
        staffId: '1447683390261166352',
        clienteId: '481153760865812482',
        guild: null
    });
    assert.ok(painel.embeds && painel.embeds.length === 1);
    assert.ok(painel.components && painel.components.length === 1);
    const btn = painel.components[0].components[0];
    assert.strictEqual(btn.data.label, 'Avalie Aqui');
    assert.ok(btn.data.custom_id.startsWith('btn_avaliar_'));
    console.log('  Painel e botão gerados com sucesso!');

    // 3. Bloqueio de auto-avaliação do staff
    console.log('3. Testando bloqueio quando o próprio atendente tenta clicar no botão...');
    let replyMsg = null;
    const mockStaffClick = {
        customId: btn.data.custom_id,
        user: { id: '1447683390261166352' }, // O próprio staff
        reply: async (obj) => { replyMsg = obj.content; }
    };
    await avaliarCore.handleAvaliarButton(mockStaffClick);
    assert.ok(replyMsg && replyMsg.includes('não pode avaliar o seu próprio atendimento'));
    console.log('  Auto-avaliação bloqueada com sucesso!');

    // 4. Abertura de Modal para o cliente
    console.log('4. Testando abertura do Modal para o cliente...');
    let modalAberto = null;
    const mockClienteClick = {
        customId: btn.data.custom_id,
        user: { id: '481153760865812482' }, // O cliente
        showModal: async (m) => { modalAberto = m; }
    };
    await avaliarCore.handleAvaliarButton(mockClienteClick);
    assert.ok(modalAberto !== null);
    assert.strictEqual(modalAberto.data.title, 'Avaliação de Atendimento');
    assert.strictEqual(modalAberto.components.length, 2);
    console.log('  Modal montado e aberto com sucesso para o cliente!');

    // 5. Envio do Modal (handleAvaliarModal)
    console.log('5. Testando submissão do Modal e geração do embed idêntico ao print...');
    let channelSent = null;
    let feedbackSent = null;
    let replyModal = null;
    let messageEdited = null;

    const mockFeedbackChannel = {
        send: async (obj) => { feedbackSent = obj; }
    };

    const mockGuild = {
        channels: {
            cache: {
                get: (id) => (id === '1560093479458177154' ? mockFeedbackChannel : null)
            },
            fetch: async (id) => (id === '1560093479458177154' ? mockFeedbackChannel : null)
        }
    };

    const mockModalSubmit = {
        customId: 'modal_avaliar_1447683390261166352',
        guild: mockGuild,
        user: {
            id: '481153760865812482',
            tag: 'kcosmo',
            displayAvatarURL: () => 'https://cdn.discordapp.com/avatars/481153760865812482/avatar.png'
        },
        fields: {
            getTextInputValue: (fieldId) => {
                if (fieldId === 'input_nota') return '5';
                if (fieldId === 'input_comentario') return 'muito bom';
                return '';
            }
        },
        channel: {
            send: async (obj) => { channelSent = obj; }
        },
        message: {
            edit: async (obj) => { messageEdited = obj; }
        },
        reply: async (obj) => { replyModal = obj; }
    };

    await avaliarCore.handleAvaliarModal(mockModalSubmit);

    // Validações no canal do ticket
    assert.ok(channelSent !== null, 'Embed deve ser enviado no canal do ticket');
    const embedTicket = channelSent.embeds[0].data;
    assert.strictEqual(embedTicket.title, '🌟 Nova Avaliação de Atendimento!');
    assert.strictEqual(embedTicket.fields[0].name, '👤 Cliente');
    assert.strictEqual(embedTicket.fields[0].value, '<@481153760865812482>');
    assert.strictEqual(embedTicket.fields[1].name, '🛡️ Atendente / Vendedor');
    assert.strictEqual(embedTicket.fields[1].value, '<@1447683390261166352>');
    assert.strictEqual(embedTicket.fields[2].name, '⭐ Nota');
    assert.strictEqual(embedTicket.fields[2].value, '⭐⭐⭐⭐⭐ (5/5)');
    assert.strictEqual(embedTicket.fields[3].name, '💬 Depoimento');
    assert.strictEqual(embedTicket.fields[3].value, '> muito bom');
    assert.strictEqual(embedTicket.footer.text, 'Kensai Store — Transparência e Confiança');

    // Validação no canal de feedback 1560093479458177154
    assert.ok(feedbackSent !== null, 'Embed deve ser enviado no canal de feedback 1560093479458177154');
    assert.strictEqual(feedbackSent.embeds[0].data.title, '🌟 Nova Avaliação de Atendimento!');

    // Validação de desativação do botão
    assert.ok(messageEdited !== null, 'Mensagem original deve ter o botão desativado');
    assert.strictEqual(messageEdited.components[0].components[0].data.disabled, true);

    console.log('  Embed idêntico ao print enviado no ticket e no canal de feedback 1560093479458177154!');

    // 6. Teste da estrutura dos comandos
    console.log('6. Testando estruturas dos comandos Slash e Prefixo...');
    assert.strictEqual(slashAvaliar.data.name, 'avaliar');
    assert.strictEqual(prefixAvaliar.name, 'avaliar');
    assert.ok(prefixAvaliar.aliases.includes('feedback'));

    console.log('\n🎉 TODOS OS TESTES DO SISTEMA DE AVALIAÇÃO PASSARAM COM 100% DE SUCESSO!');
}

testAvaliarSystem().catch(err => {
    console.error('❌ Falha nos testes:', err);
    process.exit(1);
});
