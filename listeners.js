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
      dbPool.getConnection().then((conn) => {
        let rows = conn.query(query.healthUnitsPerState)
        conn.release()
        return rows
      }).then(function ([rows]) {
        socket.emit('healthUnitsPerState', rows) // Flatten rows array
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
    },

    getHealthUnitPosition: (socket, uf) => {
      dbPool.getConnection().then((conn) => {
        let res = conn.query(query.getHealthUnitPosition, [uf])
        conn.release()
        return res
      }).then(([rows]) => {
        socket.emit('getHealthUnitPosition_answer', {uf: uf, rows: rows})
      }).catch((err) => {
        log(err)
      })
    },

    getCountryStatistics: (socket) => {
      Promise.all([
        dbPool.getConnection().then((conn) => {
          let res = conn.query(query.getRegionUnitsDistribution)
          conn.release()
          return res
        }).then(([rows]) => {
          socket.emit('getRegionUnitsDistribution', rows)
        }),
        dbPool.getConnection().then((conn) => {
          let res = conn.query(query.getRegionScoreByCategory)
          conn.release()
          return res
        }).then(([rows]) => {
          socket.emit('getRegionScoreByCategory', rows)
        }),
        dbPool.getConnection().then((conn) => {
          let res = conn.query(query.getGovernmentControlledUnits)
          conn.release()
          return res
        }).then(([rows]) => {
          socket.emit('getGovernmentControlledUnits', rows)
        }),
        dbPool.getConnection().then((conn) => {
          let res = conn.query(query.getUnityCount)
          conn.release()
          return res
        }).then(([rows]) => {
          socket.emit('getUnityCount', rows)
        })
      ]).catch((err) => {
        log(err)
      })
    }
  }
}
