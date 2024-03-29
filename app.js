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
const MongoClient = require('mongodb').MongoClient;
const Bcrypt = require("bcryptjs");
var mongo = require('mongodb');
let mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
const Sensor = require("./src/models/SensorSchema");


// Connection URL
const url = 'mongodb+srv://root:root@cluster0-srg1l.mongodb.net/smart_ag?retryWrites=true&w=majority';
 
// Database Name
const dbName = 'smart_ag';
 

mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true); //issue with a depricated- found it
// mongoose.set("poolSize", 10);
mongoose
  .connect(url, { useNewUrlParser: true, poolSize: 10 })
  .then(() => console.log("Connected Successfully to MongoDB"))
  .catch(err => console.error(err));

  const dbnew = mongoose.connection;

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


app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
    if (res.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET')
        return res.status(200).json({})
    }
    next();

})

app.get('/',function(req,res){
        res.render('register',{message:""});
});

// set the app to listen on the port
app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});


app.post('/register', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let name = req.body.name;
    let contact=req.body.number;
    let usertype=req.body.usertype;
    let email=req.body.email;
    let password = req.body.password;
    let location = req.body.location;
    let q="select * from user where email = '"+email+"'";
    let query = "INSERT INTO `user` (name, contact, email, password, usertype, location) VALUES ('" + name + "', '" + contact + "','" + email + "','" + password + "','" + usertype + "','" + location + "')";

    db.query(q, (err, result) => {
        if (err) {
            console.log("Error");
            return res.status(500).send(err);
        }
        if(!result.length){
            db.query(query, (err, result) => {
                if (err) {
                    return res.status(500).send(err);
                }else{
                    console.log("Successful");
                    res.status(200).json({message:"true"});
                }
            });
        }else{
            console.log("Email exists");
            res.status(200).json({message:"false"}); 
        }



        }
    );
});


//login
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
            res.status(200).json({message:"Invalid User ID or Password"});
        }else{
            sess = req.session;
            sess.email=email;
            console.log(sess.email);
            sess.password=password;
            console.log("session email",sess.email);
            console.log(JSON.stringify(result[0].usertype));
            if(result[0].usertype=="Farmer") res.status(200).json({message:"Login Successful"});
            if(result[0].usertype=="Machine Controller") res.status(200).json({message:"Login Successful MC"});
        }
        }
    );
});




//farmer add sensor submit
app.post('/farmer', (req, res) => {

    let type = req.body.type;
    let start_date=req.body.start_date;
    let end_date=req.body.end_date;

    let q="select id,name,location from user where email = '"+sess.email+"'";
    let q2="select mcId, sid,price from sensor where stype='"+type+"' and price=(select min(price) from sensor where stype='"+type+"' and status='Not In Use' limit 1)";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            console.log("session error")
            return res.status(500).json({message:"Invalid Session"});
        }else{
            db.query(q2, (err, result1) => {
                console.log(result1);
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.render('farmerAddSensor',{message:"Sensor not available currently"});
                }else{
                    console.log(JSON.parse(JSON.stringify(result1)));
                    let q3="update sensor set status='Connected' where sid='"+result1[0].sid+"'";
                    db.query(q3, (err, result) => {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    });
                    let q1="insert into edge_station (esId, fId, fname, mcId, sId, sType, location, start_date, end_date) VALUES ('"+result[0].id+"','"+result[0].id+"', '"+result[0].name+"','"+result1[0].mcId+"', '"+result1[0].sid+"', '"+type+"','"+result[0].location+"','"+start_date+"','"+end_date+"')";
                    //let q1="insert into edge_station (esId, fId, mcId, sId, sType) VALUES (1,1, '"+JSON.stringify(result1[0].mcId)+"', '"+JSON.stringify(result1[0].sid)+"', '"+type+"')";
                    
                    db.query(q1, (err, result) => {
                    if (err) {
                        return res.status(500).send(err);
                    }else{
                        console.log(end_date-start_date);
                        let billingQuery="insert into billing (fId, fname, mcId, sId, sType, start_date, end_date, amount) VALUES ('"+result[0].id+"', '"+result[0].name+"','"+result1[0].mcId+"', '"+result1[0].sid+"', '"+type+"','"+start_date+"','"+end_date+"', '"+amount+"')";
                        
                        res.status(200).json({message:"Inserted into edge station"});
                    }
                    });
                    
                }
                }
            );
            
       }
       }
    );
});


