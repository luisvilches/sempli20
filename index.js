const express = require("express");
const app = express();
const body = require("connect-multiparty")();
const http = require("http");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const mongoose = require("mongoose");
const socket = require("socket.io");
const chalk = require("chalk");
const conf = require(path.join(path.resolve(),"semplice.json" || "config.js"));
const jwt = require('jwt-simple');
const moment = require("moment");
const NodeMailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const transport = NodeMailer.createTransport(smtpTransport(conf.mail));

const server = http.createServer(app);
const io = socket(server);
io.set('origins', '*:*');


function createServer(){
    return server.listen(conf.server.port,err => {
        if(err){
            console.log(chalk.red("-> Semplice error => ", err));
        } else {
            console.log(chalk.cyan("-> Semplice listen port => ", chalk.magenta(conf.server.port)));
        }
    });
};

function databaseConnect(){
    return mongoose.connect(conf.database.db, {
        useMongoClient: true,
        autoIndex: false,
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 500,
        poolSize: 10, 
        bufferMaxEntries: 0
      }, err => {
          if(err){
              console.log(chalk.red("-> Semplice error => ", err));
          } else {
            console.log(chalk.cyan("-> Semplice connect database => ", chalk.magenta(conf.database.db)));
          }
      })
};

function main(){
    if(conf.database.db != ""){
        mongoose.Promise = global.Promise;
        databaseConnect();
    }
    app.use(cors());

    if(conf.auth.enable == true){
        app.post("/login",body, function(req,res,next){
            login(req,res,next);
        })
    }
    
    createServer();

    if(conf.folderPublic != ""){
        static();
    }
}


function use(use){
    return app.use(use);
}

function routerPublic(route,controller){
    return app.use(route,body,controller);
}


function routerPrivate(route,controller){
    return app.use(route,body,controller);
}

function static(){
    return app.use(express.static(path.join(path.resolve(),conf.folderPublic)));
}

function exportModel(models){
    return mongoose.model(String(models),models);
}

function createModel(name,obj){
    return mongoose.model(name, new mongoose.Schema(obj));
}

function uploadFile(obj,name,folder){
    let nombre_nuevo = name + "_file";
    let ruta_archivo = obj.path;
    let nueva_ruta = path.join(path.resolve(),conf.folderPublic,folder ? folder:"",nombre_nuevo + path.extname(ruta_archivo).toLowerCase());//"."+ folder + nombre_nuevo + path.extname(ruta_archivo).toLowerCase();
    let nombre_imagen = nombre_nuevo + path.extname(ruta_archivo).toLowerCase();
    fs.createReadStream(ruta_archivo).pipe(fs.createWriteStream(nueva_ruta)); 
    return nombre_imagen;
}

const createTokens = (user) => {
    let payload = {
        sub: user._id,
        iat: moment().unix(),
        exp: moment().add(14, 'days').unix(),
        username: user.name,
    };

    return jwt.encode(payload,conf.auth.TOKEN_SECRET);
}


function auth(req,res,next){
    if (!req.headers.authorization) {
        return res.status(403).json({message: 'Incorhentication error'})
    }

    let token = req.headers.authorization.split(" ")[1];
    let payload = jwt.decode(token,conf.auth.TOKEN_SECRET);

    if (payload.exp <= moment().unix()) {
        return res.status(401).json({message: 'Session expired'})
    }

    req.user = payload.sub;
    req.username = payload.username;
    next();
}

function login(req,res,next){
    const User = require(path.join(path.resolve(),"models",conf.auth.modelUser));
    User.findOne({mail: req.body.mail},(err, user) => {
        if (err) throw err;
        if (!user) {
            res.json({ success: false, message: 'Authentication failed. User not found.' });
        } else if (user) {
            if (user.password != req.body.password) {
                res.json({ success: false, message: 'Authentication failed. Wrong password.' });
            } else {
                let response = conf.auth.response;
                response.success = true;
                response.token = createTokens(user);
                response.user = user;
                res.json(response);
            }
        }
     });
}

function sendMail(mailOptions, callback){
    return transport.sendMail(mailOptions, callback);
}




function GeoSchema(index){
    return new mongoose.Schema({
        type: {	
          type: String,
          default: "Point"
        },
        coordinates: {
          type: [Number],
          index: "2dsphere" || index
        }
    })
}

module.exports = {
    main: main,
    use: use,
    router: express.Router(),
    routes:routerPublic,
    io: io,
    modelSchema: mongoose.Schema,
    geoSchema:GeoSchema,
    exportModel:exportModel,
    ORM: mongoose,
    createModel: createModel,
    uploadFile:uploadFile,
    routePrivate:auth,
    sendMail: sendMail
}