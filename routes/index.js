var express = require('express');
var router = express.Router();
const config = require("../config");
const coinbase = require("../coinbase");
/* GET home page. */
router.get('/', function (req, res, next) {

    res.render('layout', {
        token: config.SE.symbol,
        price: config.SE.price_usd.toFixed(2),
        total: (config.SE.price_usd * config.SE.min_purchase).toFixed(2),
        min_purchase: config.SE.min_purchase,
        logo: config.SE.logo,
        contact: config.SE.contact
    });
});

router.get("/thank-you", (req, res) => {
    res.render("thankyou", {
        token: config.SE.symbol,
        price: config.SE.price_usd.toFixed(2),
        total: (config.SE.price_usd * config.SE.min_purchase).toFixed(2),
        min_purchase: config.SE.min_purchase,
        logo: config.SE.logo,
        contact: config.SE.contact
    })
});

router.get("/canceled", (req, res) => {
    res.render("thankyou", {
        token: config.SE.symbol,
        price: config.SE.price_usd.toFixed(2),
        total: (config.SE.price_usd * config.SE.min_purchase).toFixed(2),
        min_purchase: config.SE.min_purchase,
        logo: config.SE.logo,
        contact: config.SE.contact
    })
});


router.post("/checkout", async (req, res) => {
    let amount = parseInt(req.body.quantity);
    let priceUSD = config.SE.price_usd * amount;

    if (amount < config.SE.min_purchase) {
        return res.redirect("/?error=min_quantity");
    }

    const charge = await coinbase.client.charges.create({
        "name": config.SE.symbol + " Token",
        "description": "Purchase " + config.SE.symbol + " easily.",
        "local_price": {
            "amount": priceUSD.toFixed(2),
            "currency": "USD"
        },
        "pricing_type": "fixed_price",
        "metadata": {
            "quantity": amount,
            "receiver": req.body.receiver,
            "memo": req.body.memo || "",
            "secret": config.secret
        },
        "redirect_url": config.host + "/thank-you",
        "cancel_url": config.host + "/canceled",
    });

    res.redirect(charge.data.hosted_url);

});

module.exports = router;
