// Initialize Socket.IO connection
const socket = io("https://web-production-f35ee.up.railway.app", {
    transports: ['websocket', 'polling'],
    withCredentials: false
});

// Game state
let gameState = {
    roomCode: null,
    isPlayerTurn: false,
    isAiGame: false,
    selectedDot: null,
    playerScore: 0,
    opponentScore: 0,
    playerId: null
};

// DOM Elements
const loadingScreen = document.querySelector('.loading-screen');
const loadingVideo = document.getElementById('loading-video');
const gameContainer = document.querySelector('.game-container');
const mainContainer = document.getElementById('main-container');
const welcomeScreen = document.getElementById('welcome-screen');
const roomCodeScreen = document.getElementById('room-code-screen');
const joinGameScreen = document.getElementById('join-game-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const gridContainer = document.getElementById('grid-container');
const roomCodeDisplay = document.getElementById('room-code-display');
const roomCodeInput = document.getElementById('room-code-input');
const waitingMessage = document.getElementById('waiting-message');
const joinError = document.getElementById('join-error');
const currentTurnDisplay = document.getElementById('current-turn');
const playerScoreElement = document.querySelector('#player-score span');
const opponentScoreElement = document.querySelector('#opponent-score span');
const finalScoreDisplay = document.getElementById('final-score');
const resultMessage = document.getElementById('result-message');
const backgroundVideo = document.getElementById('bg-video');

// Audio Elements
const lineSound = document.getElementById('line-sound');
const squareSound = document.getElementById('square-sound');
const winSound = document.getElementById('win-sound');

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Setup loading screen
    setTimeout(() => {
        loadingScreen.classList.add('fade-out');
        
        // Show main container after the loading screen fades out
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            mainContainer.classList.remove('hidden');
            mainContainer.classList.add('show');
        }, 1000);
    }, 5000); // Show main menu after 5 seconds

    // Setup game
    createDotGrid();
    setupEventListeners();
});

// Button Event Listeners
document.getElementById('ai-game-btn').addEventListener('click', createAIGame);
document.getElementById('create-game-btn').addEventListener('click', createGame);
document.getElementById('join-game-btn').addEventListener('click', showJoinScreen);
document.getElementById('submit-code-btn').addEventListener('click', joinGame);
document.getElementById('play-again-btn').addEventListener('click', playAgain);
document.getElementById('return-home-btn').addEventListener('click', returnHome);

// Create a game with AI
function createAIGame() {
    socket.emit('createAIGame');
    gameState.isAiGame = true;
}

// Create a new multiplayer game
function createGame() {
    socket.emit('createGame');
}

// Show the join game screen
function showJoinScreen() {
    hideAllScreens();
    joinGameScreen.classList.remove('hidden');
}

// Join an existing game
function joinGame() {
    const roomCode = roomCodeInput.value.trim().toUpperCase();
    if (roomCode.length < 5) {
        joinError.classList.remove('hidden');
        return;
    }
    
    socket.emit('joinGame', { roomCode });
}

// Play again after game is over
function playAgain() {
    if (gameState.isAiGame) {
        createAIGame();
    } else {
        createGame();
    }
}

// Return to home screen
function returnHome() {
    hideAllScreens();
    welcomeScreen.classList.remove('hidden');
    resetGameState();
    
    // Change back to initial background video
    changeBackgroundVideo('bg.mp4');
}

// Reset game state
function resetGameState() {
    gameState = {
        roomCode: null,
        isPlayerTurn: false,
        isAiGame: false,
        selectedDot: null,
        playerScore: 0,
        opponentScore: 0,
        playerId: null
    };
    
    // Reset hash symbol to default color
    const hashSymbol = document.querySelector('.hash-symbol');
    const hashTitle = document.querySelector('.hash-title');
    
    if (hashSymbol) {
        hashSymbol.style.color = '#4ecdc4';
        hashSymbol.style.textShadow = '0 0 10px rgba(78, 205, 196, 0.8)';
    }
    
    if (hashTitle) {
        hashTitle.style.color = '#ffffff';
        hashTitle.style.textShadow = '0 0 5px rgba(255, 255, 255, 0.6)';
    }
}

