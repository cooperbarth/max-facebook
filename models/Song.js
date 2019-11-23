"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SongSchema = new Schema({
    notes: Array,
    times: Array
});

SongSchema.statics.create = function(obj) {
    let song = new mongoose.model("Song", SongSchema)();
    song.notes = obj.notes;
    song.times = obj.times;
    return song;
};

module.exports = mongoose.model("Song", SongSchema);