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
    // Store active quiz sessions
    const activeQuizzes = new Map();

    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);

        // Handle player joining quiz
        socket.on("joinQuiz", ({ quizCode, playerName, profilePic, checkOnly }) => {
            console.log(`📩 Player ${playerName} joining quiz ${quizCode}`);
        
            // Initialize quiz room if it doesn't exist
            if (!activeQuizzes.has(quizCode)) {
                activeQuizzes.set(quizCode, {
                    players: [],
                    isStarted: false,
                    timer: null,
                });
            }
        
            const quiz = activeQuizzes.get(quizCode);
        
            // Check if player already exists
            let existingPlayer = quiz.players.find((p) => p.name === playerName);
        
            if (existingPlayer) {
                const oldSocket = io.sockets.sockets.get(existingPlayer.id);
        
                if (oldSocket && oldSocket.connected) {
                    socket.emit("joinError", { message: "You are already in this quiz in another tab or window." });
                    return;
                } else {
                    // Update socket ID and allow reconnection
                    console.log(`🔄 Player ${playerName} reconnecting...`);
                    existingPlayer.id = socket.id;
                    socket.join(quizCode);
        
                    // Emit success for reconnection
                    socket.emit("joinSuccess");
                    console.log(`✅ ${playerName} successfully rejoined quiz ${quizCode}`);
                    return;
                }
            }
        
            // 🚀 New player joining: Add them to the quiz
            quiz.players.push({
                id: socket.id,
                name: playerName,
                profilePic: profilePic,
                score: 0,
            });
        
            socket.join(quizCode);
        
            // Emit success for new player
            socket.emit("joinSuccess");
            console.log(`✅ ${playerName} successfully joined quiz ${quizCode}`);
        });

        // Handle player rejoining quiz  
        socket.on("rejoinQuiz", ({ quizCode, playerName, profilePic }) => {  
            console.log(`Player attempting to rejoin quiz ${quizCode}`);  
              
            if (!activeQuizzes.has(quizCode)) {  
                socket.emit("joinError", {  
                    message: "Quiz not found or has ended"  
                });  
                return;  
            }   
            const quiz = activeQuizzes.get(quizCode);  
            // If playerName is provided, try to find and update the existing player  
            if (playerName) {  
                const existingPlayerIndex = quiz.players.findIndex(p => p.name === playerName);  
                  
                if (existingPlayerIndex !== -1) {  
                    // Update the existing player with the new socket ID  
                    const oldSocketId = quiz.players[existingPlayerIndex].id;  
                    quiz.players[existingPlayerIndex].id = socket.id;  
                      
                    // Join the socket room  
                    socket.join(quizCode);  
                      
                    // Broadcast updated players list  
                    io.to(quizCode).emit("playersUpdate", {  
                        players: quiz.players  
                    });  
                      
                    console.log(`Player ${playerName} rejoined quiz ${quizCode}, replaced socket ${oldSocketId} with ${socket.id}`);  
                      
                    // If the quiz has a timer running, send the current time  
                    if (quiz.timer && quiz.currentTime !== undefined) {  
                        socket.emit("timerUpdate", {  
                            timeLeft: quiz.currentTime  
                        });
                        return;  
                    }  
                } else {  
                    // Player name not found, but they have localStorage data  
                    // This could happen if the server restarted  
                    // Add them as a new player  
                    const player = {  
                        id: socket.id,  
                        name: playerName,  
                        profilePic: profilePic,  
                        score: 0  
                    };  
                      
                    quiz.players.push(player);  
                    socket.join(quizCode);  
                      
                    io.to(quizCode).emit("playersUpdate", {  
                        players: quiz.players  
                    });  
                      
                    console.log(`Player ${playerName} added to quiz ${quizCode} during rejoin attempt`);  
                      
                    // If the quiz has a timer running, send the current time  
                    if (quiz.timer && quiz.currentTime !== undefined) {  
                        socket.emit("timerUpdate", {  
                            timeLeft: quiz.currentTime  
                        });  
                    }  
                    return;  
                }  
            }  
              
            // If we get here, either no playerName was provided or the player wasn't found  
            // Just join the room to receive updates, but don't add as a new player  
            socket.join(quizCode);  
               
            // Send current players to the rejoining socket  
            socket.emit("playersUpdate", {  
                players: quiz.players  
            });  
              
            // If the quiz has a timer running, send the current time  
            if (quiz.timer && quiz.currentTime !== undefined) {  
                socket.emit("timerUpdate", {  
                    timeLeft: quiz.currentTime  
                });  
            }  
              
            console.log(`Anonymous viewer joined quiz ${quizCode}`);  
        });  
          
        // Handle player explicitly leaving quiz  
        socket.on("leaveQuiz", ({ quizCode }) => {  
            console.log(`Player leaving quiz ${quizCode}`);  
              
            if (!activeQuizzes.has(quizCode)) return;  
              
            const quiz = activeQuizzes.get(quizCode);  
              
            // Remove player from quiz  
            quiz.players = quiz.players.filter(p => p.id !== socket.id);  
              
            // Leave the socket room  
            socket.leave(quizCode);  
              
            // If no players left, clean up the quiz  
            if (quiz.players.length === 0) {  
                if (quiz.timer) clearInterval(quiz.timer);  
                activeQuizzes.delete(quizCode);  
                console.log(`Quiz ${quizCode} ended - no players left`);  
            } else {  
                // Broadcast updated players list  
                io.to(quizCode).emit("playersUpdate", {  
                    players: quiz.players  
                });  
            }  
        });  

        // Handle quiz start  
        socket.on("startQuiz", ({ quizCode }) => {  
            console.log(`Starting quiz ${quizCode}`);  
              
            const quiz = activeQuizzes.get(quizCode);  
            if (!quiz || quiz.isStarted) return;  

            quiz.isStarted = true;  
            let countdown = 20; // 20 second countdown  
            quiz.currentTime = countdown; // Track current time  

            // Start countdown timer  
            quiz.timer = setInterval(() => {  
                countdown--;  
                quiz.currentTime = countdown; // Update current time  
                  
                // Broadcast timer to all players  
                io.to(quizCode).emit("timerUpdate", {  
                    timeLeft: countdown  
                });  

                if (countdown <= 0) {  
                    clearInterval(quiz.timer);  
                    quiz.timer = null;  
                    quiz.currentTime = null;  
                    io.to(quizCode).emit("quizStart", {  
                        questions: quiz.questions, // Send quiz questions to clients  
                    });  
                }  
            }, 1000);  
        });  

        // Handle player disconnect  
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

    // Join quiz route
    router.post("/join", (req, res) => {
        const { quizCode, playerName, profilePic } = req.body;

        if (!activeQuizzes.has(quizCode)) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found",
            });
        }

        const quiz = activeQuizzes.get(quizCode);

        // Check if player name already exists
        if (quiz.players.some((p) => p.name === playerName)) {
            return res.status(400).json({
                success: false,
                message: "Player name already taken",
            });
        }

        res.json({
            success: true,
            quizCode,
        });
    });

    router.get("/test-db/:quizCode", async (req, res) => {
        const { quizCode } = req.params;
        try {
            const quiz = await Quiz.findOne({ code: quizCode });
            if (!quiz) {
                return res.status(404).json({ success: false, message: "Quiz not found" });
            }
            res.json({ success: true, quiz });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: "Database error" });
        }
    });

    // Waiting page route
    router.get("/:quizCode/waiting", wrapAsync(async (req, res, next) => {
        const { quizCode } = req.params;

        // Check if the quiz is in memory
        if (!activeQuizzes.has(quizCode)) {
            // Fetch the quiz from MongoDB
            const quiz = await Quiz.findOne({ code: quizCode });
            if (!quiz) {
                return next(new expressError(404, "Quiz not found or has ended"));
            }

            // Add the quiz to activeQuizzes
            activeQuizzes.set(quizCode, {
                players: [],
                isStarted: false,
                timer: null,
                currentTime: null,
                questions: quiz.questions, // Store the quiz questions
            });
        }

        res.render("joinQuiz-pages/waitingPage.ejs", { quizCode });
    }));

    // Start quiz route
    router.get("/:quizCode/start", wrapAsync(async (req, res, next) => {
        const { quizCode } = req.params;

        // Check if the quiz is in memory
        const quiz = activeQuizzes.get(quizCode);
        if (!quiz) {
            return next(new expressError(404, "Quiz not found or has ended"));
        }

        res.render("joinQuiz-pages/playquiz.ejs", { questions: quiz.questions });
    }));

    return router;
};