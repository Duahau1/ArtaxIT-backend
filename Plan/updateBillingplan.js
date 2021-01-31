const paypal = require('paypal-rest-sdk');
paypal.configure({
    mode: 'sandbox', // Sandbox or live
    client_id: 'AeiHK35v7qvvIQhO-sSEptHaklcu0lIxH6A9fpMa27vgUkC_V64rV7Cjf0MkxxBvZnf4VRMeUEkyA8wx',
    client_secret: 'EPtJIjn2bU8ufRXbWRsR1ic4Af6miQEFK5451QcTPnSAcAx_iiVaU0wYXVj-Bm6TWEabDJrM-3Wt6Yoo'
})
var billingPlanId = "P-88P05926Y25845730LIX6JKI";

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