function generateBettingMenuLabels() {
    return [
        new Label(
            "Place Your Bets", 
            new Vector2(100, 0),
            Vector2.zero,
            "white",
            "left",
            "Bookman",
            "100px"
        ),
        new Label(
            "Player 1", 
            new Vector2(300, 300),
            Vector2.zero,
            "white",
            "center",
            "Bookman",
            "40px"
        ),
        new Label(
            "Player 2", 
            new Vector2(1000, 300),
            Vector2.zero,
            "white",
            "center",
            "Bookman",
            "40px"
        ),
        new Label(
            "100 coins", 
            new Vector2(300, 400),
            Vector2.zero,
            "gold",
            "center",
            "Bookman",
            "30px"
        ),
        new Label(
            "100 coins", 
            new Vector2(1000, 400),
            Vector2.zero,
            "gold",
            "center",
            "Bookman",
            "30px"
        ),
        new Label(
            "Total Pot: 200 coins", 
            new Vector2(650, 500),
            Vector2.zero,
            "gold",
            "center",
            "Bookman",
            "50px"
        )
    ];
}

function generateBettingMenuButtons() {
    return [
        new Button(
            sprites.continueButton, 
            new Vector2(650, 650),
            function() {
                Game.gameWorld.pot = new Pot(new Vector2(750, 50), 200);
                Game.mainMenu.active = false;
                GAME_STOPPED = false;
                setTimeout(Game.startNewGame, 200);
                sounds.fadeOut(Game.mainMenu.sound);
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