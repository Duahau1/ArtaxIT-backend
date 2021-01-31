const mysql = require('mysql');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const paypal = require('paypal-rest-sdk');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Dashboard = require('./Route/dashboard');
// App Configuration

app.use(cors());
app.use(express.json());
paypal.configure({
    mode: 'sandbox', // Sandbox or live
    client_id: 'AeiHK35v7qvvIQhO-sSEptHaklcu0lIxH6A9fpMa27vgUkC_V64rV7Cjf0MkxxBvZnf4VRMeUEkyA8wx',
    client_secret: 'EPtJIjn2bU8ufRXbWRsR1ic4Af6miQEFK5451QcTPnSAcAx_iiVaU0wYXVj-Bm6TWEabDJrM-3Wt6Yoo',
    headers : {
		'custom': 'header'
    }
})
const connection = require('./db.js');

function hashPassword(req, res, next) {
    req.body.password = bcrypt.hashSync(req.body.password, 10);
    next();
}

// Route
app.use('/dashboard', Dashboard);

app.post("/sign_up", hashPassword, (req, res) => {
    let sql = `INSERT INTO customers (first_name, last_name,created_by,updated_by,published_at,phone_number,user_role,company_name,user_name,username,password,email) VALUES(?,?,1,1,CURRENT_TIMESTAMP(),?,4,?,?,?,?,?)`;
    connection.query(sql, [
        req.body.first_name,
        req.body.last_name,
        req.body.phone_number,
        req.body.company_name,
        req.body.username,
        req.body.username,
        req.body.password,
        req.body.email
    ], (err, result) => {
        if (err) {
            res.json({
                'status': 'err',
                'message': 'Username already exists'
            }).status(404);
        }
        else {
            res.json({
                'status': 'good',
                'message': 'User is created'
            }).status(201);
        }
    })
})
app.post("/log_in", (req, res) => {
    let sql = 'SELECT password,company_name FROM customers WHERE username=? LIMIT 1';
    connection.query(sql, [req.body.username], (err, result) => {
        if (result.length==0||err) {
            res.json({
                'status': 'err',
                'message': 'Incorrect username or password'
            }).status(404);
        }
        else {
            bcrypt.compare(req.body.password, result[0].password, (err, same) => {
                if(err){
                    res.json({
                        'status': 'err',
                        'message': 'Incorrect username or password'
                    }).status(404);
                }
                if (same) {
                    let payload = {
                        id:result[0].id,
                        username: req.body.username,
                        company_name: result[0].company_name
                    }
                    let token = jwt.sign(payload, process.env.JWT_PRIVATE_TOKEN, { expiresIn: '1d' });
                    res.cookie('jwt', token, { httpOnly:true,expires: new Date(Date.now() + 900000) })
                        .json({
                            'status': 'good',
                            'username':req.body.username,
                            'company_name': result[0].company_name,
                            'message': 'Logged in'
                        }).status(200)
                }
                else {
                    res.json({
                        'status': 'err',
                        'message': 'Incorrect username or password'
                    }).status(404);
                }

            })
        }

    })
 

})
app.get("/log_out", (req, res) => { 
    res.clearCookie('jwt').json({
        "status": "good",
        "message": "Logged out"
    }).status(200);

})

//Hosting
app.listen(process.env.PORT||3000, () => {
    console.log("Listening on the server");
})

