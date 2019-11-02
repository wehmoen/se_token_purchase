const coinbase = require("coinbase-commerce");
const config = require("./config")

const client = new coinbase.CoinbaseCommerce({
    apiKey: config.coinbase.apiKey
});

module.exports = {
    client,
    webhook: {
        sharedSecret: config.coinbase.webhookSecret
    },
    toFixedNoRounding: function (number, n) {
        const reg = new RegExp("^-?\\d+(?:\\.\\d{0," + n + "})?", "g")
        const a = number.toString().match(reg)[0];
        const dot = a.indexOf(".");
        if (dot === -1) { // integer, insert decimal dot and pad up zeros
            return a + "." + "0".repeat(n);
        }
        const b = n - (a.length - dot) + 1;
        return b > 0 ? (a + "0".repeat(b)) : a;
    },
    buildSteemPayTX: (from, to, symbol, amount, memo) => {
        let json = [{
            "contractName": "tokens",
            "contractAction": config.SE.action,
            "contractPayload": {
                "symbol": symbol,
                "to": "null",
                "quantity": amount,
                "memo": "[from=" + to + "] " + memo
            }
        }];

        return [
            'custom_json',
            {
                required_auths: [from],
                required_posting_auths: [],
                id: "ssc-mainnet1",
                json: JSON.stringify(json)
            }
        ]
    }
};