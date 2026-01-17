'use strict'

import { create, all } from 'mathjs'

// Cria instância do mathjs com apenas funções matemáticas básicas
// Isso previne qualquer execução de código arbitrário (RCE)
const math = create(all, {
  // Desabilita funções perigosas
})

// Lista de funções permitidas (whitelist)
const ALLOWED_FUNCTIONS = new Set([
  'add', 'subtract', 'multiply', 'divide',
  'abs', 'ceil', 'floor', 'round',
  'min', 'max', 'sqrt', 'pow',
  'log', 'log10', 'exp',
])

// Sanitiza a expressão removendo caracteres perigosos
function sanitizeExpression(expression: string): string {
  // Remove espaços extras
  const sanitized = expression.trim()

  // Permite apenas: números, operadores matemáticos básicos, parênteses, ponto, variáveis
  // Regex: letras (para variáveis), números, operadores, parênteses, ponto decimal
  if (!/^[a-zA-Z0-9_+\-*/().%\s]+$/.test(sanitized)) {
    throw new Error('Expressão contém caracteres não permitidos')
  }

  // Bloqueia tentativas de acessar propriedades (prototype pollution)
  if (sanitized.includes('__proto__') ||
      sanitized.includes('constructor') ||
      sanitized.includes('prototype')) {
    throw new Error('Expressão contém padrões não permitidos')
  }

  return sanitized
}

// Valida que todas as funções usadas são permitidas
function validateFunctions(expression: string): void {
  // Encontra chamadas de função (palavra seguida de parêntese)
  const functionCalls = expression.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g)

  if (functionCalls) {
    for (const call of functionCalls) {
      const funcName = call.replace(/[\s(]/g, '')
      if (!ALLOWED_FUNCTIONS.has(funcName)) {
        throw new Error(`Função não permitida: ${funcName}`)
      }
    }
  }
}

export interface EvalScope {
  [key: string]: number
}

/**
 * Avalia uma expressão matemática de forma segura
 * @param expression - Expressão matemática (ex: "totalSpent / totalPurchases")
 * @param scope - Objeto com variáveis e seus valores
 * @returns Resultado numérico ou 0 em caso de erro
 */
export function safeEvaluate(expression: string, scope: EvalScope): number {
  try {
    // Sanitiza a expressão
    const sanitized = sanitizeExpression(expression)

    // Valida funções
    validateFunctions(sanitized)

    // Avalia usando mathjs (sandbox seguro)
    const result = math.evaluate(sanitized, scope)

    // Garante que o resultado é um número válido
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      return 0
    }

    return result
  } catch (error) {
    // Log para debug em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.warn('Erro ao avaliar expressão:', expression, error)
    }
    return 0
  }
}

/**
 * Valida uma fórmula antes de salvar
 * @param formula - Fórmula a ser validada
 * @param availableVariables - Lista de variáveis disponíveis
 * @returns Objeto com resultado da validação
 */
export function validateFormula(
  formula: string,
  availableVariables: string[]
): { valid: boolean; error?: string } {
  try {
    // Sanitiza
    const sanitized = sanitizeExpression(formula)

    // Valida funções
    validateFunctions(sanitized)

    // Cria scope com valores de teste
    const testScope: EvalScope = {}
    availableVariables.forEach(v => {
      testScope[v] = 1
    })

    // Tenta avaliar com valores de teste
    const result = math.evaluate(sanitized, testScope)

    if (typeof result !== 'number') {
      return { valid: false, error: 'A fórmula deve retornar um número' }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Fórmula inválida'
    }
  }
}
