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

    // CLIENT SPECIFICATION: Check if player has attempts left
    const today = new Date().toDateString();
    const lastPlayDate = localStorage.getItem('lastPlayDate') || '';
    const dailyBreakAttempts = parseInt(localStorage.getItem('dailyBreakAttempts') || '0');
    
    // Reset attempts if it's a new day
    if (lastPlayDate !== today) {
        localStorage.setItem('dailyBreakAttempts', '0');
        localStorage.setItem('lastPlayDate', today);
    } else if (dailyBreakAttempts >= 3) {
        // Show 24-hour message if player has used all attempts
        this.show24HourMessage('Daily Break');
        return;
    }

    // Ensure sound is enabled for break mode
    Game.sound = true;
    console.log("🔊 Sound enabled for Daily Break mode");

    Game.gameWorld = new GameWorld();
    Game.policy = new GamePolicy();
    
    // CLIENT SPECIFICATION: Initialize break mode
    Game.gameWorld.isBreakMode = true;
    Game.gameWorld.miniGameActive = true;
    Game.gameWorld.breakCompleted = false;
    Game.gameWorld.instantBallsForced = false;
    Game.gameWorld.ballsForced = false;
    Game.gameWorld.aimShootTargetForced = false;
    
    console.log(`🎯 DAILY BREAK STARTED - Attempt ${dailyBreakAttempts + 1} of 3`);
    console.log("📋 CLIENT SPEC: Ball will slowly roll into hole, show points, auto-reset");

    // Mark as Daily Break mode in localStorage
    localStorage.setItem('dailyBreakMode', 'true');

    // Start the game directly without showing controls
    GAME_STOPPED = false;
    Game.mainLoop();
}

Game_Singleton.prototype.startAimShootGame = function(){
    Canvas2D._canvas.style.cursor = "auto";

    // CLIENT SPECIFICATION: Check if player has attempts left and 5-minute cooldown
    const now = Date.now();
    const aimShootLastPlayed = parseInt(localStorage.getItem('aimShootLastPlayed') || '0');
    const aimShootShots = parseInt(localStorage.getItem('aimShootShots') || '0');
    const fiveMinutesInMs = 5 * 60 * 1000; // 5 minutes
    
    // Check if 5 minutes have passed since last completion
    const timeSinceLastPlay = now - aimShootLastPlayed;
    
    if (aimShootShots >= 3 && timeSinceLastPlay < fiveMinutesInMs) {
        // Show 5-minute cooldown message
        const remainingTime = Math.ceil((fiveMinutesInMs - timeSinceLastPlay) / 1000 / 60);
        this.show5MinuteMessage(remainingTime);
        return;
    }
    
    // Reset shots if 5 minutes have passed
    if (timeSinceLastPlay >= fiveMinutesInMs) {
        localStorage.setItem('aimShootShots', '0');
    }

    // Ensure sound is enabled for aim shoot mode
    Game.sound = true;
    console.log("🎯 Sound enabled for Aim & Shoot mode");

    // Initialize AI object to prevent blocking (AI is not used in Aim & Shoot)
    if (typeof AI === 'undefined') {
        window.AI = {};
    }
    AI.finishedSession = true;
    console.log("🤖 AI.finishedSession set to true for Aim & Shoot mode");

    // Initialize Aim & Shoot mode with only white and black ball
    Game.gameWorld = new AimShootMode();
    Game.policy = new GamePolicy();
    
    // CLIENT SPECIFICATION: Initialize aim shoot mode
    Game.gameWorld.isAimShootMode = true;
    Game.gameWorld.miniGameActive = true;
    Game.gameWorld.aimShootCompleted = false;
    Game.gameWorld.aimShootTargetForced = false;
    Game.gameWorld.aimShootShotTriggered = false; // Initialize shot trigger flag
    
    const currentShots = parseInt(localStorage.getItem('aimShootShots') || '0');
    console.log(`🎯 AIM SHOOT STARTED - Shot ${currentShots + 1} of 3`);
    console.log("📋 CLIENT SPEC: Ball must ALWAYS go into hole, show points, auto-reset, 5-min cooldown");

    // Enable game display and start the game loop
    DISPLAY = true;
    GAME_STOPPED = false;

    Canvas2D.clear();
    Canvas2D.drawImage(
        sprites.controls, 
        new Vector2(Game.size.x/2,Game.size.y/2), 
        0, 
        1, 
        new Vector2(sprites.controls.width/2,sprites.controls.height/2)
    );

    setTimeout(()=>{
        requestAnimationFrame(Game.mainLoop);
    },1000);
}

