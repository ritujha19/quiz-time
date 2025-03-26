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

document.getElementById("join-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    let quizCode = document.getElementById("quizCode").value;
    let playerName = document.getElementById("playerName").value;

    if (!selectedAvatar) {
        alert("Please select an avatar!");
        return;
    }
    console.log(typeof quizCode, quizCode);
    console.log("📢 Attempting to join quiz:", quizCode, playerName, selectedAvatar);

    // Emit join event
    socket.emit("joinQuiz", { 
        quizCode, 
        playerName, 
        profilePic: selectedAvatar,
        checkOnly: false
    });

    // Listen for errors BEFORE redirecting
    let joinErrorReceived = false;
    socket.once("joinError", (data) => {
        joinErrorReceived = true;
        console.error("❌ Join Error:", data.message);
        alert(data.message);
    });

    // If success, redirect
    socket.once("joinSuccess", () => {
        console.log("✅ Join successful, redirecting to waiting page...");
        
        // Store player info
        localStorage.setItem(`quiz_${quizCode}_player`, JSON.stringify({ name: playerName, profilePic: selectedAvatar }));
        localStorage.setItem(`quiz_${quizCode}_joined`, "true");

        // Redirect
        window.location.href = `/quiz/${quizCode}/waiting`;
    });

    // If no response in 5 seconds, assume failure
    setTimeout(() => {
        if (!joinErrorReceived) {
            alert("Connection timeout! Please try again.");
        }
    }, 5000);
});