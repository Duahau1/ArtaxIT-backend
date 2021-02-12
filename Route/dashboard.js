const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const paypal = require('paypal-rest-sdk');
const url = require('url');
const connection = require('../db.js');

//Route Configuration
function authenticate(req, res, next) {
    if (req.headers['authorization'] && req.headers['authorization'].split(' ')[0]==="Bearer") {
        let token = req.headers['authorization'].split(' ')[1];
        jwt.verify(token, process.env.JWT_PRIVATE_TOKEN, (err, payload) => {
            if (err) {
                res.json({
                    "status": "err",
                    "message": "Please log in"
                }).status(404)
            }
            else {
                req.body = {
                    "id": payload.user_id,
                    "username": payload.username,
                    "company_name": payload.company_name
                }
                next();
            }
        })
    }
    else {
        res.json({
            "status": "err",
            "message": "Please log in"
        }).status(404)
    }
}
router.use(authenticate);
//Route
router.get('/', (req, res) => {
    let subscription_sql = "SELECT * FROM new_subscriptions where user_id=?"
    let retVal;
    connection.query(subscription_sql, [req.body.id], (err, result) => {
        if (err) {
            res.json({
                "status": "err",
                "message": "Server problem"
            }).status(404)
        }
        else {
            if (result == 0) {
                retVal = {
                    "subscription": {
                        "status": "good",
                        "plan_status": "none",
                        "userID": req.body.id,
                        "planName": "none",
                        "next_billing_day": "none"
                    }
                }
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
                retVal = {
                    "subscription": {
                        "status": "good",
                        "plan_status": result[0].flag_active,
                        "userID": req.body.id,
                        "status": "good",
                        "planName": planName,
                        "next_billing_day": result[0].next_billing_period
                    }
                }
            }
            let troubleticket_sql = "SELECT * FROM trouble_tickets where customer=?";
            connection.query(troubleticket_sql, [
                req.body.id], (err, result) => {
                    if (err) {
                        res.json({
                            "status": "err",
                            "message": "Unable to retrieve a new ticket"
                        }).status(404)
                    }
                    else if (result.length == 0) {
                        retVal["trouble_ticket"] = {
                            "status": "good",
                            "ticket": []
                        }
                        res.json(retVal);
                    }
                    else {
                        retVal["trouble_ticket"] = {
                            "status": "good",
                            "ticket": result
                        }
                        res.json(retVal);
                    }
                })
        }
    })
})
router.get('/subscription/purchase', (req, res) => {
    let paymentToken = req.query.token;
    paypal.billingAgreement.execute(paymentToken, {}, function (error, billingAgreement) {
        if (error) {
            res.json({
                "status": "err",
                "message": "invalid payment 1"
            }).status(404)
        } else {
            console.log("Billing Agreement Execute Response");

            let data = billingAgreement;
            let sql = "INSERT INTO new_subscriptions VALUES(?,?,?,?,?,?)";
            connection.query(sql, [
                req.body.id,
                data.description,
                data.id,
                data.state,
                data.start_date.match(/(\d+-*)+/)[0],
                data.agreement_details.next_billing_date.match(/(\d+-*)+/)[0]
            ], (err, result) => {
                if (err) {
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
            planID = "P-58X593380W047382YRGULZZI";
        }
        //carePlus-Monthly 
        else if (plan == 2) {
            planID = "P-67M39023M45694025RGVIPGY";
        }
        //carePro-Monthly 
        else if (plan == 3) {
            planID = "P-7TA89950DY863054ARGVT74Y";
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
                res.json({
                    "status": "err",
                    "message": "Error"
                }).status(404)
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
                        res.json({
                            "url": "https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=" + url.parse(approval_url, true).query.token
                        })
                    }
                }

            }
        });
    }
    else {
        res.json({
            "status": "err",
            "message": "The plan you chose is not available"
        }).status(404)
    }
})
router.get('/subscription/cancel', (req, res) => {
    let billing_sql = "SELECT billing_id from new_subscriptions WHERE user_id=?;";
    connection.query(billing_sql, [
        req.body.id
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
                    let sql = "DELETE FROM new_subscriptions WHERE user_id=?;"
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
router.get('/subscription/localAgreement/:id', (req, res) => {
    let plan = req.params.id;
    let planID;
    if (plan != undefined) {
        //careBasic-Monthly
        if (plan == 1) {
            planID = "P-0BF826424F629154LTCH35ZA";
        }
        //carePlus-Monthly 
        else if (plan == 2) {
            planID = "P-1EF60498WU857992STCIMUYQ";
        }
        //carePro-Monthly 
        else if (plan == 3) {
            planID = "P-2K831342T7311570UTCI5F3Q";
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
                res.json({
                    "status": "err",
                    "message": "Error"
                }).status(404)
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
                        res.json({
                            "url": "https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=" + url.parse(approval_url, true).query.token
                        })
                    }
                }

            }
        });
    }
    else {
        res.json({
            "status": "err",
            "message": "The plan you chose is not available"
        }).status(404)
    }
})



module.exports = router;