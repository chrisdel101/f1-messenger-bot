var express = require("express")
var router = express.Router()
const utils = require("../utils")
const {
  sendHookResponse,
  verifyHook
} = require("../controllers/webhook.controller")

router.get("/view-cache", (req, res) => {
  console.log(utils.viewCache("development"))
  return res.send(utils.viewCache)
})
router.get("/webhook", verifyHook)
router.post("/webhook", sendHookResponse)

module.exports = router
