const https = require('https')
const moment = require('moment')
let { cache, testCache } = require('./cache')

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
  // console.log('mins', mins)
  // less than 30 mins true, else false
  return diff < mins ? true : false
}

exports.viewCache = type => {
  try {
    if (process.env.NODE_ENV === 'testing') {
      if (type === 'team') {
        return testCache.testTeamCache
      } else if (type === 'teams') {
        return testCache.testTeamsCache
      } else if (type === 'driver') {
        return testCache.testDriverCache
      } else if (type === 'drivers') {
        return testCache.testDriversCache
      } else {
        return testCache
      }
    } else {
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
    }
  } catch (e) {
    console.error('An error in viewCache', e)
  }
}
exports.resetCache = type => {
  try {
    if (process.env.NODE_ENV === 'testing') {
      if (type === 'team') {
        testCache.testTeamCache = {}
        return testCache.testTeamCache
      } else if (type === 'teams') {
        testCache.testTeamsCache = {}
        return testCache.testTeamsCache
      } else if (type === 'driver') {
        testCache.testDriverCache = {}
        return testCache.testDriverCache
      } else if (type === 'drivers') {
        testCache.testDriversCache = {}
        return testCache.testDriversCache
      } else {
        testCache = {}
        return testCache
      }
    } else {
      if (type === 'team') {
        testCache.testTeamCache = {}
        return testCache.testTeamCache
      } else if (type === 'teams') {
        testCache.testTeamsCache = {}
        return testCache.testTeamsCache
      } else if (type === 'driver') {
        testCache.testDriverCache = {}
        return testCache.testDriverCache
      } else if (type === 'drivers') {
        testCache.testDriversCache = {}
        return testCache.testDriversCache
      } else {
        testCache = {}
        return testCache
      }
    }
  } catch (e) {
    console.error('An error in viewCache', e)
  }
}
// create a timestamp delayed by x mins
// https://stackoverflow.com/a/47110455/5972531
exports.createDelayTimeStamp = minsDelay => {
  let date = new Date()
  // current time minus minsDelay - changes value of date above
  let stampMinusMins = date.setMinutes(date.getMinutes() - minsDelay)
  let extract = new Date(stampMinusMins)
  return extract
}
