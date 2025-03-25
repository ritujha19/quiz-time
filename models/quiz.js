const mongoose = require("mongoose");
const { type } = require("os");
const Schema = mongoose.Schema;

const questionSchema = new Schema({
    question: {
        type: String,
        required: true
    },
    options:{
        type: [String],
        required: true,
        validate: [arrayLimit, "each question must have 4 options"]
    },
    correctOption: {
        type: Number,
        required: true,
    }
});

function arrayLimit(val){
    return val.length === 4;
    val.every(option => option.trim() !== "");
}

const quizSchema = new Schema({
    title: {
        type:String,
        required: true,
    },
    description:{
        type: String,
    },
    code: {
        type: String, 
        unique: true,
        required: true,
        match:/^\d{3}-\d{3}$/,
    },
    questions:{
        type: [ questionSchema ],
        required: true,
    }
});

module.exports = mongoose.model("quiz", quizSchema);