// Hide all screens
function hideAllScreens() {
    welcomeScreen.classList.add('hidden');
    roomCodeScreen.classList.add('hidden');
    joinGameScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
}

// Change background video
function changeBackgroundVideo(videoName) {
    backgroundVideo.src = `assets/${videoName}`;
    backgroundVideo.load();
    backgroundVideo.play();
}

// Create dot grid with potential lines
function createDotGrid() {
    gridContainer.innerHTML = '';
    const gridSize = 5;
    const cellSize = 65;
    const dotSize = 14; // Dot size in pixels
    const dotOffset = dotSize / 2; // Half the dot size for centering
    
    // Create potential lines first (shadows)
    createPotentialLines(gridSize, cellSize);
    
    // Create dots
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            dot.dataset.row = row;
            dot.dataset.col = col;
            
            // Position dot - center the dot in its cell
            dot.style.left = `${col * cellSize + (cellSize - dotSize) / 2}px`;
            dot.style.top = `${row * cellSize + (cellSize - dotSize) / 2}px`;
            
            gridContainer.appendChild(dot);
        }
    }
}

// Create potential lines (shadows)
function createPotentialLines(gridSize, cellSize) {
    const dotSize = 14; // Dot size in pixels
    
    // Create horizontal potential lines
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize - 1; col++) {
            const line = document.createElement('div');
            line.classList.add('potential-line', 'horizontal');
            line.dataset.row1 = row;
            line.dataset.col1 = col;
            line.dataset.row2 = row;
            line.dataset.col2 = col + 1;
            
            // Position line - centered between dots
            const centerY = row * cellSize + cellSize/2 - 2.5;
            const startX = col * cellSize + cellSize/2 + 7;
            
            line.style.top = `${centerY}px`;
            line.style.left = `${startX}px`;
            
            gridContainer.appendChild(line);
            
            // Add hover effect
            line.addEventListener('mouseenter', () => {
                if (gameState.isPlayerTurn) {
                    line.style.opacity = '0.7';
                }
            });
            
            line.addEventListener('mouseleave', () => {
                line.style.opacity = '0';
            });
            
            // Add click event
            line.addEventListener('click', (e) => {
                if (gameState.isPlayerTurn) {
                    handleLineClick(parseInt(line.dataset.row1), 
                                   parseInt(line.dataset.col1), 
                                   parseInt(line.dataset.row2), 
                                   parseInt(line.dataset.col2));
                }
            });
        }
    }
    
    // Create vertical potential lines
    for (let row = 0; row < gridSize - 1; row++) {
        for (let col = 0; col < gridSize; col++) {
            const line = document.createElement('div');
            line.classList.add('potential-line', 'vertical');
            line.dataset.row1 = row;
            line.dataset.col1 = col;
            line.dataset.row2 = row + 1;
            line.dataset.col2 = col;
            
            // Position line - centered between dots
            const centerX = col * cellSize + cellSize/2 - 2.5;
            const startY = row * cellSize + cellSize/2 + 7;
            
            line.style.top = `${startY}px`;
            line.style.left = `${centerX}px`;
            
            gridContainer.appendChild(line);
            
            // Add hover effect
            line.addEventListener('mouseenter', () => {
                if (gameState.isPlayerTurn) {
                    line.style.opacity = '0.7';
                }
            });
            
            line.addEventListener('mouseleave', () => {
                line.style.opacity = '0';
            });
            
            // Add click event
            line.addEventListener('click', (e) => {
                if (gameState.isPlayerTurn) {
                    handleLineClick(parseInt(line.dataset.row1), 
                                   parseInt(line.dataset.col1), 
                                   parseInt(line.dataset.row2), 
                                   parseInt(line.dataset.col2));
                }
            });
        }
    }
}

// Handle line click
function handleLineClick(row1, col1, row2, col2) {
    // Create line object
    const line = {
        row1: row1,
        col1: col1,
        row2: row2,
        col2: col2
    };
    
    // Send move to server
    socket.emit('move', {
        roomCode: gameState.roomCode,
        line: line
    });
}

