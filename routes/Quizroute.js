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

module.exports = function (io) {
    // Store active quizzes
    const activeQuizzes = {};

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        socket.on("joinQuiz", ({ quizCode, playerName, profilePic }) => {
            console.log(`${playerName} joined quiz: ${quizCode}`);

            if (!activeQuizzes[quizCode]) {
                activeQuizzes[quizCode] = { players: [], countdownStarted: false };
            }

            activeQuizzes[quizCode].players.push({ playerName, profilePic, score: 0 });
            if(!activeQuizzes[quizCode].players.some(p => p.playerName === playerName)){
                activeQuizzes[quizCode].players.push({ playerName, profilePic, socketId: socket.id, score: 0 });
            }
            // Join the socket room
            socket.join(quizCode);
            console.log(`socket ${socket.id} joined room ${quizCode}`,Array.from(socket.rooms));    
            // Notify all users in the quiz room
            io.to(quizCode).emit("updatePlayers", activeQuizzes[quizCode].players);         
        });

        //rejoin quiz
        socket.on("rejoinQuiz", ({ quizCode }) => {
            console.log("rejoining quiz:", quizCode);
            socket.join(quizCode);
            if(!activeQuizzes[quizCode]){
                console.log("No active quiz found for this code");
                return;
            }
            console.log("Emitting updatePlayers event...", activeQuizzes[quizCode].players);
            if (activeQuizzes[quizCode]) {
                io.to(quizCode).emit("updatePlayers", activeQuizzes[quizCode].players);
            }
        });

        socket.on("startQuiz", (quizCode) => {
            if(!activeQuizzes[quizCode]){
                console.log("No active quiz found! cannot start quiz");
                return;
            }
            if (!activeQuizzes[quizCode] || activeQuizzes[quizCode].countdownStarted){
            
            activeQuizzes[quizCode].countdownStarted = true;
            let countdown = 10; // Set to 10 for quick testing
            
            console.log("Timer started for quiz:", quizCode);
        
            let timer = setInterval(() => {
                if (countdown <= 0) {
                    clearInterval(timer);
                    console.log("Quiz started:", quizCode);
                    io.to(quizCode).emit("startQuiz", { quizCode });
                } else {
                    console.log(`Time left for ${quizCode}: ${countdown}s`);
                    io.to(quizCode).emit("updateTimer", countdown);
                    countdown--;
                }
            }, 1000);
        }
        });
              socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    activeQuizzes.forEach((quiz, code) => {
        const playerIndex = quiz.players.findIndex(p => p.id === socket.id);
        
        if (playerIndex !== -1) {
            const playerName = quiz.players[playerIndex].name;
            console.log(`Removing ${playerName} from quiz ${code}`);
            quiz.players.splice(playerIndex, 1);
            
            io.to(code).emit("playersUpdate", { players: quiz.players });

            // If no players left, delete the quiz session
            if (quiz.players.length === 0) {
                if (quiz.timer) clearInterval(quiz.timer);
                activeQuizzes.delete(code);
            }
        }
    });

    // Clear player's localStorage on client-side
    socket.emit("clearLocalStorage");
});
    });

    // JOIN ROUTE
    router.get("/join", (req, res) => {
        res.render("joinQuiz-pages/joinpage.ejs");
    });

    router.post("/join", (req, res) => {
        const { quizCode, playerName, profilePic } = req.body;
        if (!quizCode || !playerName) {
            return new expressError(400, "Invalid input");
        }
        res.json({ success: true, message: "Joined the quiz" });
    });
    
    router.get("/:quizCode/waiting", (req, res) => {
        let { quizCode } = req.params;
        res.render("joinQuiz-pages/waitingPage.ejs", { quizCode });
    });

    router.get("/:quizCode/start",wrapAsync(async(req,res,next)=>{
    let { quizCode } = req.params;
    const quiz = await Quiz.findOne({ code: quizCode });
    if(!quiz){
        return next( new expressError(404,"Quiz not found"));
    };
    res.render("joinQuiz-pages/playquiz.ejs", { quiz });
    }));

    return router;
};


