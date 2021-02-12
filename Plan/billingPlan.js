const paypal = require('paypal-rest-sdk');
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
paypal.configure({
    mode: 'sandbox', // Sandbox or live
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET,
    headers : {
		'custom': 'header'
    }
})
//https://mcval.herokuapp.com
//http://localhost:3000
var billingPlanAttributes = {
    "description": " Pro plan for ArtaxIT",
    "merchant_preferences": {
        "auto_bill_amount": "yes",
        "cancel_url": "http://127.0.0.1:5501/dashboard_acc.html",
        "initial_fail_amount_action": "continue",
        "max_fail_attempts": "1",
        "return_url": "http://127.0.0.1:5501/dashboard_acc.html",
        "setup_fee": {
            "currency": "USD",
            "value": "0"
        }
    },
    "name": "carePro",
    "payment_definitions": [
        {
            "amount": {
                "currency": "USD",
                "value": "34.99"
            },
            "charge_models": [
                {
                    "amount": {
                        "currency": "USD",
                        "value": "0"
                    },
                    "type": "TAX"
                }
            ],
            "cycles": "0",
            "frequency": "MONTH",
            "frequency_interval": "1",
            "name": "Pay for artaxIT subscription plan",
            "type": "REGULAR"
        },
        {
            "amount": {
                "currency": "USD",
                "value": "0"
            },
            "charge_models": [
                {
                    "amount": {
                        "currency": "USD",
                        "value": "0"
                    },
                    "type": "TAX"
                }
            ],
            "cycles": "1",
            "frequency": "DAY",
            "frequency_interval": "7",
            "name": "No need to pay for trial",
            "type": "TRIAL"
        }
    ],
    "type": "INFINITE"
};

paypal.billingPlan.create(billingPlanAttributes, function (error, billingPlan) {
    if (error) {
        console.log(error);
        throw error;
    } else {
        console.log("Create Billing Plan Response");
        console.log(billingPlan);
    }
});