// Draw a line between two dots
function drawLine(row1, col1, row2, col2, isPlayer = true) {
    const cellSize = 65;
    const line = document.createElement('div');
    
    // Determine line direction
    const isHorizontal = row1 === row2;
    
    if (isHorizontal) {
        line.classList.add('line', 'horizontal');
        // Position horizontal line
        const centerY = row1 * cellSize + cellSize/2 - 3;
        const startX = Math.min(col1, col2) * cellSize + cellSize/2 + 7;
        
        line.style.top = `${centerY}px`;
        line.style.left = `${startX}px`;
    } else {
        line.classList.add('line', 'vertical');
        // Position vertical line
        const centerX = col1 * cellSize + cellSize/2 - 3;
        const startY = Math.min(row1, row2) * cellSize + cellSize/2 + 7;
        
        line.style.top = `${startY}px`;
        line.style.left = `${centerX}px`;
    }
    
    // Set line color/class based on player
    if (isPlayer) {
        line.classList.add('player-line');
    } else {
        line.classList.add('opponent-line');
    }

    // Add to grid with animation
    line.style.opacity = '0';
    gridContainer.appendChild(line);
    
    // Animate line appearance
    setTimeout(() => {
        line.style.opacity = '1';
    }, 10);
    
    // Play sound effect
    playSound(lineSound);
    
    return line;
}

// Draw a square
function drawSquare(row, col, isPlayer) {
    const cellSize = 65;
    const square = document.createElement('div');
    square.classList.add('square');
    
    // Set square owner
    if (isPlayer) {
        square.classList.add('player');
    } else {
        square.classList.add(gameState.isAiGame ? 'ai' : 'opponent');
    }
    
    // Position square - precisely aligned with grid cells
    square.style.top = `${row * cellSize + 12}px`;
    square.style.left = `${col * cellSize + 12}px`;
    square.style.width = `${cellSize - 11}px`;
    square.style.height = `${cellSize - 11}px`;
    
    gridContainer.appendChild(square);
    
    // Play square completion sound
    playSound(squareSound);
}

// Play sound effect
function playSound(audioElement) {
    // Reset and play
    audioElement.currentTime = 0;
    audioElement.play().catch(e => console.log("Audio play failed:", e));
}

// Handle dot selection
function handleDotClick(e) {
    if (!gameState.isPlayerTurn) return;
    
        const clickedDot = e.target;
    if (!clickedDot.classList.contains('dot')) return;
    
    const row = parseInt(clickedDot.dataset.row);
    const col = parseInt(clickedDot.dataset.col);
    
    if (!gameState.selectedDot) {
        // First dot selection
        gameState.selectedDot = { row, col };
        clickedDot.classList.add('selected');
        } else {
        // Second dot selection
        const selectedRow = gameState.selectedDot.row;
        const selectedCol = gameState.selectedDot.col;
        
        // Check if dots are adjacent
        const rowDiff = Math.abs(selectedRow - row);
        const colDiff = Math.abs(selectedCol - col);

            if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            // Valid move - adjacent dots
            const line = {
                row1: selectedRow,
                col1: selectedCol,
                row2: row,
                col2: col
            };
            
            // Send move to server
            socket.emit('move', {
                roomCode: gameState.roomCode,
                line: line
            });
            
            // Clear selection
            clearDotSelection();
        } else {
            // Invalid move - not adjacent
            clearDotSelection();
        }
    }
}

// Clear dot selection
function clearDotSelection() {
    if (gameState.selectedDot) {
        const dot = document.querySelector(
            `.dot[data-row="${gameState.selectedDot.row}"][data-col="${gameState.selectedDot.col}"]`
        );
        if (dot) {
            dot.classList.remove('selected');
        }
    }
    gameState.selectedDot = null;
}

