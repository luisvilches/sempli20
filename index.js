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
const conf = require(path.join(path.resolve(),"config.js"));
const winston = require('winston');

const server = http.createServer(app);
const io = socket(server);
io.set('origins', '*:*');


function createServer(){
    return server.listen(conf.server.port,err => {
        if(err){
            console.log(chalk.red("-> Sempli error => ", err));
        } else {
            console.log(chalk.cyan("-> Sempli listen port => ", chalk.magenta(conf.server.port)));
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
              console.log(chalk.red("-> Sempli error => ", err));
          } else {
            console.log(chalk.cyan("-> Sempli connect database => ", chalk.magenta(conf.database.db)));
          }
      })
};

function main(){
    if(conf.database.db != ""){
        mongoose.Promise = global.Promise;
        databaseConnect();
    }
    app.use(cors());
    createServer();

    if(conf.folders.public != ""){
        static();
    }
    var logger = new (winston.Logger)({
        transports: [
          new (winston.transports.File)({
            name: 'info-file',
            filename: 'filelog-info.log',
            level: 'info'
          }),
          new (winston.transports.File)({
            name: 'error-file',
            filename: 'filelog-error.log',
            level: 'error'
          })
        ]
      });
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
    return app.use(express.static(path.join(path.resolve(),conf.folders.public)));
}

function exportModel(models){
    return mongoose.model(String(models),models);
}

function createModel(name,obj){
    return mongoose.model(name, new mongoose.Schema(obj));
}

module.exports = {
    main: main,
    use: use,
    router: express.Router(),
    routes:{
        public:routerPublic,
        private:routerPrivate
    },
    io: io,
    modelSchema: mongoose.Schema,
    exportModel:exportModel,
    orm: mongoose,
    createModel: createModel
}