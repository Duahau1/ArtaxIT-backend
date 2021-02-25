const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const connection = require('../db.js');
const bcrypt = require('bcrypt');
const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');
//Route Configuration
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
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
    if (req.headers['authorization']&& req.headers['authorization'].split(' ')[0]==="Bearer") {
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
router.get("/information",authenticate,(req,res)=>{
    let sql ="SELECT first_name, last_name, phone_number,company_name FROM customers WHERE id=?";
    connection.query(sql,[
        req.body.id
    ],(err,result)=>{
        if(err||result.length<=0){
            console.log(err)
            res.json({
                "status": "err",
                "message": "Error in the server"
            }).status(404)
        }
        else{
            res.json({
                "status": "good",
                "first_name": result[0].first_name,
                "last_name": result[0].last_name,
                "phone_number": result[0].phone_number,
                "company_name": result[0].company_name,
            }).status(200)
        }

    })
})
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
            }).status(200)
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
            fs.readFile(path.join(__dirname,'..','email_temp.html'),'utf8',(err,data)=>{
                if(err){
                    console.log(err);
                }
                let retVal=data.replace('<a id="reset_button" href="" style="background-color:#21455e; border:3px solid #265678; border-color:#265678; border-radius:6px; border-width:3px; color:#ffffff; display:inline-block; font-size:14px; font-weight:normal; letter-spacing:0px; line-height:normal; padding:12px 18px 12px 18px; text-align:center; text-decoration:none; border-style:solid;" target="_blank">Reset your password</a>',
                `<a id="reset_button" href='https://user.artaxit.com/reset_password.html?au=${token}' style="background-color:#21455e; border:3px solid #265678; border-color:#265678; border-radius:6px; border-width:3px; color:#ffffff; display:inline-block; font-size:14px; font-weight:normal; letter-spacing:0px; line-height:normal; padding:12px 18px 12px 18px; text-align:center; text-decoration:none; border-style:solid;" target="_blank">Reset your password</a>`);
                const email_info = {
                    from: process.env.EMAIL,
                    to:req.body.email,
                    subject: "Reset password Link",
                    html: retVal
                }
                  sgMail
                  .send(email_info)
                  .then(() => {
                    res.json({
                        "status":"good",
                        "message":"Check your email"
                    }).status(200);
                  })
                  .catch((error) => {
                    console.error(error)
                  }) 
            })
             
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
            }).status(200)
        }
    })

})
module.exports = router;