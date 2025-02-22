const socket = io();

// Initialize Swiper
document.addEventListener("DOMContentLoaded", () => {
    console.log("JS Loaded");
    const swiperElement = document.querySelector( ".swiper-container" );
    // Initialize Swiper
    const swiper = new Swiper(swiperElement, {
        slidesPerView: 1,
        spaceBetween: 15,
        freeMode: true,
        loop: true,
        cssMode: true,
        grabCursor: true,
        watchOverflow: false,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        keyboard: {
            enabled: true,
            onlyInViewport: false,
        },
        });
    
        console.log("Swiper initialized");
    });

    // Avatar selection
    document.querySelectorAll(".swiper-slide img").forEach((img) => {
        img.addEventListener("click", function () {
            document.querySelectorAll(".swiper-slide img").forEach(i => i.classList.remove("selected"));
            this.classList.add("selected");

            // Store selected avatar in hidden input
            document.getElementById("profilePic").value = this.dataset.avatar;
        });
    });

    document.getElementById("join-form").addEventListener("submit", (e) => {
        e.preventDefault();

        let quizCode = document.getElementById("quizCode").value;
        let playerName = document.getElementById("playerName").value;
        let profilePic = document.getElementById("profilePic").value;

        if (!profilePic) {
            alert("Please select an avatar!");
            return;
        }

        socket.emit("joinQuiz", { quizCode, playerName, profilePic });

        socket.on("updatePlayers", (players) => {
            console.log("Players in quiz:", players);
        });

        socket.on("startQuiz", () => {
            console.log("Quiz starting now...");
            window.location.href = `/quiz/${quizCode}`;
        });
    });

