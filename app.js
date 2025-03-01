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
const quizRoutes = require("./routes/Quizroute.js")(io);
const idRoutes = require("./routes/idRoute.js");
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

app.use("/quiz", quizRoutes);
app.use("/quiz", idRoutes);

app.all("*",(req,res,next)=>{
    next(new expressError(404,"page not found!"));
});

app.use((err,req,res,next)=>{
    let { statusCode = 500, message = "something went wrong!"} = err;
    res.status(statusCode).render("error.ejs",{ err });
});

const PORT = process.env.PORT || 4040;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
