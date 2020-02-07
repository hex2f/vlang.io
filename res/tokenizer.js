//                      WARNING!!!                        //
// Very bad parser, i'm not a big brain low level girl :( //
//                                                        //

function peek (tokens, steps = 1) {
  const token = tokens[tokens.length - steps]
  if (typeof token === 'object') {
    token.setType = (value) => { tokens[tokens.length - steps].type = value; return token }
    token.setValue = (value) => { tokens[tokens.length - steps].value = value; return token }
    token.pushValue = (value) => { tokens[tokens.length - steps].value += value; return token }
  }
  return { type: '', value: '', ...token }
}

function Tokenizer (code) {
  let i = 0
  let readingString = false
  let readingComment = false
  const tokens = [{ type: 'unknown', value: '' }]

  while (i < code.length) {
    if (readingComment && code[i - 1] !== '\n') {
      peek(tokens).pushValue(code[i])
      i++
      continue
    } else if (readingComment) {
      readingComment = false
      tokens.push({ type: 'unknown', value: '' })
    }
    if (((code[i] === ' ' && code[i - 1] !== ' ') || code[i] === '(' || code[i] === ')' || code[i] === ',' || code[i] === '\n' || code[i].match(/[0-9]/)) && !readingString) {
      const lastToken = peek(tokens).value
      if (['for', 'import', 'if', 'return', 'else', 'in', 'fn', 'struct', 'interface'].indexOf(lastToken.replace(/\n/g, '')) > -1) {
        peek(tokens).setType('key')
      } else if ((peek(tokens, 2).type === 'key' || (peek(tokens, 2).type === 'whitespace' && peek(tokens, 3).type === 'key')) && (lastToken.endsWith('(') || lastToken.endsWith(')'))) {
        peek(tokens).setType('function')
      } else if (lastToken === '=' || lastToken === ':=') {
        peek(tokens).setType('definition')
      } else if (code[i].match(/[0-9]/)) {
        if (peek(tokens).type === 'number') {
          peek(tokens).pushValue(code[i])
        } else {
          tokens.push({ type: 'number', value: code[i] })
        }
      } else if (['int', 'f64', 'mut'].indexOf(lastToken) > -1) {
        peek(tokens).setType('type')
      }
      if (code[i] === '\n') {
        tokens.push({ type: 'whitespace', value: '\n' })
      }
      if (!lastToken.match(/[0-9]/)) {
        if (code[i] === ' ') {
          tokens.push({ type: 'whitespace', value: ' ' })
        }
        if (code[i + 1] !== ' ') {
          if (code[i] === ',' || code[i] === '(' || code[i] === ')') {
            tokens.push({ type: 'separator', value: code[i] })
          }
          tokens.push({ type: 'unknown', value: '' })
        } else if (code[i + 1] === ' ' && (code[i] === ',' || code[i] === '(' || code[i] === ')')) {
          tokens.push({ type: 'separator', value: code[i] })
        }
      }
    } else if (!readingString && code[i] === ' ' && code[i - 1] === ' ') {
      peek(tokens).pushValue(' ')
      if (code[i + 1] !== ' ') tokens.push({ type: 'unknown', value: '' })
    } else if ((code[i] === '"' || code[i] === "'") && code[i - 1] !== '\\') {
      readingString = !readingString
      peek(tokens).setType('string').pushValue(code[i])
      !readingString && tokens.push({ type: 'unknown', value: '' })
    } else if (code[i] === '/' && code[i - 1] === '/') {
      readingComment = true
      peek(tokens).setValue(peek(tokens).value.slice(0, -1))
      tokens.push({ type: 'comment', value: '//' })
    } else {
      peek(tokens).pushValue(code[i])
    }

    i++
  }

  return tokens.length === 1 && tokens[0].value === '' ? [{ type: 'whitespace', value: ' ' }] : tokens
}