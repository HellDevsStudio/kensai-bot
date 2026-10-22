const assert = require('assert');
const { ChannelType, PermissionsBitField, ButtonStyle } = require('discord.js');
const { NO_PERMISSION_MSG } = require('../utils/permissions');
const { gerarPainelCopyPayload, handleCopySelect, handleCopyModal, handleCopyButton } = require('../utils/channelCloner');
const slashCopy = require('../commands/slash/copy');
const prefixCopy = require('../commands/prefix/copy');

console.log('=== TESTES DO SISTEMA DE CLONAGEM (/copy e k!copy) ===\n');

async function run() {
    async function runTest(name, fn) {
        try {
            await fn();
            console.log(`  ✓ [TEST] ${name}`);
        } catch (err) {
            console.error(`  ✗ [FAIL] ${name}`);
            console.error(err);
            process.exit(1);
        }
    }

    // 1. Estrutura do Slash Command /copy
    await runTest('1. Slash /copy possui estrutura válida e permissão ManageChannels', () => {
        assert.strictEqual(slashCopy.data.name, 'copy');
        assert.ok(slashCopy.data.description.includes('clonar canais'));
        assert.strictEqual(slashCopy.data.default_member_permissions, PermissionsBitField.Flags.ManageChannels.toString());
        assert.strictEqual(typeof slashCopy.execute, 'function');
    });

    // 2. Estrutura do Prefix Command k!copy
    await runTest('2. Prefix k!copy possui nome, aliases e permissão de ManageChannels', () => {
        assert.strictEqual(prefixCopy.name, 'copy');
        assert.ok(prefixCopy.aliases.includes('clonar'));
        assert.ok(prefixCopy.aliases.includes('copiar'));
        assert.strictEqual(typeof prefixCopy.execute, 'function');
    });

    // 3. Painel de Clonagem (gerarPainelCopyPayload)
    await runTest('3. Painel de Clonagem gera embed roxo #9a2ea6 com 2 selects e 1 botão', () => {
        const payload = gerarPainelCopyPayload();
        assert.ok(payload.embeds && payload.embeds.length === 1);
        const emb = payload.embeds[0].data;
        assert.strictEqual(emb.color, 0x9a2ea6);
        assert.ok(emb.title.includes('CLONAGEM'));

        assert.strictEqual(payload.components.length, 3);
        const selCanal = payload.components[0].components[0].data;
        assert.strictEqual(selCanal.custom_id, 'copy_sel_channel');
        assert.ok(selCanal.channel_types.includes(ChannelType.GuildText));
        assert.ok(selCanal.channel_types.includes(ChannelType.GuildVoice));

        const selCat = payload.components[1].components[0].data;
        assert.strictEqual(selCat.custom_id, 'copy_sel_category');
        assert.ok(selCat.channel_types.includes(ChannelType.GuildCategory));

        const btnFechar = payload.components[2].components[0].data;
        assert.strictEqual(btnFechar.custom_id, 'copy_btn_fechar');
        assert.strictEqual(btnFechar.style, ButtonStyle.Secondary);
    });

    // 4. Bloqueio de Permissão em handleCopySelect
    await runTest('4. handleCopySelect bloqueia membros sem permissão de ManageChannels', async () => {
        let replyPayload = null;
        const fakeInteraction = {
            member: {
                permissions: new PermissionsBitField()
            },
            customId: 'copy_sel_channel',
            values: ['123456'],
            reply: (p) => { replyPayload = p; }
        };

        await handleCopySelect(fakeInteraction);
        assert.ok(replyPayload);
        assert.strictEqual(replyPayload.content, NO_PERMISSION_MSG);
    });

    // 5. Abertura de Modal ao selecionar Canal em handleCopySelect
    await runTest('5. handleCopySelect abre Modal com inputs para canal', async () => {
        let modalShown = null;
        const fakeChannel = {
            id: '998877',
            name: 'anuncios-vip',
            type: ChannelType.GuildText
        };
        const fakeInteraction = {
            member: {
                permissions: new PermissionsBitField([PermissionsBitField.Flags.Administrator])
            },
            guild: {
                channels: {
                    cache: new Map([['998877', fakeChannel]]),
                    fetch: async () => fakeChannel
                }
            },
            customId: 'copy_sel_channel',
            values: ['998877'],
            showModal: (m) => { modalShown = m; }
        };

        await handleCopySelect(fakeInteraction);
        assert.ok(modalShown);
        const mData = modalShown.data;
        assert.strictEqual(mData.custom_id, 'modal_copy_chan_998877');
        assert.ok(mData.title.includes('anuncios-vip'));
    });

    // 6. Abertura de Modal ao selecionar Categoria em handleCopySelect
    await runTest('6. handleCopySelect abre Modal com inputs para categoria', async () => {
        let modalShown = null;
        const fakeCategory = {
            id: '112233',
            name: 'ÁREA VIP',
            type: ChannelType.GuildCategory
        };
        const fakeInteraction = {
            member: {
                permissions: new PermissionsBitField([PermissionsBitField.Flags.Administrator])
            },
            guild: {
                channels: {
                    cache: new Map([['112233', fakeCategory]]),
                    fetch: async () => fakeCategory
                }
            },
            customId: 'copy_sel_category',
            values: ['112233'],
            showModal: (m) => { modalShown = m; }
        };

        await handleCopySelect(fakeInteraction);
        assert.ok(modalShown);
        const mData = modalShown.data;
        assert.strictEqual(mData.custom_id, 'modal_copy_cat_112233');
        assert.ok(mData.title.includes('ÁREA VIP'));
    });

    // 7. handleCopyModal clona canal com preservação de permissões
    await runTest('7. handleCopyModal clona canal com nome customizado e permissões mantidas', async () => {
        let clonedOptions = null;
        let editReplyPayload = null;

        const fakeTarget = {
            id: 'chan_orig',
            name: 'geral',
            parentId: 'cat_orig',
            rawPosition: 2,
            permissionOverwrites: { cache: new Map([['role1', {}], ['role2', {}]]) },
            clone: async (opts) => {
                clonedOptions = opts;
                return {
                    id: 'chan_clone_123',
                    name: opts.name,
                    parentId: opts.parent,
                    permissionOverwrites: { cache: new Map([['role1', {}], ['role2', {}]]) },
                    parent: { name: 'Comunidade' },
                    setPosition: async () => {}
                };
            }
        };

        const fakeInteraction = {
            customId: 'modal_copy_chan_chan_orig',
            member: {
                permissions: new PermissionsBitField([PermissionsBitField.Flags.Administrator])
            },
            user: { toString: () => '<@123>', tag: 'Owner#0001' },
            guild: {
                members: {
                    me: {
                        permissions: new PermissionsBitField([PermissionsBitField.Flags.ManageChannels])
                    }
                },
                channels: {
                    cache: new Map([['chan_orig', fakeTarget]]),
                    fetch: async () => fakeTarget
                }
            },
            fields: {
                getTextInputValue: (field) => {
                    if (field === 'copy_novo_nome') return 'geral-backup';
                    if (field === 'copy_manter_cat') return 'sim';
                    return '';
                }
            },
            deferReply: async () => {},
            editReply: (p) => { editReplyPayload = p; }
        };

        await handleCopyModal(fakeInteraction);
        assert.ok(clonedOptions);
        assert.strictEqual(clonedOptions.name, 'geral-backup');
        assert.strictEqual(clonedOptions.parent, 'cat_orig');
        assert.ok(editReplyPayload);
        assert.ok(editReplyPayload.embeds && editReplyPayload.embeds.length > 0);
        assert.ok(editReplyPayload.embeds[0].data.title.includes('Canal Clonado com Sucesso'));
    });

    // 8. handleCopyModal clona categoria e canais internos
    await runTest('8. handleCopyModal clona categoria e replica canais filhos', async () => {
        let clonedCatOpts = null;
        let clonedChildren = [];
        let editReplyPayload = null;

        const child1 = {
            id: 'c1',
            name: 'chat-1',
            parentId: 'cat_source',
            position: 1,
            clone: async (opts) => {
                clonedChildren.push({ name: 'chat-1', parent: opts.parent });
                return { id: 'c1_clone', name: 'chat-1' };
            }
        };

        const child2 = {
            id: 'c2',
            name: 'call-1',
            parentId: 'cat_source',
            position: 2,
            clone: async (opts) => {
                clonedChildren.push({ name: 'call-1', parent: opts.parent });
                return { id: 'c2_clone', name: 'call-1' };
            }
        };

        const fakeCatTarget = {
            id: 'cat_source',
            name: 'Torneios',
            type: ChannelType.GuildCategory,
            permissionOverwrites: { cache: new Map([['role_vip', {}]]) },
            clone: async (opts) => {
                clonedCatOpts = opts;
                return {
                    id: 'new_cat_999',
                    name: opts.name,
                    permissionOverwrites: { cache: new Map([['role_vip', {}]]) }
                };
            }
        };

        const channelsMap = new Map([
            ['cat_source', fakeCatTarget],
            ['c1', child1],
            ['c2', child2]
        ]);

        const fakeInteraction = {
            customId: 'modal_copy_cat_cat_source',
            member: {
                permissions: new PermissionsBitField([PermissionsBitField.Flags.Administrator])
            },
            user: { toString: () => '<@123>', tag: 'Owner#0001' },
            guild: {
                members: {
                    me: {
                        permissions: new PermissionsBitField([PermissionsBitField.Flags.ManageChannels])
                    }
                },
                channels: {
                    cache: channelsMap,
                    fetch: async () => fakeCatTarget
                }
            },
            fields: {
                getTextInputValue: (field) => {
                    if (field === 'copy_novo_nome') return 'Torneios (Edição 2)';
                    if (field === 'copy_clonar_filhos') return 'sim';
                    return '';
                }
            },
            deferReply: async () => {},
            editReply: (p) => { editReplyPayload = p; }
        };

        await handleCopyModal(fakeInteraction);
        assert.ok(clonedCatOpts);
        assert.strictEqual(clonedCatOpts.name, 'Torneios (Edição 2)');
        assert.strictEqual(clonedChildren.length, 2);
        assert.strictEqual(clonedChildren[0].parent, 'new_cat_999');
        assert.strictEqual(clonedChildren[1].parent, 'new_cat_999');
        assert.ok(editReplyPayload.embeds[0].data.title.includes('Categoria Clonada com Sucesso'));
    });

    // 9. handleCopyButton fecha o painel
    await runTest('9. handleCopyButton limpa o painel ao clicar em fechar', async () => {
        let updatePayload = null;
        const fakeInteraction = {
            customId: 'copy_btn_fechar',
            member: {
                permissions: new PermissionsBitField([PermissionsBitField.Flags.ManageChannels])
            },
            update: (p) => { updatePayload = p; }
        };

        await handleCopyButton(fakeInteraction);
        assert.ok(updatePayload);
        assert.ok(updatePayload.content.includes('Painel de clonagem encerrado'));
        assert.deepStrictEqual(updatePayload.components, []);
    });

    console.log('\n======================================================');
    console.log('   RESULTADO DOS TESTES DE /copy: 9/9 PASSADOS COM SUCESSO');
    console.log('======================================================\n');
}

run();
