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

        // If we have player info, try to rejoin  
        if (playerInfo) {  
            console.log("📢 Rejoining quiz with saved player info:", playerInfo);  
            socket.emit("rejoinQuiz", { quizCode, playerName: playerInfo.name, profilePic: playerInfo.profilePic });  
        } else {  
            console.log("📢 Rejoining quiz room without player info");  
            socket.emit("rejoinQuiz", { quizCode });  
            alert("You are already participating in this quiz in another tab. This tab is view-only.");  
        }  
    } else {  
        console.log("Direct navigation to waiting page without joining");  
        alert("Please join the quiz properly");  
        window.location.href = "/quiz/join";  
    }  

    // Handle join errors  
    socket.on("joinError", (data) => {  
        console.error("❌ Join Error:", data.message);  
        alert(data.message);  
        window.location.href = "/quiz/join";  
    });  

    socket.on("playersUpdate", (data) => {  
        console.log("🚀 - Update players:", data.players);  
        if (!playerInfo) {  
            const myPlayer = data.players.find(p => p.id === socket.id);  
            if (myPlayer) {  
                playerInfo = { name: myPlayer.name, profilePic: myPlayer.profilePic };  
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

    // ✅ ⏳ Listen for Timer Updates (ONLY Server Controls Countdown)  
    socket.on("timerUpdate", (data) => {  
        console.log("⏳ - Timer Update Received:", data.timeLeft);  
        if (data.timeLeft === null || data.timeLeft === undefined) {  
            console.warn("⚠️ Timer value is null or undefined");  
            return;  
        }  
    
        if (countdownTimer) {  
            countdownTimer.textContent = `Quiz starts in ${data.timeLeft} seconds`;  
        } else {  
            console.warn("⚠️ countdownTimer element not found!");  
        }  
    
        // 🔥 **NEW**: Only check quiz existence AFTER countdown ends  
        if (data.timeLeft === 0) {  
            console.log("⏳ Countdown ended, checking if quiz exists...");
            socket.emit("checkQuiz", { quizCode });  
        }  
    });
    
    // **NEW**: Listen for quiz check response
    socket.on("quizCheckResponse", (data) => {  
        if (!data.exists) {  
            alert("Quiz not found or has ended.");  
            window.location.href = "/";  
        }  
    });
    // 🚀 Redirect to Quiz Page When Countdown Ends  
    socket.on("quizStart", () => {  
        console.log("🚀 Quiz starting... Redirecting");  
        window.location.href = `/quiz/${quizCode}/start`;  
    });  

    // Handle quiz ending  
    socket.on("clearLocalStorage", () => {
        console.log("Clearing localStorage for this quiz");
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
});
