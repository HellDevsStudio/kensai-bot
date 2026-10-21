/**
 * Avaliador matemático seguro sem uso de eval()
 * Suporta +, -, *, x, X, /, ÷, ^, %, parênteses e vírgula decimal (ex: 5x5, 20+20, 20/3, 1500 * 0,7)
 */
function evaluateMath(expr) {
    if (!expr || typeof expr !== 'string') {
        throw new Error('Expressão inválida');
    }

    let cleaned = expr.trim();

    // Suporte a vírgula decimal comum no Brasil (ex: 0,7 -> 0.7, 5,5 -> 5.5)
    cleaned = cleaned.replace(/(\d+),(\d+)/g, '$1.$2');

    // Substituir operadores comuns de multiplicação e divisão
    // Cuidado: substituir 'x' e 'X' apenas quando atuam como multiplicação (ex: 5x5, 5 x 5, )x(, )x5)
    cleaned = cleaned.replace(/x/gi, '*').replace(/÷/g, '/');

    // Checar por caracteres proibidos
    if (/[a-zA-Z_$]/.test(cleaned) || /[\`'"\[\]{}]/.test(cleaned)) {
        throw new Error('Expressão contém caracteres ou identificadores proibidos');
    }

    // Checar divisão por zero explícita (ex: / 0, / 0.0, / (0))
    if (/\/\s*0+(?:\.0+)?(?![0-9])/.test(cleaned)) {
        throw new Error('Divisão por zero não é permitida');
    }

    // Converter exponenciação ^ para **
    cleaned = cleaned.replace(/\^/g, '**');

    // Validação de parênteses balanceados
    let balance = 0;
    for (const char of cleaned) {
        if (char === '(') balance++;
        if (char === ')') balance--;
        if (balance < 0) throw new Error('Parênteses desbalanceados');
    }
    if (balance !== 0) throw new Error('Parênteses desbalanceados');

    // Apenas números, espaços e operadores aritméticos válidos
    if (!/^[0-9+\-*\/().%\s*]+$/.test(cleaned)) {
        throw new Error('Caracteres inválidos na expressão matemática');
    }

    try {
        const fn = new Function('"use strict"; return (' + cleaned + ');');
        const res = fn();

        if (typeof res !== 'number' || isNaN(res) || !isFinite(res)) {
            throw new Error('Divisão por zero ou resultado indefinido');
        }

        return Math.round(res * 10000) / 10000;
    } catch (err) {
        if (/divisão por zero/i.test(err.message)) throw err;
        throw new Error('Erro ao calcular expressão: ' + err.message);
    }
}

function safeCalculate(expression) {
    try {
        return evaluateMath(expression);
    } catch {
        return null;
    }
}

module.exports = {
    evaluateMath,
    safeCalculate
};
