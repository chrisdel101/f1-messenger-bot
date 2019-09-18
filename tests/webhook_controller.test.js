const assert = require('assert')
let webhookController = require('../controllers/webhook.controller')
let driverController = require('../controllers/driver.controller')
let teamController = require('../controllers/team.controller')
const { httpsFetch } = require('../utils')
const utils = require('../utils')
const rewire = require('rewire')
const sinon = require('sinon')
const responses = require('../responses.json')

let stub
before(function() {
  // set to use rewire
  webHookController = rewire('../controllers/webhook.controller')
  driverController = rewire('../controllers/driver.controller')
  stub = sinon.stub()
  // set what func should return
  stub.returns({
    type: 'text',
    payload: 'fake cache payload - from a stub'
  })
  // patch the function to get handleMessageType to take correct path
  webHookController.__set__('driversCache', stub)
})
describe('F1 Messenger tests', function() {
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
      it('cacheAndGetTeams adds slugs array to cache - hits the no team slugs condition', function() {
        sinon.spy(teamController, 'getAllTeamSlugs')
        let fakeCache = {}
        return teamController.cacheAndGetTeams(fakeCache, 1400).then(res => {
          // console.log(fakeCache['team_slugs'])
          // get goes correct path - fix once SO question answered
          assert(teamController.getAllTeamSlugs.calledOnce)
          // check added to cache
          assert(fakeCache.hasOwnProperty('team_slugs'))
          assert(fakeCache['team_slugs'].hasOwnProperty('timeStamp'))
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
      it('cacheAndGetTeams gets drivers data from cache - verifyTimestamp and getAllTeamSlugs not called', function() {
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
          // teamController.getAllTeamSlugs.restore()
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
              'https://f1-cards.herokuapp.com/api/driver/red_bull_racing'
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
    })
    describe('checkTeamApi', () => {
      it('checkTeamApi returns correct team name - using name ferrari', function() {
        return Promise.resolve(teamController.checkTeamApi('scuderia')).then(
          res => {
            assert.strictEqual(res, 'ferrari')
          }
        )
      })
      it('checkTeamApi returns correct team name - using name Aston Martin', function() {
        return Promise.resolve(
          teamController.checkTeamApi('Aston Martin')
        ).then(res => {
          assert.strictEqual(res, 'red_bull_racing')
        })
      })
      it('checkTeamApi returns correct team name - using name Haas', function() {
        return Promise.resolve(teamController.checkTeamApi('Haas')).then(
          res => {
            assert.strictEqual(res, 'haas_f1_team')
          }
        )
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
  describe('drivers controller', function() {
    describe('getAllDriverSlugs()', () => {
      it('getAllDriverSlugs returns an array after parsing', function() {
        return driverController.getAllDriverSlugs().then(result => {
          // console.log('re', res)
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
    describe('cacheAndGetDriver()', () => {
      it('cacheAndGetDriver returns new driver to obj', function() {
        const fakeCache = {
          'lewis-hamilton': {
            imageUrl: 'An image Url',
            timeStamp: new Date()
          }
        }
        // check if cache has that key
        return driverController
          .cacheAndGetDriver('alexander-albon', fakeCache)
          .then(res => {
            // check that new key was added
            assert(res.hasOwnProperty('slug') && res.hasOwnProperty('imageUrl'))
            // check url is formed correct
            assert.strictEqual(
              res.imageUrl,
              'https://f1-cards.herokuapp.com/api/driver/alexander-albon'
            )
          })
      })
      it('cacheAndGetDriver adds new driver to cache', function() {
        const fakeCache = {
          'lewis-hamilton': {
            imageUrl: 'An image Url',
            timeStamp: new Date()
          }
        }
        return driverController
          .cacheAndGetDriver('alexander-albon', fakeCache)
          .then(res => {
            assert(fakeCache.hasOwnProperty('lewis-hamilton'))
            assert(fakeCache['lewis-hamilton'].hasOwnProperty('imageUrl'))
            assert(fakeCache.hasOwnProperty('alexander-albon'))
            assert(fakeCache['alexander-albon'].hasOwnProperty('imageUrl'))
          })
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
  describe('webhook controller', function() {
    describe('handleMessageType()', () => {
      it('handleMessageType handles partial driver name', function() {
        // replace function with a spy
        sinon.spy(webhookController, 'callSendAPI')
        return (
          // call with partial name
          webhookController
            .handleMessageType('2399043010191818', {
              message: {
                text: 'pierre'
              }
            })
            // check func gets called/
            .then(res => {
              // check callSendAPI called
              assert(webhookController.callSendAPI.calledOnce)
              // check return value
              assert.deepEqual(res.attachment, {
                type: 'image',
                payload: {
                  url: 'https://f1-cards.herokuapp.com/api/driver/pierre-gasly',
                  is_reusable: true
                }
              })
              webhookController.callSendAPI.restore()
            })
        )
      })
      it('handleMessageType handles image: returns response and calls callSendAPI; spy callSendAPI', function() {
        // replace function with a spy
        sinon.spy(webhookController, 'callSendAPI')
        return (
          webhookController
            .handleMessageType('2399043010191818', {
              message: {
                text: 'Lewis Hamilton'
              }
            })
            // check func gets called/
            .then(res => {
              // check callSendAPI called
              // console.log('count', res)
              assert(webhookController.callSendAPI.calledOnce)
              // check return value
              assert.deepEqual(res.attachment, {
                type: 'image',
                payload: {
                  url:
                    'https://f1-cards.herokuapp.com/api/driver/lewis-hamilton',
                  is_reusable: true
                }
              })
              webhookController.callSendAPI.restore()
            })
        )
      })
      // stub of checkInputText not working
      it('handleMessageType handles image: returns response and calls callSendAPI; spy callSendAPI; stub checkInputText', function() {
        // replace function with a spy
        sinon.spy(webhookController, 'callSendAPI')
        // console.log('res', webHookController.callSendAPI)

        // stub checkInputText - forced to return an image type
        let stub = sinon.stub()
        stub.returns({
          type: 'image',
          url: 'some image Url',
          is_reusable: true
        })
        // console.log('stub', stub())
        webHookController.__set__('checkInputText', stub)
        return (
          webhookController
            .handleMessageType('2399043010191818', {
              message: {
                text: 'Lewis Hamilton'
              }
            })
            // check func gets called/
            .then(res => {
              // check callSendAPI called
              // console.log('count', webhookController.callSendAPI.callCount)
              assert(webhookController.callSendAPI.calledOnce)
              // check return value
              assert.deepEqual(res.attachment, {
                type: 'image',
                payload: {
                  url:
                    'https://f1-cards.herokuapp.com/api/driver/lewis-hamilton',
                  is_reusable: true
                }
              })
              webhookController.callSendAPI.restore()
              stub.reset()
            })
        )
      })
      it('handleMessageType handles image: returns response and calls callSendAPI', function() {
        // webhookController.callSendAPI.restore()
        // replace function with a spy
        sinon.spy(webhookController, 'callSendAPI')
        // console.log(typeof webHookController.callSendAPI)
        return (
          webhookController
            .handleMessageType('2399043010191818', {
              message: {
                text: 'Lewis Hamilton'
              }
            })
            // check func gets called/
            .then(res => {
              // console.log('RES', res)
              // check callSendAPI called
              assert(webhookController.callSendAPI.calledOnce)
              // check return value
              assert.deepEqual(res.attachment, {
                type: 'image',
                payload: {
                  url:
                    'https://f1-cards.herokuapp.com/api/driver/lewis-hamilton',
                  is_reusable: true
                }
              })
              webhookController.callSendAPI.restore()
            })
        )
      })
      it.skip('handleMessageType calls checkInput text when passed text; spy checkTextInput', function() {
        // replace function with a spy
        sinon.spy(webhookController, 'checkInputText')
        // let spy = sinon.spy()
        // driverController.__set__('checkInputText', spy)
        console.log(webhookController)
        return (
          webhookController
            .handleMessageType('2399043010191818', {
              message: {
                text: 'Some text passed in'
              }
            })
            // check func gets called/

            .then(res => {
              // console.log(res)
              // check that callSendAPI is called
              assert(driverController.checkInputText.calledOnce)
              // check return value
              // assert.deepEqual(res, { text: responses.filler })
              // driverController.checkInputText.restore()
            })
        )
      })
    })
    describe.only('checkInputText()', () => {
      it('checkInputText returns card.driver response', function() {
        return (
          Promise.resolve(webhookController.checkInputText('racer'))
            // check f(unPromise.resolvec gets called/
            .then(res => {
              assert.strictEqual(res.payload, responses.card.driver)
            })
        )
      })
      it('checkInputText returns filler text', function() {
        return (
          Promise.resolve(webhookController.checkInputText('Just some text'))
            // check func gets called/
            .then(res => {
              console.log(res)
              if (res.payload) {
                console.log('HERE')
                assert(res.payload, responses.filler)
              } else {
                assert(res, responses.filler)
              }
            })
        )
      })
      it('checkInputText returns greeting prompt - lowercase', function() {
        return Promise.resolve(webhookController.checkInputText('hello')).then(
          res => {
            assert.strictEqual(
              res.payload,
              'Welcome to Formula1 Cards. To get a card enter the name of the Formula1 driver.'
            )
          }
        )
      })
      it('checkInputText returns help prompt - lowercase ', function() {
        return Promise.resolve(webhookController.checkInputText('help')).then(
          res => {
            assert.strictEqual(res.payload, 'What can we do to help you today?')
          }
        )
      })
      it('checkInputText returns help prompt - uppercase ', function() {
        return Promise.resolve(webhookController.checkInputText('HELP')).then(
          res => {
            assert.strictEqual(res.payload, 'What can we do to help you today?')
          }
        )
      })
      it('checkInputText returns driver', function() {
        // set to use rewire
        // let webHookController = rewire('../controllers/webhook.controller')
        const fakeCache = {
          'fake-test-driver': {
            imageUrl: 'fake url',
            timeStamp: new Date('Wed Sep 04 2019 13:27:11 GMT-0600')
          }
        }
        driverController.__set__('driversCache', fakeCache)
        return Promise.resolve(
          webhookController.checkInputText('Lewis Hamilton', fakeCache)
        ).then(res1 => {
          res1.payload.then(payload => {
            assert(
              payload.hasOwnProperty('slug') &&
                payload.hasOwnProperty('imageUrl')
            )
            assert(payload.slug === 'lewis-hamilton')
            // check that new driver added to cache
            assert(
              Object.keys(driverController.__get__('driversCache')).includes(
                'lewis-hamilton'
              )
            )
          })
        })
      })
      it('checks for partial names - returns correct driver slug and URL', function() {
        const fakeCache = {
          'fake-test-driver': {
            imageUrl: 'fake url',
            timeStamp: new Date('Wed Sep 04 2019 13:27:11 GMT-0600')
          }
        }
        return Promise.resolve(
          webhookController.checkInputText('lewis', fakeCache)
        )
          .then(res => {
            res.payload
              .then(payload => {
                assert.strictEqual(payload.slug, 'lewis-hamilton')
                assert.strictEqual(
                  payload.imageUrl,
                  'https://f1-cards.herokuapp.com/api/driver/lewis-hamilton'
                )
              })
              .catch(e => {
                assert.fail()
                console.error(
                  'error in checkInputText(): checks for partial names - returns correct driver slug and URL',
                  e
                )
              })
          })
          .catch(e => {
            assert.fail()
            console.error(
              'error in checkInputText() - checks for partial names - returns correct driver slug and URL',
              e
            )
          })
      })
      it('checks for partial names - returns correct obj', function() {
        const fakeCache = {
          'fake-test-driver': {
            imageUrl: 'fake url',
            timeStamp: new Date('Wed Sep 04 2019 13:27:11 GMT-0600')
          }
        }
        return Promise.resolve(
          webhookController.checkInputText('lewis', fakeCache)
        )
          .then(res => {
            return res.payload
              .then(payload => {
                assert.deepEqual(payload, {
                  slug: 'lewis-hamilton',
                  imageUrl:
                    'https://f1-cards.herokuapp.com/api/driver/lewis-hamilton',
                  timeStamp: new Date()
                })
              })
              .catch(e => {
                console.error(
                  'error in checks for partial names - return correct obj bottom',
                  e
                )
              })
          })
          .catch(e => {
            console.error(
              'error in checks for partial names - returns returns correct obj top',
              e
            )
          })
      })
      it.only('checks for partial names - uppercase', function() {
        const fakeCache = {
          'fake-test-driver': {
            imageUrl: 'fake url',
            timeStamp: new Date('Wed Sep 04 2019 13:27:11 GMT-0600')
          }
        }
        return Promise.resolve(
          webhookController.checkInputText('VALTTERI', fakeCache)
        ).then(res => {
          return res.payload.then(res => {
            // check it returns correct driver
            assert.strictEqual(res.slug, 'valtteri-bottas')
            assert(res.hasOwnProperty('imageUrl'))
            assert(res.imageUrl.includes('valtteri-bottas'))
          })
        })
      })
      // it('teams', function() {
      //   const fakeCache = {
      //   }
      //   return Promise.resolve(
      //     webhookController.checkInputText('mercedes', fakeCache)
      //   ).then(res => console.log('res', res))
      // })
    })
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
  })
})
