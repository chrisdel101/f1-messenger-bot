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
    it('viewCache displays stored teams cache with single team - with cacheAndGetTeam()', function() {
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
    it('viewCache displays stored teams cache with multiple team - with cacheAndGetTeam()', function() {
      // call with two teams
      return Promise.resolve(
        teamController.cacheAndGetTeam('ferrari', testCache.testTeamCache)
      ).then(res => {
        teamController
          .cacheAndGetTeam('mclaren', testCache.testTeamCache)
          .then(res => {
            const cacheResult = utils.viewCache('team')
            console.log(cacheResult)
            teamController
            assert(
              cacheResult.hasOwnProperty('ferrari') &&
                cacheResult.hasOwnProperty('mclaren')
            )
          })
      })
    })
  })
})
