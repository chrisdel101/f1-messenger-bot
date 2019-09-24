const https = require('https')
const moment = require('moment')
const cache = require('./cache')

exports.httpsFetch = url => {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      res.setEncoding('utf8')
      res.on('data', d => {
        resolve(d)
      })
    })
  })
}
// check if timestamp is older than mins entered
exports.verifyTimeStamp = (timeStamp, mins) => {
  // console.log('verify')
  const d1 = new moment(timeStamp)
  const d2 = new moment()
  // subract time1 from time 2
  const diff = moment.duration(d2.diff(d1)).asMinutes()
  // console.log('diff', diff)
  // less than 30 mins true, else false
  return diff < mins ? true : false
}

exports.viewCache = type => {
  try {
    if (type === 'team') {
      return cache.teamCache
    } else if (type === 'teams') {
      return cache.teamsCache
    } else if (type === 'driver') {
      return cache.driverCache
    } else if (type === 'drivers') {
      return cache.driversCache
    } else {
      return cache
    }
  } catch (e) {
    console.error('An error in resetCache', e)
  }
}
exports.resetCache = type => {
  try {
    if (type === 'team') {
    } else if (type === 'teams') {
    } else if (type === 'driver') {
    } else if (type === 'drivers') {
    } else {
      console.error('resetCache: Not a valid type')
    }
  } catch (e) {
    console.error('An error in resetCache', e)
  }
}
