'use strict'

// === Node packages ===
const path = require('path')

// === NPM external packages ===
const debug = require('debug')

// This file's path information
const file = path.parse(__filename)
// Internal logger
const log = debug(`${path.basename(file.dir)}:${file.name}`)

/**
 * Socket.IO listeners
 * @param dbPool
 * @returns {Object}
 */
module.exports = (dbPool, query) => {
  return {
    getStates: (socket) => {
      dbPool.getConnection().then((conn) => {
        let res = conn.query({sql: query.getStates, rowsAsArray: true})
        conn.release()
        return res
      }).then(([rows]) => {
        socket.emit('getStates_answer', [].concat(...rows)) // Flatten rows array
      }).catch((err) => {
        log(err)
      })
    },

    countLocalizationsPerState: (socket, stateName) => {
      dbPool.getConnection().then((conn) => {
        let res = conn.query(query.countLocalizationsPerState, [stateName])
        conn.release()
        return res
      }).then(([[row]]) => {
        socket.emit('countLocalizationsPerState_answer', row)
      }).catch((err) => {
        log(err)
      })
    },

    countHealthUnitPerType: (socket, uf) => {
      dbPool.getConnection().then((conn) => {
        let res = conn.query(query.countHealthUnitPerType, [uf])
        conn.release()
        return res
      }).then(([rows]) => {
        socket.emit('countHealthUnitPerType_answer', {uf: uf, rows: rows})
      }).catch((err) => {
        log(err)
      })
    }
  }
}
