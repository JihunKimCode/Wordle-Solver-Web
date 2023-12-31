document.addEventListener('DOMContentLoaded', function () {
    const startButton = document.getElementById('start-button');
    const instruction = document.getElementById('instruction');
    const suggestionContainer = document.getElementById('suggestions');
    // const resultContainer = document.getElementById('result');
    const submitBtn = document.getElementById('submit');

    let possibleWords = [];

    async function loadPossibleWordsFromFile(filePath) {
        try {
            const response = await fetch(filePath);
            const wordsText = await response.text();
            possibleWords = wordsText.split('\n').map(word => word.trim()).filter(word => word !== '');
        } catch (error) {
            console.error('Error loading possible words:', error);
        }
    }

    // Evaluate Each Guess by Comapring to the Feedback
    function evaluateGuess(targetWord, guess, feedback) {
        feedback = [];
        let remainingSecretLetters = [...targetWord];
    
        for (let i = 0; i < targetWord.length; i++) {
            if (targetWord[i] === guess[i]) {
                feedback.push("🟩");
                remainingSecretLetters.splice(remainingSecretLetters.indexOf(targetWord[i]), 1);
            } else {
                feedback.push("⬛");
            }
        }
    
        for (let i = 0; i < guess.length; i++) {
            if (remainingSecretLetters.includes(guess[i]) && feedback[i] !== "🟩") {
                feedback[i] = "🟨";
                remainingSecretLetters.splice(remainingSecretLetters.indexOf(guess[i]), 1);
            }
        }
        return feedback.join("");
    }
    
    // Apply Bayesian Model to find the best next word
    function bayesianChooseWord(possibleWords, previousGuesses) {
        let scores = {};

        for (let word of possibleWords) {
            scores[word] = 0;
            for (let [guess, feedback] of previousGuesses) {
                let guessFeedback = evaluateGuess(word, guess, feedback);
                if (guessFeedback === feedback) {
                    scores[word] += 1;
                }
            }
        }

        let maxScore = Math.max(...Object.values(scores));
        let bestWords = Object.keys(scores).filter(word => scores[word] === maxScore);

        return bestWords[Math.floor(Math.random() * bestWords.length)];
    }
    
    startButton.addEventListener('click', startGame);
    
    async function startGame() {
        const filePath = 'https://raw.githubusercontent.com/3b1b/videos/master/_2022/wordle/data/allowed_words.txt';
        await loadPossibleWordsFromFile(filePath);
    
        let attempts = 0;
        let previousGuesses = [];
        let preferredStartWord = null;

        // Ask the user if they have a preferred starting word
        const preferStartWord = confirm("Click 'OK' to set the starting word with your preferred");
        
        if (preferStartWord) {
            preferredStartWord = prompt("Enter your preferred starting word:");
        }
        
        while (true) {
            startButton.style.display = 'none';
            instruction.style.display = 'block';
            attempts += 1;
            let guess = bayesianChooseWord(possibleWords, previousGuesses);
        
            // First step to set the first word
            if (attempts === 1 && preferredStartWord) {
                guess = preferredStartWord;
            } else if (attempts === 1) {
                guess = "slate";
            }

            let feedback = [];
    
            while (true) {
                suggestionContainer.innerHTML += `<div class="container">
                                                    <p>Attempt ${attempts}: ${guess}</p>
                                                    <div class="box" onclick="changeColor(this, 0)">${guess[0].toUpperCase()}</div>
                                                    <div class="box" onclick="changeColor(this, 1)">${guess[1].toUpperCase()}</div>
                                                    <div class="box" onclick="changeColor(this, 2)">${guess[2].toUpperCase()}</div>
                                                    <div class="box" onclick="changeColor(this, 3)">${guess[3].toUpperCase()}</div>
                                                    <div class="box" onclick="changeColor(this, 4)">${guess[4].toUpperCase()}</div>
                                                </div>`;
                submitBtn.innerHTML = `<br><button id="sendFeedbackBtn">Send Feedback</button>`;
    
                // Wrap the feedback gathering logic in a Promise
                await new Promise((resolve) => {
                    document.getElementById("sendFeedbackBtn").addEventListener("click", () => {
                        
                        let feedbackInput = selectedColors.map(color => {
                            if (color === 0) return 0;
                            else if (color === 1) return 1;
                            else if (color === 2) return 2;
                        });
                        selectedColors = [0, 0, 0, 0, 0];
    
                        if (feedbackInput.every(f => [0, 1, 2].includes(f)) && feedbackInput.length === 5) {
                            feedback = feedbackInput.map(f => {
                                if (f === 0) return "⬛";
                                else if (f === 1) return "🟨";
                                else if (f === 2) return "🟩";
                            });
                        } else {
                            alert("Invalid feedback. Please provide feedback as gray, yellow, and green.");
                            return; // Do not resolve the Promise if the feedback is invalid
                        }
    
                        if (feedback.length === feedbackInput.length) {
                            feedback = feedback.join("");
                            resolve(); // Resolve the Promise once valid feedback is provided
                        }
                    });
                });
    
                break; // Break from the inner loop after resolving the Promise
            }
    
            // Store Game Play
            previousGuesses.push([guess, feedback]);
            // resultContainer.innerHTML += `<p>${feedback}</p>`;
    
            // Check to end Wordle Game
            if (feedback.split("🟩").length - 1 === 5) {
                instruction.style.display = 'none';
                submitBtn.style.display = 'none';
                suggestionContainer.innerHTML += `
                    <p>Congratulations!</p>
                    <p>It took ${attempts} attempts to guess</p>
                    <p>Refresh the website to play a new Game</p>`;
                break;
            } else if(attempts === 6) {
                instruction.style.display = 'none';
                submitBtn.style.display = 'none';
                suggestionContainer.innerHTML += `
                    <p>You already used all six attempts to guess</p>
                    <p>Refresh website to play a new Game</p>`;
                break;
            }
        }
    }    
});

let selectedColors = [0, 0, 0, 0, 0];
let feedbackInput;

function changeColor(box, index) {
    const colors = ['#787c7f', '#c8b653', '#6ca965'];
    let currentColor = selectedColors[index] || 0;

    currentColor = (currentColor + 1) % colors.length;
    selectedColors[index] = currentColor;
    box.dataset.color = currentColor;
    box.style.backgroundColor = colors[currentColor];
}