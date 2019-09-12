const { verifyTimeStamp, httpsFetch } = require('../utils')
const { teamsCache } = require('../cache')
const endpoints = require('../endpoints')

exports.checkTeamApi = input => {}

exports.getAllTeamSlugs = () => {
  return httpsFetch(endpoints.productionAPI('teams')).then(drivers => drivers)
}

exports.getAndCacheTeams = (cache, expiryTime) => {
  // if not in cache OR time stamp passes fails use new call
  if (
    !cache.hasOwnProperty('teams_slugs') ||
    !verifyTimeStamp(cache['teams_slugs'].timeStamp, expiryTime)
  ) {
    return module.exports.getAllTeamSlugs().then(teams => {
      console.log('NOT FROM CACHE')
      teams = JSON.parse(teams)
      cache['team_slugs'] = {
        team_slugs: teams,
        timeStamp: new Date()
      }
      // console.log('here', drivers)
      return teams
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
