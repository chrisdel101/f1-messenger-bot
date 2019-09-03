var express = require('express')
var router = express.Router()
const {
  sendHookResponse,
  verifyHook
} = require('../controllers/webhook.controller')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' })
})
router.get('/webhook', verifyHook)
router.post('/webhook', sendHookResponse)

module.exports = router