// Update turn display
function updateTurnDisplay() {
    if (gameState.isPlayerTurn) {
        currentTurnDisplay.textContent = 'Your Turn';
        currentTurnDisplay.style.backgroundColor = '#4ecdc4';
    } else {
        currentTurnDisplay.textContent = gameState.isAiGame ? 'AI Turn' : 'Opponent Turn';
        currentTurnDisplay.style.backgroundColor = '#ff6b6b';
    }
}

// Update score display
function updateScoreDisplay() {
    playerScoreElement.textContent = gameState.playerScore;
    opponentScoreElement.textContent = gameState.opponentScore;
    updateHashColor();
}

// Update hash color based on scores
function updateHashColor() {
    const hashSymbol = document.querySelector('.hash-symbol');
    const hashTitle = document.querySelector('.hash-title');
    
    if (gameState.playerScore > gameState.opponentScore) {
        // Player is winning - make it green
        hashSymbol.style.color = '#4ecdc4';
        hashSymbol.style.textShadow = '0 0 10px rgba(78, 205, 196, 0.8)';
        hashTitle.style.color = '#4ecdc4';
        hashTitle.style.textShadow = '0 0 5px rgba(78, 205, 196, 0.6)';
    } else if (gameState.playerScore < gameState.opponentScore) {
        // Opponent is winning - make it red
        hashSymbol.style.color = '#ff6b6b';
        hashSymbol.style.textShadow = '0 0 10px rgba(255, 107, 107, 0.8)';
        hashTitle.style.color = '#ff6b6b';
        hashTitle.style.textShadow = '0 0 5px rgba(255, 107, 107, 0.6)';
    } else {
        // It's a tie - make it neutral
        hashSymbol.style.color = '#ffffff';
        hashSymbol.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.8)';
        hashTitle.style.color = '#ffffff';
        hashTitle.style.textShadow = '0 0 5px rgba(255, 255, 255, 0.6)';
    }
}

// Socket event handlers
socket.on('gameCreated', (data) => {
    gameState.roomCode = data.roomCode;
    gameState.isAiGame = data.aiMode || false;
    gameState.playerId = socket.id;
    gameState.isPlayerTurn = true;
    
    hideAllScreens();
    
    if (!gameState.isAiGame) {
        // Show room code for multiplayer games
        roomCodeDisplay.textContent = data.roomCode;
        roomCodeScreen.classList.remove('hidden');
    } else {
        // Go directly to game for AI games
        startGame();
    }
});

socket.on('gameJoined', (data) => {
    gameState.roomCode = data.roomCode;
    gameState.playerId = socket.id;
    gameState.isPlayerTurn = false;
    
    joinError.classList.add('hidden');
    hideAllScreens();
    startGame();
});

socket.on('joinError', (data) => {
    joinError.textContent = data.message;
    joinError.classList.remove('hidden');
});

socket.on('playerJoined', () => {
    waitingMessage.textContent = 'Player joined! Starting game...';
    setTimeout(startGame, 1500);
});

socket.on('moveMade', (data) => {
    const { line, player, completedSquares, scores } = data;
    const isCurrentPlayer = player === gameState.playerId;
    
    // Draw the line
    drawLine(
        line.row1, 
        line.col1, 
        line.row2, 
        line.col2, 
        isCurrentPlayer
    );
    
    // Log scores for debugging
    console.log('Received scores:', scores);
    
    // Update scores internally for both players
    if (scores) {
        // Update player score
        gameState.playerScore = scores[gameState.playerId] || 0;
        
        // Update AI/opponent score internally only
        if (gameState.isAiGame) {
            // Make sure we're using the exact key that the server is using
            gameState.opponentScore = scores['ai-player'] || 0;
            console.log('AI score updated to:', gameState.opponentScore);
            } else {
            // For multiplayer games, find opponent's score
            const opponentId = Object.keys(scores).find(id => id !== gameState.playerId);
            if (opponentId) {
                gameState.opponentScore = scores[opponentId] || 0;
            }
        }
        
        // Update the score display element - only show player score
        playerScoreElement.textContent = gameState.playerScore;
        
        // For multiplayer games, show opponent score. For AI games, hide it
        if (!gameState.isAiGame) {
            opponentScoreElement.textContent = gameState.opponentScore;
        } else {
            opponentScoreElement.textContent = "?";
        }
        
        updateHashColor();
    }
    
    // Draw completed squares
    if (completedSquares && completedSquares.length > 0) {
        completedSquares.forEach(square => {
            const [row, col] = square.split(',').map(num => parseInt(num));
            drawSquare(row, col, isCurrentPlayer);
        });
    }
});

