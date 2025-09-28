"use strict";

var requestAnimationFrame = (function () {
    return  window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

function Game_Singleton() {
    this.size = undefined;
    this.spritesStillLoading = 0;
    this.gameWorld = undefined;
    this.sound = true;

    this.mainMenu = new Menu();
}

Game_Singleton.prototype.start = function (divName, canvasName, x, y) {
    this.size = new Vector2(x,y);
    Canvas2D.initialize(divName, canvasName);
    this.loadAssets();
    this.assetLoadingLoop();
};

Game_Singleton.prototype.initialize = function () {
    this.gameWorld = new GameWorld();
    this.policy = new GamePolicy();
    
    this.initMenus();

    AI.init(this.gameWorld, this.policy);
};

Game_Singleton.prototype.initMenus = function(inGame){

    let labels = generateMainMenuLabels("Classic 8-Ball");

    let buttons = generateMainMenuButtons(inGame);

    this.mainMenu.init
    (
        sprites.mainMenuBackground,
        labels,
        buttons,
        sounds.jazzTune
    );
}

Game_Singleton.prototype.loadSprite = function (imageName) {
    console.log("Loading sprite: " + imageName);
    var image = new Image();
    image.src = imageName;
    this.spritesStillLoading += 1;
    image.onload = function () {
        Game.spritesStillLoading -= 1;
    };
    return image;
};

Game_Singleton.prototype.assetLoadingLoop = function () {
    if (!this.spritesStillLoading > 0)
        requestAnimationFrame(Game.assetLoadingLoop);
    else {
        Game.initialize();
        requestAnimationFrame(this.mainMenu.load.bind(this.mainMenu));
    }
};

Game_Singleton.prototype.handleInput = function(){

    if(Keyboard.down(Keys.escape)){
        GAME_STOPPED = true;
        Game.initMenus(true);
        requestAnimationFrame(Game.mainMenu.load.bind(this.mainMenu));
    }
}

Game_Singleton.prototype.startNewGame = function(){
    Canvas2D._canvas.style.cursor = "auto";

    Game.gameWorld = new GameWorld();
    Game.policy = new GamePolicy();

    Canvas2D.clear();
    Canvas2D.drawImage(
        sprites.controls, 
        new Vector2(Game.size.x/2,Game.size.y/2), 
        0, 
        1, 
        new Vector2(sprites.controls.width/2,sprites.controls.height/2)
    );

    setTimeout(()=>{
        AI.init(Game.gameWorld, Game.policy);

        if(AI_ON && AI_PLAYER_NUM == 0){
            AI.startSession();
        }
        Game.mainLoop();
    },5000);
}

Game_Singleton.prototype.continueGame = function(){
    Canvas2D._canvas.style.cursor = "auto";

    requestAnimationFrame(Game.mainLoop);
}

Game_Singleton.prototype.mainLoop = function () {
    

    if(DISPLAY && !GAME_STOPPED){
        Game.gameWorld.handleInput(DELTA);
        Game.gameWorld.update(DELTA);
        Canvas2D.clear();
        Game.gameWorld.draw();
        Mouse.reset();
        Game.handleInput();
        requestAnimationFrame(Game.mainLoop);
    }
};

// Mini-game functionality
Game_Singleton.prototype.startMiniGame = function(type, gameData) {
    GAME_STOPPED = true;
    this.currentMiniGame = {
        type: type,
        data: gameData,
        isActive: true
    };
    
    if (type === 'dailyBreak') {
        this.startDailyBreakGame(gameData);
    } else if (type === 'powerShot') {
        this.startPowerShotGame(gameData);
    }
};

Game_Singleton.prototype.startDailyBreakGame = function(gameData) {
    // Setup break shot scenario
    this.gameWorld = new GameWorld();
    this.policy = new GamePolicy();
    
    // Position balls for break shot
    for (let i = 0; i < gameData.balls.length; i++) {
        if (i < this.gameWorld.balls.length - 1) { // Exclude white ball
            this.gameWorld.balls[i].position = gameData.balls[i].position.copy();
            this.gameWorld.balls[i].color = gameData.balls[i].color;
        }
    }
    
    // Position white ball for break shot
    this.gameWorld.whiteBall.position = new Vector2(413, 413);
    this.gameWorld.stick.position = this.gameWorld.whiteBall.position.copy();
    
    // Add instructions overlay
    this.showMiniGameInstructions("Daily Break Challenge", 
        "Make the best break shot possible! You have " + (3 - gameData.currentAttempt) + " attempts remaining.");
    
    GAME_STOPPED = false;
    requestAnimationFrame(Game.mainLoop);
};

Game_Singleton.prototype.startPowerShotGame = function(gameData) {
    // Setup power shot scenario
    this.gameWorld = new GameWorld();
    this.policy = new GamePolicy();
    
    // Clear all balls except white ball and targets
    this.gameWorld.balls = [this.gameWorld.whiteBall];
    
    // Add target balls
    for (let target of gameData.targets) {
        const targetBall = new Ball(target.position.copy(), target.color);
        this.gameWorld.balls.push(targetBall);
    }
    
    // Position white ball at center
    this.gameWorld.whiteBall.position = new Vector2(800, 400);
    this.gameWorld.stick.position = this.gameWorld.whiteBall.position.copy();
    
    // Add instructions overlay
    this.showMiniGameInstructions("Power Shot Challenge", 
        `Level ${gameData.level}: Use high power (>60%) to pot the target balls!`);
    
    GAME_STOPPED = false;
    requestAnimationFrame(Game.mainLoop);
};

Game_Singleton.prototype.showMiniGameInstructions = function(title, instructions) {
    // Create or update instructions overlay
    let overlay = document.getElementById('minigame-instructions');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'minigame-instructions';
        overlay.className = 'minigame-overlay';
        document.body.appendChild(overlay);
    }
    
    overlay.innerHTML = `
        <div class="minigame-container">
            <h2>${title}</h2>
            <div class="minigame-instructions">${instructions}</div>
            <button onclick="Game.hideMiniGameInstructions()" class="play-btn">Start Playing</button>
        </div>
    `;
    
    overlay.style.display = 'flex';
};

Game_Singleton.prototype.hideMiniGameInstructions = function() {
    const overlay = document.getElementById('minigame-instructions');
    if (overlay) {
        overlay.style.display = 'none';
    }
};

Game_Singleton.prototype.endMiniGame = function(results) {
    GAME_STOPPED = true;
    this.currentMiniGame = null;
    
    // Return to main menu or continue game
    this.initMenus(true);
    requestAnimationFrame(this.mainMenu.load.bind(this.mainMenu));
    
    // Show results
    if (results) {
        rewardsDashboard.showNotification(results.message, results.success ? 'success' : 'error');
        if (results.reward) {
            SolanaWalletManager.addPendingReward(results.reward.tokens, "Mini-game Reward");
        }
    }
};

var Game = new Game_Singleton();

