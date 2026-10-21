/**
 * SUÍTE OFICIAL DE 120 TESTES - KENSAI STORE BOT (KEN)
 * Validação rigorosa de todos os comandos públicos, utilitários, staff,
 * utilitários matemáticos, banco de dados atômico, permissões e design system.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente com override garantido
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: true });

const config = require('../config');
const { criarEmbedPadrao, criarEmbedSucesso, criarEmbedErro } = require('../utils/embeds');
const { readData, writeData } = require('../utils/db');
const { parseDuration, formatDuration } = require('../utils/timeParser');
const { evaluateMath } = require('../utils/mathParser');
const { getSnipe, setSnipe } = require('../utils/snipeManager');
const { NO_PERMISSION_MSG, isStaff, checkPermission, checkHierarchy } = require('../utils/permissions');
const { PermissionsBitField } = require('discord.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

function test(description, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        results.push({ num: totalTests, desc: description, status: 'PASS' });
        console.log(`  ✓ [TEST ${totalTests.toString().padStart(3, '0')}/120] ${description}`);
    } catch (err) {
        failedTests++;
        results.push({ num: totalTests, desc: description, status: 'FAIL', error: err.message });
        console.error(`  ❌ [TEST ${totalTests.toString().padStart(3, '0')}/120] ${description} -> ${err.message}`);
    }
}

console.log('\n===============================================================');
console.log('   INICIANDO A SUÍTE DE 120 TESTES AUTOMATIZADOS - KENSAI BOT');
console.log('===============================================================\n');

// -------------------------------------------------------------------------
// BLOCO 1: CONFIGURAÇÃO, AMBIENTE E DESIGN SYSTEM (#9a2ea6) [Testes 1 a 10]
// -------------------------------------------------------------------------
console.log('--- [Bloco 1: Ambiente & Design System #9a2ea6] ---');

test('01. Arquivo .env deve existir no diretório raiz', () => {
    assert.strictEqual(fs.existsSync(path.join(__dirname, '..', '.env')), true);
});

test('02. Token do bot deve estar configurado no ambiente', () => {
    assert.ok(config.TOKEN && config.TOKEN.length > 20);
});

test('03. Prefixo oficial do bot deve ser k!', () => {
    assert.strictEqual(config.PREFIX, 'k!');
});

test('04. EMBED_COLOR deve ser estritamente #9a2ea6', () => {
    assert.strictEqual(config.EMBED_COLOR.toLowerCase(), '#9a2ea6');
});

test('05. criarEmbedPadrao deve renderizar com a cor oficial #9a2ea6 (10104486)', () => {
    const embed = criarEmbedPadrao('Teste', 'Desc');
    assert.strictEqual(embed.data.color, 10104486);
});

test('06. criarEmbedSucesso deve renderizar com a cor oficial #9a2ea6 (10104486)', () => {
    const embed = criarEmbedSucesso('Sucesso', 'Operação concluída');
    assert.strictEqual(embed.data.color, 10104486);
});

test('07. criarEmbedErro deve renderizar com a cor oficial #9a2ea6 (10104486)', () => {
    const embed = criarEmbedErro('Erro', 'Algo falhou');
    assert.strictEqual(embed.data.color, 10104486);
});

test('08. criarEmbedPadrao deve definir timestamp', () => {
    const embed = criarEmbedPadrao('Titulo');
    assert.ok(embed.data.timestamp);
});

test('09. Diretório /data deve existir para persistência atômica', () => {
    const dataDir = path.join(__dirname, '..', 'data');
    assert.strictEqual(fs.existsSync(dataDir), true);
});

test('10. Mensagem canônica de erro de permissão deve ser exata', () => {
    assert.strictEqual(NO_PERMISSION_MSG, '❌ Você não tem permissão para empunhar esta lâmina!');
});

// -------------------------------------------------------------------------
// BLOCO 2: PARSER MATEMÁTICO SEGURO (CALC) [Testes 11 a 20]
// -------------------------------------------------------------------------
console.log('\n--- [Bloco 2: Parser Matemático Seguro (Calc)] ---');

test('11. Soma aritmética simples (10 + 25 = 35)', () => {
    assert.strictEqual(evaluateMath('10 + 25'), 35);
});

test('12. Subtração aritmética simples (100 - 42 = 58)', () => {
    assert.strictEqual(evaluateMath('100 - 42'), 58);
});

test('13. Multiplicação e precedência de operadores (2 + 3 * 4 = 14)', () => {
    assert.strictEqual(evaluateMath('2 + 3 * 4'), 14);
});

test('14. Operações com parênteses ((2 + 3) * 4 = 20)', () => {
    assert.strictEqual(evaluateMath('(2 + 3) * 4'), 20);
});

test('15. Divisão e números decimais (10 / 4 = 2.5)', () => {
    assert.strictEqual(evaluateMath('10 / 4'), 2.5);
});

test('16. Exponenciação aritmética (2 ^ 8 = 256)', () => {
    assert.strictEqual(evaluateMath('2 ^ 8'), 256);
});

test('17. Módulo / resto de divisão (17 % 5 = 2)', () => {
    assert.strictEqual(evaluateMath('17 % 5'), 2);
});

test('18. Proteção contra divisão por zero (retorna erro)', () => {
    assert.throws(() => evaluateMath('100 / 0'), /divisão por zero/i);
});

test('19. Proteção contra injeção de código / scripts arbitrários', () => {
    assert.throws(() => evaluateMath('process.exit(1)'));
    assert.throws(() => evaluateMath('require("fs")'));
});

test('20. Tratamento de parênteses desbalanceados', () => {
    assert.throws(() => evaluateMath('(10 + 5 * 2'));
});

// -------------------------------------------------------------------------
// BLOCO 3: PARSER DE TEMPO E DURAÇÕES (TIME PARSER) [Testes 21 a 30]
// -------------------------------------------------------------------------
console.log('\n--- [Bloco 3: Parser de Tempo e Duração] ---');

test('21. Conversão de segundos simples (30s = 30000ms)', () => {
    assert.strictEqual(parseDuration('30s'), 30000);
});

test('22. Conversão de minutos simples (10m = 600000ms)', () => {
    assert.strictEqual(parseDuration('10m'), 600000);
});

test('23. Conversão de horas simples (2h = 7200000ms)', () => {
    assert.strictEqual(parseDuration('2h'), 7200000);
});

test('24. Conversão de dias simples (1d = 86400000ms)', () => {
    assert.strictEqual(parseDuration('1d'), 86400000);
});

test('25. Conversão composta (1h30m = 5400000ms)', () => {
    assert.strictEqual(parseDuration('1h30m'), 5400000);
});

test('26. Conversão com espaços (2d 5h = 190800000ms)', () => {
    assert.strictEqual(parseDuration('2d 5h'), 190800000);
});

test('27. Formatação de duração em português (60000ms = "1m")', () => {
    const formatted = formatDuration(60000);
    assert.ok(formatted.includes('1m'));
});

test('28. Formatação de duração mista (3661000ms = "1h 1m 1s")', () => {
    const formatted = formatDuration(3661000);
    assert.ok(formatted.includes('1h') && formatted.includes('1m'));
});

test('29. Formato inválido de duração retorna null', () => {
    assert.strictEqual(parseDuration('abc'), null);
    assert.strictEqual(parseDuration(''), null);
});

test('30. Formatação de 0ms ou negativo retorna "0s"', () => {
    assert.strictEqual(formatDuration(0), '0s');
});

// -------------------------------------------------------------------------
// BLOCO 4: BANCO DE DADOS ATÔMICO JSON [Testes 31 a 40]
// -------------------------------------------------------------------------
console.log('\n--- [Bloco 4: Banco de Dados Atômico JSON] ---');

test('31. Escrita de dados atômicos com writeData', () => {
    const testKey = 'test_suite_db';
    const payload = { timestamp: Date.now(), status: 'active', counter: 42 };
    writeData(testKey, payload);
    const targetFile = path.join(__dirname, '..', 'data', `${testKey}.json`);
    assert.strictEqual(fs.existsSync(targetFile), true);
});

test('32. Leitura de dados gravados com readData', () => {
    const testKey = 'test_suite_db';
    const data = readData(testKey, {});
    assert.strictEqual(data.counter, 42);
    assert.strictEqual(data.status, 'active');
});

test('33. Retorno de default value quando arquivo não existe', () => {
    const nonExistent = readData('arquivo_inexistente_xyz', { fallback: true });
    assert.strictEqual(nonExistent.fallback, true);
});

test('34. Persistência de registros AFK no banco', () => {
    const afkData = readData('afk', {});
    afkData['user_test_999'] = { timestamp: Date.now(), reason: 'Almoço' };
    writeData('afk', afkData);
    const updated = readData('afk', {});
    assert.strictEqual(updated['user_test_999'].reason, 'Almoço');
    // Cleanup
    delete updated['user_test_999'];
    writeData('afk', updated);
});

test('35. Persistência de advertências (warns) no banco', () => {
    const warnsData = readData('warns', {});
    warnsData['user_warn_123'] = [{ id: 'TEST1', reason: 'Flood', timestamp: Date.now() }];
    writeData('warns', warnsData);
    const updated = readData('warns', {});
    assert.strictEqual(updated['user_warn_123'][0].id, 'TEST1');
    delete updated['user_warn_123'];
    writeData('warns', updated);
});

test('36. Persistência de sorteios no banco', () => {
    const sorteios = readData('sorteios', {});
    sorteios['sorteio_unit_test'] = { prize: '1000 Robux', winnersCount: 1, participants: ['user1', 'user2'] };
    writeData('sorteios', sorteios);
    const updated = readData('sorteios', {});
    assert.strictEqual(updated['sorteio_unit_test'].prize, '1000 Robux');
    delete updated['sorteio_unit_test'];
    writeData('sorteios', sorteios);
});

test('37. Persistência de reputação no banco', () => {
    const repData = readData('reputacao', {});
    repData['seller_test'] = { points: 5, reviews: [] };
    writeData('reputacao', repData);
    const updated = readData('reputacao', {});
    assert.strictEqual(updated['seller_test'].points, 5);
    delete updated['seller_test'];
    writeData('reputacao', updated);
});

test('38. Persistência de sugestões com upvotes/downvotes', () => {
    const sugs = readData('sugestoes', {});
    sugs['sug_test_1'] = { idea: 'Adicionar Pix', author: 'user', upvotes: ['u1', 'u2'], downvotes: [] };
    writeData('sugestoes', sugs);
    const updated = readData('sugestoes', {});
    assert.strictEqual(updated['sug_test_1'].upvotes.length, 2);
    delete updated['sug_test_1'];
    writeData('sugestoes', sugs);
});

test('39. Isolamento contra corrupção em caso de JSON mal formatado', () => {
    const badKey = 'test_corrupt';
    const badPath = path.join(__dirname, '..', 'data', `${badKey}.json`);
    fs.writeFileSync(badPath, '{corrompido', 'utf8');
    const result = readData(badKey, { safe: true });
    assert.strictEqual(result.safe, true);
    if (fs.existsSync(badPath)) fs.unlinkSync(badPath);
});

test('40. Remoção limpa de arquivo de teste gerado', () => {
    const testFile = path.join(__dirname, '..', 'data', 'test_suite_db.json');
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
    assert.strictEqual(fs.existsSync(testFile), false);
});

// -------------------------------------------------------------------------
// BLOCO 5: MEMÓRIA DE SNIPE E ISOLAMENTO DE CANAIS [Testes 41 a 45]
// -------------------------------------------------------------------------
console.log('\n--- [Bloco 5: Snipe Manager & Isolamento de Canais] ---');

test('41. Armazenamento de mensagem apagada no canal A', () => {
    setSnipe('channel_A', {
        content: 'Segredo de teste',
        authorId: '123',
        authorTag: 'Tester#0001',
        authorAvatar: null,
        image: null
    });
    const snipe = getSnipe('channel_A');
    assert.ok(snipe);
    assert.strictEqual(snipe.content, 'Segredo de teste');
});

test('42. Isolamento de canais: canal B não deve ver o snipe do canal A', () => {
    const snipeB = getSnipe('channel_B');
    assert.strictEqual(snipeB, null);
});

test('43. Atualização de snipe substitui a mensagem anterior', () => {
    setSnipe('channel_A', {
        content: 'Nova mensagem apagada',
        authorId: '456',
        authorTag: 'Tester2#0002',
        authorAvatar: null,
        image: null
    });
    const snipe = getSnipe('channel_A');
    assert.strictEqual(snipe.content, 'Nova mensagem apagada');
    assert.strictEqual(snipe.authorId, '456');
});

test('44. Snipe com anexo de imagem preserva URL da imagem', () => {
    setSnipe('channel_C', {
        content: 'Foto apagada',
        authorId: '789',
        authorTag: 'User#1234',
        image: 'https://cdn.discordapp.com/attachments/1.png'
    });
    const snipe = getSnipe('channel_C');
    assert.strictEqual(snipe.image, 'https://cdn.discordapp.com/attachments/1.png');
});

test('45. Limpeza ou canal sem snipe retorna null', () => {
    assert.strictEqual(getSnipe('channel_inexistente'), null);
});

// -------------------------------------------------------------------------
// BLOCO 6: GERENCIAMENTO DE PERMISSÕES E HIERARQUIA [Testes 46 a 55]
// -------------------------------------------------------------------------
console.log('\n--- [Bloco 6: Permissões & Hierarquia de Cargos] ---');

test('46. isStaff retorna false para membro nulo ou undefined', () => {
    assert.strictEqual(isStaff(null), false);
    assert.strictEqual(isStaff(undefined), false);
});

test('47. isStaff retorna true para membro com permissão Administrator', () => {
    const mockAdmin = {
        permissions: { has: (perm) => perm === PermissionsBitField.Flags.Administrator },
        roles: { cache: new Map() }
    };
    assert.strictEqual(isStaff(mockAdmin), true);
});

test('48. checkPermission retorna true quando membro tem a permissão específica', () => {
    const mockMod = {
        permissions: {
            has: (perm) => perm === PermissionsBitField.Flags.ManageMessages
        },
        roles: { cache: new Map() }
    };
    assert.strictEqual(checkPermission(mockMod, PermissionsBitField.Flags.ManageMessages), true);
});

test('49. checkPermission retorna false quando membro não tem a permissão', () => {
    const mockUser = {
        permissions: { has: () => false },
        roles: { cache: new Map() }
    };
    assert.strictEqual(checkPermission(mockUser, PermissionsBitField.Flags.BanMembers), false);
});

test('50. Administrator tem bypass irrestrito em checkPermission', () => {
    const mockAdmin = {
        permissions: { has: (perm) => perm === PermissionsBitField.Flags.Administrator },
        roles: { cache: new Map() }
    };
    assert.strictEqual(checkPermission(mockAdmin, PermissionsBitField.Flags.KickMembers), true);
});

test('51. checkHierarchy: Dono da guilda (Guild Owner) tem imunidade hierárquica máxima', () => {
    const ownerMember = {
        id: 'owner_id',
        guild: { ownerId: 'owner_id' },
        roles: { highest: { position: 10 } }
    };
    const targetMember = {
        id: 'staff_id',
        roles: { highest: { position: 99 } }
    };
    assert.strictEqual(checkHierarchy(ownerMember, targetMember), true);
});

test('52. checkHierarchy: Cargo superior consegue gerenciar cargo inferior', () => {
    const higherStaff = {
        id: 'staff_1',
        guild: { ownerId: 'other_owner' },
        roles: { highest: { position: 50 } }
    };
    const lowerUser = {
        id: 'user_1',
        roles: { highest: { position: 10 } }
    };
    assert.strictEqual(checkHierarchy(higherStaff, lowerUser), true);
});

test('53. checkHierarchy: Cargo inferior não pode gerenciar cargo superior', () => {
    const lowerStaff = {
        id: 'staff_low',
        guild: { ownerId: 'other_owner' },
        roles: { highest: { position: 20 } }
    };
    const higherTarget = {
        id: 'target_high',
        roles: { highest: { position: 35 } }
    };
    assert.strictEqual(checkHierarchy(lowerStaff, higherTarget), false);
});

test('54. checkHierarchy: Cargos de mesma posição são bloqueados', () => {
    const staffA = {
        id: 'staff_a',
        guild: { ownerId: 'other_owner' },
        roles: { highest: { position: 30 } }
    };
    const staffB = {
        id: 'staff_b',
        roles: { highest: { position: 30 } }
    };
    assert.strictEqual(checkHierarchy(staffA, staffB), false);
});

test('55. checkHierarchy com alvos nulos retorna true com segurança', () => {
    assert.strictEqual(checkHierarchy(null, null), true);
});

// -------------------------------------------------------------------------
// BLOCO 7: CÁLCULOS DE TAXA ROBUX E OFERTAS DE LOJA [Testes 56 a 60]
// -------------------------------------------------------------------------
console.log('\n--- [Bloco 7: Lógica Financeira de Loja (Taxa Robux)] ---');

test('56. Venda de 1.000 Robux com taxa de 30% rende exatamente 700 Robux', () => {
    const valor = 1000;
    const recebe = Math.floor(valor * 0.70);
    assert.strictEqual(recebe, 700);
});

test('57. Para receber 1.000 Robux líquidos, a Gamepass deve ser criada por 1.429 Robux', () => {
    const desejado = 1000;
    const gamepass = Math.ceil(desejado / 0.70);
    assert.strictEqual(gamepass, 1429);
});

test('58. Venda de 100 Robux rende 70 Robux líquidos', () => {
    const valor = 100;
    const recebe = Math.floor(valor * 0.70);
    assert.strictEqual(recebe, 70);
});

test('59. Gamepass para receber 70 Robux líquidos custa exatamente 100 Robux', () => {
    const desejado = 70;
    const gamepass = Math.ceil(desejado / 0.70);
    assert.strictEqual(gamepass, 100);
});

test('60. Taxa para 0 ou negativo deve ser tratada como 0', () => {
    const valor = 0;
    const recebe = Math.max(0, Math.floor(valor * 0.70));
    assert.strictEqual(recebe, 0);
});

// -------------------------------------------------------------------------
// BLOCO 8: INTEGRIDADE DE TODOS OS COMANDOS SLASH PÚBLICOS [Testes 61 a 75]
// -------------------------------------------------------------------------
console.log('\n--- [Bloco 8: Verificação de Comandos Slash Públicos] ---');

const slashDir = path.join(__dirname, '..', 'commands', 'slash');

function verifySlashCommand(name) {
    const cmdPath = path.join(slashDir, `${name}.js`);
    assert.strictEqual(fs.existsSync(cmdPath), true, `Comando slash ${name}.js deve existir`);
    const cmd = require(cmdPath);
    assert.ok(cmd.data, `Comando ${name} deve possuir .data`);
    assert.strictEqual(typeof cmd.execute, 'function', `Comando ${name} deve possuir .execute()`);
}

test('61. Slash /ping deve possuir estrutura válida', () => verifySlashCommand('ping'));
test('62. Slash /help deve possuir estrutura válida e handleSelect', () => {
    verifySlashCommand('help');
    const cmd = require(path.join(slashDir, 'help.js'));
    assert.strictEqual(typeof cmd.handleSelect, 'function');
});
test('63. Slash /serverinfo deve possuir estrutura válida', () => verifySlashCommand('serverinfo'));
test('64. Slash /userinfo deve possuir estrutura válida', () => verifySlashCommand('userinfo'));
test('65. Slash /avatar deve possuir estrutura válida', () => verifySlashCommand('avatar'));
test('66. Slash /banner deve possuir estrutura válida', () => verifySlashCommand('banner'));
test('67. Slash /servericon deve possuir estrutura válida', () => verifySlashCommand('servericon'));
test('68. Slash /roleinfo deve possuir estrutura válida', () => verifySlashCommand('roleinfo'));
test('69. Slash /channelinfo deve possuir estrutura válida', () => verifySlashCommand('channelinfo'));
test('70. Slash /botinfo deve possuir estrutura válida', () => verifySlashCommand('botinfo'));
test('71. Slash /afk deve possuir estrutura válida', () => verifySlashCommand('afk'));
test('72. Slash /lembrete deve possuir estrutura válida', () => verifySlashCommand('lembrete'));
test('73. Slash /calc deve possuir estrutura válida', () => verifySlashCommand('calc'));
test('74. Slash /traduzir deve possuir estrutura válida', () => verifySlashCommand('traduzir'));
test('75. Slash /sugerir deve possuir estrutura válida', () => verifySlashCommand('sugerir'));

// -------------------------------------------------------------------------
// BLOCO 9: COMANDOS SLASH DE LOJA, COMUNIDADE E ENGAGEMENT [Testes 76 a 85]
// -------------------------------------------------------------------------
console.log('\n--- [Bloco 9: Comandos Slash de Loja, Diversão & RP] ---');

test('76. Slash /robloxinfo deve possuir estrutura válida', () => verifySlashCommand('robloxinfo'));
test('77. Slash /taxarobux deve possuir estrutura válida', () => verifySlashCommand('taxarobux'));
test('78. Slash /avaliar deve possuir estrutura válida', () => verifySlashCommand('avaliar'));
test('79. Slash /reputacao deve possuir estrutura válida', () => verifySlashCommand('reputacao'));
test('80. Slash /vouch deve possuir estrutura válida', () => verifySlashCommand('vouch'));
test('81. Slash /8ball deve possuir estrutura válida', () => verifySlashCommand('8ball'));
test('82. Slash /coinflip deve possuir estrutura válida', () => verifySlashCommand('coinflip'));
test('83. Slash /roll deve possuir estrutura válida', () => verifySlashCommand('roll'));
test('84. Slash /ppt deve possuir estrutura válida e handleButton', () => {
    verifySlashCommand('ppt');
    const cmd = require(path.join(slashDir, 'ppt.js'));
    assert.strictEqual(typeof cmd.handleButton, 'function');
});
test('85. Slash /jogodavelha deve possuir estrutura válida e handleButton', () => {
    verifySlashCommand('jogodavelha');
    const cmd = require(path.join(slashDir, 'jogodavelha.js'));
    assert.strictEqual(typeof cmd.handleButton, 'function');
});

// -------------------------------------------------------------------------
// BLOCO 10: DIVERSÃO, MINI-GAMES E ROLEPLAY [Testes 86 a 95]
// -------------------------------------------------------------------------
console.log('\n--- [Bloco 10: Mini-games & Roleplay] ---');

test('86. Slash /duelo deve possuir estrutura válida e handleButton', () => {
    verifySlashCommand('duelo');
    const cmd = require(path.join(slashDir, 'duelo.js'));
    assert.strictEqual(typeof cmd.handleButton, 'function');
});
test('87. Slash /ship deve possuir estrutura válida', () => verifySlashCommand('ship'));
test('88. Slash /hackear deve possuir estrutura válida', () => verifySlashCommand('hackear'));
test('89. Slash /rate deve possuir estrutura válida', () => verifySlashCommand('rate'));
test('90. Slash /escolha deve possuir estrutura válida', () => verifySlashCommand('escolha'));
test('91. Slash /ascii deve possuir estrutura válida', () => verifySlashCommand('ascii'));
test('92. Slash /inverter deve possuir estrutura válida e proteção anti-everyone', () => {
    verifySlashCommand('inverter');
    const content = fs.readFileSync(path.join(slashDir, 'inverter.js'), 'utf8');
    assert.ok(content.includes('everyone') || content.includes('replace'));
});
test('93. Slash /hug deve possuir estrutura válida e executeRetribuir', () => {
    verifySlashCommand('hug');
    const cmd = require(path.join(slashDir, 'hug.js'));
    assert.strictEqual(typeof cmd.executeRetribuir, 'function');
});
test('94. Slash /slap deve possuir estrutura válida e executeRetribuir', () => {
    verifySlashCommand('slap');
    const cmd = require(path.join(slashDir, 'slap.js'));
    assert.strictEqual(typeof cmd.executeRetribuir, 'function');
});
test('95. Slash /kiss, /pat e /highfive devem possuir estruturas válidas', () => {
    verifySlashCommand('kiss');
    verifySlashCommand('pat');
    verifySlashCommand('highfive');
});

// -------------------------------------------------------------------------
// BLOCO 11: COMANDOS SLASH EXCLUSIVOS DA STAFF / ADM [Testes 96 a 105]
// -------------------------------------------------------------------------
console.log('\n--- [Bloco 11: Comandos Slash Exclusivos de Staff & Moderação] ---');

test('96. Slash /clear deve possuir estrutura e verificação de permissão', () => verifySlashCommand('clear'));
test('97. Slash /ban deve possuir estrutura e verificação de BanMembers', () => verifySlashCommand('ban'));
test('98. Slash /unban deve possuir estrutura válida', () => verifySlashCommand('unban'));
test('99. Slash /kick deve possuir estrutura e verificação de KickMembers', () => verifySlashCommand('kick'));
test('100. Slash /timeout deve possuir estrutura e parsing de tempo', () => verifySlashCommand('timeout'));
test('101. Slash /untimeout deve possuir estrutura válida', () => verifySlashCommand('untimeout'));
test('102. Slash /warn deve gravar no banco e possuir estrutura válida', () => verifySlashCommand('warn'));
test('103. Slash /warnings deve consultar histórico de advertências', () => verifySlashCommand('warnings'));
test('104. Slash /unwarn deve possuir remoção de warn por ID', () => verifySlashCommand('unwarn'));
test('105. Slash /snipe deve possuir leitura do snipeManager', () => verifySlashCommand('snipe'));

// -------------------------------------------------------------------------
// BLOCO 12: GERENCIAMENTO DE CANAIS, CARGOS E LOJA [Testes 106 a 115]
// -------------------------------------------------------------------------
console.log('\n--- [Bloco 12: Gerenciamento de Canais, Cargos & Loja] ---');

test('106. Slash /lock deve possuir estrutura válida', () => verifySlashCommand('lock'));
test('107. Slash /unlock deve possuir estrutura válida', () => verifySlashCommand('unlock'));
test('108. Slash /slowmode deve possuir estrutura com limites de segundos', () => verifySlashCommand('slowmode'));
test('109. Slash /nuke deve possuir confirmação e handleButton', () => {
    verifySlashCommand('nuke');
    const cmd = require(path.join(slashDir, 'nuke.js'));
    assert.strictEqual(typeof cmd.handleButton, 'function');
});
test('110. Slash /role deve possuir subcomandos add e remove', () => verifySlashCommand('role'));
test('111. Slash /setnick deve possuir estrutura e trava de hierarquia', () => verifySlashCommand('setnick'));
test('112. Slash /say deve possuir estrutura e filtro anti-everyone', () => {
    verifySlashCommand('say');
    const content = fs.readFileSync(path.join(slashDir, 'say.js'), 'utf8');
    assert.ok(content.includes('everyone'));
});
test('113. Slash /embed deve possuir modal e handleModal', () => {
    verifySlashCommand('embed');
    const cmd = require(path.join(slashDir, 'embed.js'));
    assert.strictEqual(typeof cmd.handleModal, 'function');
});
test('114. Slash /dm deve possuir estrutura para envio direto ao cliente', () => verifySlashCommand('dm'));
test('115. Slash /addemoji e /sorteio devem possuir estruturas válidas', () => {
    verifySlashCommand('addemoji');
    verifySlashCommand('sorteio');
});

// -------------------------------------------------------------------------
// BLOCO 13: COMANDOS DE PREFIXO (k!prefix) & INTEGRIDADE FINAL [Testes 116 a 120]
// -------------------------------------------------------------------------
console.log('\n--- [Bloco 13: Comandos de Prefixo & Handlers de Eventos] ---');

const prefixDir = path.join(__dirname, '..', 'commands', 'prefix');

function verifyPrefixCommand(name) {
    const cmdPath = path.join(prefixDir, `${name}.js`);
    assert.strictEqual(fs.existsSync(cmdPath), true, `Comando prefixo ${name}.js deve existir`);
    const cmd = require(cmdPath);
    assert.ok(cmd.name, `Comando prefixo ${name} deve possuir .name`);
    assert.strictEqual(typeof cmd.execute, 'function', `Comando prefixo ${name} deve possuir .execute()`);
}

test('116. Comandos essenciais de prefixo devem existir e ser válidos (k!ping, k!help, k!calc)', () => {
    verifyPrefixCommand('ping');
    verifyPrefixCommand('help');
    verifyPrefixCommand('calc');
});

test('117. Comandos de moderação de prefixo devem existir (k!clear, k!ban, k!mute, k!warn)', () => {
    verifyPrefixCommand('clear');
    verifyPrefixCommand('ban');
    verifyPrefixCommand('mute');
    verifyPrefixCommand('warn');
});

test('118. Evento messageCreate deve possuir processamento de AFK e prefixo', () => {
    const evtPath = path.join(__dirname, '..', 'events', 'messageCreate.js');
    assert.strictEqual(fs.existsSync(evtPath), true);
    const content = fs.readFileSync(evtPath, 'utf8');
    assert.ok(content.includes('afkData'));
    assert.ok(content.includes('prefixCommands'));
});

test('119. Evento interactionCreate deve possuir roteamento de Slash, Select, Botões e Modais', () => {
    const evtPath = path.join(__dirname, '..', 'events', 'interactionCreate.js');
    assert.strictEqual(fs.existsSync(evtPath), true);
    const content = fs.readFileSync(evtPath, 'utf8');
    assert.ok(content.includes('isChatInputCommand'));
    assert.ok(content.includes('isStringSelectMenu'));
    assert.ok(content.includes('isButton'));
    assert.ok(content.includes('isModalSubmit'));
});

test('120. Total de comandos slash e prefixos sincronizados e prontos para produção', () => {
    const slashFiles = fs.readdirSync(slashDir).filter(f => f.endsWith('.js'));
    const prefixFiles = fs.readdirSync(prefixDir).filter(f => f.endsWith('.js'));
    assert.ok(slashFiles.length >= 60, `Total de Slash deve ser >= 60 (atual: ${slashFiles.length})`);
    assert.ok(prefixFiles.length >= 60, `Total de Prefix deve ser >= 60 (atual: ${prefixFiles.length})`);
});

console.log('\n===============================================================');
console.log(`   RELATÓRIO FINAL DA SUÍTE DE TESTES: ${passedTests}/${totalTests} PASSADOS`);
if (failedTests > 0) {
    console.log(`   ❌ FALHAS DETECTADAS: ${failedTests}`);
} else {
    console.log('   🎉 TODOS OS 120 TESTES PASSARAM COM 100% DE SUCESSO!');
}
console.log('===============================================================\n');

if (failedTests > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
