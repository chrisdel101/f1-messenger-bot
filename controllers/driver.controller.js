const utils = require("../utils")
const endpoints = require("../endpoints")
const testWordsJson = require("../test_words.json")
const responses = require("../responses.json")
const { cache } = require("../cache")
const moment = require("moment")
// https://stackoverflow.com/q/26885685/5972531
const debug = require("debug")
const log = debug("f1:log")
const error = debug("f1:error")

exports.getAllDriverSlugs = () => {
  return utils
    .httpsFetch(`${endpoints.prodAPIEndpoint}/drivers`)
    .then(drivers => drivers)
}
// make all names lowercase
exports.makeEntriesLower = arr => {
  try {
    if (typeof arr === "string" && !Array.isArray(arr)) {
      arr = JSON.parse(arr)
    }
    let newArr = arr.map(obj => {
      obj["name"] = obj["name"].toLowerCase()
      obj["name_slug"] = obj["name_slug"].toLowerCase()
      return obj
    })
    // re-stringify for searching later on
    return JSON.stringify(newArr)
  } catch (e) {
    console.error("An error in makeEntriesLower", e)
  }
}
// take in drivers json and add first and last name keys
// return new arr
exports.extractDriverNames = driversArr => {
  return driversArr.map(driverObj => {
    let firstName = driverObj.name_slug.split("-")[0]
    let lastName = driverObj.name_slug.split("-")[1]
    driverObj["firstName"] = firstName
    driverObj["lastName"] = lastName
    return driverObj
  })
}
// returns obj with driver name and slug
exports.getRandomDriver = () => {
  return Promise.resolve(
    this.cacheAndGetDrivers(cache.driversCache, 1400)
  ).then(res => {
    // random int btw 0 and 20
    const randomInt = utils.getRandomInt(20)
    return res[randomInt]
  })
}
// takes name of driver - check if it is valid name
// gets drivers array from cache or api
// return name_slug or false
exports.checkDriverApi = nameToCheck => {
  try {
    log("checkDriverApi")
    nameToCheck = nameToCheck.toLowerCase()
    return Promise.resolve(
      module.exports.cacheAndGetDrivers(cache.driversCache, 1400)
    ).then(drivers => {
      // console.log('DDD', drivers)
      drivers = module.exports.makeEntriesLower(drivers)
      drivers = module.exports.extractDriverNames(JSON.parse(drivers))
      // check user input first/last names of drivers against data
      for (let driver of drivers) {
        for (let key in driver) {
          if (driver[key] === nameToCheck) {
            // if true return driver name
            return driver["name_slug"]
          }
        }
      }
      return false
    })
  } catch (e) {
    console.error("An error in checkDriverApi", e)
  }
}
// takes a cache obj and timeStamp
// gets/caches drivers array
// returns array cache for from api
exports.cacheAndGetDrivers = (driversCache, expiryTime) => {
  // if not in cache OR time stamp passes fails use new call
  if (
    !driversCache.hasOwnProperty("drivers_slugs") ||
    !utils.verifyTimeStamp(driversCache["drivers_slugs"].timeStamp, expiryTime)
  ) {
    return module.exports.getAllDriverSlugs().then(drivers => {
      console.log("cacheAndGetDrivers() - NOT FROM CACHE")
      drivers = JSON.parse(drivers)
      driversCache["drivers_slugs"] = {
        drivers_slugs: drivers,
        timeStamp: new Date()
      }
      // console.log('here', drivers)
      return drivers
    })
  } else {
    console.log("cacheAndGetDrivers() - FROM CACHE")
    // if less than 24 hours old get from cache
    return driversCache["drivers_slugs"]["drivers_slugs"]
  }
}
exports.createDriverObject = driverSlug => {
  if (!driverSlug) throw Error()
  try {
    return {
      slug: driverSlug,
      mobileImageUrl: `${
        endpoints.prodCardsEndpoint
      }${endpoints.prodDriverCardSm(driverSlug)}`,
      imageUrl: `${endpoints.prodCardsEndpoint}${endpoints.prodDriverCardLg(
        driverSlug
      )}`,
      timeStamp: new Date()
    }
  } catch (e) {
    console.error("An error in driverController.createDriverObject", e)
  }
}

// handle caching and return driver obj - returns a promise or object
exports.cacheAndGetDriver = (driverSlug, driverCache) => {
  try {
    let imageUrl
    // console.log('cacheAndGetDriver()', driverCache)
    log("cacheAndGetDriver")
    // if not in cache add to cache
    if (!driverCache.hasOwnProperty(driverSlug)) {
      // call all drivers api and check if it's there
      return module.exports.checkDriverApi(driverSlug).then(slug => {
        // if driver name is valid
        if (slug) {
          console.log("cacheAndGetDriver() - NOT FROM CACHE")
          //  add to cache
          driverCache[driverSlug] = this.createDriverObject(driverSlug)
          // console.log('here', driverCache)
          // return new driver obj
          return driverCache[driverSlug]
        } else {
          console.log("Not a valid driver name")
          return false
        }
      })
      // if driver is in cache already
    } else if (driverCache.hasOwnProperty(driverSlug)) {
      console.log("cacheAndGetDriver() - FROM CACHE")
      // check if time is valid - less than 30 mins
      if (utils.verifyTimeStamp(driverCache[driverSlug].timeStamp, 30)) {
        console.log("valid time stamp")
        // if valid get from cache
        return driverCache[driverSlug]
        // if not valid then re-add
      } else {
        console.log("cacheAndGetDriver() - NOT FROM CACHE")
        console.log("failed time stamp")
        driverCache[driverSlug] = this.createDriverObject(driverSlug)
        // console.log('here', driverCache)
        // return new driver obj
        return driverCache[driverSlug]
      }
    } else {
      console.log("Not a valid driver name to cache")
      return false
    }
  } catch (e) {
    console.error("An error in driverController.cacheAndGetDriver", e)
  }
}
