"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dns = require("dns");
const url = require("url");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3210;
const generateHash = function () {
    const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const ID_LENGTH = 6;
    let HASH = "";
    for (let i = 0; i < ID_LENGTH; i++) {
        HASH += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return HASH;
};
mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-xgb1n.mongodb.net/test?retryWrites=true&w=majority`, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, () => {
        console.log(mongoose.connection.readyState);
    })
    .catch(err => {
        console.log(err);
    });
const Schema = mongoose.Schema;
const urlObjSchema = new Schema({
    url: {
        type: String,
        required: true
    },
    hash: {
        type: String,
        required: true
    }
});
const UrlObj = mongoose.model("UrlObj", urlObjSchema);
const options = {
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "X-Access-Token"],
    credentials: true,
    methods: "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",
    origin: "localhost",
    preflightContinue: false
};
app.use(cors(options));
const urlencodedParser = bodyParser.urlencoded({
    extended: false
});
app.use('/public', express.static(process.cwd() + '/public'));
app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});
app.get("/api/hello", function (req, res) {
    res.json({
        greeting: 'hello API'
    });
});
app.post("/resultURL", urlencodedParser, function (req, res) {
    let parsedUrl = url.parse(req.body.url);
    dns.lookup(parsedUrl.hostname, function (err) {
        if (err) {
            res.json({
                error: "invalid URL"
            });
        } else {
            let urlObj = {
                url: req.body.url,
                hash: generateHash()
            };
            UrlObj.create(urlObj, function (err) {
                err
                    ?
                    res.json(err) :
                    res.render("resultURL", {
                        link: `${req.headers.origin}/sh/${urlObj.hash}`
                    });
            });
        }
    });
});
app.get("/resultURL", (req, res) => {
    res.render("resultURL");
});
app.get("/sh/:hash", function (req, res) {
    UrlObj.findOne({
        hash: req.params.hash
    }, function (err, result) {
        if (err) {
            res.json(err);
        } else {
            let changedUrl = result.url;
            if (result.url.slice(0, 3) === "www") {
                changedUrl = "https://" + result.url.slice(4);
            }
            res.redirect(changedUrl);
        }
    });
});
const listener = app.listen(PORT, function () {
    console.log("Your app is listening on port " + listener.address().port);
});