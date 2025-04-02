const express = require("express");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const router = express.Router();
const Quiz = require("../models/quiz.js");
const expressError = require("../utils/expressError.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { quizSchema, questionSchema } = require("../schema.js");

const validateQuestion = (req, res, next) => {
    for (let i = 0; i < req.body.questions.length; i++) {
        let { error } = questionSchema.validate(req.body.questions[i], { abortEarly: false });
        if (error) {
            let errMsg = error.details.map((el) => el.message).join(",");
            return next(new expressError(400, errMsg));
        }
    }
    next();
};

const validateQuiz = (req, res, next) => {
    let { error } = quizSchema.validate(req.body, { abortEarly: false });
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        console.log(error.details);
        throw new expressError(400, errMsg);
    } else {
        next();
    }
};

// CREATE ROUTE
const randomCode = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;

router.get("/create", (req, res) => {
    res.render("createQuiz-pages/hostquiz.ejs");
});

router.post("/", validateQuiz, wrapAsync(async (req, res, next) => {
    const { title, description, questions } = req.body;
    console.log(req.body);
    if (!title || !questions || questions.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid input" });
    }
    // Save quiz to database
    const quiz = new Quiz({ title, description, code: randomCode, questions });
    let result = await quiz.save();
    console.log(result);
    return res.status(201).json({
        success: true, code: randomCode,
        quizId: result._id,
    });
}));

router.get("/join", (req,res)=>{
    res.render("joinQuiz-pages/joinPage.ejs");
});

router.post("/join", wrapAsync(async (req, res, next) => {
    const { quizCode, playerName, profilePic } = req.body;
    console.log(quizCode, playerName, profilePic);
    if (!quizCode || !playerName) {
        return next(new expressError(400, "Invalid input"));
    } 

    // find quiz by code
    const quiz = await Quiz.findOne({ code: quizCode });
    if (!quiz) {
        return next(new expressError(404, "Quiz not found"));
    }
    // store player data in session
    req.session.player= {
        name: playerName,
        profilePic: profilePic,
        quizCode: quizCode,
        score: 0,
    };

    // redirect to quiz page
    res.redirect(`/quiz/${quizCode}/play`);
}));

router.get("/:quizCode/play", wrapAsync(async (req, res, next) => {
    const { quizCode } = req.params;
    const quiz = await Quiz.findOne({ code: quizCode });
    if (!quiz) {
        return next(new expressError(404, "Quiz not found"));
    }
    res.render("joinQuiz-pages/playQuiz.ejs", { quiz });
}));    