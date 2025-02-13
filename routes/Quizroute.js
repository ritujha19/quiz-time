const express = require("express");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const router = express.Router();
const Quiz = require("../models/quiz.js");
const expressError = require("../utils/expressError.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { quizSchema, questionSchema } = require("../schema.js");

const validateQuestion = (req,res,next)=>{
    for (let i = 0; i < req.body.questions.length; i++) {
        let { error } = questionSchema.validate(req.body.questions[i], { abortEarly: false });
        if(error){
            let errMsg = error.details.map((el)=> el.message).join(",");
            throw new expressError(400,errMsg);
        } 
    }
    next();
};

const validateQuiz = (req,res,next)=>{
   
    let { error } = quizSchema.validate(req.body, { abortEarly: false });
    if(error){
        let errMsg = error.details.map((el)=> el.message).join(",");
        console.log(error.details);
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

router.post("/", validateQuiz, wrapAsync(async(req,res)=>{
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

router.get("/:id/:questionId/edit", async(req,res)=>{
    let {id, questionId} = req.params;
    const quiz = await Quiz.findById(id);
    if (!quiz) {
        return res.status(404).send("Quiz not found");
    };

    const question = quiz.questions.id(questionId);
    if (!question) {
        return res.status(404).send("Question not found");
    };
    res.render("quizzes/edit.ejs", { quiz, question });    
})

router.delete("/:id",async(req,res)=>{
    let {id} = req.params;
    console.log(id);
    res.send("delete");
});

module.exports = router;