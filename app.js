const express = require("express");
const session = require("express-session");
const http = require("http");
const mongoose = require("mongoose");
const app = express();
const server = http.createServer(app);
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const quizRoutes = require("./routes/Quizroute.js");
const idRoutes = require("./routes/idRoute.js");
const expressError = require("./utils/expressError.js");
const cors = require("cors");

// Set view engine and views directory
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middlewares in correct order
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);

// Session configuration
app.use(session({
    name: 'quiz_session',
    secret: 'quiz-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, // Changed to false for development
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Database connection
mongoose.connect('mongodb+srv://ritu05491:ritu2312@myproject.chwmz.mongodb.net/?retryWrites=true&w=majority&appName=myProject')
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.use("/quiz", quizRoutes);
app.use("/quiz", idRoutes);

// Error handlers
app.all("*", (req, res, next) => {
    next(new expressError(404, "page not found!"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { err });
});

// Start server
const PORT = process.env.PORT || 4050;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
