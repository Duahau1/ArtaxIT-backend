const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const connection = require('../db.js');
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");

//Route Configuration
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    },
});
function hashPassword(req, res, next) {
    req.body.password = bcrypt.hashSync(req.body.password, 10);
    next();
}
function restPasswordTokenAuth(req, res, next) {
    if (req.query.au) {
        let token = req.query.au;
        jwt.verify(token, process.env.JWT_PRIVATE_TOKEN, (err, payload) => {
            if (err) {
                res.json({
                    "status": "err",
                    "message": "The token has expired"
                }).status(404)
            }
            else {
                req.body.id = payload.user_id;
                next();
            }
        })
    }
    else{
        console.log("ERR");
    }
}
function authenticate(req, res, next) {
    if (req.headers['authorization']) {
        let token = req.headers['authorization'].split(' ')[1];
        jwt.verify(token, process.env.JWT_PRIVATE_TOKEN, (err, payload) => {
            if (err) {
                res.json({
                    "status": "err",
                    "message": "Please log in"
                }).status(404)
            }
            else {
                req.body.id = payload.user_id;
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

router.patch("/edit", authenticate, (req, res) => {
    let sql = "UPDATE customers SET first_name=?, last_name=?, phone_number=?,company_name=? WHERE id =?;";
    connection.query(sql, [
        req.body.first_name,
        req.body.last_name,
        req.body.phone_number,
        req.body.company_name,
        req.body.id
    ], (err, result) => {
        if (err) {
            res.json({
                "status": "err",
                "message": "Server error"
            }).status(404)
        }
        else {
            res.json({
                "status": "good",
                "first_name": req.body.first_name,
                "last_name": req.body.last_name,
                "phone_number": req.body.phone_number,
                "company_name": req.body.company_name,
                "message": "Successfully update user info"
            }).status(404)
        }
    })

})
router.post("/forgotpassword", (req, res) => {
    let sql = "SELECT id FROM customers where email=? and username=?"
    connection.query(sql, [
        req.body.email,
        req.body.username
    ], (err, result) => {
        if (err) {
            console.log("error in the server");
            res.json({
                "status": "err",
                "message": "Mail was not sent"
            })
        }
        else if (result.length == 0) {
            res.json({
                "status": "err",
                "message": "User with this email does not exist"
            }).status(404);
        }
        else {
            const token = jwt.sign({ user_id: result[0].id }, process.env.JWT_PRIVATE_TOKEN, { expiresIn: '15m' });
            const email_info = {
                from: process.env.EMAIL,
                to: req.body.email,
                subject: "Reset password Link",
                html: `<h2>Please click the link below to reset your password</h2>
                <p>http://127.0.0.1:5501/temp2.html?au=${token}</p>
                <h3>The link will expire in <strong>15 minutes</strong> <h3>`
            }
            transporter.sendMail(email_info, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  res.json({
                      "status":"good",
                      "message":"Check your email"
                  })
                }
              });
        }
    })
})
router.post("/resetpassword", restPasswordTokenAuth, hashPassword, (req, res) => {
    let sql = "UPDATE customers SET password=? WHERE id =?";
    connection.query(sql, [
        req.body.password,
        req.body.id
    ], (err, result) => {
        if (err) {
            console.log("Error in mysql");
        }
        else {
            
            res.json({
                "status": "good",
                "message": "Successfully update your password"
            })
        }
    })

})
module.exports = router;