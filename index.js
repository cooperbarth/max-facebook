"use strict";

const dotenv = require("dotenv");
dotenv.config();

const config = require("./config/config")[env || "development"];
const mongoose = require("mongoose");
mongoose.connect(config.database, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true
}, err => {
    if (err) {
        console.log("Could not connect to database.");
        console.log(`${err.name}: ${err.errorLabels}`);
        process.exit(1);
    } else {
        console.log("Connected to database.");
    }
});

const express = require("express");
const app = express();

// Parses request bodies
const bodyParser = require("body-parser");
const bpConfig = {limit: "10mb", extended: true};
app.use(bodyParser.urlencoded(bpConfig));
app.use(bodyParser.json(bpConfig));

// Adds CORS headers to requests
const cors = require("./src/middleware/cors");
app.use(cors);

const routes = require("./config/routes");
Object.entries(routes).forEach(([route, router]) => {
    app.use(route, router);
});

const PORT = process.env.PORT || 8081;
app.listen(PORT);
console.log("Application listening on PORT: " + PORT);

if (env === "production") {
    require("./scripts/setTimers")();
}

module.exports = app;