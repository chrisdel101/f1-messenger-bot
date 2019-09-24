const utils = require('../utils')
const { teamsCache, teamCache } = require('../cache')
const endpoints = require('../endpoints')
const debug = require('debug')
const log = debug('f1:log')
const error = debug('f1:error')



exports.checkTeamApi = nameToCheck => {
  // check if string is team name from api- return name_slug or false
  try {
    log('checkTeamApi')
    nameToCheck = nameToCheck.toLowerCase()
    return Promise.resolve(
      module.exports.cacheAndGetTeams(teamCache, 1400)
    ).then(teams => {
      teams = module.exports.makeTeamEntriesLower(teams)
      // console.log('DDD', teams)
      // compare entry to team names first
      for (let team of teams) {
        // compare against team name
        if (team.name.includes(nameToCheck)) {
          return team.name_slug
        }
      }
      // if not match names - compare entry to team slugs second
      for (let team of teams) {
        // compare against team name
        if (team.name_slug.includes(nameToCheck)) {
          return team.name_slug
        }
      }
      return false
    })
  } catch (e) {
    console.error('An error in checkTeamApi', e)
  }
}
exports.makeTeamEntriesLower = arr => {
  try {
    if (typeof arr === 'string' && !Array.isArray(arr)) {
      arr = JSON.parse(arr)
    }
    return arr.map(obj => {
      obj['name'] = obj['name'].toLowerCase()
      return obj
    })
    // re-stringify for searching later on
  } catch (e) {
    console.error('An error in makeEntriesLower', e)
  }
}
exports.getAllTeamSlugs = () => {
  return utils
    .httpsFetch(endpoints.productionAPI('teams'))
    .then(drivers => drivers)
}

// get array of all teams and cache it - return it
exports.cacheAndGetTeams = (cache, expiryTime) => {
  console.log('cacheAndGetTeams')
  // if not in cache OR time stamp passes fails use new call
  if (
    !cache.hasOwnProperty('teams_slugs') ||
    !utils.verifyTimeStamp(cache['teams_slugs'].timeStamp, expiryTime)
  ) {
    return module.exports.getAllTeamSlugs().then(teams => {
      console.log('NOT FROM CACHE')
      teams = JSON.parse(teams)
      cache['team_slugs'] = {
        team_slugs: teams,
        timeStamp: new Date()
      }
      return teams
    })
  } else {
    console.log('FROM CACHE')
    // if less and 24 hours old get from cache
    return cache['teams_slugs']['teams_slugs']
  }
}
// handle caching and return team obj - returns a promise or object
exports.cacheAndGetTeam = (teamSlug, teamCache) => {
  log('cacheAndGetTeam')
  // if not in cache add to cache
  if (!teamCache.hasOwnProperty(teamSlug)) {
    // call all team api and check if it's there
    return module.exports.checkTeamApi(teamSlug).then(slug => {
      // if team name is valid
      if (slug) {
        //  add to cache
        teamCache[teamSlug] = {
          slug: teamSlug,
          imageUrl: `${endpoints.prodCardsEndpoint}\/api\/team\/${teamSlug}`,
          timeStamp: new Date()
        }
        // console.log('here', teamCache)
        // return new team obj
        return {
          slug: teamSlug,
          imageUrl: `${endpoints.prodCardsEndpoint}\/api\/team\/${teamSlug}`,
          timeStamp: new Date()
        }
      } else {
        console.log('Not a valid team name')
        return false
      }
    })
    // if team is in cache already
  } else if (teamCache.hasOwnProperty(teamSlug)) {
    // check if time is valid
    if (utils.verifyTimeStamp(teamCache[teamSlug].timeStamp)) {
      console.log('valid time stamp')
      // if valid get from cache
      console.log('team from cache')
      return teamCache[teamSlug]
      // if not valid then re-add
    } else {
      console.log('failed time stamp')
      teamCache[teamSlug] = {
        slug: teamSlug,
        imageUrl: `${endpoints.prodCardsEndpoint}\/api\/team\/${teamSlug}`,
        timeStamp: new Date()
      }
      return {
        slug: teamSlug,
        imageUrl: `${endpoints.prodCardsEndpoint}\/api\/team\/${teamSlug}`,
        timeStamp: new Date()
      }
    }
  } else {
    console.log('Not a valid team name to cache')
    return false
  }
}
