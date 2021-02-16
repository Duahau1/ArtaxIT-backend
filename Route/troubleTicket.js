const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const connection = require('../db.js');
const cloudinary = require('cloudinary').v2;
const upload = require('express-fileupload');

//Route Configuration
router.use(upload({
    useTempFiles: true,
    limits: { fileSize: 50 * 1024 * 1024 }
}));
cloudinary.config({
    cloud_name: 'dqd1jzhf6',
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET_KEY
})
function authenticate(req, res, next) {
    if (req.headers['authorization']) {
        let token = req.headers['authorization'].split(' ')[1];
        jwt.verify(token, process.env.JWT_PRIVATE_TOKEN, (err, payload) => {
            if (err) {
                res.json({
                    "status": "err",
                    "message": "Please log in"
                }).status(404);
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
router.use(authenticate);

//Route
router.post("/create", (req, res) => {
   
        let sql = "INSERT INTO trouble_tickets(issue,description,datetime,priority,status,customer) VALUES(?,?,CURRENT_TIMESTAMP(),?,?,?)";
        connection.query(sql, [
            req.body.issue,
            req.body.description,
            0,
            1,
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
})
router.post("/create_pic", async (req, res) => {
    let file ='';
    if(req.files!=null){
    file = req.files.Image;
    }
    if (file!=null && file!=''){
    let photo = await new Promise((resp, rej) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype == 'image/png') {
            cloudinary.uploader.upload(file.tempFilePath, (err, result) => {
                if (err) {
                    console.log(err);
                    rej("Invalid Format");
                }
                resp(result);

            })
        }
        else {
            res.end("Please input only jpeg or png files");
        }
    });
    req.body.Image = photo.url;
    }
    else{
    req.body.Image=" ";
    }
    req.body.priority=Number(req.body.priority)
        let sql = "INSERT INTO trouble_tickets(issue,description,datetime,priority,status,customer,image_link) VALUES(?,?,CURRENT_TIMESTAMP(),?,?,?,?)";
        connection.query(sql, [
            req.body.issue,
            req.body.description,
            0,
            1,
            req.body.id,
            req.body.Image
        ], (err, result) => {
            if (err) {
                console.log(err);
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
    

})
router.get("/view", (req, res) => {
    let sql = "SELECT * FROM trouble_tickets where customer=?";
    connection.query(sql, [
        req.body.id], (err, result) => {
            if (err) {
                res.json({
                    "status": "err",
                    "message": "Unable to retrieve a new ticket"
                }).status(404)
            }
            else if (result.length == 0) {
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