socket.on('turnChange', (data) => {
    gameState.isPlayerTurn = data.currentPlayer === gameState.playerId;
    
    // If server sends score updates with turn changes, update them
    if (data.scores) {
        gameState.playerScore = data.scores[gameState.playerId] || 0;
        
        if (gameState.isAiGame) {
            gameState.opponentScore = data.scores['ai-player'] || 0;
        } else {
            const opponentId = Object.keys(data.scores).find(id => id !== gameState.playerId);
            if (opponentId) {
                gameState.opponentScore = data.scores[opponentId] || 0;
            }
        }
        
        // Update score display - only show player score
        playerScoreElement.textContent = gameState.playerScore;
        
        // For multiplayer games, show opponent score. For AI games, hide it
        if (!gameState.isAiGame) {
            opponentScoreElement.textContent = gameState.opponentScore;
        } else {
            opponentScoreElement.textContent = "?";
        }
        
        updateHashColor();
    }
    
    updateTurnDisplay();
});

socket.on('gameOver', (data) => {
    const { scores } = data;
    
    const playerScore = scores[gameState.playerId];
    
    // Calculate opponent score
    let opponentScore = 0;
    if (gameState.isAiGame) {
        // For AI games, use the ai-player ID directly
        opponentScore = scores['ai-player'] || 0;
    } else {
        // For multiplayer games, find opponent score
        const opponents = Object.keys(scores).filter(id => id !== gameState.playerId);
        if (opponents.length > 0) {
            opponentScore = scores[opponents[0]];
        }
    }
    
    // Update game state scores
    gameState.playerScore = playerScore;
    gameState.opponentScore = opponentScore;
    
    // Update score display - now we can show the AI score since game is over
    playerScoreElement.textContent = gameState.playerScore;
    opponentScoreElement.textContent = gameState.opponentScore;
    updateHashColor();
    
    // Determine winner
    let result;
    if (playerScore > opponentScore) {
        result = 'You Win!';
        playSound(winSound);
    } else if (playerScore < opponentScore) {
        result = gameState.isAiGame ? 'AI Wins!' : 'Opponent Wins!';
    } else {
        result = 'It\'s a Tie!';
    }
    
    // Update game over screen
    finalScoreDisplay.textContent = `You: ${playerScore} - ${gameState.isAiGame ? 'AI' : 'Opponent'}: ${opponentScore}`;
    resultMessage.textContent = result;
    
    // Show game over screen
    setTimeout(() => {
        hideAllScreens();
        gameOverScreen.classList.remove('hidden');
    }, 1000);
});

socket.on('playerDisconnected', () => {
    alert('Opponent disconnected');
    hideAllScreens();
    welcomeScreen.classList.remove('hidden');
    resetGameState();
});

socket.on('notYourTurn', () => {
    alert('Not your turn!');
});

socket.on('invalidMove', () => {
    alert('Invalid move!');
});

// Start the game
function startGame() {
    hideAllScreens();
    gameScreen.classList.remove('hidden');
    
    // Change background video
    changeBackgroundVideo('bg2.mp4');
    
    // Create dot grid
    createDotGrid();
    
    // Update displays
    updateTurnDisplay();
    updateScoreDisplay();
    
    // Set opponent label based on game type
    document.querySelector('#opponent-score').textContent = 
        gameState.isAiGame ? 'AI: ' : 'Opponent: ';
    
    // For AI games, show "?" instead of the score
    if (gameState.isAiGame) {
        document.querySelector('#opponent-score').innerHTML += '<span>🤫</span>';
    } else {
        document.querySelector('#opponent-score').innerHTML += '<span>0</span>';
    }
}
