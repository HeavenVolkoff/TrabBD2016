/**
 * Server Entry Point
 * Initialize and set-up all required resources
 */
'use strict'

// Internal configuration
const configuration = Object.assign(require('./configuration.json'), require('./localConfiguration.json'))
// Configure Debug Logs
process.env.DEBUG = configuration.debug

// === Node packages ===
const path = require('path')

// === NPM external packages ===
const debug = require('debug')
const mysql = require('mysql2/promise')
const Promise = require('bluebird')

// === Internal packages ===
const getListeners = require('./listeners')
const createSocketIO = require('./util/createSoketIO')
const createLocalServer = require('./util/createLocalServer')

// This file path information
const file = path.parse(__filename)
// Internal logger
const log = debug(`${path.basename(file.dir)}:${file.name}`)

log('Initializing server...')

// Create database connection pool
const dbPool = mysql.createPool(
  Object.assign(configuration.db, {
    /* Database Custom Options */
    Promise: Promise
  })
)

// Create local server instance
const server = createLocalServer(
  Object.assign(configuration.server, {
    /* Server Custom Options */
  })
)

// Create Socket.io instance inside previously created server
const io = createSocketIO(server, getListeners(dbPool))

// === Internal Listeners ===
server.on('listening', () => {
  log('Server initialized...')
})

server.on('error', () => {
  // TODO
})

io.on('message', () => {
  // TODO
})

io.on('destroy', () => {
  // TODO
})