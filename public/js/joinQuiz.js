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
let selectedAvatar = ""; // Store the selected avatar

// Handle avatar selection
document.querySelectorAll(".swiper-slide img").forEach((img) => {
    img.addEventListener("click", function () {
        // Remove border from all images
        document.querySelectorAll(".swiper-slide img").forEach((el) => {
            el.classList.remove("selected-avatar");
        });

        // Add border to selected image
        this.classList.add("selected-avatar");

        // Store selected image
        selectedAvatar = this.getAttribute("src");

        // Display selected avatar
        document.getElementById("selectedAvatar").src = selectedAvatar;
        document.getElementById("selectedAvatarContainer").style.display = "block";
    });
});

document.getElementById("join-form").addEventListener("submit", (e) => {
    e.preventDefault();

    let quizCode = document.getElementById("quizCode").value;
    let playerName = document.getElementById("playerName").value;

    if (!selectedAvatar) {
        alert("Please select an avatar!");
        return;
    }

    console.log("📢 Emitting joinQuiz event...");
    console.log("Joining quiz...", quizCode, playerName, selectedAvatar);

    window.location.href = `/quiz/${quizCode}/waiting`;
    });

