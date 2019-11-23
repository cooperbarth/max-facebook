"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: String
});

UserSchema.statics.create = function(obj) {
    let user = new mongoose.model("User", UserSchema)();
    user.name = obj.name;
    return user;
};

module.exports = mongoose.model("User", UserSchema);