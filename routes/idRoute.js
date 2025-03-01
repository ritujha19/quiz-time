const express = require("express");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const router = express.Router();
const Quiz = require("../models/quiz.js");
const expressError = require("../utils/expressError.js");
const wrapAsync = require("../utils/wrapAsync.js");

router.get("/:id", wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    if (!ObjectId.isValid(id)) {
        return next(new expressError(400, "Invalid id format"));
    }

    const quiz = await Quiz.findById(id);
    if (!quiz) {
        return next(new expressError(404, "Quiz not found"));
    }

    res.render("createQuiz-pages/show.ejs", { quiz });
}));

router.get("/:id/:questionId/edit", wrapAsync(async (req, res, next) => {
    let { id, questionId } = req.params;
    const quiz = await Quiz.findById(id);
    if (!quiz) {
        return next(new expressError(404, "Quiz not found"));
    }

    const question = quiz.questions.id(questionId);
    if (!question) {
        return next(new expressError(404, "Question not found"));
    }

    res.render("createQuiz-pages/editquestion.ejs", { quiz, question });
}));

// UPDATE ROUTE
router.put("/:id/:questionId", wrapAsync(async (req, res, next) => {
    let { id, questionId } = req.params;
    const { question, options, correctOption } = req.body;
    const quiz = await Quiz.findById(id);
    if (!quiz) {
        return next(new expressError(404, "quiz not found"));
    }

    let q = quiz.questions.id(questionId);
    if (!q) {
        return next(new expressError(404, "question not found"));
    }

    q.question = question;
    q.options = options;
    q.correctOption = correctOption;
    let result = await quiz.save();
    res.redirect(`/quiz/${id}`);
}));

// DELETE ROUTE
router.delete("/:id/:questionId", wrapAsync(async (req, res, next) => {
    let { id, questionId } = req.params;
    let quiz = await Quiz.findById(id);
    if (!quiz) {
        return next(new expressError(404, "quiz not found"));
    }
    quiz.questions = quiz.questions.filter(q => q._id.toString() !== questionId);
    await quiz.save();
    res.redirect(`/quiz/${id}`);
}));

router.delete("/:id", async (req, res) => {
    let { id } = req.params;
    let quiz = await Quiz.findByIdAndDelete(id);
    res.redirect("/quiz/create");
});

module.exports = router;