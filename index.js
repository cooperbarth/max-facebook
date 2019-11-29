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
        } else if (timing < 0.125) {
            timing = 0.125;
        }
        timings.push(timing);
    },
    addUser: newName => {
        if (newName !== name) {
            name = newName;
        }
        User.findOne({
            name: name
        }, (err, user) => {
            if (!err && !user) {
                const user = User.create({
                    name: name
                });
                user.save();
            }
        });
    },
    loadUsers: () => {
        if (name !== "") {
            User.find({
                name: {$ne: name}
            }, (err, users) => {
                if (err) {
                    maxAPI.post("Error retrieving users");
                } else {
                    for (let user of users) {
                        maxAPI.outlet(user.name);
                    }
                }
            });
        }
    },
    receiveMessage: () => {
        Message.find({
            seen: false
        })
            .populate("receiver")
            .populate("song")
            .exec((err, messages) => {
                if (err) {
                    maxAPI.post("Error retrieving message");
                } else {
                    for (let message of messages) {
                        if (message.receiver.name === name) {
                            const song = message.song;
                            maxAPI.outlet(song.times.concat(song.notes));
                            Message.findOneAndUpdate({
                                _id: message._id
                            }, { 
                                $set: {
                                    seen: true
                                }
                            }, {upsert: true}, err => {
                                if (err) {
                                    maxAPI.post("Error updating message status");
                                }
                            });
                            return;
                        }
                    }
                }
            });
    },
    sendMessage: receiverName => {
        if (!receiverName || receiverName === "") {
            maxAPI.post("No receiver name given");
            return;
        } else if (name === "") {
            maxAPI.post("Must log in before sending messages");
            return;
        } else if (notes.length === 0 || timings.length === 0) {
            maxAPI.post("No notes played");
        } else {
            User.findOne({
                name: name
            }, (err, me) => {
                if (err) {
                    maxAPI.post("Error retrieving users");
                    notes = [];
                    timings = [];
                } else if (!me) {
                    maxAPI.post(`No user with name ${name} - please log in again`);
                } else {
                    User.findOne({
                        name: receiverName
                    }, (err, receiver) => {
                        if (err) {
                            maxAPI.post("Error retrieving users");
                            notes = [];
                            timings = [];
                        } else if (!receiver) {
                            maxAPI.post(`No receiver with name ${receiverName}`);
                        } else {
                            const song = Song.create({
                                notes: notes,
                                times: timings
                            });
                            song.save();
                            const message = Message.create({
                                receiver: receiver._id,
                                sender: me._id,
                                song: song
                            });
                            message.save();
                            notes = [];
                            timings = [];
                        }
                    });
                }
            });
        }
    }
});
