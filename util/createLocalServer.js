/**
 * Server initialization
 */
'use strict'

const path = require('path')
const http = require('http')
const https = require('https')

const connect = require('connect')
const serveStatic = require('serve-static')

const defaultOpts = {
  ssl: null,
  port: 80,
  hostname: '127.0.0.1',
  root: path.dirname(require.main.filename)
}

/**
 * Create a local server to serve a folder using static server middleware
 * @param [opts] {Object}
 * @param [opts.ssl] {Object}
 * @param [opts.port] {Number}
 * @param [opts.hostname] {String}
 * @param [opts.root] {String}
 * @param [opts.headers] {(Object|Map)}
 * @param [opts.setHeaders] {Function}
 * @returns {Server}
 */
function createLocalServer (opts) {
  let server, middleware

  // Parse configuration
  if (typeof opts !== 'object') {
    opts = defaultOpts
  } else {
    opts.hostname = opts.hostname || defaultOpts.hostname

    if (typeof opts.ssl === 'object') {
      server = https.createServer(opts.ssl)
      opts.port = opts.port || 433
    } else {
      server = http.createServer()
      opts.port = opts.port || 80
    }

    if (!opts.root) {
      opts.root = defaultOpts.root
    }
  }

  middleware = connect()
  middleware.use(
    serveStatic(opts.root, {
      setHeaders: (res, path, stat) => {
        if (typeof opts.setHeaders === 'function') {
          opts.setHeaders(res, path, stat)
        }

        if (typeof opts.headers === 'object') {
          if (opts.headers instanceof Map) {
            for (let [key, value] of opts.headers) {
              res.setHeader(key, value)
            }
          } else if (!Array.isArray(opts.headers)) {
            for (let key in opts.headers) {
              if (opts.headers.hasOwnProperty(key)) {
                res.setHeader(key, opts.headers[key])
              }
            }
          }
        }
      }
    })
  )

  server.on('request', middleware)
  server.listen(opts.port, opts.hostname)

  return server
}

module.exports = createLocalServer
