const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Quiz = require("../models/quiz.js");

const randomCode = `${Math.floor(100 + Math.random()* 900)}-${
Math.floor(100 + Math.random()* 900)}`;

router.get("/create", (req,res)=>{
    res.render("quizzes/hostquiz.ejs");
});

router.post("/", async(req,res)=>{
    try{
        const {title,description, questions} = req.body;
        console.log(req.body);
        if(!title || !description || !questions || questions.length === 0 ){
            return res.status(400).json({ success: false, message: "Invalid input" });
        };

        // Save quiz to database
        const quiz = new Quiz({title, description, code: randomCode, questions});
        let result = await quiz.save();
        console.log(result);
        res.status(201).json({ success: true, code: randomCode });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

router.get("/:id",async(req,res)=>{
    try{
        const quiz = await Quiz.findById(req.params.id);
        if(!quiz){
            res.status(404).send("quiz is not found");
        }
        res.render("quizzes/show.ejs", { quiz });
    } catch(error){
        console.log(error);
        res.status(500).send("Server error");
    };    
});

module.exports = router;