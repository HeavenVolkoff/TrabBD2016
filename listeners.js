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
module.exports = (dbPool) => {
  return {
    get_ufs: (socket) => {
      dbPool.getConnection().then((conn) => {
        let query = 'SELECT ufs.sigla FROM ufs';
        let res = conn.execute({sql: query, rowsAsArray: true}, [])
        conn.release()
        return res
      }).then((response) => {
        socket.emit('get_ufs_answer', response)
      }).catch((err) => {
        log(err)
      })
    },
    get_uf_locations_count: (socket, uf_name) => {
      dbPool.getConnection().then((conn) => {
        let query =
            'SELECT ufs.sigla, count(localizacoes.id) ' +
            'FROM localizacoes ' +
            'INNER JOIN ufs ON localizacoes.uf_id = ufs.id ' +
            'WHERE ufs.sigla = ? '
        let res = conn.execute({sql: query, rowsAsArray: true}, [uf_name])
        conn.release()
        return res
      }).then((response) => {
        console.log(response)
        socket.emit('get_uf_locations_count_answer', response)
      }).catch((err) => {
        log(err)
      })
    },
    get_state_floating_info: (socket, uf) => {
      dbPool.getConnection().then((conn) => {
        let query =
          "SELECT tipos_gestao.descricao, COUNT(tipos_gestao.id) AS 'count' " +
          "FROM tipos_gestao " +
          "INNER JOIN unidades_saude ON unidades_saude.tipo_gestao_id = tipos_gestao.id " +
          "INNER JOIN localizacoes ON unidades_saude.localizacao_id = localizacoes.id " +
          "INNER JOIN ufs ON localizacoes.uf_id = ufs.id " +
          "WHERE ufs.sigla = '?' " +
          "GROUP BY tipos_gestao.descricao;";
        let res = conn.execute({sql: query, rowsAsArray: true}, [uf])
        conn.release()
        return res
      }).then((response) => {
        socket.emit('get_state_floating_info_answer', [uf, response])
      }).catch((err) => {
        log(err)
      })
    }
  }
}
