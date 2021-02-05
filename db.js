const mysql = require('mysql');
const connection = mysql.createConnection({
    host: process.env.RDS_HOSTNAME,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    port: process.env.RDS_PORT,
    database: process.env.RDS_DB_NAME
});
connection.connect(function(err) {
    if (err){
        console.log(err);
    };
});
module.exports=connection;