//get dynamic sensor price farmer
app.post('/price', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    
    //sess = req.session;
    console.log(sess.email);
    let type = req.body.type;
    let q2="select price from sensor where stype='"+type+"' and price=(select min(price) from sensor where stype='"+type+"' and status='Not In Use' limit 1)";
            db.query(q2, (err, result1) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    console.log("Result empty");
                    res.status(200).json({message:" ",
                                            session: sess.email});
                }else{
                    console.log(JSON.parse(JSON.stringify(result1)));
                    console.log(JSON.stringify(result1[0]));
                    res.status(200).json({message : JSON.stringify(result1[0].price)});
                }
                }
            );
    
});





//farmer get rented sensor details
app.get('/farmer', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    //sess = req.session;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            return res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="select * from edge_station where fId='"+JSON.stringify(result[0].id)+"'";
            db.query(q2, (err, result1) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.status(200).json({message:""});
                }else{
                    console.log(JSON.parse(JSON.stringify(result1)));
                    res.status(200).json({message : result1});
                }
                }
            );
            
        }
        }
    );
});




//farmer to display all available machines
app.get('/farmerGetAddMachine', (req, res) => {
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            return res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="select * from machine where status='Not In Use'";
            db.query(q2, (err, result1) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.status(200).json({message:"No machines available"});
                }else{
                    console.log(JSON.parse(JSON.stringify(result1)));
                    res.status(200).json({message : result1});
                }
                }
            );
            
        }
        }
    );
});


//farmer add machine submit
app.post('/farmerAddMachine',(req,res) =>{
    let id = req.body.id;
    let q="select id from user where email = '"+sess.email+"'";
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            console.log("session error")
            return res.status(500).json({message:"Invalid Session"});
        }else{
            q2="update machine set status='Connected', fId='"+result[0].id+"' where id='"+id+"'";
            db.query(q2, (err, result1) => {
                console.log(result1);
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                else{
                    res.status(200).json({message:"Machine Added"});
                }
                }
            );
            
       }
       }
    );
});


//farmer get rented machine details
app.get('/farmerGetMachine', (req, res) => {
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            return res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="select * from machine where fId='"+JSON.stringify(result[0].id)+"'";
            db.query(q2, (err, result1) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.status(200).json({message:""});
                }else{
                    console.log(JSON.parse(JSON.stringify(result1)));
                    res.status(200).json({message : result1});
                }
                }
            );
            
        }
        }
    );
});



//farmer to display all available services
app.get('/farmerGetAddServices', (req, res) => {
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            return res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="select * from services where status='Not In Use'";
            db.query(q2, (err, result1) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.status(200).json({message:"No services available"});
                }else{
                    console.log(JSON.parse(JSON.stringify(result1)));
                    res.status(200).json({message : result1});
                }
                }
            );
            
        }
        }
    );
});


//farmer add services submit
app.post('/farmerAddService',(req,res) =>{
    let id = req.body.id;
    let q="select id from user where email = '"+sess.email+"'";
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            console.log("session error")
            return res.status(500).json({message:"Invalid Session"});
        }else{
            q2="update services set status='Connected', fId='"+result[0].id+"' where id='"+id+"'";
            db.query(q2, (err, result1) => {
                console.log(result1);
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                else{
                    res.status(200).json({message:"Service Added"});
                }
                }
            );
            
       }
       }
    );
});


//farmer get rented services details
app.get('/farmerGetService', (req, res) => {
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            return res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="select * from services where fId='"+JSON.stringify(result[0].id)+"'";
            db.query(q2, (err, result1) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.status(200).json({message:""});
                }else{
                    console.log(JSON.parse(JSON.stringify(result1)));
                    res.status(200).json({message : result1});
                }
                }
            );
            
        }
        }
    );
});








