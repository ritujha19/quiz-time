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

console.log("📢 Joining quiz...", quizCode, playerName, selectedAvatar);  
  
// Store player info in localStorage  
const playerInfo = {  
    name: playerName,  
    profilePic: selectedAvatar  
};  
  
// Emit joinQuiz event with a new flag to check if player can join  
socket.emit("joinQuiz", {   
    quizCode,   
    playerName,   
    profilePic: selectedAvatar,  
    checkOnly: false  
});  

// Set up event listener for join errors before redirecting  
let joinErrorReceived = false;  
socket.on("joinError", (data) => {
    console.error("❌ Join Error:", data.message);
    alert(data.message);
    
    // Remove stored data if quiz is not found
    localStorage.removeItem(`quiz_${quizCode}_joined`);
    localStorage.removeItem(`quiz_${quizCode}_player`);

    window.location.href = "/quiz/join";
});  
  
socket.once("joinSuccess", () => {  
    // Save to localStorage only after confirmed success  
    localStorage.setItem(`quiz_${quizCode}_player`, JSON.stringify(playerInfo));  
    localStorage.setItem(`quiz_${quizCode}_joined`, "true");  
      
    // Redirect to waiting page  
    window.location.href = `/quiz/${quizCode}/waiting`;  
});

});

socket.on("updatePlayers", (players) => {
console.log("📢 updatePlayers event received...");
console.log("Players in the quiz:", players);
});;

