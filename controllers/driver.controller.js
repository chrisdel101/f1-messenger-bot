const { httpsFetch, verifyTimeStamp } = require('../utils')
const endpoints = require('../endpoints')
const testWordsJson = require('../test_words.json')
const responses = require('../responses.json')
const { driverCache, driversCache } = require('../cache')
const moment = require('moment')
// https://stackoverflow.com/q/26885685/5972531
const debug = require('debug')
const log = debug('f1:log')
const error = debug('f1:error')

exports.getAllDriverSlugs = () => {
  return httpsFetch(endpoints.productionAPI('drivers')).then(drivers => drivers)
}
// make all names lowercase
exports.makeEntriesLower = arr => {
  try {
    if (typeof arr === 'string' && !Array.isArray(arr)) {
      arr = JSON.parse(arr)
    }
    let newArr = arr.map(obj => {
      obj['name'] = obj['name'].toLowerCase()
      obj['name_slug'] = obj['name_slug'].toLowerCase()
      return obj
    })
    // re-stringify for searching later on
    return JSON.stringify(newArr)
  } catch (e) {
    console.error('An error in makeEntriesLower', e)
  }
}
// take in drivers json and add first and last name keys
// return new arr
exports.extractDriverNames = driversArr => {
  return driversArr.map(driverObj => {
    let firstName = driverObj.name_slug.split('-')[0]
    let lastName = driverObj.name_slug.split('-')[1]
    driverObj['firstName'] = firstName
    driverObj['lastName'] = lastName
    return driverObj
  })
}
// check if string is driver name from api- return name_slug or false
exports.checkDriverApi = nameToCheck => {
  try {
    log('checkDriverApi')
    nameToCheck = nameToCheck.toLowerCase()

    return Promise.resolve(
      module.exports.cacheAndGetDrivers(driversCache, 1400)
    ).then(drivers => {
      console.log('DDD', drivers)
      drivers = module.exports.makeEntriesLower(drivers)
      drivers = module.exports.extractDriverNames(JSON.parse(drivers))
      // check user input first/last names of drivers against data
      for (let driver of drivers) {
        for (let key in driver) {
          if (driver[key] === nameToCheck) {
            return driver['name_slug']
          }
        }
      }
      return false
    })
  } catch (e) {
    console.error('An error in checkDriverApi', e)
  }
}
// gets/caches drivers array from api and returns array
exports.cacheAndGetDrivers = (cache, expiryTime) => {
  // if not in cache OR time stamp passes fails use new call
  if (
    !cache.hasOwnProperty('drivers_slugs') ||
    !verifyTimeStamp(cache['drivers_slugs'].timeStamp, expiryTime)
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

// handle caching and return driver obj - returns a promise or object
exports.cacheAndGetDriver = (driverSlug, driverCache) => {
  log('cacheAndGetDriver')
  // if not in cache add to cache
  if (!driverCache.hasOwnProperty(driverSlug)) {
    // call all drivers api and check if it's there
    return module.exports.checkDriverApi(driverSlug).then(slug => {
      // if driver name is valid
      if (slug) {
        //  add to cache
        driverCache[driverSlug] = {
          slug: driverSlug,
          imageUrl: endpoints.productionCards(driverSlug),
          timeStamp: new Date()
        }
        // console.log('here', driverCache)
        // return new driver obj
        return {
          slug: driverSlug,
          imageUrl: endpoints.productionCards(driverSlug),
          timeStamp: new Date()
        }
      } else {
        console.log('Not a valid driver name')
        return false
      }
    })
    // if driver is in cache already
  } else if (driverCache.hasOwnProperty(driverSlug)) {
    // check if time is valid
    if (verifyTimeStamp(driverCache[driverSlug].timeStamp)) {
      console.log('valid time stamp')
      // if valid get from cache
      return driverCache[driverSlug]
      // if not valid then re-add
    } else {
      console.log('failed time stamp')
      driverCache[driverSlug] = {
        slug: driverSlug,
        imageUrl: endpoints.productionCards(driverSlug),
        timeStamp: new Date()
      }
      return {
        slug: driverSlug,
        imageUrl: endpoints.productionCards(driverSlug),
        timeStamp: new Date()
      }
    }
  } else {
    console.log('Not a valid driver name to cache')
    return false
  }
}
// take user input and check to send back response
exports.checkInputText = (inputText, cache) => {
  log('checkInputText')
  try {
    // check json first
    if (testWordsJson.prompt_greeting.includes(inputText.toLowerCase())) {
      return {
        type: 'text',
        payload: responses.profile.greeting
      }
    } else if (testWordsJson.prompt_help.includes(inputText.toLowerCase())) {
      return {
        type: 'text',
        payload: responses.help.ask
      }
    } else if (
      testWordsJson.prompt_card.indexOf(inputText.toLowerCase()) != -1
    ) {
      // if text is hello, or other start word, welcome/
      // if help listing a few options
      // if card, driver, team, prompt with which driver?
      switch (testWordsJson.prompt_card.indexOf(inputText.toLowerCase())) {
        case 0:
          return {
            type: 'text',
            payload: responses.card.driver
          }
        case 1:
          return {
            type: 'text',
            payload: responses.card.team
          }
        case 2:
          return {
            type: 'text',
            payload: responses.card.team
          }
        case 3:
          return {
            type: 'text',
            payload: responses.card.driver
          }
      }
    }
    // else check if input was a driver name
    // console.log('pp', Promise.resolve(module.exports.checkDriverApi(inputText)))
    return module.exports.checkDriverApi(inputText).then(driverSlug => {
      console.log('driverSlug', driverSlug)
      // true if a driver name
      if (driverSlug) {
        // - returns a promise if calling from API
        // - returns an object if in the cache
        const driver = module.exports.cacheAndGetDriver(driverSlug, cache)
        // console.log('DD', driver)
        // send driver card info
        return {
          type: 'image',
          payload: driver
        }
        // if not driver call team
      }
      return {
        type: 'text',
        payload: responses.filler
      }
    })
  } catch (e) {
    console.log('An error in checkInputText', e)
  }
}
