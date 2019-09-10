const { httpsFetch } = require('../utils')
const endpoints = require('../endpoints')

const testWordsJson = require('../test_words.json')
const responses = require('../responses.json')
const driversCache = require('../driversCache')
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
  arr = JSON.parse(arr)
  let newArr = arr.map(obj => {
    obj['name'] = obj['name'].toLowerCase()
    obj['name_slug'] = obj['name_slug'].toLowerCase()
    return obj
  })
  // re-stringify for searching later on
  return JSON.stringify(newArr)
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
    return module.exports.getAllDriverSlugs().then(drivers => {
      drivers = module.exports.makeEntriesLower(drivers)
      drivers = module.exports.extractDriverNames(JSON.parse(drivers))
      // console.log(drivers)
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
// check if timestamp is older than 30 mins
exports.verifyTimeStamp = timeStamp => {
  const d1 = new moment(timeStamp)
  const d2 = new moment()
  // subract time1 from time 2
  const diff = moment.duration(d2.diff(d1)).asMinutes()
  // less than 30 mins true, else false
  return diff < 30 ? true : false
}
// handle caching and return driver obj - returns a promise or object
exports.cacheAndGetDriver = (driverSlug, driversCache) => {
  log('cacheAndGetDriver')
  // if not in cache add to cache
  if (!driversCache.hasOwnProperty(driverSlug)) {
    // call all drivers api and check if it's there
    return module.exports.checkDriverApi(driverSlug).then(slug => {
      // if driver name is valid
      if (slug) {
        //  add to cache
        driversCache[driverSlug] = {
          slug: driverSlug,
          imageUrl: endpoints.productionCards(driverSlug),
          timeStamp: new Date()
        }
        // console.log('here', driversCache)
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
  } else if (driversCache.hasOwnProperty(driverSlug)) {
    // check if time is valid
    if (module.exports.verifyTimeStamp(driversCache[driverSlug].timeStamp)) {
      // if valid get from cache
      console.log('valid time stamp')
      return driversCache[driverSlug]
      // if not valid then re-add
    } else {
      driversCache[driverSlug] = {
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
  // check if input was a driver name
  try {
    log('checkInputText')
    return module.exports.checkDriverApi(inputText).then(slug => {
      console.log('slug', slug)
      // true if a driver name
      if (slug) {
        // - returns a promise if calling from API
        // - returns an object if in the cache
        const driver = module.exports.cacheAndGetDriver(slug, cache)
        // console.log('DD', driver)
        // send driver card info
        return {
          type: 'image',
          payload: driver
        }
        // if not driver
      } else {
        // if in array return greeting
        if (testWordsJson.prompt_greeting.includes(inputText.toLowerCase())) {
          return {
            type: 'text',
            payload: responses.profile.greeting
          }
        } else if (
          testWordsJson.prompt_help.includes(inputText.toLowerCase())
        ) {
          return {
            type: 'text',
            payload: responses.help.ask
          }
          // if text is hello, or other start word, welcome/
          // if help listing a few options
          // if card, driver, team, prompt with which driver?
        } else if (
          testWordsJson.prompt_card.indexOf(inputText.toLowerCase()) != -1
        ) {
          console.log(
            testWordsJson.prompt_card.indexOf(inputText.toLowerCase())
          )
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
        } else {
          return {
            type: 'text',
            payload: responses.filler
          }
        }
      }
    })
  } catch (e) {
    console.log('An error in checkInputText', e)
  }
}
