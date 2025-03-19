const socket = io();

document.addEventListener("DOMContentLoaded", () => {
console.log("🚀 - DOM fully loaded and parsed");
const playersList = document.getElementById("playersList");
const countdownTimer = document.getElementById("countdownTimer");

// Get player info from localStorage if available  
let playerInfo = null;  
try {  
    playerInfo = JSON.parse(localStorage.getItem(`quiz_${quizCode}_player`));  
} catch (e) {  
    console.error("Error parsing player info from localStorage:", e);  
}  
  
// Check if already joined in this browser  
const alreadyJoined = localStorage.getItem(`quiz_${quizCode}_joined`) === "true";  
  
if (alreadyJoined) {  
    console.log("Already joined this quiz in this browser");  
      
    // If we have player info, try to rejoin with that info  
    if (playerInfo) {  
        console.log("📢 Rejoining quiz with saved player info:", playerInfo);  
        socket.emit("rejoinQuiz", {   
            quizCode,   
            playerName: playerInfo.name,  
            profilePic: playerInfo.profilePic   
        });  
    } else {  
        // Just join the room to receive updates  
        console.log("📢 Rejoining quiz room without player info");  
        socket.emit("rejoinQuiz", { quizCode });  
          
        // Show alert that they're viewing only  
        alert("You are already participating in this quiz in another tab. This tab is view-only.");  
    }  
} else {  
    // This is a direct navigation to the waiting page without joining  
    // Redirect back to join page  
    console.log("Direct navigation to waiting page without joining");  
    alert("Please join the quiz properly");  
    window.location.href = "/quiz/join";  
}  

// Handle join errors  
socket.on("joinError", (data) => {  
    console.error("❌ Join Error:", data.message);  
    alert(data.message);  
      
    // Redirect back to join page  
    window.location.href = "/quiz/join";  
});  

socket.on("playersUpdate", (data) => {  
    console.log("🚀 - Update players:", data.players);  
      
    // If this is our first update and we don't have player info yet,  
    // try to find our socket.id in the players list  
    if (!playerInfo) {  
        const myPlayer = data.players.find(p => p.id === socket.id);  
        if (myPlayer) {  
            // Save my player info  
            playerInfo = {  
                name: myPlayer.name,  
                profilePic: myPlayer.profilePic  
            };  
            localStorage.setItem(`quiz_${quizCode}_player`, JSON.stringify(playerInfo));  
        }  
    }  
      
    if (playersList) {  
        playersList.innerHTML = data.players.map(player =>  
            `<li class="text-center">${player.name} -   
            <img src="${player.profilePic}" width="80" class="rounded-circle"></li>`  
        ).join("");  
    }  
});  

// ⏳ Listen for Timer Updates  
socket.on("timerUpdate", (data) => {  
    console.log("⏳ - Timer Update Received:", data.timeLeft);  
    if(data.timeLeft === null || data.timeLeft === undefined){  
        console.warn("⚠️ Timer value is null or undefined");  
        return;  
    }  
    if (countdownTimer) {  
        countdownTimer.textContent = `Quiz starts in ${data.timeLeft} seconds`;  
    } else {  
        console.warn("⚠️ countdownTimer element not found!");  
    }  
});  

// Redirect to Quiz Page When Countdown Ends  
socket.on("quizStart", () => {  
    console.log("🚀 Quiz starting... Redirecting");  
    window.location.href = `/quiz/${quizCode}/start`;  
});  
  
// Handle quiz ending  
socket.on("quizEnd", () => {  
    console.log("Quiz has ended");  
    // Clear localStorage for this quiz  
    localStorage.removeItem(`quiz_${quizCode}_joined`);  
    localStorage.removeItem(`quiz_${quizCode}_player`);  
});  

socket.on("disconnect", () => {  
    console.log("⚠️ - Disconnected from server", socket.id);  
});

});

window.addEventListener("beforeunload", () => {
console.log("leaving quiz");
socket.emit("leaveQuiz", { quizCode });

// Don't remove the joined flag or player info  
// This allows the player to rejoin if they accidentally close the tab

});
