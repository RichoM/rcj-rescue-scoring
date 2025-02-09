// Libraries
//
var env = require('node-env-file')
env('process.env')

var express       = require('express');
var RateLimit     = require('express-rate-limit');
const compression = require('compression')
var path          = require('path')
var favicon       = require('serve-favicon')
var logger        = require('./config/logger').mainLogger
var cookieParser  = require('cookie-parser')
var bodyParser    = require('body-parser')
var session       = require('express-session')

const limiter = new RateLimit({
    windowMs: process.env.LIMITER_WINDOW_MS || 1000, // 1 sec
    max     : process.env.LIMITER_MAX || 200
});

var app = express();
app.set('trust proxy', true);
async function bootstrap(){
    // Static routes

    var homeRoute    = require('./routes/home')
    var localesRoute = require('./routes/locales')


    // Configuration

    app.use(compression())

    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
    /** Setting up the correct view engine - we are using pug */
    app.set('views', path.join(__dirname, 'views'))
    app.set('view engine', 'pug')

    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

    app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')))
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(cookieParser())
    app.use(express.static(path.join(__dirname, 'public')))

    // apply rate limiter to all requests
    app.use(limiter);


    // Route configuration

    app.use('/home', [homeRoute.public, homeRoute.private, homeRoute.admin])
    app.use('/locales', localesRoute)

    // Custom routes
    // This is called last in the routing config, therefor it'll take care of 404s
    app.use(function (req, res, next) {
        logger.error("404 Not Found: " + req.originalUrl)
        var err = new Error('Not Found: ' + req.originalUrl)
        err.status = 404
        next(err)
    })

    // Error handling
    process.on('uncaughtException', function(err) {
        console.log("SERVER ERROR");
        console.log(err);
    });

    app.use(function (err, req, res, next) {
        // is at base, send to login
        if (req.originalUrl === "/") {
            res.redirect("home")
        }

        /*
        *  Check if it is an api or static page miss (404)
        *
        * One of the big things to do for scalability is to separate tcp server,static server and application server (api).
        *
        * Right now they are mixed and running on a single core togeather. To be able to use Node.js to 100% the  application
        * part of the server should run alone on an own process. And the static files (CSS, HTML and Javascript(frontend)) should
        * for performance reasons not run on Node.js but on nginx (http://nginx.org/). One of the fastest static servers out there used
        * by many companies. Also it can work as a reverse proxy to support multi Node.js clusters.
        *
        */
        else {
            if (err.status != 404) {
                logger.error(err)
            }

            // since we are running api and static website on same we need to hack the different custom routes
            var stringSplit = req.originalUrl.split("/")
            if (stringSplit[1] !== undefined && stringSplit[1] === "api") {
                res.status(404).send({ message: "404 Not found" })
            } else {

                // in in development show stacktrace
                if (app.get('env') === 'development') {
                    res.render('error', {
                        message: err.message,
                        error:   err
                    })
                } else { // in production :( 
                    res.status(err.status || 500)
                    res.render('error', {
                        message: err.message,
                        error: {}
                    })
                }
            }
        }
    })
    
}
bootstrap();
module.exports = app
