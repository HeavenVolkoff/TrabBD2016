/**
 * Static Server initialization
 */
'use strict'

// === Node packages ===
const url = require('url')
const path = require('path')
const http = require('http')
const https = require('https')

// === NPM external packages ===
const connect = require('connect')
const serveStatic = require('serve-static')
const escapeHtml = require('escape-html')

// === Constants ===
const port = {
  http: 80,
  https: 443
}
const defaultOpts = {
  ssl: null,
  hostname: '127.0.0.1',
  root: path.dirname(require.main.filename),
  forceSSL: true
}

/**
 * Redirects a ServerResponse to designated address
 *
 * @param res {ServerResponse}
 * @param method {string}
 * @param status {(number|string)}
 * @param [address] {string}
 */
const redirect = (res, method, status, address) => {
  if (!address) {
    address = status
    status = 302
  }

  res.statusCode = status
  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  res.setHeader('Content-Length', String.byteLength(address))
  res.setHeader('Location', address)

  if (method === 'HEAD') {
    res.end()
    return
  }

  address = escapeHtml(address)
  res.end(`${http.STATUS_CODES[status]}. Redirecting to <a href="${address}">${address}</a>\n`)
}

/**
 * Create a local server to serve a folder using static server middleware
 * @param [opts] {Object}
 * @param [opts.ssl] {Object}
 * @param [opts.port] {Number}
 * @param [opts.hostname] {String}
 * @param [opts.root] {String}
 * @param [opts.headers] {(Object|Map)}
 * @param [opts.forceSSL] {Boolean}
 * @param [opts.setHeaders] {Function}
 * @returns {Server}
 */
module.exports = (opts) => {
  let server
  let middleware
  let isEncrypted = false

  // Parse configuration
  if (typeof opts !== 'object') {
    opts = defaultOpts
  } else {
    opts = Object.assign(Object.create(null), defaultOpts, opts)
  }

  // Create Server
  if (typeof opts.ssl === 'object' && opts.ssl) {
    isEncrypted = true
    server = https.createServer(opts.ssl)
    opts.port = opts.port || port.https
  } else {
    server = http.createServer()
    opts.port = opts.port || port.http
  }

  // === Manage Middleware ===
  middleware = connect()

  if (isEncrypted && opts.forceSSL) {
    middleware.use((req, res, next) => {
      if (req.connection.encrypted) {
        redirect(
          res,
          req.method,
          301,
          'https://' + url.parse(req.headers.host).hostname + (opts.port === port.https ? '' : `:${opts.port}`) + req.originalUrl
        )
        return
      }

      next()
    })
  }

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

  // Add middleware to request listeners
  server.on('request', middleware)
  // Initialize server
  server.listen(opts.port, opts.hostname)

  return server
}
