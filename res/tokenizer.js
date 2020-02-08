//                      WARNING!!!                        //
// Very bad parser, i'm not a big brain low level girl :( //
// - Leah                                                 //

const keywords = [
  "break",
  "const",
  "continue",
  "defer",
  "else",
  "enum",
  "fn",
  "for",
  "go",
  "goto",
  "if",
  "import",
  "in",
  "interface",
  "match",
  "module",
  "mut",
  "none",
  "or",
  "pub",
  "struct",
  "type"
]
const ops = ["+","-","*","/","%","&","|","^","<<",">>"]
const assignments = ["+=","-=", "*=","/=","%=","&=","|=","^=",">>=","<<=",":=","="]
const breakers = ["(",")", "{","}"]
const types = ["bool","string","i8","i16","int","i64","i128","byte","u16","u32","u64","u128","rune","f32","f64","byteptr","voidptr"]

function peek (tokens, steps = 1) {
  const token = tokens[tokens.length - steps]
  if (typeof token === 'object') {
    token.setType = (value) => { tokens[tokens.length - steps].type = value; return token }
    token.setValue = (value) => { tokens[tokens.length - steps].value = value; return token }
    token.pushValue = (value) => { tokens[tokens.length - steps].value += value; return token }
  }
  return { type: '', value: '', ...token }
}

function finishType (tokens, type) {
  peek(tokens).setType(type)
  tokens.push({ type: 'unknown', value: '' })
}

function Tokenizer (code) {
  let i = 0
  let readingString = false
  let stringStarter = ""
  let readingComment = false
  let readingMultiLineComment = false
  const tokens = [{ type: 'unknown', value: '' }]

  function IsKeyword (next, str) { return keywords.indexOf(str) > -1 && !readingString && !readingComment && next === ' ' }
  function IsType (next, str) { return types.indexOf(str) > -1 && !readingString && !readingComment && (next === ' ' || next === '\n' || IsBreak(next)) }
  function IsAssignment (str) { return assignments.indexOf(str) > -1 && !readingString && !readingComment }
  function IsOp (str) { return ops.indexOf(str) > -1 && !readingString && !readingComment }
  function IsBreak (str) { return breakers.indexOf(str) > -1 && !readingString && !readingComment}
  function IsNumber (str) { return str.match(/^[0-9]+$/) && !readingString && !readingComment}

  while (i < code.length) {
    if (code[i] === '/' && (code[i+1] === '/' || code[i+1] === '*') && code[i-1] !== '\\') {
      readingComment = true
      if (code[i+1] === '*') readingMultiLineComment = true
    } else
    if (code[i] === '*' && code[i+1] === '/' && code[i-1] !== '\\') {
      readingComment = false
      readingMultiLineComment = false
      finishType(tokens, 'comment')
    } else
    if (IsKeyword(code[i], peek(tokens).value)) { finishType(tokens, 'keyword') } else
    if (IsType(code[i], peek(tokens).value)) { finishType(tokens, 'type') } else
    if (IsAssignment(peek(tokens).value)) { finishType(tokens, 'definition') } else
    if (IsOp(peek(tokens).value)) { finishType(tokens, 'operator') } else
    if (IsBreak(peek(tokens).value)) { finishType(tokens, 'separator') } else
    if (IsNumber(peek(tokens).value)) { finishType(tokens, 'number') } else
    if (peek(tokens).value === 'return' && !readingString && !readingComment && code[i] === ' ') { finishType(tokens, 'return') }

    if (peek(tokens).value === ' ' || peek(tokens).value === '\n') { finishType(tokens, 'whitespace') } else
    if (IsBreak(code[i])) {
      if (peek(tokens, 3).type === 'keyword') { finishType(tokens, 'key') } else { finishType(tokens, 'unknown') }
    } else if ((code[i] === ' ' && !readingString) || (code[i] === '\n' && !readingString && code[i-1] !== '\\')) {
      if(code[i] === '\n' && readingComment && !readingMultiLineComment) { 
        finishType(tokens, 'comment')
        readingComment = false
      } else if (!readingComment) {
        finishType(tokens, 'unknown')
      }
    }

    if ((code[i] === '\'' || code[i] === '\"') && code[i - 1] !== "\\" && !readingComment) {
      if (code[i] === stringStarter && readingString) {
        peek(tokens).pushValue(code[i])
        if (readingString) { finishType(tokens, 'string') }
        readingString = false
      } else if(!readingString) {
        finishType(tokens, 'unknown')
        peek(tokens).pushValue(code[i])
        stringStarter = code[i]
        readingString = true
      } else {
        peek(tokens).pushValue(code[i])
      }
    } else {
      peek(tokens).pushValue(code[i])
    }
    i++
  }

  return tokens.length === 1 && tokens[0].value === '' ? [{ type: 'whitespace', value: ' ' }] : tokens
}