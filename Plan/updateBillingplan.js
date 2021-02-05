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
var billingPlanId = "P-84P73367AN3845727OEO4G5Y";

var billing_plan_update_attributes = [
    {
        "op": "replace",
        "path": "/",
        "value": {
            "state": "ACTIVE"
        }
    }
];

paypal.billingPlan.get(billingPlanId, function (error, billingPlan) {
    if (error) {
        console.log(error);
        throw error;
    } else {
        console.log("Get Billing Plan");
        console.log(JSON.stringify(billingPlan));

        paypal.billingPlan.update(billingPlanId, billing_plan_update_attributes, function (error, response) {
            if (error) {
                console.log(error.response);
                throw error;
            } else {
                paypal.billingPlan.get(billingPlanId, function (error, billingPlan) {
                    if (error) {
                        console.log(error.response);
                        throw error;
                    } else {
                        console.log(billingPlan.state);
                    }
                });
            }
        });
    }
});