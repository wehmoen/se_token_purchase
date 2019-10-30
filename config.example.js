module.exports = {
    secret: "Custom String used to identify an instance of this software.",
    host: "https://website.test",
    httpPort: 3000,
    SE: {
        symbol: "TOKEN",
        min_purchase: 100,
        price_usd: 0.01,
        precision: 3,
        bank_account: 'null',
        active_wif: 'bank_account_private_active_wif',
        logo: "https://i.kym-cdn.com/photos/images/newsfeed/000/925/494/218.png_large",
        contact: {
            name: "Your Full Name",
            steem: "You Steem Account",
            email: "Your E-Mail"
        }
    },
    coinbase: {
        apiKey :"Your Coinbase Commerce API Key",
        webhookSecret: "Your Shared Webhook Secret"
    }
}