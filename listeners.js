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
 * @param query {Object}
 * @returns {Object}
 */
module.exports = (dbPool, query) => {
  return {
    ready: (socket) => {
      dbPool.execute(query.healthUnitsPerState)
        .then(function ([rows]) {
          socket.emit('healthUnitsPerState', rows)
        }).catch((err) => {
        log(err)
      })
    },

    countLocalizationsPerState: (socket, stateName) => {
      dbPool.execute(query.countLocalizationsPerState, [stateName])
        .then(([[row]]) => {
          socket.emit('countLocalizationsPerState_answer', row)
        }).catch((err) => {
        log(err)
      })
    },

    getStatePopupData: (socket) => {
      Promise.all([
        dbPool.getConnection().then((conn) => {
          let res = conn.query(query.countHealthUnitPerType)
          conn.release()
          return res
        }).then(([rows]) => {
          socket.emit('countHealthUnitPerType', {rows: rows})
        }),
        dbPool.getConnection().then((conn) => {
          let res = conn.query(query.StateUnitsScoreAvg)
          conn.release()
          return res
        }).then(([rows]) => {
          socket.emit('StateUnitsScoreAvg', {rows: rows})
        })
      ]).catch((err) => {
        log(err)
      })
    },

    getHealthUnitPosition: (socket, uf) => {
      dbPool.execute(query.getHealthUnitPosition, [uf])
        .then(([rows]) => {
          socket.emit('getHealthUnitPosition_answer', {uf: uf, rows: rows})
        }).catch((err) => {
        log(err)
      })
    },

    getCountryStatistics: (socket) => Promise.all([
      dbPool.execute(query.getUnitsPerRegion)
        .then(([rows]) => {
          socket.emit('getUnitsPerRegion', rows)
        }),
      dbPool.execute(query.getRegionScoreByCategory)
        .then(([rows]) => {
          socket.emit('getRegionScoreByCategory', rows)
        }),
      dbPool.execute(query.getGovernmentControlledUnits)
        .then(([[rows]]) => {
          socket.emit('getGovernmentControlledUnits', rows)
        }),
      dbPool.execute(query.getUnityQuantity)
        .then(([[rows]]) => {
          socket.emit('getUnitQuantity', rows)
        })
    ]).catch((err) => {
      log(err)
    })
  }
}
