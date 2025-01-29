const mongoose = require("mongoose");
const { type } = require("os");
const Schema = mongoose.Schema;

const questionSchema = new Schema({
    question: String,
    option: [ String ],
    correcOption: Number
});

const quizSchema = new Schema({
    title: String,
    description: String,
    code: {
        type: String, 
        unique: true,
    },
    questions: [ questionSchema ],
});

module.exports = mongoose.Model("quiz", quizSchema);