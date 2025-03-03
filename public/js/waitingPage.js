document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 - DOM fully loaded and parsed");
    const socket = io();
    const playersList = document.getElementById("playersList");
    const countdownTimer = document.getElementById("countdownTimer");
    socket.on("connect", () => {
        console.log("🚀 - Connected to server", socket.id);
        console.log("parsed quizCode", quizCode);
        if(!quizCode){
            console.error("quizCode is missing! check Ejs template.");
            return;
        }
        console.log("rejoining quiz:", quizCode);
        
        socket.emit("rejoinQuiz", { quizCode });

        socket.on("updatePlayers", (players) => {
            console.log("🚀 - Update players", players);
            if(playersList){
            playersList.innerHTML = players.map(player =>`<li class="text-center">${player.playerName}- <img src="${player.profilePic}" width="80" class="rounded-circle"></li>`).join("");
            }
        });

        socket.on("updateTimer", (time) => {
            console.log("🚀 - Update timer:" , time);
            if(countdownTimer){
            countdownTimer.textContent = `Quiz starts in ${time} seconds`;
            }
            // console.log(countdownTimer);
        });

        socket.on("startQuiz", ({ quizCode }) => {
            console.log("🚀 Quiz starting... Redirecting");
            window.location.href = `/quiz/${quizCode}/start`;
        });
    });
});