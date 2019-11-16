const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const app = express();
const fs = require('fs');
const request=require('request');
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine','ejs');
app.set('views','./views');
const session = require('express-session');
app.use(session({secret: 'abcd',saveUninitialized: true,resave: true}));


var sess;

const port = 5000;

const db = mysql.createConnection ({
    host: 'localhost',
    user: 'root',
    password: '',
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
    let location = req.body.location;
    let q="select * from user where email = '"+email+"'";
    let query = "INSERT INTO `user` (name, contact, email, password, usertype, location) VALUES ('" + name + "', '" + contact + "','" + email + "','" + password + "','" + usertype + "','" + location + "')";

    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            db.query(query, (err, result) => {
                if (err) {
                    return res.status(500).send(err);
                }else{
                    res.send(result);
                }
            });
        }else{
            res.send({message:"Email ID already registered"});
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
    console.log('Received req'+email+" "+password);
    let q="select * from user where email = '"+email+"' and password = '"+password+"'";
    db.query(q, (err, result) => {
        if (err) {
            res.send({message:"Invalid User ID or Password"});
        }
        if(!result.length){
            res.send({message:"Invalid User ID or Password"});
            res.render('login',{message:"Invalid User ID or Password"});
        }else{
            res.send({message:"success"});

            sess = req.session;
            sess.email=email;
            sess.password=password;
            console.log(result);
            console.log(JSON.stringify(result[0].usertype));
            //res.redirect('/mcDashboard');
            console.log(result[0].usertype=="Machine Controller");
            
            if(result[0].usertype=="Farmer") {}//res.redirect('/dashboard');
            if(result[0].usertype=="Machine Controller") {}//res.redirect('/mcDashboard');

        }
        }

    );
});

app.get('/sensor',function(req,res){
    res.render('sensor',{message:""});
});

app.get('/dashboard',function(req,res){
    res.render('dashboard',{message:""});
});

app.post('/sensor', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let stype=req.body.stype;
    let sdesc = req.body.sdesc;
    let price = req.body.price;
    sess = req.session;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        if(!result.length){
            res.send({message:"Please login"});
            res.render('sensor',{message:"Invalid Session"});
        }else{
            let q1="insert into sensor (mcId, stype, sdesc,price) VALUES ('"+JSON.stringify(result[0].id)+"', '"+stype+"', '"+sdesc+"', '"+price+"')";
            db.query(q1, (err, result) => {
                if (err) {
                    return res.status(500).send(err);
                }else{
                    res.send({message:"success"});
                    res.redirect('/mcDashboard');
                }
            });
        }
        }
    );
});

app.get('/service',function(req,res){
    res.render('service',{message:""});
});

app.post('/service', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let sdesc = req.body.serDesc;
    let price = req.body.serPrice;
    sess = req.session;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.render('login',{message:"Invalid User ID or Password"});
        }else{
            let q1="insert into services (mcId, serDesc, serPrice) VALUES ('"+JSON.stringify(result[0].id)+"', '"+sdesc+"', '"+price+"')";
            db.query(q1, (err, result) => {
                if (err) {
                    return res.status(500).send(err);
                }else{
                    res.render({message:"success"});
                    res.render('service',{message:"Service Added"});
                }
            });
        }
        }
    );
});

app.get('/machine',function(req,res){
    res.render('machine',{message:""});
});

app.post('/machine', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let mdesc = req.body.mDesc;
    let price = req.body.mPrice;
    let type = req.body.mType;
    sess = req.session;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.render('login',{message:"Invalid User ID or Password"});
        }else{
            let q1="insert into machine (mcId, mDesc, mPrice, mType) VALUES ('"+JSON.stringify(result[0].id)+"', '"+mdesc+"', '"+price+"', '"+type+"')";
            db.query(q1, (err, result) => {
                if (err) {
                    return res.status(500).send(err);
                }else{
                    res.send({message:"Machine Added"});
                    res.render('machine',{message:"Machine Added"});
                }
            });
        }
        }
    );
});

app.get('/farmerAddSensor',function(req,res){
    res.render('farmerAddSensor',{message:""});
});

app.post('/farmerAddSensor', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let type = req.body.type;
    console.log(type);
    //let price = req.body.price;
    sess = req.session;
    let q="select id from user where email = '"+sess.email+"'";
    let q2="select mcId, sid from sensor where stype='"+type+"' and price=(select min(price) from sensor where stype='"+type+"' and status='Inactive' limit 1)";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.render('login',{message:"Invalid Session"});
        }else{
            db.query(q2, (err, result1) => {
                console.log(result1);
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.send({message:"Sensor not available currently"});
                    res.render('farmerAddSensor',{message:"Sensor not available currently"});
                }else{
                    console.log(JSON.parse(JSON.stringify(result1)));
                    let q3="update sensor set status='Connected' where sid='"+result1[0].sid+"'";
                    db.query(q3, (err, result) => {
                    if (err) {
                        return res.status(500).send(err);
                    }else{
                        res.send({message:"Sensor updated"});
                    }
                    });
                    let q1="insert into edge_station (esId, fId, mcId, sId, sType) VALUES ('"+JSON.stringify(result[0].id)+"','"+JSON.stringify(result[0].id)+"', '"+JSON.stringify(result1[0].mcId)+"', '"+JSON.stringify(result1[0].sid)+"', '"+type+"')";
                    
                    db.query(q1, (err, result) => {
                    if (err) {
                        return res.status(500).send(err);
                    }else{
                        res.redirect('farmerGetSensor');
                    }
                    });
                    
                }
                }
            );
            
        }
        }
    );
});


