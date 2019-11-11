const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const app = express();
const fs = require('fs');
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine','ejs');
app.set('views','./views');


const port = 5000;

const db = mysql.createConnection ({
    host: 'localhost',
    user: 'root',
    password: 'admin@123',
    database: '281db'
});

// connect to database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});
global.db = db;

// configure middleware
app.set('port', process.env.port || port); // set express to use this port

app.get('/',function(req,res){
        res.render('register',{message:""});
});

// set the app to listen on the port
app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});

app.get('/register',function(req,res){
    res.render('register',{message:""});
});


app.post('/register', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let name = req.body.name;
    let contact=req.body.contact;
    let usertype=req.body.usertype;
    let email=req.body.email;
    let password = req.body.password;
    let q="select * from user where email = '"+email+"'";
    let query = "INSERT INTO `user` (name, contact, email, password, usertype) VALUES ('" + name + "', '" + contact + "','" + email + "','" + password + "','" + usertype + "')";

    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            db.query(query, (err, result) => {
                if (err) {
                    return res.status(500).send(err);
                }else{
                    res.render('register',{message:"Registered Successfully"});
                }
            });
        }else{
            res.render('register',{message:"Email ID already registered"});
        }



        }
    );
});

app.get('/login',function(req,res){
    res.render('login',{message:""});
});

app.post('/login', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let email=req.body.email;
    let password = req.body.password;
    let q="select * from user where email = '"+email+"' and password = '"+password+"'";
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.render('login',{message:"Invalid User ID or Password"});
        }else{
            res.render('dashboard');
        }
        }
    );
});