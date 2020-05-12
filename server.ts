import express = require('express');
import mongoose = require('mongoose');
import bodyParser = require('body-parser')
const dns: any = require("dns");
const url: any = require("url");
import cors = require('cors');

const app: express.Application = express()

// Basic Configuration 
const PORT: any = process.env.PORT || 3210;



//creating unique 6-char identifier
const generateHash = function () : any {
    const ALPHABET: string = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const ID_LENGTH: number = 6;
    let HASH: string = "";
    for (let i: number = 0; i < ID_LENGTH; i++) {
        HASH += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return HASH;
};


/** this project needs a db !! **/
// mongoose.connect(process.env.DB_URI);

mongoose //https://docs.atlas.mongodb.com/driver-connection/#driver-examples
    .connect(
        `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-xgb1n.mongodb.net/test?retryWrites=true&w=majority`, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        },
        () => {
            console.log(mongoose.connection.readyState); //0: disconnected 1: connected 2: connecting 3: disconnecting
        }
    )
    .catch(err => {
        console.log(err);
    });


//mongoose schema
const Schema: any = mongoose.Schema;

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

const options:cors.CorsOptions = {
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "X-Access-Token"],
    credentials: true,
    methods: "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",
    origin: "localhost" , //API_URL
    preflightContinue: false
  }
app.use(cors(options))
/** this project needs to parse POST bodies **/
// you should mount the body-parser here

// create application/x-www-form-urlencoded parser
const urlencodedParser: any = bodyParser.urlencoded({
    extended: false
});

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req: any, res: any) {
    res.sendFile(process.cwd() + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req: any, res: any) {
    res.json({
        greeting: 'hello API'
    });
});


app.post("/resultURL", urlencodedParser, function (req: any, res: any) {
    let parsedUrl: any = url.parse(req.body.url);
    dns.lookup(parsedUrl.hostname, function (err: any) {
        if (err) {
            res.json({
                error: "invalid URL"
            });
        } else {
            let urlObj = {
                url: req.body.url,
                hash: generateHash()
            };
            UrlObj.create(urlObj, function (err: any) {
                err
                    ?
                    res.json(err) :
                    res.render("resultURL", {
                        // link: `${req.headers.origin}/api/shorturl/${urlObj.hash}`
                        link: `${req.headers.origin}/sh/${urlObj.hash}`
                    });
            });
        }
    });
});

app.get("/resultURL", (req: any, res: any) => {
    res.render("resultURL");
});

app.get("/sh/:hash", function (req: any, res: any) {
    UrlObj.findOne({
        hash: req.params.hash
    }, function (err: any, result: any) {
        if (err) {
            res.json(err);
        } else {
            let changedUrl: any = result.url;
            if (result.url.slice(0, 3) === "www") {
                changedUrl = "https://" + result.url.slice(4);
            }
            res.redirect(changedUrl);
        }
    });
});



// listen for requests :)
const listener: any = app.listen(PORT, function () {
    console.log("Your app is listening on port " + listener.address().port)
})