const assert = require('assert')
let webhookController = require('../controllers/webhook.controller')
let driverController = require('../controllers/driver.controller')
let teamController = require('../controllers/team.controller')
const { httpsFetch } = require('../utils')
const utils = require('../utils')
const rewire = require('rewire')
const sinon = require('sinon')
const responses = require('../responses.json')
const { cache, testCache } = require('../cache')

describe('utils tests', function() {
  describe('verifyTimeStamp()', () => {
    it('verifyTimeStamp fails older than mins entered', function() {
      // older than 30 mins
      const fakeCache = {
        'lewis-hamilton': {
          imageUrl: 'An image Url',
          timeStamp: new Date('2019-09-04 19:30:26')
        }
      }
      const res = utils.verifyTimeStamp(
        fakeCache['lewis-hamilton'].timeStamp,
        30
      )
      assert(!res)
    })
    it('verifyTimeStamp returns passes when less than time entered', function() {
      // return exact same time as func
      const fakeCache = {
        'lewis-hamilton': {
          imageUrl: 'An image Url',
          timeStamp: new Date()
        }
      }
      const res = utils.verifyTimeStamp(
        fakeCache['lewis-hamilton'].timeStamp,
        30
      )
      assert(res)
    })
  })
  describe('viewCache()', () => {
    it('viewCache displays stored teams cache - using cacheAndGetTeams()', function() {
      return Promise.resolve(
        //   fill cache with testTeamsCache to test
        teamController.cacheAndGetTeams(testCache.testTeamsCache, 1400)
      ).then(res => {
        const cacheResult = utils.viewCache('teams')
        assert(Array.isArray(cacheResult.teams_slugs.teams_slugs))
        assert(cacheResult.teams_slugs.teams_slugs.length > 0)
        assert(cacheResult.hasOwnProperty('teams_slugs'))
      })
    })
    it('viewCache displays stored team cache with single team - with cacheAndGetTeam()', function() {
      // call with two teams
      return Promise.resolve(
        teamController.cacheAndGetTeam('ferrari', testCache.testTeamCache)
      ).then(res => {
        const cacheResult = utils.viewCache('team')
        teamController
        assert(cacheResult.hasOwnProperty('ferrari'))
        assert(cacheResult.ferrari.hasOwnProperty('timeStamp'))
      })
    })
    it('viewCache displays stored team cache with multiple team - with cacheAndGetTeam()', function() {
      // call with two teams
      return Promise.resolve(
        teamController.cacheAndGetTeam('ferrari', testCache.testTeamCache)
      ).then(res => {
        teamController
          .cacheAndGetTeam('mclaren', testCache.testTeamCache)
          .then(res => {
            const cacheResult = utils.viewCache('team')
            teamController
            assert(
              cacheResult.hasOwnProperty('ferrari') &&
                cacheResult.hasOwnProperty('mclaren')
            )
          })
      })
    })
    it('viewCache displays stored drivers cache - using cacheAndGetDrivers()', function() {
      return Promise.resolve(
        driverController.cacheAndGetDrivers(testCache.testDriversCache, 1400)
      ).then(res => {
        const cacheResult = utils.viewCache('drivers')
        assert(cacheResult.hasOwnProperty('drivers_slugs'))
        assert(Array.isArray(cacheResult.drivers_slugs.drivers_slugs))
        assert(cacheResult.drivers_slugs.drivers_slugs.length > 0)
      })
    })
    it('viewCache displays stored driver cache - single driver with cacheAndGetDriver()', function() {
      return Promise.resolve(
        driverController.cacheAndGetDriver(
          'lewis-hamilton',
          testCache.testDriverCache
        )
      ).then(res => {
        const cacheResult = utils.viewCache('driver')
        assert(cacheResult.hasOwnProperty('lewis-hamilton'))
        assert(cacheResult['lewis-hamilton'].slug === 'lewis-hamilton')
      })
    })
    it('viewCache displays stored driver cache - muitple driver with cacheAndGetDriver()', function() {
      return Promise.resolve(
        driverController.cacheAndGetDriver(
          'lewis-hamilton',
          testCache.testDriverCache
        )
      ).then(res => {
        return Promise.resolve(
          driverController.cacheAndGetDriver(
            'charles-leclerc',
            testCache.testDriverCache
          )
        ).then(res => {
          const cacheResult = utils.viewCache('driver')
          assert(cacheResult.hasOwnProperty('lewis-hamilton'))
          assert(cacheResult.hasOwnProperty('charles-leclerc'))
        })
      })
    })
  })
})
