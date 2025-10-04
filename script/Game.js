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

Game_Singleton.prototype.startBreakGame = function(){
    Canvas2D._canvas.style.cursor = "auto";

    Game.gameWorld = new GameWorld();
    Game.policy = new GamePolicy();
    Game.gameWorld.isBreakMode = true; // Mark as break mode
    Game.gameWorld.miniGameActive = true;

    Canvas2D.clear();
    Canvas2D.drawImage(
        sprites.controls, 
        new Vector2(Game.size.x/2,Game.size.y/2), 
        0, 
        1, 
        new Vector2(sprites.controls.width/2,sprites.controls.height/2)
    );

    setTimeout(()=>{
        Game.mainLoop();
    },3000);
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
        
        // Check mini-game completion
        if (Game.currentMiniGame && Game.currentMiniGame.isActive) {
            Game.checkMiniGameCompletion();
        }
        
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
    // Disable AI for mini-games
    AI_ON = false;
    
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
    
    // Store initial ball positions for scoring
    this.currentMiniGame.initialBallPositions = this.gameWorld.balls.map(ball => ball.position.copy());
    this.currentMiniGame.shotTaken = false;
    this.currentMiniGame.shotCompleted = false;
    
    // Add instructions overlay
    this.showMiniGameInstructions("Daily Break Challenge", 
        "Make the best break shot possible! You have " + (3 - gameData.currentAttempt) + " attempts remaining.");
    
    GAME_STOPPED = false;
    requestAnimationFrame(Game.mainLoop);
};

