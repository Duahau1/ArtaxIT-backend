const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const connection = require('../db.js');
//Route Configuration
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
                
            }
        })
        next();
    }
    else {
        res.json({
            "status": "err",
            "message": "Please log in"
        }).status(404)
    }
}
router.use(authenticate);

router.patch("/edit", (req, res) => {
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
module.exports =router;