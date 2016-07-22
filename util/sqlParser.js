'use strict'

// === Node packages ===
const fs = require('fs')
const path = require('path')
const util = require('util')

// === NPM external packages ===
const debug = require('debug')

// This file's path information
const file = path.parse(__filename)
// Internal logger
const log = debug(`${path.basename(file.dir)}:${file.name}`)

// SQL Regular Expressions
const regExp = {
  removeHashTag: /(\s|;|^)#[\s\S]+?(?=\n|$)/g,
  queryPattern: /--([\w \t\r]+?(?=\n))([\s\S]+?(?=--|$))/g,
  openExpression: /(\(|\[|\{)\s+/g,
  closeExpression: /\s+(\)|]|})/g,
  space: /\s+/g
}

/**
 * Parse SQL file and return query object
 *
 * @param filePath {string}
 * @returns {object}
 */
module.exports = (filePath) => {
  const queries = {}
  let file = fs.readFileSync(filePath, {encoding: 'utf8'})

  file = file.replace(regExp.removeHashTag, (match, firstChar) => firstChar === ';' ? ';' : '')

  let queryInfo
  while ((queryInfo = regExp.queryPattern.exec(file)) !== null) {
    let name = queryInfo[1].replace(regExp.space, '')
    let query = queryInfo[2]
      .replace(regExp.space, (match, offset, string) => offset === 0 || offset + match.length === string.length ? '' : ' ')
      .replace(regExp.openExpression, '$1')
      .replace(regExp.closeExpression, '$1')

    queries[name] = query
  }

  log(util.inspect(queries, {colors: true}))

  return queries
}
