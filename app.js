const express = require("express");
const mongoose = require("mongoose");
const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const quiz = require("./routes/Quizroute.js");


app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.json());
app.use(express.urlencoded({ extended : true }));
app.use(express.static(path.join(__dirname,"public")));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate); 

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

const randomCode = `${Math.floor(100 + Math.random()* 900)}-${
    Math.floor(100 + Math.random()* 900)}`;

app.get("/",(req,res)=>{
    res.render("index.ejs");
});

app.use("/quiz", quiz);

app.listen(4040, ()=>{
    console.log("app is listening on port 4040");
});