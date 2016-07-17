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
        let res = conn.query({
          sql: 'SELECT ufs.sigla FROM ufs',
          rowsAsArray: true
        })

        conn.release()
        return res
      }).then(([rows]) => {
        socket.emit('get_ufs_answer', [].concat(...rows))
      }).catch((err) => {
        log(err)
      })
    },

    get_uf_locations_count: (socket, stateName) => {
      dbPool.getConnection().then((conn) => {
        let res = conn.query(
`SELECT ufs.sigla AS state, count(localizacoes.id) AS quantity
FROM localizacoes
  INNER JOIN ufs ON localizacoes.uf_id = ufs.id
WHERE ufs.sigla = ?
GROUP BY ufs.sigla;`, [stateName])

        conn.release()
        return res
      }).then(([[row]]) => {
        socket.emit('get_uf_locations_count_answer', row)
      }).catch((err) => {
        log(err)
      })
    },

    get_state_floating_info: (socket, uf) => {
      dbPool.getConnection().then((conn) => {
        let res = conn.query(
`SELECT tipos_gestao.descricao AS description, COUNT(tipos_gestao.id) AS quantity
FROM tipos_gestao 
INNER JOIN unidades_saude ON unidades_saude.tipo_gestao_id = tipos_gestao.id 
INNER JOIN localizacoes ON unidades_saude.localizacao_id = localizacoes.id 
INNER JOIN ufs ON localizacoes.uf_id = ufs.id 
WHERE ufs.sigla = ?
GROUP BY tipos_gestao.descricao;`, [uf])

        conn.release()
        return res
      }).then(([[row]]) => {
        row.uf = uf
        socket.emit('get_state_floating_info_answer', row)
      }).catch((err) => {
        log(err)
      })
    }
  }
}