app.get('/farmerGetSensor', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    sess = req.session;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.render('login',{message:"Invalid Session"});
        }else{
            let q2="select * from edge_station where fId='"+JSON.stringify(result[0].id)+"'";
            db.query(q2, (err, result1) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.render('farmerGetSensor',{message:"No sensors rented"});
                }else{
                    console.log(JSON.parse(JSON.stringify(result1)));
                    res.render('farmerGetSensor',{message : JSON.parse(JSON.stringify(result1))});
                }
                }
            );
            
        }
        }
    );
});

app.get('/edgeStationMC', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    sess = req.session;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.render('login',{message:"Invalid Session"});
        }else{
            let q2="select * from edge_station where mcId='"+JSON.stringify(result[0].id)+"'";
            db.query(q2, (err, result1) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.render('edgeStationMC',{message:"No sensors on any edge station"});
                }else{
                    console.log(JSON.parse(JSON.stringify(result1)));
                    res.render('edgeStationMC',{message : JSON.parse(JSON.stringify(result1))});
                }
                }
            );
            
        }
        }
    );
});


app.get('/mcDashboard', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    sess = req.session;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.render('login',{message:"Invalid Session"});
        }else{
            let q2="select * from sensor where mcId='"+JSON.stringify(result[0].id)+"'";
            db.query(q2, (err, result1) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.render('mcDashboard',{message:"No sensors added"});
                }else{
                    console.log(JSON.parse(JSON.stringify(result1)));
                    res.render('mcDashboard',{message : JSON.parse(JSON.stringify(result1))});
                }
                }
            );
            
        }
        }
    );
});

app.get('/monitor', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    sess = req.session;
    let q="select id,location from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.render('login',{message:"Invalid Session"});
        }else{
            let q1="select sType from edge_station where fId='"+result[0].id+"' and status='Connected'";
            let loc=result[0].location;
            db.query(q1, (err, result1) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.render('monitor',{message:"No active sensors"});
                }else{
                    var listOfObjects = [];
                    console.log(result1[0].sType);
                    request(`https://api.darksky.net/forecast/1cc49bed160877460d1977016029cdd8/${loc}`, { json: true }, (err, resp, body) => {
                    if (err) { return console.log(err); }
                    for(var i=0;i<result1.length;i++){
                        if(result1[i].sType=="Temperature"){
                            console.log(resp.body.currently.temperature);
                            var singleObj = {};
                            singleObj['type'] = result1[i].sType;
                            singleObj['value'] = resp.body.currently.temperature;
                            listOfObjects.push(singleObj);
                        }else if(result1[i].sType=="Humidity"){
                            console.log(resp.body.currently.humidity);
                            var singleObj = {};
                            singleObj['type'] = result1[i].sType;
                            singleObj['value'] = resp.body.currently.humidity;
                            listOfObjects.push(singleObj);
                        }else if(result1[i].sType=="Precipitation"){
                            console.log(resp.body.currently.precipIntensity);
                            var singleObj = {};
                            singleObj['type'] = result1[i].sType;
                            singleObj['value'] = resp.body.currently.precipIntensity;
                            listOfObjects.push(singleObj);
                        }else if(result1[i].sType=="Wind"){
                            console.log(resp.body.currently.windSpeed);
                            var singleObj = {};
                            singleObj['type'] = result1[i].sType;
                            singleObj['value'] = resp.body.currently.wind;
                            listOfObjects.push(singleObj);
                        }else if(result1[i].sType=="Visibility"){
                            console.log(resp.body.currently.visibility);
                            var singleObj = {};
                            singleObj['type'] = result1[i].sType;
                            singleObj['value'] = resp.body.currently.visibility;
                            listOfObjects.push(singleObj);
                        }
                    }
                    console.log(listOfObjects);
                    res.render('monitor',{message : listOfObjects});
                    });
                    
                }
                }
            );
            
        }
        }
    );
});


app.put('/updateSensorStatus', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    sess = req.session;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.render('login',{message:"Invalid Session"});
        }else{
            let q2="select * from sensor where mcId='"+JSON.stringify(result[0].id)+"'";
            db.query(q2, (err, result1) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.render('mcDashboard',{message:"No sensors added"});
                }else{
                    console.log(JSON.parse(JSON.stringify(result1)));
                    res.render('mcDashboard',{message : JSON.parse(JSON.stringify(result1))});
                    res.send({message:"Sensor updated"});
                }
                }
            );
        }
        }
    );
});