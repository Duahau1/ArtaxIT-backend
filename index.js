const mysql = require('mysql');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const paypal = require('paypal-rest-sdk');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Dashboard = require('./Route/dashboard');
const TroubleTicket =require('./Route/troubleTicket');
const UserInfo = require('./Route/user');
const schedule = require('node-schedule');
const fs = require('fs');
const tmpDir = '/tmp';
// App Configuration
app.use(cors());
app.use(express.json());
paypal.configure({
    mode: 'sandbox', // Sandbox or live
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET,
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
app.use('/ticket',TroubleTicket);
app.use('/user',UserInfo)
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
    let sql = 'SELECT password,company_name,id FROM customers WHERE username=? LIMIT 1';
    connection.query(sql, [req.body.username], (err, result) => {
        if (result.length==0||err) {
            res.json({
                'status': 'err',
                'message': 'Incorrect username or password'
            }).status(404);
            return;

        }
        else {
            bcrypt.compare(req.body.password, result[0].password, (err, same) => {
                if(err){
                    res.json({
                        'status': 'err',
                        'message': 'Incorrect username or password'
                    }).status(404);
                    return;
                }
                if (same) {
                    let payload = {
                        user_id:result[0].id,
                        username: req.body.username,
                        company_name: result[0].company_name
                    }
                    let token = jwt.sign(payload, process.env.JWT_PRIVATE_TOKEN, { expiresIn: '1d' });
                    
                    //res.cookie('jwt', token, {sameSite:'none',httpOnly:true,secure:true,expires: new Date(Date.now() + 900000) })
                   //res.cookie('jwt', token, {expires: new Date(Date.now() + 900000) })     
                   res.json({
                            'status': 'good',
                            'token':token,
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

//Schedule a cron job to clear the temp file
//every day at 1am we clean the temp files
const cleanUpSchedule = '0 1 * * *';
schedule.scheduleJob(cleanUpSchedule,function(){
    console.log('running job: clean up tmp files')
    fs.readdir(tmpDir,{withFileTypes:true},(err,files)=>{
        if(err){
            console.warn('unable to read temp files directory');
            console.log(err);
            return;
        }
        if(Array.isArray(files)){
            const time = (new Date()).getTime();//get ms since epoch
            //because of withFileTypes option, files are fs.Dirent objects instead of just string filenames.
            files.forEach(file=>{
                //make sure its a file before proceeding
                if(file.isFile()){
                    fs.stat(tmpDir+file.name,(err,stats)=>{
                        if(err){
                            console.warn('unable to fs.stat() file %s',file.name);
							console.log(err);
                            return;
                        }
                        //if the time the file created is greater than or equal to 1 hour, delete it
                        if(stats.birthtimeMs - time >= 3.6e+6) {
                            console.log('removing temp file %s',file.name)
                            fs.unlink(tmpDir+file.name,err=>{
                                if(err){
                                    console.warn('unable to remove temp file %s',file.name)
                                }else{
                                    console.log('temp file %s removed',file.name);
                                }
                            })
                        }else{
                            console.log('the temp file %s will not be removed due to not being old enough.',file.name);
                        }
                    })
                }
            })
        }
    })
});