Game_Singleton.prototype.startPowerShotGame = function(gameData) {
    // Disable AI for mini-games
    AI_ON = false;
    
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
    
    // Initialize power shot tracking
    this.currentMiniGame.shotTaken = false;
    this.currentMiniGame.shotCompleted = false;
    this.currentMiniGame.targetsPotted = 0;
    this.currentMiniGame.requiredPower = gameData.powerThreshold || 0.6;
    
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

Game_Singleton.prototype.checkMiniGameCompletion = function() {
    if (!this.currentMiniGame || !this.currentMiniGame.isActive) return;
    
    // Check if balls have stopped moving
    const ballsMoving = this.gameWorld.ballsMoving();
    
    // Mark shot as taken when stick shoots
    if (this.gameWorld.stick.shooting && !this.currentMiniGame.shotTaken) {
        this.currentMiniGame.shotTaken = true;
        this.currentMiniGame.shotPower = this.gameWorld.stick.power;
    }
    
    // Check completion when balls stop moving after shot
    if (this.currentMiniGame.shotTaken && !ballsMoving && !this.currentMiniGame.shotCompleted) {
        this.currentMiniGame.shotCompleted = true;
        
        if (this.currentMiniGame.type === 'dailyBreak') {
            this.completeDailyBreakAttempt();
        } else if (this.currentMiniGame.type === 'powerShot') {
            this.completePowerShotAttempt();
        }
    }
};

Game_Singleton.prototype.completeDailyBreakAttempt = function() {
    // Calculate break score
    const ballsSpread = this.calculateBallSpread();
    const ballsPotted = this.countPottedBalls();
    const cueballScratch = this.gameWorld.whiteBall.inHole;
    
    const score = MiniGameSystem.evaluateBreakShot(ballsSpread, ballsPotted, cueballScratch);
    
    // Update attempt
    this.currentMiniGame.data.currentAttempt++;
    this.currentMiniGame.data.bestScore = Math.max(this.currentMiniGame.data.bestScore || 0, score);
    
    // Check if more attempts available
    if (this.currentMiniGame.data.currentAttempt < this.currentMiniGame.data.attempts) {
        // Show attempt result and offer to continue
        this.showAttemptResult(score, this.currentMiniGame.data.attempts - this.currentMiniGame.data.currentAttempt);
    } else {
        // Complete the daily break mini-game
        const result = MiniGameSystem.completeDailyBreak(this.currentMiniGame.data.bestScore);
        this.endMiniGame(result);
    }
};

Game_Singleton.prototype.completePowerShotAttempt = function() {
    const shotPower = this.currentMiniGame.shotPower / 10; // Normalize power (0-1)
    const ballsPotted = this.countPottedBalls();
    
    // Check if power requirement met and ball potted
    const powerMet = shotPower >= this.currentMiniGame.requiredPower;
    const success = powerMet && ballsPotted > 0;
    
    if (success) {
        // Level completed, advance or finish
        const level = this.currentMiniGame.data.level;
        this.currentMiniGame.data.score += level * 10;
        
        if (level < 5) {
            // Advance to next level
            const nextLevelData = MiniGameSystem.advancePowerShotLevel(level, this.currentMiniGame.data.score);
            if (nextLevelData.levelComplete) {
                this.showLevelComplete(level, nextLevelData.nextLevel);
                return;
            }
        } else {
            // All levels completed
            const result = MiniGameSystem.completePowerShot(this.currentMiniGame.data.score);
            this.endMiniGame(result);
        }
    } else {
        // Failed attempt
        let failReason = "";
        if (!powerMet) failReason = `Need ${Math.round(this.currentMiniGame.requiredPower * 100)}%+ power`;
        if (!ballsPotted) failReason += (failReason ? " and " : "") + "must pot a ball";
        
        this.showFailedAttempt(failReason);
    }
};

Game_Singleton.prototype.calculateBallSpread = function() {
    let totalDistance = 0;
    const initialPositions = this.currentMiniGame.initialBallPositions;
    
    for (let i = 0; i < this.gameWorld.balls.length - 1; i++) { // Exclude white ball
        const initial = initialPositions[i];
        const current = this.gameWorld.balls[i].position;
        totalDistance += initial.distanceFrom(current);
    }
    
    return totalDistance / (this.gameWorld.balls.length - 1);
};

Game_Singleton.prototype.countPottedBalls = function() {
    let pottedCount = 0;
    for (let ball of this.gameWorld.balls) {
        if (ball.inHole && ball !== this.gameWorld.whiteBall) {
            pottedCount++;
        }
    }
    return pottedCount;
};

Game_Singleton.prototype.showAttemptResult = function(score, attemptsLeft) {
    const overlay = document.getElementById('minigame-instructions');
    if (overlay) {
        overlay.innerHTML = `
            <div class="minigame-container">
                <h2>Attempt Complete!</h2>
                <div class="attempt-score">Score: ${score}</div>
                <p>Attempts remaining: ${attemptsLeft}</p>
                <button onclick="Game.continueMinigame()" class="play-btn">Next Attempt</button>
                <button onclick="Game.endMiniGame()" class="disconnect-btn">Finish Now</button>
            </div>
        `;
        overlay.style.display = 'flex';
    }
};

Game_Singleton.prototype.showLevelComplete = function(completedLevel, nextLevel) {
    const overlay = document.getElementById('minigame-instructions');
    if (overlay) {
        overlay.innerHTML = `
            <div class="minigame-container">
                <h2>Level ${completedLevel} Complete!</h2>
                <p>Great shot! Ready for Level ${nextLevel}?</p>
                <button onclick="Game.advanceToNextLevel()" class="play-btn">Continue to Level ${nextLevel}</button>
                <button onclick="Game.endMiniGame()" class="disconnect-btn">Finish Now</button>
            </div>
        `;
        overlay.style.display = 'flex';
    }
};

Game_Singleton.prototype.showFailedAttempt = function(reason) {
    const overlay = document.getElementById('minigame-instructions');
    if (overlay) {
        overlay.innerHTML = `
            <div class="minigame-container">
                <h2>Attempt Failed</h2>
                <p>${reason}</p>
                <button onclick="Game.endMiniGame()" class="play-btn">Try Again Tomorrow</button>
            </div>
        `;
        overlay.style.display = 'flex';
    }
};

Game_Singleton.prototype.continueMinigame = function() {
    // Reset for next attempt
    this.currentMiniGame.shotTaken = false;
    this.currentMiniGame.shotCompleted = false;
    
    // Reset game world
    this.gameWorld.reset();
    this.hideMiniGameInstructions();
};

Game_Singleton.prototype.advanceToNextLevel = function() {
    const nextLevel = this.currentMiniGame.data.level + 1;
    this.currentMiniGame.data.level = nextLevel;
    this.currentMiniGame.data.targets = MiniGameSystem.setupPowerShotTargets(nextLevel);
    
    // Restart with new level
    this.startPowerShotGame(this.currentMiniGame.data);
};

Game_Singleton.prototype.endMiniGame = function(results) {
    GAME_STOPPED = true;
    this.currentMiniGame = null;
    
    // Re-enable AI for normal games
    AI_ON = true;
    
    // Hide any mini-game overlays
    this.hideMiniGameInstructions();
    
    // Return to main menu
    this.initMenus(true);
    requestAnimationFrame(this.mainMenu.load.bind(this.mainMenu));
    
    // Show results
    if (results) {
        rewardsDashboard.showNotification(results.message, results.success ? 'success' : 'error');
        if (results.reward && results.reward.tokens) {
            SolanaWalletManager.addPendingReward(results.reward.tokens, "Mini-game Reward");
        }
    }
    
    // Update dashboard
    setTimeout(() => {
        rewardsDashboard.update();
    }, 1000);
};

var Game = new Game_Singleton();

