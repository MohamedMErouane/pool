
function generateMainMenuLabels(headerText){

    let labels = [

        new Label(
            headerText || "Pool Mining Game", 
            new Vector2(100,0),
            Vector2.zero,
            "white",
            "left",
            "Bookman",
            "100px"
        
        )
    ];


    return labels;
}


function generateMainMenuButtons(inGame){



    let buttons = [];

    let dev = 0;

    if(inGame){
        dev = 200;
        buttons.push(
            new Button
                (
                    // CONTINUE BUTTON
                    sprites.continueButton, 
                    new Vector2(200,200),
                    function(){
                        Game.mainMenu.active = false;
                        GAME_STOPPED = false;
                        setTimeout(Game.continueGame,200);
                        sounds.fadeOut(Game.mainMenu.sound);
                    },
                    sprites.continueButtonHover
                )
        )
    }

    let muteSprite = sprites.muteButton;
    let muteSpriteHover = sprites.muteButtonHover;

    if(Game.mainMenu.sound && Game.mainMenu.sound.volume === 0){
        muteSprite = sprites.muteButtonPressed;
        muteSpriteHover = sprites.muteButtonPressedHover;
    }


    let muteButton = new Button
    (
        // MUTE BUTTON
        muteSprite, 
        new Vector2(1430,10),
        function(){
            if(Game.mainMenu.sound.volume == 0){
                SOUND_ON = true;
                Game.mainMenu.sound.volume = 0.8;
                this.sprite = sprites.muteButton;
                this.hoverSprite = sprites.muteButtonHover;
            }
            else{
                SOUND_ON = false;
                Game.mainMenu.sound.volume = 0.0;
                this.sprite = sprites.muteButtonPressed;
                this.hoverSprite = sprites.muteButtonPressedHover;
            }
        },
        muteSpriteHover
    );

    let backButton = new Button
    (
        //BACK
        sprites.backButton, 
        new Vector2(100,150),
        function(){
            Game.mainMenu.labels = generateMainMenuLabels("Classic 8-Ball");
            Game.mainMenu.buttons = generateMainMenuButtons(inGame);
        },
        sprites.backButtonHover
    );

    buttons = buttons.concat([
        new Button
        (
            // CUE SHOT MINING (Daily Check-in)
            sprites.onePlayersButton, 
            new Vector2(200,dev+200),
            function(){
                if (!Game.dailyRewards) {
                    Game.dailyRewards = new DailyRewards();
                }
                
                const result = Game.dailyRewards.performDailyCheckIn();
                if (result.success) {
                    alert(`Daily Cue Shot Complete! Earned ${result.reward} tokens!`);
                } else {
                    alert(result.message);
                }
            },
            sprites.onePlayersButtonHover
        ),
        new Button
        (
            // DAILY BREAK BONUS (Pocket Billiards)
            sprites.twoPlayersButton, 
            new Vector2(200,dev+350),
            function(){
                if (!Game.miniGames) {
                    Game.miniGames = new MiniGames();
                }
                Game.miniGames.startDailyBreak();
                Game.mainMenu.active = false;
                GAME_STOPPED = false;
                setTimeout(Game.startBreakGame,200);
                sounds.fadeOut(Game.mainMenu.sound);
            },
            sprites.twoPlayersButtonHover
        ),
        new Button
        (
            // AIM & SHOOT PRACTICE MODE
            sprites.hardButton, 
            new Vector2(200,dev+500),
            function(){
                if (!Game.miniGames) {
                    Game.miniGames = new MiniGames();
                }
                Game.miniGames.startAimShoot();
                Game.mainMenu.active = false;
                GAME_STOPPED = false;
                setTimeout(Game.startAimShootGame,200);
                sounds.fadeOut(Game.mainMenu.sound);
            },
            sprites.hardButtonHover
        ),
        new Button
        (
            // POWER SHOT GAUGE
            sprites.easyButton, 
            new Vector2(200,dev+650),
            function(){
                if (!Game.miniGames) {
                    Game.miniGames = new MiniGames();
                }
                Game.miniGames.startPowerShot();
                alert("Power Shot Gauge activated! Take your shot!");
            },
            sprites.easyButtonHover
        ),
        muteButton
    ]);

    return buttons;
}