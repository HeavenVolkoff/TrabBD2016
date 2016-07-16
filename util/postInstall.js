'use strict'

const fs = require('fs')

const exists = (path) => {
  try {
    fs.statSync(path)
    return true
  } catch (ignore) {
    return false
  }
}

let createFile = true

if (exists('./localConfiguration.json')) {
  try {
    require('../localConfiguration.json')
    createFile = false
  } catch (ignore) {
    createFile = true
  }
}

if (createFile) {
  fs.writeFileSync('./localConfiguration.json', JSON.stringify({
    db: {},
    server: {}
  }, null, 2))
}
