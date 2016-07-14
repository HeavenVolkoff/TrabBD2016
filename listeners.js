'use strict'

// === Node packages ===
const path = require('path')

// === NPM external packages ===
const debug = require('debug')

// This file path information
const file = path.parse(__filename)
// Internal logger
const log = debug(`${path.basename(file.dir)}:${file.name}`)

/**
 * Socket.IO listeners
 * @param dbPool
 * @returns {Object}
 */
module.exports = (dbPool) => {
  return {
    unidadesSaude: (socket, maxId) => {
      // TODO
    }
  }
}
