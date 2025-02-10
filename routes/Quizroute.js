const express = require("express");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const router = express.Router();
const Quiz = require("../models/quiz.js");
const expressError = require("../utils/expressError.js").default;
const wrapAsync = require("../utils/wrapAsync.js").default;
const { quizSchema, questionSchema } = require("../schema.js");

const validateQuestion = (req,res,next)=>{
    let { error } = questionSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el)=> el.message).join(",");
        throw new expressError(400,errMsg);
    } else{
        next();
    }
};

const validateQuiz = (req,res,next)=>{
    let { error } = quizSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el)=> el.message).join(",");
        throw new expressError(400,errMsg);
    } else{
        next();
    }
};

const randomCode = `${Math.floor(100 + Math.random()* 900)}-${
Math.floor(100 + Math.random()* 900)}`;

router.get("/create", (req,res)=>{
    res.render("quizzes/hostquiz.ejs");
});

router.post("/", validateQuestion,validateQuiz, wrapAsync(async(req,res)=>{
        const {title,description, questions} = req.body;
        console.log(req.body);
        if(!title || !questions || questions.length === 0 ){
            return res.status(400).json({ success: false, message: "Invalid input" });
        };
        // Save quiz to database
        const quiz = new Quiz({title, description, code: randomCode, questions});
        let result = await quiz.save();
        console.log(result);
        res.status(201).json({ success: true, code: randomCode,
        quizId: result._id,
        });
    
}));

router.get("/:id",wrapAsync(async(req,res)=>{
    let { id } = req.params;
        if(!ObjectId.isValid(id)){
            return res.send(400).send("invalid id format");
        };

        const quiz = await Quiz.findById(id);
        if(!quiz){
            res.status(404).send("quiz is not found");
        };

        res.render("quizzes/show.ejs", { quiz });  
}));

module.exports = router;