// Show 5-minute wait message
Game_Singleton.prototype.show5MinuteMessage = function(remainingMinutes) {
    console.log(`⏰ Showing 5-minute cooldown message - ${remainingMinutes} minutes remaining`);
    
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '50%';
    overlay.style.left = '50%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    overlay.style.color = 'white';
    overlay.style.padding = '50px';
    overlay.style.borderRadius = '15px';
    overlay.style.textAlign = 'center';
    overlay.style.fontSize = '20px';
    overlay.style.fontWeight = 'bold';
    overlay.style.zIndex = '10000';
    overlay.style.border = '3px solid #FF4444';
    
    overlay.innerHTML = `
        <div style="margin-bottom: 25px; font-size: 26px; color: #FF6666;">🎯 Cooldown Active</div>
        <div style="margin-bottom: 20px; line-height: 1.5;">You have completed 3 shots.</div>
        <div style="font-size: 24px; color: #FFD700; margin: 20px 0;">Please wait ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}</div>
        <div style="font-size: 16px; color: #CCCCCC;">Come back soon to play again!</div>
        <div style="margin-top: 25px;">
            <button onclick="this.parentElement.parentElement.remove();" 
                    style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                OK
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
};

Game_Singleton.prototype.continueGame = function(){
    Canvas2D._canvas.style.cursor = "auto";

    requestAnimationFrame(Game.mainLoop);
}

Game_Singleton.prototype.mainLoop = function () {
    
    if(DISPLAY && !GAME_STOPPED){
        // Guard: Check if gameWorld is properly initialized
        if (!Game.gameWorld) {
            console.warn("⚠️ Game world not initialized, skipping frame");
            requestAnimationFrame(Game.mainLoop);
            return;
        }
        
        Game.gameWorld.handleInput(DELTA);
        Game.gameWorld.update(DELTA);
        
        // SUPER AGGRESSIVE BALL FORCING - CHECK EVERY FRAME
        if (Game.gameWorld) {
          // Daily Break forcing
          if (Game.gameWorld.isBreakMode) {
            let ballsMoving = false;
            for (let i = 0; i < Game.gameWorld.balls.length; i++) {
              if (Game.gameWorld.balls[i] && Game.gameWorld.balls[i].velocity && 
                  (Math.abs(Game.gameWorld.balls[i].velocity.x) > 1 || Math.abs(Game.gameWorld.balls[i].velocity.y) > 1)) {
                ballsMoving = true;
                break;
              }
            }
            
            // If balls have stopped and we haven't forced yet, FORCE NOW!
            if (!ballsMoving && !Game.gameWorld.ballsForced && Game.policy && Game.policy.turnPlayed) {
              console.log("🚨 MAIN LOOP: FORCING BREAK BALLS NOW!");
              this.forceBreakBallsInMainLoop();
            }
          }
          
          // Aim & Shoot forcing - handled in AimShootMode.update()
          // No need for additional forcing here as it's handled in the update method
        }
        
        Canvas2D.clear();
        
        // Guard: Check if draw method exists
        if (Game.gameWorld && typeof Game.gameWorld.draw === 'function') {
            Game.gameWorld.draw();
        } else {
            console.warn("⚠️ Game world draw method not available");
        }
        
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
// MAIN LOOP BALL FORCING METHODS - ULTIMATE BACKUP
Game_Singleton.prototype.forceBreakBallsInMainLoop = function() {
  console.log("🔥 MAIN LOOP: FORCING BREAK BALLS!");
  try {
    let forcedCount = 0;
    let targetCount = 3 + Math.floor(Math.random() * 5); // Force 3-7 balls
    
    for (let i = 1; i < Game.gameWorld.balls.length && forcedCount < targetCount; i++) {
      let ball = Game.gameWorld.balls[i];
      if (ball && !ball.inHole && ball.visible) {
        ball.inHole = true;
        ball.visible = false;
        ball.position = new Vector2(-100, -100);
        forcedCount++;
        console.log(`🎯 MAIN LOOP FORCED BALL ${i}! Count: ${forcedCount}`);
      }
    }
    
    // Mark as forced to prevent repeated forcing
    Game.gameWorld.ballsForced = true;
    
    // Update score and rewards
    if (Game.gameWorld.updateBreakRewards) {
      Game.gameWorld.updateBreakRewards(forcedCount);
    }
    
    console.log(`✅ MAIN LOOP FORCED ${forcedCount} BALLS TOTAL!`);
    
  } catch (error) {
    console.error("❌ Main loop break forcing error:", error);
  }
};

Game_Singleton.prototype.forceAimShootBallInMainLoop = function() {
  console.log("🎯 MAIN LOOP: FORCING AIM SHOOT BALL!");
  try {
    // Force the first non-white ball into a hole
    for (let i = 1; i < Game.gameWorld.balls.length; i++) {
      let ball = Game.gameWorld.balls[i];
      if (ball && !ball.inHole && ball.visible) {
        ball.inHole = true;
        ball.visible = false;
        ball.position = new Vector2(-100, -100);
        console.log(`🎯 MAIN LOOP FORCED BALL ${i} INTO HOLE!`);
        
        // Mark as forced
        Game.gameWorld.ballsForced = true;
        
        // Update score and rewards
        if (Game.gameWorld.updateAimShootRewards) {
          Game.gameWorld.updateAimShootRewards();
        }
        break;
      }
    }
    
  } catch (error) {
    console.error("❌ Main loop aim shoot forcing error:", error);
  }
};

Game_Singleton.prototype.startMiniGame = function(type, gameData) {
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
    console.log("🎯 Starting Daily Break Game - Complete state reset");
    
    // CRITICAL: Stop any running game loop first
    GAME_STOPPED = true;
    
    // Disable AI for mini-games
    AI_ON = false;
    
    // CRITICAL: Clear all previous game state completely
    if (this.gameWorld) {
        this.gameWorld = null;
        delete this.gameWorld;
    }
    if (this.policy) {
        this.policy = null;
        delete this.policy;
    }
    
    // Clear any lingering Aim & Shoot state
    localStorage.setItem('dailyBreakMode', 'false');
    
    // Wait 100ms to ensure previous state is fully cleared and garbage collected
    setTimeout(() => {
        try {
            console.log("🔧 Creating fresh GameWorld for Daily Break...");
            
            // Setup break shot scenario with fresh instances
            Game.gameWorld = new GameWorld();
            Game.policy = new GamePolicy();
            
            if (!Game.gameWorld || !Game.policy) {
                console.error("❌ Failed to create GameWorld or GamePolicy");
                return;
            }
            
            console.log("✅ GameWorld and GamePolicy created successfully");
            
            // CRITICAL: Reset all game state flags
            Game.gameWorld.isBreakMode = false;
            Game.gameWorld.isAimShootMode = false;
            Game.gameWorld.miniGameActive = false;
            Game.gameWorld.aimShootCompleted = false;
            Game.gameWorld.aimShootTargetForced = false;
            Game.gameWorld.aimShootShotTriggered = false;
            Game.gameWorld.breakCompleted = false;
            Game.gameWorld.dailyBreakBallsAlreadyForced = false;
            Game.gameWorld.ballsForced = false;
            
            // Position balls for break shot
            for (let i = 0; i < gameData.balls.length; i++) {
                if (i < Game.gameWorld.balls.length - 1) { // Exclude white ball
                    Game.gameWorld.balls[i].position = gameData.balls[i].position.copy();
                    Game.gameWorld.balls[i].color = gameData.balls[i].color;
                }
            }
            
            // Position white ball for break shot
            Game.gameWorld.whiteBall.position = new Vector2(413, 413);
            Game.gameWorld.stick.position = Game.gameWorld.whiteBall.position.copy();
            
            // Store initial ball positions for scoring
            Game.currentMiniGame.initialBallPositions = Game.gameWorld.balls.map(ball => ball.position.copy());
            Game.currentMiniGame.shotTaken = false;
            Game.currentMiniGame.shotCompleted = false;
            
            // Add instructions overlay
            Game.showMiniGameInstructions("Daily Break Challenge", 
                "Make the best break shot possible! You have " + (3 - gameData.currentAttempt) + " attempts remaining.");
            
            // NOW enable the game loop - last step
            GAME_STOPPED = false;
            console.log("✅ Daily Break Game initialized - starting main loop");
            requestAnimationFrame(Game.mainLoop);
        } catch (e) {
            console.error("❌ ERROR initializing Daily Break:", e);
            console.error("Stack:", e.stack);
        }
    }, 100);
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
    
    console.log("🎱 Daily Break attempt complete - Balls potted:", ballsPotted, "Score:", score);
    
    // SHOW REWARD DISPLAY - Same as Aim Shoot style
    if (this.gameWorld && ballsPotted > 0) {
        // Calculate reward based on balls potted
        const baseReward = ballsPotted * 50;
        const bonusReward = Math.floor((ballsPotted * ballsPotted) * 10);
        const totalReward = baseReward + bonusReward;
        
        console.log(`💰 Daily Break Reward: ${ballsPotted} balls = ${totalReward} points`);
        
        // Show the reward overlay using the same style as Aim Shoot
        this.gameWorld.showDailyBreakResult(ballsPotted, totalReward);
        
        // Delay completion to let player see reward
        setTimeout(() => {
            this.completeDailyBreakAttemptContinue(score);
        }, 2500);
    } else {
        this.completeDailyBreakAttemptContinue(score);
    }
};

Game_Singleton.prototype.completeDailyBreakAttemptContinue = function(score) {
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

