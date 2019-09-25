const assert = require('assert')
let driverController = require('../controllers/driver.controller')
let teamController = require('../controllers/team.controller')
const utils = require('../utils')
const rewire = require('rewire')
const sinon = require('sinon')

// let stub
// before(function() {
//   // set to use rewire
//   teamController = rewire('../controllers/team.controller')
//   stub = sinon.stub()
//   // set what func should return
//   stub.returns({
//     type: 'text',
//     payload: 'fake cache team payload - from a stub'
//   })
//   // patch the function to get handleMessageType to take correct path
//   teamController.__set__('driversCache', stub)
// })
describe('teams controller', function() {
  describe('getAllTeamSlugs()', () => {
    it('getAllTeamSlugs returns an array after parsing', function() {
      return teamController.getAllTeamSlugs().then(result => {
        assert(typeof result === 'string')
        //   parse Json
        const parsed = JSON.parse(result)
        assert(Array.isArray(parsed))
      })
    })
    //   check json string before parsing
    it('getAllTeamSlugs returns all teams', () => {
      return teamController.getAllTeamSlugs().then(result => {
        assert(result.includes('mercedes'))
        assert(result.includes('ferrari'))
      })
    })
  })
  describe('cacheAndGetTeams()', () => {
    it('cacheAndGetTeams adds slugs array to cache - hits the hasOwnProperty team_slugs condition', function() {
      sinon.spy(teamController, 'getAllTeamSlugs')
      let fakeCache = {}
      return teamController.cacheAndGetTeams(fakeCache, 1400).then(res => {
        // console.log('res', res)
        // console.log('fake', fakeCache['teams_slugs'])
        // get goes correct path - fix once SO question answered
        assert(teamController.getAllTeamSlugs.calledOnce)
        // check added to cache
        assert(fakeCache.hasOwnProperty('teams_slugs'))
        assert(fakeCache['teams_slugs'].hasOwnProperty('timeStamp'))
        teamController.getAllTeamSlugs.restore()
      })
    })
    it('cacheAndGetTeams returns drivers arr after caching', function() {
      const fakeCache = {}
      return teamController.cacheAndGetTeams(fakeCache, 1400).then(res => {
        assert(Array.isArray(res))
        assert(res.length > 0)
      })
    })
    it('cacheAndGetTeams gets drivers data from cache - verifyTimestamp() called and getAllTeamSlugs() not called', function() {
      sinon.spy(utils, 'verifyTimeStamp')
      sinon.spy(teamController, 'getAllTeamSlugs')
      const fakeCache = {
        teams_slugs: {
          teams_slugs: [{ name: 'Test Team', name_slug: 'test_team' }],
          timeStamp: new Date()
        }
      }
      return Promise.resolve(
        teamController.cacheAndGetTeams(fakeCache, 1400)
      ).then(res => {
        assert(utils.verifyTimeStamp.calledOnce)
        assert(teamController.getAllTeamSlugs.notCalled)
        teamController.getAllTeamSlugs.restore()
        utils.verifyTimeStamp.restore()
      })
    })
    it('cacheAndGetTeams gets drivers data from cache - returns drivers', function() {
      const fakeCache = {
        teams_slugs: {
          teams_slugs: [{ name: 'Test Team', name_slug: 'test_team' }],
          timeStamp: new Date()
        }
      }
      return Promise.resolve(
        teamController.cacheAndGetTeams(fakeCache, 1400)
      ).then(res => {
        // convert to strings to compare res - to comapre 2 arrays
        assert.strictEqual(
          JSON.stringify(res),
          JSON.stringify(fakeCache['teams_slugs']['teams_slugs'])
        )
      })
    })
  })
  describe('cacheAndGetTeam', () => {
    it('cacheAndGetTeam returns new tean obj', function() {
      const fakeCache = {
        'test-team': {
          imageUrl: 'An image Url',
          timeStamp: new Date()
        }
      }
      // check if cache has that key
      return teamController
        .cacheAndGetTeam('red_bull_racing', fakeCache)
        .then(res => {
          // check that new key was added
          console.log('res', res)
          assert(res.hasOwnProperty('slug') && res.hasOwnProperty('imageUrl'))
          // check url is formed correct
          assert.strictEqual(
            res.imageUrl,
            'https://f1-cards.herokuapp.com/api/team/red_bull_racing'
          )
        })
    })
    it('cacheAndGetTeam adds new driver to cache', function() {
      const fakeCache = {
        'test-team': {
          imageUrl: 'An image Url',
          timeStamp: new Date()
        }
      }
      return driverController
        .cacheAndGetDriver('alexander-albon', fakeCache)
        .then(res => {
          assert(fakeCache.hasOwnProperty('test-team'))
          assert(fakeCache['test-team'].hasOwnProperty('imageUrl'))
          assert(fakeCache.hasOwnProperty('alexander-albon'))
          assert(fakeCache['alexander-albon'].hasOwnProperty('imageUrl'))
        })
    })
    it('cacheAndGetTeam forms correct endpoint URL', function() {
      const fakeCache = {}
      return Promise.resolve(
        teamController.cacheAndGetTeam('ferrari', fakeCache)
      ).then(res => {
        console.log(res)
        assert.strictEqual(
          res.imageUrl,
          'https://f1-cards.herokuapp.com/api/team/ferrari'
        )
      })
    })
    it('cacheAndGetTeam forms correct endpoint URL', function() {
      const fakeCache = {}
      return Promise.resolve(
        teamController.cacheAndGetTeam('racing_point', fakeCache)
      ).then(res => {
        console.log(res)
        assert.strictEqual(
          res.imageUrl,
          'https://f1-cards.herokuapp.com/api/team/racing_point'
        )
      })
    })
  })
  describe('checkTeamApi', () => {
    it('checkTeamApi returns correct team name - using name ferrari', function() {
      return Promise.resolve(teamController.checkTeamApi('scuderia')).then(
        res => {
          assert.strictEqual(res, 'ferrari')
        }
      )
    })
    it('checkTeamApi returns correct team name - using name ferrari', function() {
      return Promise.resolve(teamController.checkTeamApi('scuderia')).then(
        res => {
          assert.strictEqual(res, 'ferrari')
        }
      )
    })
    it('checkTeamApi returns correct team name - using name Aston Martin', function() {
      return Promise.resolve(teamController.checkTeamApi('Aston Martin')).then(
        res => {
          assert.strictEqual(res, 'red_bull_racing')
        }
      )
    })
    it('checkTeamApi returns correct team name - using name Haas', function() {
      return Promise.resolve(teamController.checkTeamApi('Haas')).then(res => {
        assert.strictEqual(res, 'haas_f1_team')
      })
    })
    it('checkTeamApi returns correct team name - using slug red_bull_racing', function() {
      return Promise.resolve(
        teamController.checkTeamApi('red_bull_racing')
      ).then(res => {
        console.log(res)
        assert.strictEqual(res, 'red_bull_racing')
      })
    })
    it('checkTeamApi returns correct team name - using slug alfa_romeo_racing', function() {
      return Promise.resolve(
        teamController.checkTeamApi('alfa_romeo_racing')
      ).then(res => {
        console.log(res)
        assert.strictEqual(res, 'alfa_romeo_racing')
      })
    })
    it('checkTeamApi returns false', function() {
      return Promise.resolve(teamController.checkTeamApi('mclaaren')).then(
        res => {
          assert(!res)
        }
      )
    })
  })

  describe('makeTeamEntriesLower()', () => {
    it('makeTeamEntriesLower makes entries name lower', function() {
      const testArr = [
        { name: 'Test Team Racing', name_slug: 'test_team_racing' },
        { name: 'Some Long Team Racing Name', name_slug: 'some_racing_name' }
      ]
      const res = teamController.makeTeamEntriesLower(testArr)
      assert.strictEqual(res[0].name, testArr[0].name.toLowerCase())
      assert.strictEqual(res[1].name, testArr[1].name.toLowerCase())
    })
  })
})
