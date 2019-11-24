"use strict";

const config = require("./config/config");
const mongoose = require("mongoose");
mongoose.connect(config.database, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true
}, err => {
    if (err) {
        console.log("Could not connect to database.");
        console.log(err);
        console.log(`${err.name}: ${err.errorLabels}`);
        process.exit(1);
    } else {
        console.log("Connected to database.");
    }
});

const maxAPI = require("max-api");
maxAPI.post("Node.js Process Running", maxAPI.POST_LEVELS.INFO);

const Message = require("./models/Message");
const Song = require("./models/Song");
const User = require("./models/User");

let name = "";
let notes = [];
let timings = [];

maxAPI.addHandlers({
    addNote: note => {
        notes.push(note);
    },
    addTiming: timing => {
        timing = parseInt(timing, 10);
        if (isNaN(timing)) {
            return;
        }
        if (timing > 3) {
            timing = 4;
        } else if (timing > 2) {
            timing = 3;
        } else if (timing > 1.5) {
            timing = 2;
        } else if (timing > 1) {
            timing = 1.5;
        } else if (timing > 0.5) {
            timing = 1;
        } else {
            timing = 0.5;
        }
        timings.push(timing);
    },
    addUser: newName => {
        if (newName !== name) {
            name = newName;
            User.findOne({
                name: name
            }, (err, user) => {
                if (!err && !user) {
                    const user = User.create({
                        name: name
                    });
                    user.save();
                }
            })
        }
    },
    loadUsers: () => {
        if (name !== "") {
            User.find({
                name: {$ne: name}
            }, (err, users) => {
                if (err) {
                    maxAPI.post("Error retrieving users");
                }
                for (let user of users) {
                    maxAPI.outlet(user.name);
                }
            })
        }
    },
    receiveMessage: () => {
        Message.findOne({
            "receiver.name": name,
            seen: false
        })
            .populate("song")
            .exec((err, res) => {
                if (err) {
                    maxAPI.post("Error retrieving message");
                } else if (!res) {
                    maxAPI.post("No messages for this user");
                }
                const song = res.song;
                maxAPI.outlet(song.times.concat(notes));
                Message.findOneAndUpdate({
                    _id: res._id
                }, {
                    seen: true
                });
            });
    },
    sendMessage: receiverName => {
        const song = Song.create({
            notes: notes,
            times: timings
        });
        User.findOne({
            name: name
        }, (err, me) => {
            if (err) {
                maxAPI.post("Error retrieving users");
            }
            User.findOne({
                name: receiverName
            }, (err, receiver) => {
                if (err) {
                    maxAPI.post("Error retrieving users");
                }
                const message = Message.create({
                    receiver: receiver._id,
                    sender: me._id,
                    song: song
                });
                message.save();
            });
        });
    }
})
