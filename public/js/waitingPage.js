document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 - DOM fully loaded and parsed");
    const socket = io();
    const playersList = document.getElementById("playersList");
    const countdownTimer = document.getElementById("countdownTimer");
    socket.on("updatePlayers", (players) => {
        
        playersList.innerHTML = "";
        players.forEach((player) => {
            let li = document.createElement("li");
            li.innerText = `${player.name} - Avatar : ${player.profilePic}`;
            playersList.appendChild(li);
            console.log(playersList);
        });
    });

    socket.on("updateTimer", (time) => {
    if(countdownTimer){
        countdownTimer.innerText = `Quiz starts in ${time} seconds`;
        console.log(countdownTimer);
    }
    });

    socket.on("quizStarted", ({ quizCode }) => {
        console.log("🚀 Quiz starting... Redirecting");
        window.location.href = `/quiz/${quizCode}/start`;
    });
});