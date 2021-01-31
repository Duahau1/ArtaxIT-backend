const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const paypal = require('paypal-rest-sdk');
const url = require('url');
const mysql = require('mysql');
const connection = require('../db.js');

//Route Configuration
function authenticate(req, res, next) {
    if (req.headers.cookie) {
        let token = req.headers.cookie.split('=')[1];
        jwt.verify(token, process.env.JWT_PRIVATE_TOKEN, (err, payload) => {
            if (err) {
                res.send('Please log in');
            }
            else {
                res.body = payload;
            }
        })
        next();
    }
    else {
        res.send('Please log in');
    }
}
//CHECK FOR UNIQUE SUBSCRIPTION
router.use(authenticate);
//Route
router.get('/', (req, res) => {
    let subscription_sql = "SELECT * FROM new_subscription where ID=?"
    connection.query(subscription_sql, [req.body.id], (err, result) => {
        if (result.length <= 0 || err) {
            res.json({
                "status": "err",
                "message": "invalid payment"
            }).status(404)
        }
        else {
            let planName = ""
            if (result[0].plan_id == 1) {
                planName = "careBasic";
            }
            else if (result[0].plan_id == 1) {
                planName = "carePlus";
            }
            else if (result[0].plan_id == 1) {
                planName = "carePro";
            }
            res.json({
                "status": "good",
                "plan_status": result[0].flag_active,
                "userID": req.body.id,
                "status": "good",
                "planName": planName,
                "next_billing_day": result[0].next_billing_period
            })
        }
    })
})
router.get('/subscription/purchase', (req, res) => {
    let paymentToken = req.query.token;
    paypal.billingAgreement.execute(paymentToken, {}, function (error, billingAgreement) {
        if (error) {
            console.log(error);
            throw error;
        } else {
            console.log("Billing Agreement Execute Response");

            let data = billingAgreement;
            let sql = "INSERT INTO new_subscriptions VALUES(?,?,?,?,?,?)";
            connection.query(sql, [
                14,
                data.description,
                data.id,
                data.state,
                data.start_date.match(/(\d+-*)+/)[0],
                data.agreement_details.next_billing_date.match(/(\d+-*)+/)[0]
            ], (err, result) => {
                if (err) {
                    console.log(err);
                    res.json({
                        "status": "err",
                        "message": "invalid payment"
                    }).status(404)
                }
                else {
                    let planName = "";
                    if (data.description == 1) {
                        planName = "careBasic";
                    }
                    else if (data.description == 2) {
                        planName = "carePlus";
                    }
                    else if (data.description == 3) {
                        planName = "carePro";
                    }
                    res.json({
                        "status": "good",
                        "plan": planName,
                        "next_billing_day": data.agreement_details.next_billing_date.match(/(\d+-*)+/)[0]
                    }).status(200);
                }
            })
        }
    });
})

router.get('/subscription/createAgreement/:id', (req, res) => {
    let plan = req.params.id;
    let planID;
    if (plan != undefined) {
        //careBasic-Monthly
        if (plan == 1) {
            planID = "P-5RN915393Y424794BKXR5RXA";
        }
        //carePlus-Monthly
        else if (plan == 2) {
            planID = "P-0KF59041AG4143832KXSQFZQ";
        }
        //carePro-Monthly
        else if (plan == 3) {
            planID = "P-7P626551RP002983GKXS5DWI";
        }

        var isoDate = new Date();
        isoDate.setHours(isoDate.getHours() + 4);
        isoDate.toISOString().slice(0, 19) + 'Z';
        let billingAgreementAttributes = {
            "name": "artaxIT Agreement",
            "description": plan,
            "start_date": isoDate,
            "plan": {
                "id": planID
            },
            "payer": {
                "payment_method": "paypal"
            }
        };

        // Use activated billing plan to create agreement
        paypal.billingAgreement.create(billingAgreementAttributes, function (error, billingAgreement) {
            if (error) {
                console.log(error);
            } else {
                console.log("Create Billing Agreement Response");
                var approval_url;
                for (var index = 0; index < billingAgreement.links.length; index++) {
                    if (billingAgreement.links[index].rel === 'approval_url') {
                        approval_url = billingAgreement.links[index].href;
                        console.log("For approving subscription via Paypal, first redirect user to");
                        console.log(approval_url);
                        console.log("Payment token is");
                        console.log(url.parse(approval_url, true).query.token);
                        res.redirect("https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=" + url.parse(approval_url, true).query.token);
                    }
                }

            }
        });
    }
    else {
        res.send("a plan please");
    }
})
router.get('/subscription/cancel', (req, res) => {
    let billing_sql = "SELECT billing_id from new_subscriptions WHERE user_id=?;";
    connection.query(billing_sql, [
        //req.body.id
        14
    ], (err, results) => {
        if (results.length <= 0 || err) {
            res.json({
                "status": "err",
                "message": "Error"
            }).status(404)
        }
        else {
            let billingAgreementId = results[0].billing_id;
            let cancel_note = {
                "note": "Canceling the agreement"
            };
            paypal.billingAgreement.cancel(billingAgreementId, cancel_note, function (error, response) {
                if (error) {
                    res.json({
                        "status": "err",
                        "message": "No subscription available"
                    }).status(404);
                } else {
                    console.log("Cancel Billing Agreement Response");
                    let sql = "DELETE FROM new_subscriptions WHERE userid=?;"
                    connection.query(sql, [
                        req.body.id
                    ], (err, result) => {
                        if (err) {
                            res.json({
                                "status": "err",
                                "message": "invalid payment"
                            }).status(404)
                        }
                        else {
                            res.json({
                                "status": "good",
                                "message": "successfully delete your subscription"
                            })
                        }
                    })

                }
            });
        }
    })

})
module.exports = router;