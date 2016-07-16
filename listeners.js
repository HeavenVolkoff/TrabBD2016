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
    unidadesSaudeLocalizacoes: (socket) => {
      log(`Requisição para geo location das unidades de saude`)
      dbPool.getConnection().then((conn) => {
        let query = 'SELECT COUNT(TrabalhoBD.localizacoes.id) FROM TrabalhoBD.localizacoes';
        let res = conn.execute({sql: query, rowsAsArray: true}, [])
        conn.release()
        return res
      }).then((response) => {
        dbPool.getConnection().then((conn) => {
          let chunckSize = 100;
          let total = response[0][0][0];
          let queries = [];
          for(let count = 0; count <= (total/chunckSize); count++){
            let query = 'SELECT localizacoes.latitude, localizacoes.longitude FROM localizacoes ORDER BY id LIMIT ?,?';
            queries.push(
                conn.execute({sql: query, rowsAsArray: true}, [count*chunckSize,  chunckSize]).then((response) => {
                  socket.emit('unidadesSaudeLocalizacoesAnswer', response)
                }).catch((err) => {
                  log(err)
                })
            );
          }
          conn.release()
          return Promise.all(queries).catch((err) => {
            log(err)
          })
        })
      }).catch((err) => {
        log(err)
      })
    }
  }
}
