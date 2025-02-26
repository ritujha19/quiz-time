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

// JOIN ROUTE
router.get("/join", (req, res) => {
    res.render("joinQuiz-pages/joinpage.ejs");
});

router.get("/:quizCode/start", wrapAsync(async (req, res, next) => {
    let { quizCode } = req.params;
    console.log("🔍 Checking quiz for:", quizCode);
    const quiz = await Quiz.findOne({ code: quizCode });

    if (!quiz) {
        console.log("❌ Quiz not found!");
        return next(new expressError(404, "Quiz not found"));
    }

    console.log("✅ Quiz found:", quiz);
    res.render("joinQuiz-pages/playquiz.ejs", { quiz });
}));

router.get("/:quizCode/waiting",wrapAsync( async(req, res, next) => {
    let { quizCode} = req.params;
    const quiz = await Quiz.findOne({ code: quizCode });

    if (!quiz) {
        return next(new expressError(404, "Quiz not found"));
    }
    res.render("joinQuiz-pages/waitingPage.ejs", { quizCode });
}));

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

module.exports = function (io) {
    // Store active quizzes
    const activeQuizzes = {};

    io.on("connection", (socket) => {
        console.log("🔗 New user connected:", socket.id);
    
        socket.on("joinQuiz", ({ quizCode, playerName, profilePic }) => {
            console.log(`📩 Received joinQuiz event: ${playerName} joined ${quizCode}`);
    
            if (!activeQuizzes[quizCode]) {
                activeQuizzes[quizCode] = { players: [] };
            }
    
            activeQuizzes[quizCode].players.push({ playerName, profilePic, score: 0 });
    
            console.log("📝 Updated Active Quizzes:", activeQuizzes);
    
            io.emit("updatePlayers", activeQuizzes[quizCode].players);
    
            console.log("✅ Sending quizStarted event...");
            if (activeQuizzes[quizCode].players.length >= 2) { // Change the condition if needed
                console.log("Starting quiz...");
                io.emit("quizStarted", { quizCode });
            }
        });
    
        socket.on("disconnect", () => {
            console.log("❌ User disconnected:", socket.id);
        });
    });
    
    router.post("/join", (req, res) => {
        const { quizCode, playerName, profilePic } = req.body;
        if (!quizCode || !playerName) {
            return new expressError (400, "Invalid input");
        }
        res.json({ success: true, message: "Joined the quiz" });
    });

    return router;
};
