const assert = require('assert')
let driverController = require('../controllers/driver.controller')
const utils = require('../utils')
const rewire = require('rewire')
const sinon = require('sinon')
const { cache, testCache } = require('../cache')

describe('drivers controller', function() {
  describe('getRandomDriver()', () => {
    // assure random func it called
    it('getRandomDriver calls return getRandomInt', function() {
      sinon.spy(utils, 'getRandomInt')
      return Promise.resolve(
        driverController
          .getRandomDriver(testCache.testDriversCache, 1400)
          .then(res => {
            assert(utils.getRandomInt.calledOnce)
            utils.getRandomInt.restore()
          })
      )
    })
    it('getRandomDriver returns a driver obj', function() {
      return Promise.resolve(
        driverController
          .getRandomDriver(testCache.testDriversCache, 1400)
          .then(res => {
            assert(res.hasOwnProperty('name'))
            assert(res.hasOwnProperty('name_slug'))
          })
      )
    })
  })
  describe('getAllDriverSlugs()', () => {
    it('getAllDriverSlugs returns an array after parsing', function() {
      return driverController.getAllDriverSlugs().then(result => {
        // console.log('re', result)
        // unparsed json
        assert(typeof result === 'string')
        //   parse Json
        const parsed = JSON.parse(result)
        assert(Array.isArray(parsed))
      })
    })
    //   check json string before parsing
    it('getAllDriverSlugs returns all drivers', () => {
      return driverController.getAllDriverSlugs().then(result => {
        // console.log(result)
        assert(result.includes('lewis-hamilton'))
        assert(result.includes('alexander-albon'))
      })
    })
  })
  describe('cacheAndGetDrivers()', () => {
    it('cacheAndGetDrivers adds driver slugs array to cache - hits the no driver slugs ', function() {
      const fakeCache = {}
      return driverController.cacheAndGetDrivers(fakeCache).then(res => {
        // console.log(fakeCache['drivers'])
        assert(fakeCache.hasOwnProperty('drivers_slugs'))
        assert(fakeCache.drivers_slugs.hasOwnProperty('drivers_slugs'))
        assert(Array.isArray(fakeCache.drivers_slugs['drivers_slugs']))
      })
    })
    it('cacheAndGetDrivers returns drivers arr after caching', function() {
      const fakeCache = {}
      return driverController.cacheAndGetDrivers(fakeCache).then(res => {
        assert(Array.isArray(res))
        assert(res.length > 0)
      })
    })
    it('cacheAndGetDrivers adds timestamp to cache', function() {
      const fakeCache = {}
      return driverController.cacheAndGetDrivers(fakeCache).then(res => {
        assert(fakeCache.drivers_slugs.hasOwnProperty('timeStamp'))
      })
    })
    it('cacheAndGetDrivers gets from cache - passes timestamp validation', function() {
      // console.log('bottom', driverController)
      sinon.spy(driverController, 'getAllDriverSlugs')
      sinon.spy(utils, 'verifyTimeStamp')

      const fakeCache = {
        drivers_slugs: {
          drivers_slugs: [{ name: 'Test Name1', name_slug: 'test-name1' }],
          timeStamp: new Date()
        }
      }
      return Promise.resolve(
        driverController.cacheAndGetDrivers(fakeCache, 1400)
      ).then(res => {
        // does not call API function
        assert(driverController.getAllDriverSlugs.notCalled)
        // does call verification
        assert(utils.verifyTimeStamp.calledOnce)
        driverController.getAllDriverSlugs.restore()
        utils.verifyTimeStamp.restore()
      })
    })
    it('cacheAndGetDrivers gets values from api - fails verifyTimeStamp ', function() {
      sinon.spy(utils, 'verifyTimeStamp')
      sinon.spy(driverController, 'getAllDriverSlugs')
      const fakeCache = {
        drivers_slugs: {
          drivers_slugs: [{ name: 'Test Name1', name_slug: 'test-name1' }],
          timeStamp: new Date('2019-09-04 19:30:26')
        }
      }
      return Promise.resolve(
        driverController.cacheAndGetDrivers(fakeCache, 1400)
      ).then(res => {
        console.log('utils', utils)
        // should call buy bypass verifyTimeStamp
        assert(utils.verifyTimeStamp.calledOnce)
        // should byp ass call to API
        assert(driverController.getAllDriverSlugs.calledOnce)
        // check cache value.
        driverController.getAllDriverSlugs.restore()
        utils.verifyTimeStamp.restore()
      })
    })
  })
  describe('checkDriverApi()', () => {
    it('returns true when matches', function() {
      return driverController.checkDriverApi('Pierre Gasly').then(res => {
        console.log(res)
        assert.strictEqual(res, 'pierre-gasly')
      })
    })
    it('returns false when not matches', function() {
      return driverController.checkDriverApi('Pierre Gaslly').then(res => {
        assert(res === false)
      })
    })
    it('gets partial names of drivers', function() {
      return driverController.checkDriverApi('lewi').then(res => {
        assert(res === false)
      })
    })
    it('gets partial names of drivers', function() {
      return driverController.checkDriverApi('lewis').then(res => {
        assert.strictEqual(res, 'lewis-hamilton')
      })
    })
  })
  describe('extractDriverNames', () => {
    it('test', function() {
      const arr = [
        { name: 'Test Driver 1', name_slug: 'test-driver1' },
        { name: 'Test Driver 2', name_slug: 'test-driver2' },
        { name: 'Some Driver 3', name_slug: 'some-driver3' }
      ]
      const res = driverController.extractDriverNames(arr)
      assert(res, Array.isArray(res))
      assert(res[0].hasOwnProperty('firstName'))
      assert(res[0]['firstName'] === 'test')
      assert(res[2].hasOwnProperty('lastName'))
      assert(res[2]['firstName'] === 'some')
    })
  })
  // check function returns
  // check function caches
  describe('cacheAndGetDriver()', () => {
    it('cacheAndGetDriver caches new driver to cache - non-empty cache', function() {
      const fakeCache = {
        'lewis-hamilton': {
          imageUrl: 'fakeImageUrl.com',
          mobileImageUrl: 'fakeMobileImageUrl.com',
          timeStamp: new Date()
        }
      }
      return driverController
        .cacheAndGetDriver('alexander-albon', fakeCache)
        .then(res => {
          // check for old data
          assert(fakeCache.hasOwnProperty('lewis-hamilton'))
          assert(fakeCache['lewis-hamilton'].hasOwnProperty('imageUrl'))
          assert(fakeCache['lewis-hamilton'].hasOwnProperty('mobileImageUrl'))
          // check for new data
          assert(fakeCache.hasOwnProperty('alexander-albon'))
          assert(fakeCache['alexander-albon'].hasOwnProperty('imageUrl'))
          assert(fakeCache['alexander-albon'].hasOwnProperty('mobileImageUrl'))
        })
    })
    it('cacheAndGetDriver caches new driver to cache - empty cache', function() {
      const fakeCache = {}
      return driverController
        .cacheAndGetDriver('alexander-albon', fakeCache)
        .then(res => {
          assert(fakeCache.hasOwnProperty('alexander-albon'))
          assert(fakeCache['alexander-albon'].hasOwnProperty('imageUrl'))
          assert(fakeCache['alexander-albon'].hasOwnProperty('mobileImageUrl'))
        })
    })
    it('cacheAndGetDriver gets driver from the cache - timeStamp verified', function() {
      // called only on fetch
      sinon.spy(driverController, 'checkDriverApi')
      // called only when timestamp fails
      sinon.spy(driverController, 'createDriverObject')
      // create a timestamp 15mins older than when tests are run
      const fakeCache = {
        'alexander-albon': {
          imageUrl: 'fakeImageUrl.com',
          mobileImageUrl: 'fakeMobileImageUrl.com',
          timeStamp: utils.createDelayTimeStamp(15)
        }
      }
      return Promise.resolve(
        driverController.cacheAndGetDriver('alexander-albon', fakeCache)
      ).then(res => {
        // check api was not called
        assert(driverController.checkDriverApi.notCalled)
        // check cache was called - not created
        assert(driverController.createDriverObject.notCalled)
        assert(fakeCache.hasOwnProperty('alexander-albon'))
        assert(fakeCache['alexander-albon'].hasOwnProperty('imageUrl'))
        assert(fakeCache['alexander-albon'].hasOwnProperty('mobileImageUrl'))
        driverController.createDriverObject.restore()
        driverController.checkDriverApi.restore()
      })
    })
    it('cacheAndGetDriver gets driver from the cache - timeStamp failed', function() {
      sinon.spy(driverController, 'createDriverObject')
      sinon.spy(driverController, 'checkDriverApi')
      const fakeCache = {
        'alexander-albon': {
          imageUrl: 'fakeImageUrl.com',
          mobileImageUrl: 'fakeMobileImageUrl.com',
          timeStamp: utils.createDelayTimeStamp(31)
        }
      }
      return Promise.resolve(
        driverController.cacheAndGetDriver('alexander-albon', fakeCache)
      ).then(res => {
        // check api was not called
        assert(driverController.checkDriverApi.notCalled)
        // check cache was not called - obj created
        assert(driverController.createDriverObject.calledOnce)
        assert(fakeCache.hasOwnProperty('alexander-albon'))
        assert(fakeCache['alexander-albon'].hasOwnProperty('imageUrl'))
        assert(fakeCache['alexander-albon'].hasOwnProperty('mobileImageUrl'))
        // console.log(fakeCache)
        driverController.createDriverObject.restore()
        driverController.checkDriverApi.restore()
      })
    })
  })
  describe('createDriverObject()', () => {
    it('createDriverObject creates a new driver obj - real driver', function() {
      const res = driverController.createDriverObject('sebastian-vettel')
      assert.strictEqual(res.slug, 'sebastian-vettel')
      assert(res.hasOwnProperty('imageUrl'))
      assert(res.hasOwnProperty('mobileImageUrl'))
      assert(res.imageUrl.includes('api/driver/sebastian-vettel'))
      assert(res.mobileImageUrl.includes('mobile/driver/sebastian-vettel'))
    })
    it('createDriverObject creates new driver obj - fake driver', function() {
      const res = driverController.createDriverObject('fake-driver')
      assert(res.hasOwnProperty('imageUrl'))
      assert(res.hasOwnProperty('mobileImageUrl'))
    })
    it('createDriverObject throws error when no slug input', function() {
      assert.throws(() => driverController.createDriverObject(), Error)
    })
  })
  describe('makeEntriesLower()', () => {
    it('makeEntriesLower makes entries lower', function() {
      // func takes stringified obj
      const stringified = JSON.stringify([
        {
          name: 'Test Name Here',
          name_slug: 'test-name-here'
        }
      ])
      // need to parse here to check values
      const res = JSON.parse(driverController.makeEntriesLower(stringified))
      const ex = {
        name: 'test name here',
        name_slug: 'test-name-here'
      }
      assert.deepEqual(res[0], ex)
    })
    it('makeEntriesLower returns stringified obj', function() {
      // func takes stringified obj
      const stringified = JSON.stringify([
        {
          name: 'Test Name Here',
          name_slug: 'test-name-here'
        }
      ])
      // need to parse here to check values
      const res = driverController.makeEntriesLower(stringified)
      assert(typeof res === 'string')
    })
  })
})
