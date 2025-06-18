function generateMultiplayerMenuLabels() {
    return [
        new Label(
            "Multiplayer Mode", 
            new Vector2(100, 0),
            Vector2.zero,
            "white",
            "left",
            "Bookman",
            "100px"
        ),
        new Label(
            "HOST", 
            new Vector2(550, 300),
            Vector2.zero,
            "white",
            "center",
            "Bookman",
            "40px"
        ),
        new Label(
            "JOIN", 
            new Vector2(550, 500),
            Vector2.zero,
            "white",
            "center",
            "Bookman",
            "40px"
        )
    ];
}

function generateHostMenuLabels(roomCode) {
    return [
        new Label(
            "Creating Room...", 
            new Vector2(650, 200),
            Vector2.zero,
            "white",
            "center",
            "Bookman",
            "40px"
        ),
        new Label(
            roomCode ? "Your Room Code:" : "Please Wait...", 
            new Vector2(650, 300),
            Vector2.zero,
            "white",
            "center",
            "Bookman",
            "40px"
        ),
        new Label(
            roomCode || "", 
            new Vector2(650, 400),
            Vector2.zero,
            "gold",
            "center",
            "Bookman",
            "60px"
        ),
        new Label(
            roomCode ? "Waiting for player to join..." : "", 
            new Vector2(650, 500),
            Vector2.zero,
            "white",
            "center",
            "Bookman",
            "30px"
        )
    ];
}

function generateJoinMenuLabels() {
    // Show the input field when this menu is generated
    const input = document.getElementById('roomCodeInput');
    if (input) {
        input.style.display = 'block';
        input.value = ''; // Clear any previous value
    }
    
    return [
        new Label(
            "Enter Room Code:", 
            new Vector2(650, 200),
            Vector2.zero,
            "white",
            "center",
            "Bookman",
            "40px"
        ),
        new Label(
            "(Enter the code and click Continue)", 
            new Vector2(650, 250),
            Vector2.zero,
            "white",
            "center",
            "Bookman",
            "20px"
        )
    ];
}

function generateMultiplayerMenuButtons() {
    return [
        new Button(
            sprites.continueButton,
            new Vector2(450, 280),
            function() {
                // Switch to host screen
                Game.network.hostGame();
                Game.mainMenu.labels = generateHostMenuLabels();
                Game.mainMenu.buttons = generateHostMenuButtons();
            },
            sprites.continueButtonHover
        ),
        new Button(
            sprites.continueButton,
            new Vector2(450, 480),
            function() {
                // Switch to join screen
                Game.mainMenu.labels = generateJoinMenuLabels();
                Game.mainMenu.buttons = generateJoinMenuButtons();
            },
            sprites.continueButtonHover
        ),
        new Button(
            sprites.backButton,
            new Vector2(100, 150),
            function() {
                Game.mainMenu.labels = generateMainMenuLabels("Classic 8-Ball");
                Game.mainMenu.buttons = generateMainMenuButtons(false);
            },
            sprites.backButtonHover
        )
    ];
}

function generateHostMenuButtons() {
    return [
        new Button(
            sprites.backButton,
            new Vector2(100, 150),
            function() {
                Game.network.socket.emit('cancelHost');
                Game.mainMenu.labels = generateMultiplayerMenuLabels();
                Game.mainMenu.buttons = generateMultiplayerMenuButtons();
            },
            sprites.backButtonHover
        )
    ];
}

function generateJoinMenuButtons() {
    return [
        new Button(
            sprites.continueButton,
            new Vector2(450, 450),
            function() {
                const input = document.getElementById('roomCodeInput');
                const code = input ? input.value.toUpperCase() : '';
                if (code && code.length > 0) {
                    // Hide the input field
                    input.style.display = 'none';
                    
                    // Show loading message
                    Game.mainMenu.labels = [
                        new Label(
                            "Joining game...", 
                            new Vector2(650, 300),
                            Vector2.zero,
                            "white",
                            "center",
                            "Bookman",
                            "40px"
                        )
                    ];
                    Game.mainMenu.buttons = [];
                    
                    // Emit join event
                    Game.network.joinGame(code);
                }
            },
            sprites.continueButtonHover
        ),
        new Button(
            sprites.backButton,
            new Vector2(100, 150),
            function() {
                // Hide the input field
                const input = document.getElementById('roomCodeInput');
                if (input) {
                    input.style.display = 'none';
                    input.value = '';
                }
                
                // Return to multiplayer menu
                Game.mainMenu.labels = generateMultiplayerMenuLabels();
                Game.mainMenu.buttons = generateMultiplayerMenuButtons();
            },
            sprites.backButtonHover
        )
    ];
}

function generateBettingScreenLabels() {
    return [
        new Label(
            "Place Your Bet", 
            new Vector2(650, 200),
            Vector2.zero,
            "white",
            "center",
            "Bookman",
            "40px"
        ),
        new Label(
            "100 coins", 
            new Vector2(650, 300),
            Vector2.zero,
            "gold",
            "center",
            "Bookman",
            "30px"
        ),
        new Label(
            "Total Pot: 200 coins", 
            new Vector2(650, 400),
            Vector2.zero,
            "gold",
            "center",
            "Bookman",
            "30px"
        )
    ];
}

function generateBettingScreenButtons() {
    return [
        new Button(
            sprites.continueButton,
            new Vector2(450, 500),
            function() {
                Game.network.setBettingReady();
            },
            sprites.continueButtonHover
        ),
        new Button(
            sprites.backButton,
            new Vector2(100, 150),
            function() {
                document.getElementById('roomCodeInput').style.display = 'none';
                Game.mainMenu.labels = generateMultiplayerMenuLabels();
                Game.mainMenu.buttons = generateMultiplayerMenuButtons();
            },
            sprites.backButtonHover
        )
    ];
} 