const { verifyTimeStamp } = require('../utils')
const { teamsCache } = require('../cache')

exports.checkTeamApi = input => {}

exports.getAllTeamSlugs() = () => {
    
}

exports.getAndCacheTeams = (cache, expiryTime) => {
  // if not in cache OR time stamp passes fails use new call
  if (
    !cache.hasOwnProperty('teams_slugs') ||
    !verifyTimeStamp(cache['teams_slugs'].timeStamp, expiryTime)
  ) {
    return module.exports.getAllDriverSlugs().then(drivers => {
      console.log('NOT FROM CACHE')
      drivers = JSON.parse(drivers)
      cache['drivers_slugs'] = {
        drivers_slugs: drivers,
        timeStamp: new Date()
      } 
      // console.log('here', drivers)
      return drivers
    })
  } else {
    console.log('FROM CACHE')
    // if less and 24 hours old get from cache
    // if (verifyTimeStamp(cache['drivers_slugs'].timeStamp)) {
    console.log('CA', cache['drivers_slugs'].timeStamp)
    return cache['drivers_slugs']['drivers_slugs']
    // } else {
    //   cache['drivers'] = {
    //     drivers_slugs: drivers,
    //     timeStamp: new Date()
    //   }
  }
}