//farmer monitor all active sensors
app.get('/monitor', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let q="select id,location from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.status(500).json({message:"Invalid Session"});
        }else{
            console.log("in");
            let q1="select sType,sId from edge_station where fId='"+result[0].id+"' and status='Active'";
            let loc=result[0].location;
            db.query(q1, (err, result1) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.status(200).json({message:""});
                }else{
                    var listOfObjects = [];
                    console.log(result1[0].sType);
					let sensor;
                    request(`https://api.darksky.net/forecast/1cc49bed160877460d1977016029cdd8/${loc}`, { json: true }, (err, resp, body) => {
                    if (err) { return console.log(err); }
                    for(var i=0;i<result1.length;i++){
						
                        if(result1[i].sType=="Temperature"){
                            console.log(resp.body.currently.temperature);
                            var singleObj = {};
                            singleObj['type'] = result1[i].sType;
                            singleObj['value'] = resp.body.currently.temperature;
                            listOfObjects.push(singleObj);
							sensor = new Sensor({ 
							                    "fId": result[0].id,
												"sId": result1[i].sId,
							                    "type":result1[i].sType, 
							                    "value":resp.body.currently.temperature
							                });
                        }else if(result1[i].sType=="Humidity"){
                            console.log(resp.body.currently.humidity);
                            var singleObj = {};
                            singleObj['type'] = result1[i].sType;
                            singleObj['value'] = resp.body.currently.humidity;
                            listOfObjects.push(singleObj);
							sensor = new Sensor({ 
							                    "fId": result[0].id,
												"sId": result1[i].sId, 
							                    "type":result1[i].sType, 
							                    "value":resp.body.currently.humidity
							                });
                        }else if(result1[i].sType=="Precipitation"){
                            console.log(resp.body.currently.precipIntensity);
                            var singleObj = {};
                            singleObj['type'] = result1[i].sType;
                            singleObj['value'] = resp.body.currently.precipIntensity;
                            listOfObjects.push(singleObj);
							sensor = new Sensor({ 
							                    "fId": result[0].id, 
												"sId": result1[i].sId,
							                    "type":result1[i].sType, 
							                    "value":resp.body.currently.precipIntensity
							                });
                        }else if(result1[i].sType=="Wind"){
                            console.log(resp.body.currently.windSpeed);
                            var singleObj = {};
                            singleObj['type'] = result1[i].sType;
                            singleObj['value'] = resp.body.currently.wind;
                            listOfObjects.push(singleObj);
							sensor = new Sensor({ 
							                    "fId": result[0].id, 
												"sId": result1[i].sId,
							                    "type":result1[i].sType, 
							                    "value":resp.body.currently.wind
							                });
                        }else if(result1[i].sType=="Visibility"){
                            console.log(resp.body.currently.visibility);
                            var singleObj = {};
                            singleObj['type'] = result1[i].sType;
                            singleObj['value'] = resp.body.currently.visibility;
                            listOfObjects.push(singleObj); 
							sensor = new Sensor({ 
							                    "fId": result[0].id, 
												"sId": result1[i].sId,
							                    "type":result1[i].sType, 
							                    "value":resp.body.currently.visibility
							                });
                        }
						sensor.save().then(()=>{
							console.log("Sensor data inserted successfully");
						}).catch(err=>{
						    console.log("Error insereting record: "+err);
		                });
                    }
                    console.log(listOfObjects);
					
                    res.status(200).json({message : listOfObjects});
                    });
                }
                }
            );
        }
        }
    );
});



//farmer get data from mongodb for charts
app.get('/charts', (req, res) => {
    let q="select id from user where email = '"+sess.email+"'";
    db.query(q, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        else{
            Sensor.find({fId: result[0].id}).then(sensor =>{
                if(!sensor){
                    return res.json({message:""});
                }
                else{
                    console.log(sensor);
                    res.json({message:"Sensors Found", result:sensor});
                }
            })
        }
        });
});





//machine controller edge station
app.get('/edgeStation', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="select * from edge_station where mcId='"+JSON.stringify(result[0].id)+"'";
            db.query(q2, (err, result1) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.status(200).json({message:""});
                }else{
                    console.log(JSON.parse(JSON.stringify(result1)));
                    res.status(200).json({message : result1});
                }
                }
            );
            
        }
        }
    );
});



