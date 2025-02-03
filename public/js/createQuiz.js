
let createQuizForm = document.getElementById("createQuizForm");
let questions = [];

createQuizForm.addEventListener("submit", async function(event) {
    event.preventDefault();
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    
    if(!title || !description || questions.length === 0){
        alert("Please fill in all the fields and add at least one question.");
        return;
    };

    const quizData = {title, description,questions};

    console.log("sending data:", quizData );

    try{
        let response = await fetch("/quiz",{
            method: "POST",
            headers: { "Content-Type": "application/json"},

            body: JSON.stringify(quizData)
        });
        let result = await response.json();
        console.log("server Response:", result);

        if(result.success){
            document.getElementById("quizCodeMessage").innerText = `Quiz Created! Code: ${result.code}`;
            document.getElementById("quizCodeMessage").style.display = "block";
    
        } else{
            alert(result.message || "error creating quiz."); 
        } 
    }catch(error){
        console.log("fetch error:", error);
        alert("server error. check the console for details.");
    };
})

function addQuestion(){
    if (questions.length > 0) {
        let lastQuestion = questions[questions.length - 1];
        if (!lastQuestion.question || lastQuestion.options.some(opt => !opt)) {
            alert("Please complete the previous question before adding a new one.");
            return;
        };
    };

    let questionIndex = questions.length;
    questions.push({ question: "", options: ["", "", "", ""], correctOption: 0 });

    let questionDiv = document.createElement("div");
    questionDiv.classList.add("question");
    questionDiv.innerHTML = `
    <form>
        <label for="question">Enter Question ${questionIndex + 1}:</label>
        <input type="text"  oninput="updateQuestion(${questionIndex}, this.value)" name="question" id="question" placeholder="enter question" required/>
        <label for="option">Enter Option:</label>
        ${[0, 1, 2, 3].map(i => `
            <input type="text" oninput="updateOption(${questionIndex}, ${i}, this.value)" placeholder="Option ${i + 1}" name="option" required>
        `).join("")}
        <label for="correctOption">Correct Option :</label>
        <select name="correctOption" onchange="updateCorrectOption(${questionIndex}, this.value)">
            <option value="0">option 1</option>
            <option value="1">option 2</option>
            <option value="2">option 3</option>
            <option value="3">option 4</option>
        </select>
    </form>`
    document.getElementById("questions-container").appendChild(questionDiv);
};

function updateQuestion(index, value){
    questions[index].question = value;
};

function updateOption(qIndex,optIndex,value){
    if(questions[qIndex]){
    questions[qIndex].options[optIndex] = value;
    };
};

function updateCorrectOption( index,value){
    questions[index].correctOption = parseInt(value);
};