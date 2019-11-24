"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    date: Date,
    receiver: {type: Schema.Types.ObjectId, ref: "User"},
    seen: Boolean,
    sender: {type: Schema.Types.ObjectId, ref: "User"},
    song: {type: Schema.Types.ObjectId, ref: "Song"}
});

MessageSchema.statics.create = function(obj) {
    let message = new mongoose.model("Message", MessageSchema)();
    message.date = new Date();
    message.receiver = obj.receiver;
    message.seen = false;
    message.sender = obj.sender;
    message.song = obj.song;
    return message;
};

module.exports = mongoose.model("Message", MessageSchema);