//machine controller add new machine
app.post('/machine', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let mdesc = req.body.mDesc;
    let price = req.body.mPrice;
    let type = req.body.mType;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.status(500).json({message:"Invalid Session"});
        }else{
            let q1="insert into machine (mcId, mDesc, mPrice, mType) VALUES ('"+JSON.stringify(result[0].id)+"', '"+mdesc+"', '"+price+"', '"+type+"')";
            db.query(q1, (err, result) => {
                if (err) {
                    return res.status(500).send(err);
                }else{
                    console.log("machine added")
                    res.status(200).json({message:"Machine Added"});
                }
            });
        }
        }
    );
});

//machine controller add new sensor
app.post('/sensor', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let stype=req.body.type;
    let price = req.body.price;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        if(!result.length){
            res.status(500).json({message:"Invalid Session"});
        }else{
            let q1="insert into sensor (mcId, stype,price) VALUES ('"+JSON.stringify(result[0].id)+"', '"+stype+"', '"+price+"')";
            db.query(q1, (err, result) => {
                if (err) {
                    return res.status(500).send(err);
                }else{
                    res.status(200).json({message:"Successfully Added"})
                }
            });
        }
        }
    );
});


//machine controller add new service
app.post('/service', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let sdesc = req.body.serDesc;
    let price = req.body.serPrice;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.status(500).json({message:"Invalid Session"});
        }else{
            let q1="insert into services (mcId, serDesc, serPrice) VALUES ('"+JSON.stringify(result[0].id)+"', '"+sdesc+"', '"+price+"')";
            db.query(q1, (err, result) => {
                if (err) {
                    return res.status(500).send(err);
                }else{
                    res.status(200).json({message:"Successfully Added"})
                }
            });
        }
        }
    );
});



//machine controller update sensor status to ACTIVE from edge station
app.post('/updateSensorStatus', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let id=req.body.sid;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="UPDATE edge_station SET status = 'Active' WHERE sId='"+id+"'";
            db.query(q2, (err, result1) => {
                console.log(result1);
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    console.log(JSON.parse(JSON.stringify(result1)));
                    let q3="UPDATE sensor SET status = 'Active' WHERE sid='"+id+"'";
                    db.query(q3, (err, result1) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err);
                    }
                        console.log(JSON.parse(JSON.stringify(result1)));
                        res.status(200).send("Success");
                }
            );
                }
                }
            );
            
        }
        }
    );
});

//machine controller update sensor status to INACTIVE from edge station
app.post('/updateSensorStatusInactive', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let id=req.body.sid;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="UPDATE edge_station SET status = 'Inactive' WHERE sId='"+id+"'";
            db.query(q2, (err, result1) => {
                console.log(result1);
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    console.log(JSON.parse(JSON.stringify(result1)));
                    let q3="UPDATE sensor SET status = 'Inactive' WHERE sid='"+id+"'";
                    db.query(q3, (err, result1) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err);
                    }
                        console.log(JSON.parse(JSON.stringify(result1)));
                        res.status(200).send("Success");
                }
            );
                }
                }
            );
            
        }
        }
    );
});





//machine controller update sensor status to DISCONNECTED/NOT IN USE from edge station
app.post('/updateSensorStatusDisconnect', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let id=req.body.sid;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="DELETE from edge_station WHERE sId='"+id+"'";
            db.query(q2, (err, result1) => {
                console.log(result1);
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    console.log(JSON.parse(JSON.stringify(result1)));
                    let q3="UPDATE sensor SET status = 'Not In Use' WHERE sid='"+id+"'";
                    db.query(q3, (err, result1) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err);
                    }
                        console.log(JSON.parse(JSON.stringify(result1)));
                        res.status(200).send("Success");
                }
            );
                }
                }
            );
            
        }
        }
    );
});




//machine controller get added sensor details
app.get('/mcGetSensor', (req, res) => {
    console.log("here",sess.email);
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            return res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="select * from sensor where mcId='"+JSON.stringify(result[0].id)+"'";
            db.query(q2, (err, result1) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.status(200).json({message:""});
                }else{
                    res.status(200).json({message : result1});
                }
                }
            );
            
        }
        }
    );
});

