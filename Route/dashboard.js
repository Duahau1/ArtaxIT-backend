const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const url = require('url');
const connection = require('../db.js');
const axios = require('axios');
const paypalCancel = 'https://api-m.paypal.com/v1/billing/subscriptions/';
//Route Configuration
function authenticate(req, res, next) {
  if (
    req.headers['authorization'] &&
    req.headers['authorization'].split(' ')[0] === 'Bearer'
  ) {
    let token = req.headers['authorization'].split(' ')[1];
    jwt.verify(token, process.env.JWT_PRIVATE_TOKEN, (err, payload) => {
      if (err) {
        res
          .json({
            status: 'err',
            message: 'Please log in',
          })
          .status(404);
      } else {
        req.body.id = payload.user_id;
        req.body.username = payload.username;
        req.body.company_name = payload.company_name;
        next();
      }
    });
  } else {
    res
      .json({
        status: 'err',
        message: 'Please log in',
      })
      .status(404);
  }
}
router.use(authenticate);
//Route
router.get('/', (req, res) => {
  let subscription_sql = 'SELECT * FROM new_subscriptions where user_id=?';
  let retVal;
  connection.query(subscription_sql, [req.body.id], (err, result) => {
    if (err) {
      res
        .json({
          status: 'err',
          message: 'Server problem',
        })
        .status(404);
    } else {
      if (result == 0) {
        retVal = {
          subscription: {
            status: 'good',
            plan_status: 'none',
            userID: req.body.id,
            planName: 'none',
            next_billing_day: 'none',
          },
        };
      } else {
        let planName = '';
        if (result[0].plan_id == 1) {
          planName = 'careBasic';
        } else if (result[0].plan_id == 1) {
          planName = 'carePlus';
        } else if (result[0].plan_id == 1) {
          planName = 'carePro';
        }
        retVal = {
          subscription: {
            status: 'good',
            plan_status: result[0].flag_active,
            userID: req.body.id,
            status: 'good',
            planName: planName,
            next_billing_day: result[0].next_billing_period,
          },
        };
      }
      let troubleticket_sql = 'SELECT * FROM trouble_tickets where customer=?';
      connection.query(troubleticket_sql, [req.body.id], (err, result) => {
        if (err) {
          res
            .json({
              status: 'err',
              message: 'Unable to retrieve a new ticket',
            })
            .status(404);
        } else if (result.length == 0) {
          retVal['trouble_ticket'] = {
            status: 'good',
            ticket: [],
          };
          res.json(retVal);
        } else {
          retVal['trouble_ticket'] = {
            status: 'good',
            ticket: result,
          };
          res.json(retVal);
        }
      });
    }
  });
});
router.post('/subscription/purchase', (req, res) => {
  let tempDate = new Date();
  tempDate.setMonth(tempDate.getMonth() + 1);
  let sql = 'INSERT INTO new_subscriptions VALUES(?,?,?,?,?,?)';
  connection.query(
    sql,
    [
      req.body.id,
      req.body.planID,
      req.body.subscriptionID,
      'Active',
      new Date().toISOString().match(/(\d+-*)+/)[0],
      tempDate.toISOString().match(/(\d+-*)+/)[0],
    ],
    (err, result) => {
      if (err) {
        res
          .json({
            status: 'err',
            message: 'invalid payment',
          })
          .status(404);
      } else {
        res
          .json({
            status: 'good',
            plan: req.body.planName,
            next_billing_day: tempDate.toISOString().match(/(\d+-*)+/)[0],
          })
          .status(200);
      }
    },
  );
});

router.post('/subscription/cancel', (req, res) => {
  let billing_sql = 'SELECT billing_id from new_subscriptions WHERE user_id=?;';
  connection.query(billing_sql, [req.body.id], (err, results) => {
    if (results.length <= 0 || err) {
      res
        .json({
          status: 'err',
          message: 'Error',
        })
        .status(404);
    } else {
      axios
        .post(paypalCancel + `${results[0].billing_id}/cancel`, {
          headers: {
            'Content-Type': 'application/json',
          },
          auth: {
            username: process.env.PAYPAL_CLIENT_ID,
            password: process.env.PAYPAL_CLIENT_SECRET,
          },
        })
        .then(() => {
          let sql = 'DELETE FROM new_subscriptions WHERE user_id=?;';
          connection.query(sql, [req.body.id], (err, result) => {
            if (err) {
              res
                .json({
                  status: 'err',
                  message: 'invalid payment',
                })
                .status(404);
            } else {
              res.json({
                status: 'good',
                message: 'successfully cancel your subscription',
              });
            }
          });
        });
    }
  });
});
router.get('/sss', (req, res) => {
  axios
    .get('https://api-m.paypal.com/v1/billing/plans', {
      headers: {
        'Content-Type': 'application/json',
      },
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_CLIENT_SECRET,
      },
    })
    .then((val) => console.log('success'))
    .catch((err) => console.log(err));
});
module.exports = router;
