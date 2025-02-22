const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const quiz = require("./routes/Quizroute.js");
const expressError = require("./utils/expressError.js");
const cors = require("cors");


app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.json());
app.use(express.urlencoded({ extended : true }));
app.use(express.static(path.join(__dirname,"public")));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(cors()); 

const MONGO_URL =  "mongodb://localhost:27017/quiz";

main()
    .then(()=>{
        console.log("connected to DB");
    })
    .catch((err)=>{
        console.log(err);
    });

async function main(){
    await mongoose.connect(MONGO_URL);
};

app.get("/",(req,res)=>{
    res.render("index.ejs");
});

app.use("/quiz", quiz);

const activeQuizzes = {}; // Store active quiz sessions

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("joinQuiz", ({ quizCode, playerName, profilePic }) => {
        if (!activeQuizzes[quizCode]) {
            activeQuizzes[quizCode] = { players: [], questions: [], started: false };
        }

        activeQuizzes[quizCode].players.push({ id: socket.id, name: playerName, profilePic, score: 0 });

        io.to(quizCode).emit("updatePlayers", activeQuizzes[quizCode].players);
        socket.join(quizCode);

        console.log(`${playerName} joined quiz ${quizCode}`);

        if (activeQuizzes[quizCode].players.length === 1) {
            setTimeout(() => {
                io.to(quizCode).emit("startQuiz");
                activeQuizzes[quizCode].started = true;
            }, 60000);
        }
    });

    socket.on("submitAnswer", ({ quizCode, questionIndex, answer }) => {
        let player = activeQuizzes[quizCode].players.find(p => p.id === socket.id);
        if (player) {
            let correctAnswer = activeQuizzes[quizCode].questions[questionIndex].correctOption;
            if (answer === correctAnswer) {
                player.score += 10;
            }
            io.to(quizCode).emit("updateLeaderboard", activeQuizzes[quizCode].players);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});


app.all("*",(req,res,next)=>{
    next(new expressError(404,"page not found!"));
});

app.use((err,req,res,next)=>{
    let { statusCode = 500, message = "something went wrong!"} = err;
    res.status(statusCode).render("error.ejs",{ err });
    // res.status(statuscode).send(message);
});

const PORT = process.env.PORT || 4040;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// app.listen(4040, ()=>{
//     console.log("app is listening on port 4040");
// });