//machine controller get added machine details
app.get('/mcGetMachine', (req, res) => {
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            return res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="select * from machine where mcId='"+JSON.stringify(result[0].id)+"'";
            db.query(q2, (err, result1) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.status(200).json({message:""});
                }else{
                    console.log(JSON.parse(JSON.stringify(result1)));
                    res.status(200).json({message : result1});
                }
                }
            );
            
        }
        }
    );
});



//machine controller get added services details
app.get('/mcGetService', (req, res) => {
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            return res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="select * from services where mcId='"+JSON.stringify(result[0].id)+"'";
            db.query(q2, (err, result1) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.status(200).json({message:""});
                }else{
                    console.log(JSON.parse(JSON.stringify(result1)));
                    res.status(200).json({message : result1});
                }
                }
            );
            
        }
        }
    );
});





//machine controller monitor all active sensors
app.get('/mcmonitor', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.status(500).json({message:"Invalid Session"});
        }else{
            console.log("in");
            let q1="select fname, sType,location from edge_station where mcId='"+result[0].id+"' and status='Active'";
            
            db.query(q1, (err, result1) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.status(200).json({message:""});
                }else{
                    var listOfObjects = [];
                    console.log("bjhcvsdjhcvdsvcj",result1[0].sType);
                    
                    for(let i=0;i<result1.length;i++){
                        let loc=result1[i].location;
                        
                        request(`https://api.darksky.net/forecast/1cc49bed160877460d1977016029cdd8/${loc}`, { json: true }, (err, resp, body) => {
                            if (err) { return console.log(err); }
                            
                            if(result1[i].sType==="Temperature"){
                                console.log(resp.body);
                                console.log(resp.body.currently.temperature);
                                var singleObj = {};
                                singleObj['fname'] = result1[i].fname;
                                singleObj['type'] = result1[i].sType;
                                singleObj['value'] = resp.body.currently.temperature;
                                listOfObjects.push(singleObj);
                                if(i == result1.length-1){
                                    res.status(200).json({message : listOfObjects});
                                }
                            }else if(result1[i].sType==="Humidity"){
                                console.log(resp.body.currently.humidity);
                                var singleObj = {};
                                singleObj['fname'] = result1[i].fname;
                                singleObj['type'] = result1[i].sType;
                                singleObj['value'] = resp.body.currently.humidity;
                                listOfObjects.push(singleObj);
                                if(i == result1.length-1){
                                    res.status(200).json({message : listOfObjects});
                                }
                            }else if(result1[i].sType==="Precipitation"){
                                console.log(resp.body.currently.precipIntensity);
                                var singleObj = {};
                                singleObj['fname'] = result1[i].fname;
                                singleObj['type'] = result1[i].sType;
                                singleObj['value'] = resp.body.currently.precipIntensity;
                                listOfObjects.push(singleObj);
                                if(i == result1.length-1){
                                    res.status(200).json({message : listOfObjects});
                                }
                            }else if(result1[i].sType==="Wind"){
                                console.log(resp.body.currently.windSpeed);
                                var singleObj = {};
                                singleObj['fname'] = result1[i].fname;
                                singleObj['type'] = result1[i].sType;
                                singleObj['value'] = resp.body.currently.wind;
                                listOfObjects.push(singleObj);
                                if(i == result1.length-1){
                                    res.status(200).json({message : listOfObjects});
                                }
                            }else if(result1[i].sType==="Visibility"){
                                console.log(resp.body.currently.visibility);
                                var singleObj = {};
                                singleObj['fname'] = result1[i].fname;
                                singleObj['type'] = result1[i].sType;
                                singleObj['value'] = resp.body.currently.visibility;
                                listOfObjects.push(singleObj);
                                if(i == result1.length-1){
                                    res.status(200).json({message : listOfObjects});
                                }
                        }
                    });
                    console.log(listOfObjects);
                    // res.status(200).json({message : listOfObjects});
                    
                }
                }
                }
            );
        }
        }
    );
});







//machine controller update service status to ACTIVE
app.post('/updateServiceStatus', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let id=req.body.sid;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="UPDATE services SET status = 'Active' WHERE id='"+id+"'";
            db.query(q2, (err, result1) => {
                console.log(result1);
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.status(200).json({message:"Success"});
                }
                }
            );
            
        }
        }
    );
});

