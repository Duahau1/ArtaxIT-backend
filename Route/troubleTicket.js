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

//Route
router.post("/create", (req, res) => {
    if(typeof req.body.priority===Number && typeof req.body.status===Number){
    let sql = "INSERT INTO trouble_tickets(issue,description,datetime,priority,status,customer) VALUES(?,?,CURRENT_TIMESTAMP(),?,?,?)";
    connection.query(sql, [
        req.body.issue,
        req.body.desciption,
        req.body.priority,
        req.body.status,
        req.body.id
    ], (err, result) => {
        if (err) {
            res.json({
                "status": "err",
                "message": "Unable to create a new ticket"
            }).status(404)
        }
        else {
            res.json({
                "status": "good",
                "message": "Ticket create successfully"
            }).status(201)
        }
    })
}
else{
    res.json({
        "status": "err",
        "message": "Unable to create a new ticket"
    }).status(404)
}
})

router.get("/view",(req,res)=>{
    let sql ="SELECT * FROM trouble_tickets where customer=?";
    connection.query(sql,[
        req.body.id],(err,result)=>{
            if (err) {
                res.json({
                    "status": "err",
                    "message": "Unable to retrieve a new ticket"
                }).status(404)
            }
            else if(result.length==0){
                res.json({
                    "status": "good",
                    "ticket": []
                })
            }
            else {
                res.json({
                    "status": "good",
                    "ticket": result
                })
            }
        })
})

module.exports = router;