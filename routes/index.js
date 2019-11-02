var express = require('express');
var router = express.Router();
const config = require("../config");
const coinbase = require("../coinbase");
const fetch = require("node-fetch");
/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('layout', {
        token: config.SE.symbol,
        price: (() => {
            if (config.SE.price_usd < 0.01) {
                return config.SE.price_usd.toString()
            }

            return config.SE.price_usd.toFixed(2);
        })(),
        step: (() => {
            if (config.SE.price_usd < 0.01) {
                return Math.round(0.01 / config.SE.price_usd)
            }

            return 1;
        })(),
        price_plain: config.SE.price_usd,
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
    res.render("canceled", {
        token: config.SE.symbol,
        price: config.SE.price_usd.toFixed(2),
        total: (config.SE.price_usd * config.SE.min_purchase).toFixed(2),
        min_purchase: config.SE.min_purchase,
        logo: config.SE.logo,
        contact: config.SE.contact
    })
});

function getBeneficiary(from, memo) {
    let match = memo.match(/\[from\s{0,}=\s{0,}@{0,1}(.*)\s{0,}\]/);
    if (match !== null) {
        return match[1].trim()
    }
    return from;
}
function clearMemo(memo) {
    let match = memo.match(/\[from\s{0,}=\s{0,}@{0,1}(.*)\s{0,}\]/);
    if (match !== null) {
        return memo.replace(match[0], "").split("--")[0].trim()
    }
    return "";
}

async function getHistoryMin(account, symbol, offset, max, data) {
    let url = 'https://api.steem-engine.com/accounts/history?';
    let parameter = [
        ["account", account].join("="),
        ["limit", 1000].join("="),
        ["symbol", symbol].join("="),
        ["offset", offset].join("=")
    ].join("&");

    url += parameter;

    let transactions = await (await fetch(url)).json();

    data = data.concat(transactions);

    if (offset < max) {
        return getHistoryMin(account, symbol, offset + 1000, max, data)
    }

    return data;
}

async function getHistory(account, symbol, offset = 0) {

    let transactions = await getHistoryMin(account, symbol, 0, 3000, []);

    let relevantTX = [];

    let totalBurn = 0;

    for (let i in transactions) {
        let tx = transactions[i];
        totalBurn += parseFloat(tx.quantity);
        relevantTX.push({
            account: getBeneficiary(tx.from, tx.memo || ""),
            quantity: parseFloat(tx.quantity),
            memo: clearMemo(tx.memo),
            txid: tx.txid
        })
    }

    relevantTX = relevantTX.sort((a, b) => {
        return (new Date(b.timestamp)) - (new Date(a.timestamp))
    });

    return {
        data: relevantTX,
        totalBurn: totalBurn
    };

}

router.get("/donations", async (req, res) => {
    let data = await getHistory("null", "TREE")
    res.render("donations", {
        data,
        contact: config.SE.contact,
        logo: config.SE.logo,
        token: config.SE.symbol
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