//machine controller update service status to INACTIVE
app.post('/updateServiceStatusInactive', (req, res) => {
    console.log("inactiveeeeeeeeee "+ JSON.stringify(req.body));
    let id=req.body.sid;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="UPDATE services SET status = 'Inactive' WHERE id='"+id+"'";
            db.query(q2, (err, result1) => {
                console.log(result1);
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.status(200).json({message:"Success"});
                }
                }
            );
            
        }
        }
    );
});





//machine controller update service status to Not In Use
app.post('/updateServiceStatusDisconnect', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let id=req.body.sid;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="UPDATE services SET status = 'Not In Use' WHERE id='"+id+"'";
            db.query(q2, (err, result1) => {
                console.log(result1);
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.status(200).json({message:"Success"});
                }
                }
            );
            
        }
        }
    );
});




//machine controller delete NOT IN USE service
app.post('/updateServiceStatusDelete', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let id=req.body.sid;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="DELETE from services WHERE id='"+id+"'";
            db.query(q2, (err, result1) => {
                console.log(result1);
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.status(200).json({message:"Success"});
                }
                }
            );
            
        }
        }
    );
});






//machine controller update machine status to ACTIVE
app.post('/updateMachineStatus', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let id=req.body.sid;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="UPDATE machine SET status = 'Active' WHERE id='"+id+"'";
            db.query(q2, (err, result1) => {
                console.log(result1);
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.status(200).json({message:"Success"});
                }
                }
            );
            
        }
        }
    );
});

//machine controller update machine status to INACTIVE
app.post('/updateMachineStatusInactive', (req, res) => {
    console.log("inactiveeeeeeeeee "+ JSON.stringify(req.body));
    let id=req.body.sid;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="UPDATE machine SET status = 'Inactive' WHERE id='"+id+"'";
            db.query(q2, (err, result1) => {
                console.log(result1);
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.status(200).json({message:"Success"});
                }
                }
            );
            
        }
        }
    );
});





//machine controller update service status to ACTIVE
app.post('/updateMachineStatusDisconnect', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let id=req.body.sid;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="UPDATE machine SET status = 'Not In Use' WHERE id='"+id+"'";
            db.query(q2, (err, result1) => {
                console.log(result1);
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.status(200).json({message:"Success"});
                }
                }
            );
            
        }
        }
    );
});




//machine controller delete NOT IN USE machine
app.post('/updateServiceStatusDelete', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    let id=req.body.sid;
    let q="select id from user where email = '"+sess.email+"'";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            res.status(500).json({message:"Invalid Session"});
        }else{
            let q2="DELETE from machine WHERE id='"+id+"'";
            db.query(q2, (err, result1) => {
                console.log(result1);
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                if(!result1.length){
                    res.status(200).json({message:"Success"});
                }
                }
            );
            
        }
        }
    );
});






app.get('/logout',function(req,res){    
    req.session.destroy(function(err){  
        if(err){  
            console.log(err);  
        }  
        else  
        {
            res.redirect('/login');  
        }
    });
});  






app.get('/allSensors', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    //sess = req.session;
    let q="select * from sensor";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            return res.status(500).json({message:"No Sensors"});
        
        }
        else {
            res.status(200).json({message: result});
        }
    }
    );
});


app.get('/allmachine', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    //sess = req.session;
    let q="select * from machine";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            return res.status(500).json({message:"No machines"});
        
        }
        else {
            res.status(200).json({message: result});
        }
    }
    );
});


app.get('/allServices', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    //sess = req.session;
    let q="select * from services";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            return res.status(500).json({message:"No Services"});
        
        }
        else {
            res.status(200).json({message: result});
        }
    }
    );
});

app.get('/allUsers', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    //sess = req.session;
    let q="select * from user";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            return res.status(500).json({message:"No User"});
        
        }
        else {
            res.status(200).json({message: result});
        }
    }
    );
});

app.get('/allEdgeStation', (req, res) => {
    console.log("req body "+ JSON.stringify(req.body));
    //sess = req.session;
    let q="select * from edge_station";
    
    db.query(q, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if(!result.length){
            return res.status(500).json({message:"No edge_stations"});
        
        }
        else {
            res.status(200).json({message: result});
        }
    }
    );
});