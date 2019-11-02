var express = require('express');
var router = express.Router();
const coinbase = require("../coinbase");
const config = require("../config");
const steem = require("steem");

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.json({
        version: "1.0.0"
    });
});

router.post("/coinbase/webhook", (req, res) => {

    const signature = req.headers["x-cc-webhook-signature"];
    const bodyString = JSON.stringify(req.body);

    const isVerified = coinbase.client.verifyWebhookSignature(signature, bodyString, coinbase.webhook.sharedSecret);

    if (isVerified) {
        console.log("> Verified Request:", bodyString)
        let meta = req.body.event.data.metadata;
        if (meta.receiver && meta.quantity) {
            console.log("> Event Metadata includes Receiver and Quantity.")
            if (meta.secret === config.secret) {
                console.log("> Event Secret is correct.")
                meta.memo = meta.memo + " -- " + req.body.event.data.code;
                console.log("----" + (new Date()).toString())
                steem.broadcast.send({
                    operations: [coinbase.buildSteemPayTX(config.SE.bank_account, meta.receiver, config.SE.symbol, meta.quantity, meta.memo)]
                }, {active: config.SE.active_wif}, (err, result) => {
                    if (err) {
                        console.log("> Failed to transfer token:");
                        console.log(err)
                    } else {
                        console.log("> Sent Token:", meta.quantity, config.SE.symbol, "to", meta.receiver, ":: https://steemd.com/tx/" + result.id);
                    }
                });
            }
        }
    } else {
        console.log("> Invalid Webhook request.")
    }
    res.status(200).end()
});


module.exports = router;
