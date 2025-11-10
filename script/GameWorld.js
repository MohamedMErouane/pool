"use strict";

function GameWorld() {

    this.whiteBallStartingPosition = new Vector2(413,400);

    // Create balls in perfect triangle formation with MORE spacing
    // Increased spacing to 30+ pixels to create clear gaps between balls
    
    // Row 1 (front) - 1 ball
    var ball1 = new NumberedBall(new Vector2(1000, 413), 1);  // 1 ball at front
    
    // Row 2 - 2 balls
    var ball2 = new NumberedBall(new Vector2(1040, 398), 2);  // 2 ball top
    var ball3 = new NumberedBall(new Vector2(1040, 428), 3);  // 3 ball bottom
    
    // Row 3 - 3 balls  
    var ball4 = new NumberedBall(new Vector2(1080, 383), 4);  // 4 ball top
    var ball8 = new NumberedBall(new Vector2(1080, 413), 8);  // 8 ball center
    var ball5 = new NumberedBall(new Vector2(1080, 443), 5);  // 5 ball bottom
    
    // Row 4 - 4 balls
    var ball6 = new NumberedBall(new Vector2(1120, 368), 6);   // 6 ball top
    var ball7 = new NumberedBall(new Vector2(1120, 398), 7);   // 7 ball
    var ball9 = new NumberedBall(new Vector2(1120, 428), 9);   // 9 ball
    var ball10 = new NumberedBall(new Vector2(1120, 458), 10); // 10 ball bottom
    
    // Row 5 (back) - 5 balls
    var ball11 = new NumberedBall(new Vector2(1160, 353), 11); // 11 ball top
    var ball12 = new NumberedBall(new Vector2(1160, 383), 12); // 12 ball
    var ball13 = new NumberedBall(new Vector2(1160, 413), 13); // 13 ball center
    var ball14 = new NumberedBall(new Vector2(1160, 443), 14); // 14 ball
    var ball15 = new NumberedBall(new Vector2(1160, 473), 15); // 15 ball bottom

    // Group balls by type for game logic (solids vs stripes)
    this.redBalls = [ball3, ball4, ball7, ball11, ball12, ball14, ball15];
    this.yellowBalls = [ball1, ball2, ball5, ball6, ball9, ball10, ball13];

    // White ball positioned for break shot
    this.whiteBall = new NumberedBall(new Vector2(413, 400), 0); // Cue ball
    this.blackBall = ball8; // 8 ball

    // All balls in play order
    this.balls = [
        ball1,  // 1
        ball2,  // 2
        ball3,  // 3
        ball4,  // 4
        ball8,  // 8 (black ball)
        ball5,  // 5
        ball6,  // 6
        ball7,  // 7
        ball9,  // 9
        ball10, // 10
        ball11, // 11
        ball12, // 12
        ball13, // 13
        ball14, // 14
        ball15, // 15
        this.whiteBall // 0 (cue ball)
    ];

    this.stick = new Stick({ x : 413, y : 413 });

    this.gameOver = false;
    this.isBreakMode = false;
    this.miniGameActive = false;
    this.ballsPocketedInBreak = 0;
    this.isAimShootMode = false;
    this.aimShootCompleted = false;
    this.powerShotActive = false;
}

GameWorld.prototype.getBallsSetByColor = function(color){

    if(color === Color.red){
        return this.redBalls;
    }
    if(color === Color.yellow){
        return this.yellowBalls;
    }
    if(color === Color.white){
        return this.whiteBall;
    }
    if(color === Color.black){
        return this.blackBall;
    }
}

GameWorld.prototype.handleInput = function (delta) {
    this.stick.handleInput(delta);
};

GameWorld.prototype.update = function (delta) {
    this.stick.update(delta);

    for (var i = 0 ; i < this.balls.length; i++){
        for(var j = i + 1 ; j < this.balls.length ; j++){
            this.handleCollision(this.balls[i], this.balls[j], delta);
        }
    }

    for (var i = 0 ; i < this.balls.length; i++) {
        this.balls[i].update(delta);
    }

    if(!this.ballsMoving() && AI.finishedSession){
        // Check if in break mode and shot is complete
        if (this.isBreakMode && this.miniGameActive) {
            this.handleBreakComplete();
            return;
        }
        
        // Check if in aim shoot mode and shot is complete
        if (this.isAimShootMode && this.miniGameActive && !this.aimShootCompleted) {
            this.handleAimShootComplete();
            return;
        }
        
        // Check if in power shot mode and shot is complete
        if (this.powerShotActive && this.miniGameActive) {
            this.handlePowerShotComplete();
            return;
        }
        
        Game.policy.updateTurnOutcome();
        if(Game.policy.foul){
            this.ballInHand();
        }
    }

};

GameWorld.prototype.ballInHand = function(){
    if(AI_ON && Game.policy.turn === AI_PLAYER_NUM){
        return;
    }

    KEYBOARD_INPUT_ON = false;
    this.stick.visible = false;
    if(!Mouse.left.down){
        this.whiteBall.position = Mouse.position;
    }
    else{
        let ballsOverlap = this.whiteBallOverlapsBalls();

        if(!Game.policy.isOutsideBorder(Mouse.position,this.whiteBall.origin) &&
            !Game.policy.isInsideHole(Mouse.position) &&
            !ballsOverlap){
            KEYBOARD_INPUT_ON = true;
            Keyboard.reset();
            Mouse.reset();
            this.whiteBall.position = Mouse.position;
            this.whiteBall.inHole = false;
            Game.policy.foul = false;
            this.stick.position = this.whiteBall.position;
            this.stick.visible = true;
        }
    }

}

GameWorld.prototype.whiteBallOverlapsBalls = function(){

    let ballsOverlap = false;
    for (var i = 0 ; i < this.balls.length; i++) {
        if(this.whiteBall !== this.balls[i]){
            if(this.whiteBall.position.distanceFrom(this.balls[i].position)<BALL_SIZE){
                ballsOverlap = true;
            }
        }
    }

    return ballsOverlap;
}

GameWorld.prototype.ballsMoving = function(){

    var ballsMoving = false;

    for (var i = 0 ; i < this.balls.length; i++) {
        if(this.balls[i].moving){
            ballsMoving = true;
        }
    }

    return ballsMoving;
}

GameWorld.prototype.handleCollision = function(ball1, ball2, delta){

    if(ball1.inHole || ball2.inHole)
        return;

    if(!ball1.moving && !ball2.moving)
        return;

    var ball1NewPos = ball1.position.add(ball1.velocity.multiply(delta));
    var ball2NewPos = ball2.position.add(ball2.velocity.multiply(delta));

    var dist = ball1NewPos.distanceFrom(ball2NewPos);

    if(dist<BALL_SIZE){
        Game.policy.checkColisionValidity(ball1, ball2);

        var power = (Math.abs(ball1.velocity.x) + Math.abs(ball1.velocity.y)) + 
                    (Math.abs(ball2.velocity.x) + Math.abs(ball2.velocity.y));
        power = power * 0.00482;

        if(Game.sound && SOUND_ON){
            var ballsCollide = sounds.ballsCollide.cloneNode(true);
            ballsCollide.volume = (power/(20))<1?(power/(20)):1;
            ballsCollide.play();
        }

        var opposite = ball1.position.y - ball2.position.y;
        var adjacent = ball1.position.x - ball2.position.x;
        var rotation = Math.atan2(opposite, adjacent);

        ball1.moving = true;
        ball2.moving = true;

        var velocity2 = new Vector2(90*Math.cos(rotation + Math.PI)*power,90*Math.sin(rotation + Math.PI)*power);
        ball2.velocity = ball2.velocity.addTo(velocity2);

        ball2.velocity.multiplyWith(0.97);

        var velocity1 = new Vector2(90*Math.cos(rotation)*power,90*Math.sin(rotation)*power);
        ball1.velocity = ball1.velocity.addTo(velocity1);

        ball1.velocity.multiplyWith(0.97);
    }

}

GameWorld.prototype.draw = function () {
    Canvas2D.drawImage(sprites.background);
    Game.policy.drawScores();

    for (var i = 0; i < this.balls.length; i++) {
        this.balls[i].draw();
    }

    this.stick.draw();
};

GameWorld.prototype.reset = function () {
    this.gameOver = false;

    // Preserve break mode stats during reset if in break mode
    const preserveBreakStats = this.isBreakMode && this.miniGameActive;
    const ballsPocketedBackup = preserveBreakStats ? this.ballsPocketedInBreak : 0;

    for (var i = 0; i < this.balls.length; i++) {
        this.balls[i].reset();
    }

    this.stick.reset();

    // Restore break stats if needed
    if (preserveBreakStats) {
        this.ballsPocketedInBreak = ballsPocketedBackup;
    } else {
        this.ballsPocketedInBreak = 0;
    }

    if(AI_ON && AI_PLAYER_NUM === 0){
        AI.startSession();
    }
};

GameWorld.prototype.initiateState = function(balls){
    
    for (var i = 0; i < this.balls.length; i++) {
        this.balls[i].position.x = balls[i].position.x;
        this.balls[i].position.y = balls[i].position.y;
        this.balls[i].visible = balls[i].visible;
        this.balls[i].inHole = balls[i].inHole;
    }

    this.stick.position = this.whiteBall.position;
}

// Mining and Rewards Integration
GameWorld.prototype.trackShotTaken = function(shotPower, accuracy) {
    // Add heat for taking a shot
    GlobalHeatMeter.addHeatForAction('shot_taken');
    
    // Calculate accuracy bonus (closer to 1.0 = better accuracy)
    const normalizedAccuracy = Math.min(accuracy, 1.0);
    
    // Mine tokens based on shot performance
    const miningResult = DailyReward.getCueShootingMining(normalizedAccuracy, 0);
    
    // Update pending rewards
    if (miningResult.mined > 0) {
        SolanaWalletManager.addPendingReward(miningResult.mined, "Cue Shot Mining");
    }
    
    return miningResult;
};

GameWorld.prototype.trackBallPotted = function(ball) {
    console.log("🎱 Ball potted detected! Break mode:", this.isBreakMode, "Mini game active:", this.miniGameActive);
    
    // Check if in break mode
    if (this.isBreakMode && this.miniGameActive) {
        this.ballsPocketedInBreak++;
        console.log("⚡ Break mode ball count increased to:", this.ballsPocketedInBreak);
        return this.ballsPocketedInBreak;
    }
    
    // Add heat for potting a ball
    if (typeof GlobalHeatMeter !== 'undefined') {
        GlobalHeatMeter.addHeatForAction('ball_potted');
    }
    
    // Mine tokens for successful pot
    const pottingReward = 2; // Base reward for potting a ball
    
    // Add to pending rewards
    if (typeof SolanaWalletManager !== 'undefined') {
        SolanaWalletManager.addPendingReward(pottingReward, "Ball Potted");
    }
    
    // Show mining notification
    if (typeof rewardsDashboard !== 'undefined') {
        rewardsDashboard.showNotification("Ball potted! +" + pottingReward + " tokens mined", 'success');
    }
    
    return pottingReward;
};

GameWorld.prototype.trackGameWon = function(winner) {
    // Add heat for winning game
    GlobalHeatMeter.addHeatForAction('game_won');
    
    // Award win bonus
    const winBonus = 10;
    SolanaWalletManager.addPendingReward(winBonus, "Game Victory");
    
    // Show win notification
    rewardsDashboard.showNotification(`🏆 Game won! +${winBonus} tokens earned!`, 'success');
    
    return winBonus;
};

GameWorld.prototype.trackBreakShot = function(ballsSpread, ballsPotted) {
    // Add heat for break shot
    GlobalHeatMeter.addHeatForAction('break_shot');
    
    // Calculate break quality and reward
    const breakQuality = (ballsSpread / 100) + (ballsPotted * 0.2);
    const breakReward = Math.floor(breakQuality * 3);
    
    if (breakReward > 0) {
        SolanaWalletManager.addPendingReward(breakReward, "Break Shot");
        rewardsDashboard.showNotification(`🎯 Great break! +${breakReward} tokens`, 'success');
    }
    
    return breakReward;
};

GameWorld.prototype.handleBreakComplete = function() {
    console.log("🎯 Break complete! Balls pocketed in break:", this.ballsPocketedInBreak);
    
    // Apply guaranteed ball pocketing system for better gameplay
    const guaranteedBalls = this.applyGuaranteedBallPocketing();
    console.log("🎲 Guaranteed balls applied:", guaranteedBalls);
    
    this.miniGameActive = false;
    
    if (!Game.miniGames) {
        Game.miniGames = new MiniGames();
    }
    
    // Enhanced break analysis
    const ballsRemaining = this.analyzeBallsAfterBreak();
    const result = Game.miniGames.completeBreakShot(this.ballsPocketedInBreak);
    
    console.log("🎮 Mini game result:", result);
    
    // Add detailed ball analysis to result
    result.ballAnalysis = ballsRemaining;
    
    // Show result overlay
    this.showBreakResult(result);
    
    // Explicitly reset cue stick to starting position
    console.log("🎯 Resetting cue stick after break");
    this.stick.reset();
    this.stick.position = this.whiteBall.position.copy();
    this.stick.visible = true;
    this.stick.power = 0;
    this.stick.rotation = 0;
    
    // IMMEDIATE RESET: Reset the game immediately without delays
    this.reset(); // Reset balls and cue stick to starting positions
    this.ballsPocketedInBreak = 0; // Reset counter for next attempt
    
    // Return to main menu immediately (no delay)
    Game.initMenus(false);
    Game.mainMenu.active = true;
    GAME_STOPPED = true;
    
    console.log("🔄 Immediately returned to initial screen");
};

// Guaranteed Ball Pocketing System
GameWorld.prototype.applyGuaranteedBallPocketing = function() {
    if (!this.isBreakMode || !this.miniGameActive) return 0;
    
    // Calculate how many balls should be guaranteed based on attempt number
    const attempt = Game.miniGames ? Game.miniGames.dailyBreakAttempts : 1;
    let guaranteedBalls = this.calculateGuaranteedBalls(attempt);
    
    // If we already have enough balls pocketed naturally, don't add more
    if (this.ballsPocketedInBreak >= guaranteedBalls) {
        return 0;
    }
    
    const ballsToAdd = guaranteedBalls - this.ballsPocketedInBreak;
    console.log("🎯 Adding", ballsToAdd, "guaranteed balls to break result");
    
    // Find balls that are not in holes and make some of them "pocketed"
    const availableBalls = [];
    for (let i = 1; i < this.balls.length; i++) { // Skip cue ball (index 0)
        const ball = this.balls[i];
        if (ball.visible && !ball.inHole) {
            availableBalls.push(ball);
        }
    }
    
    // Randomly select balls to be "pocketed"
    const ballsToPocket = Math.min(ballsToAdd, availableBalls.length);
    for (let i = 0; i < ballsToPocket; i++) {
        const randomIndex = Math.floor(Math.random() * availableBalls.length);
        const ballToPocket = availableBalls.splice(randomIndex, 1)[0];
        
        // Make the ball appear to have been pocketed
        this.forceBallIntoPocket(ballToPocket);
    }
    
    return ballsToPocket;
};

GameWorld.prototype.calculateGuaranteedBalls = function(attemptNumber) {
    // Progressive system: more balls guaranteed on later attempts
    const guaranteedByAttempt = {
        1: Math.floor(Math.random() * 3) + 1, // 1-3 balls on first attempt
        2: Math.floor(Math.random() * 4) + 2, // 2-5 balls on second attempt  
        3: Math.floor(Math.random() * 5) + 3  // 3-7 balls on final attempt
    };
    
    return guaranteedByAttempt[attemptNumber] || 2; // Default to 2 balls
};

GameWorld.prototype.forceBallIntoPocket = function(ball) {
    // Get a random pocket position
    const pockets = [
        { x: 62, y: 62 },     // Top-left
        { x: 400, y: 50 },    // Top-center
        { x: 738, y: 62 },    // Top-right
        { x: 62, y: 438 },    // Bottom-left
        { x: 400, y: 450 },   // Bottom-center
        { x: 738, y: 438 }    // Bottom-right
    ];
    
    const randomPocket = pockets[Math.floor(Math.random() * pockets.length)];
    
    // Move ball to pocket and mark as pocketed
    ball.position.x = randomPocket.x;
    ball.position.y = randomPocket.y;
    ball.inHole = true;
    ball.visible = false;
    ball.velocity = Vector2.zero;
    
    // Increment the counter and trigger the tracking
    this.ballsPocketedInBreak++;
    
    // Play sound effect if available
    if (Game.sound && SOUND_ON && typeof sounds !== 'undefined' && sounds.hole) {
        try {
            const holeSound = sounds.hole.cloneNode(true);
            holeSound.volume = 0.3;
            holeSound.play();
        } catch (error) {
            console.log("Sound effect error:", error);
        }
    }
    
    console.log("⚡ Forced ball into pocket! Total now:", this.ballsPocketedInBreak);
};

GameWorld.prototype.analyzeBallsAfterBreak = function() {
    const analysis = {
        totalBalls: this.balls.length - 1, // Exclude cue ball
        ballsPocketed: this.ballsPocketedInBreak,
        ballsRemaining: 0,
        ballsNearPockets: 0,
        ballsInClusters: 0,
        spreadQuality: 0
    };
    
    let ballPositions = [];
    
    // Analyze each ball
    for (let i = 1; i < this.balls.length; i++) { // Skip cue ball (index 0)
        const ball = this.balls[i];
        if (ball.visible && !ball.inHole) {
            analysis.ballsRemaining++;
            ballPositions.push(ball.position);
            
            // Check if near pocket
            if (this.isBallNearPocket(ball.position)) {
                analysis.ballsNearPockets++;
            }
        }
    }
    
    // Calculate spread quality (how well balls are distributed)
    analysis.spreadQuality = this.calculateSpreadQuality(ballPositions);
    
    // Detect clusters (balls close together)
    analysis.ballsInClusters = this.detectBallClusters(ballPositions);
    
    return analysis;
};

GameWorld.prototype.isBallNearPocket = function(position) {
    // Pocket positions on standard 8-ball table
    const pockets = [
        { x: 62, y: 62 },     // Top-left
        { x: 400, y: 50 },    // Top-center  
        { x: 738, y: 62 },    // Top-right
        { x: 62, y: 438 },    // Bottom-left
        { x: 400, y: 450 },   // Bottom-center
        { x: 738, y: 438 }    // Bottom-right
    ];
    
    const nearDistance = 60; // Distance to be considered "near" a pocket
    
    for (let pocket of pockets) {
        const distance = Math.sqrt(
            Math.pow(position.x - pocket.x, 2) + 
            Math.pow(position.y - pocket.y, 2)
        );
        if (distance < nearDistance) {
            return true;
        }
    }
    return false;
};

GameWorld.prototype.calculateSpreadQuality = function(ballPositions) {
    if (ballPositions.length < 2) return 0;
    
    let totalDistance = 0;
    let comparisons = 0;
    
    // Calculate average distance between all balls
    for (let i = 0; i < ballPositions.length; i++) {
        for (let j = i + 1; j < ballPositions.length; j++) {
            const distance = Math.sqrt(
                Math.pow(ballPositions[i].x - ballPositions[j].x, 2) +
                Math.pow(ballPositions[i].y - ballPositions[j].y, 2)
            );
            totalDistance += distance;
            comparisons++;
        }
    }
    
    const averageDistance = totalDistance / comparisons;
    // Normalize to a 0-100 scale (higher = better spread)
    return Math.min(100, Math.floor(averageDistance / 5));
};

GameWorld.prototype.detectBallClusters = function(ballPositions) {
    let clusteredBalls = 0;
    const clusterDistance = 80; // Balls within this distance are considered clustered
    
    for (let i = 0; i < ballPositions.length; i++) {
        let nearbyBalls = 0;
        for (let j = 0; j < ballPositions.length; j++) {
            if (i !== j) {
                const distance = Math.sqrt(
                    Math.pow(ballPositions[i].x - ballPositions[j].x, 2) +
                    Math.pow(ballPositions[i].y - ballPositions[j].y, 2)
                );
                if (distance < clusterDistance) {
                    nearbyBalls++;
                }
            }
        }
        
        // If a ball has 2+ nearby balls, it's in a cluster
        if (nearbyBalls >= 2) {
            clusteredBalls++;
        }
    }
    
    return clusteredBalls;
};

GameWorld.prototype.showBreakResult = function(result) {
    // Enhanced result display with odds information
    let message = "";
    
    if (result.success) {
        message = "🎯 " + result.odds.description + "\n\n" +
                 "📊 BREAK STATISTICS:\n" +
                 "Balls Entered: " + result.ballsPocketed + "\n" +
                 "Points Earned: " + result.points + "\n" +
                 "Probability: " + (result.odds.probability * 100).toFixed(1) + "%\n" +
                 "Multiplier: x" + result.odds.multiplier;
        
        if (result.ballAnalysis) {
            message += "\n\n🎱 TABLE ANALYSIS:\n" +
                      "Balls remaining: " + result.ballAnalysis.ballsRemaining + "\n" +
                      "Balls near pockets: " + result.ballAnalysis.ballsNearPockets + "\n" +
                      "Spread quality: " + result.ballAnalysis.spreadQuality + "%";
        }
        
        // Add note about guaranteed balls if system was used
        if (result.ballsPocketed >= 1) {
            message += "\n\n🎲 Note: Ball assistance system ensures fair rewards!";
        }
    } else {
        message = "❌ BREAK RESULT\n\n" +
                 "Balls Entered: " + result.ballsPocketed + "\n";
        
        if (result.ballAnalysis) {
            message += "\n� WHY BALLS DIDN'T ENTER:\n";
            
            if (result.ballAnalysis.ballsInClusters > 0) {
                message += "• " + result.ballAnalysis.ballsInClusters + " balls stuck in clusters\n";
            }
            
            if (result.ballAnalysis.ballsNearPockets === 0) {
                message += "• No balls reached pocket areas\n";
                message += "• Break power may be too low\n";
            } else {
                message += "• " + result.ballAnalysis.ballsNearPockets + " balls near pockets but didn't drop\n";
                message += "• Consider different break angle\n";
            }
            
            if (result.ballAnalysis.spreadQuality < 30) {
                message += "• Poor ball spread (Quality: " + result.ballAnalysis.spreadQuality + "%)\n";
                message += "• Try hitting the lead ball more directly\n";
            }
        }
        
        if (result.ballsNotEnteredFeedback) {
            message += "\n💭 " + result.ballsNotEnteredFeedback;
        }
        
        if (result.nextAttemptHint) {
            message += "\n\n" + result.nextAttemptHint;
        }
        
        message += "\n\n" + result.message;
        
        // Encourage player for next attempt
        if (result.attempt < result.maxAttempts) {
            message += "\n\n🎯 Next attempt will have better ball assistance!";
        }
    }
    
    // Show enhanced result
    console.log("🎯 Break Result:", message);
    
    // Optional: Show quick non-blocking notification instead of blocking alert
    if (typeof rewardsDashboard !== 'undefined') {
        const shortMessage = result.success ? 
            `${result.odds.description} - ${result.ballsPocketed} balls, ${result.points} points!` :
            `${result.ballsPocketed} balls entered`;
        rewardsDashboard.showNotification(shortMessage, result.success ? 'success' : 'info');
    }
    
    // No blocking alert - return immediately
};

GameWorld.prototype.handleAimShootComplete = function() {
    this.miniGameActive = false;
    this.aimShootCompleted = true;
    
    // Apply guaranteed ball pocketing system (same as Daily Break)
    const ballsPottedBeforeAssist = this.countPottedBalls();
    console.log("Balls potted before assistance:", ballsPottedBeforeAssist);
    
    // Apply guaranteed ball system for Aim & Shoot
    this.applyGuaranteedBallPocketing();
    
    // Calculate final ball count after assistance
    const ballsPotted = this.countPottedBalls();
    console.log("Final balls potted after assistance:", ballsPotted);
    
    const baseReward = 5; // Base reward for taking a shot
    const pottingBonus = ballsPotted * 3; // 3 tokens per ball potted
    const totalReward = baseReward + pottingBonus;
    
    // Add to daily rewards
    if (typeof DailyReward !== 'undefined') {
        DailyReward.totalTokens += totalReward;
        localStorage.setItem('totalTokens', DailyReward.totalTokens.toString());
    }
    
    // Add to wallet rewards if connected
    if (typeof SolanaWalletManager !== 'undefined') {
        SolanaWalletManager.addPendingReward(totalReward, "Aim & Shoot");
    }
    
    // IMMEDIATE RESET: No result screen - just log and reset instantly
    console.log("=== AIM & SHOOT RESULT ===");
    console.log("Balls Potted:", ballsPotted);
    console.log("Reward:", totalReward, "tokens");
    console.log("Resetting immediately to initial screen...");
    
    this.reset(); // Reset balls and cue stick to starting positions
    
    // Return to main menu immediately
    if (typeof showMobileInterface === 'function') {
        showMobileInterface();
    }
};

GameWorld.prototype.showAimShootResult = function(ballsPotted, reward) {
    let message = "Aim & Shoot Complete!\n\n";
    message += "Balls Potted: " + ballsPotted + "\n";
    message += "Reward: " + reward + " tokens\n";
    
    if (ballsPotted > 0) {
        message += "\nGreat shooting! 🎯";
    } else {
        message += "\nKeep practicing! 💪";
    }
    
    // Log result instead of blocking alert for immediate screen reset
    console.log("=== AIM & SHOOT RESULT ===");
    console.log("Balls Potted:", ballsPotted);
    console.log("Reward:", reward, "tokens");
    console.log("Message:", ballsPotted > 0 ? "Great shooting! 🎯" : "Keep practicing! 💪");
    
    // No blocking alert - return immediately
};

GameWorld.prototype.handlePowerShotComplete = function() {
    this.miniGameActive = false;
    this.powerShotActive = false;
    
    // Apply guaranteed ball pocketing system (same as Daily Break and Aim & Shoot)
    const ballsPottedBeforeAssist = this.countPottedBalls();
    console.log("Power Shot - balls potted before assistance:", ballsPottedBeforeAssist);
    
    // Apply guaranteed ball system for Power Shot
    this.applyGuaranteedBallPocketing();
    
    // Calculate final ball count after assistance
    const ballsPotted = this.countPottedBalls();
    console.log("Power Shot - final balls potted after assistance:", ballsPotted);
    
    let baseReward = ballsPotted * 5; // 5 tokens per ball potted
    
    // 40% chance to double the reward
    const doubleChance = Math.random() < 0.4;
    if (doubleChance) {
        baseReward *= 2;
    }
    
    // Add to daily rewards
    if (typeof DailyReward !== 'undefined') {
        DailyReward.totalTokens += baseReward;
        localStorage.setItem('totalTokens', DailyReward.totalTokens.toString());
    }
    
    // Add to wallet rewards if connected
    if (typeof SolanaWalletManager !== 'undefined') {
        SolanaWalletManager.addPendingReward(baseReward, "Power Shot");
    }
    
    // Show result with guaranteed balls
    this.showPowerShotResult(ballsPotted, baseReward, doubleChance);
    
    // IMMEDIATE RESET: No delays - reset immediately as client requested
    console.log("Power Shot completed - resetting immediately");
    this.reset(); // Reset balls and cue stick to starting positions
    
    // Return to main menu immediately
    if (typeof showMobileInterface === 'function') {
        showMobileInterface();
    }
};

GameWorld.prototype.showPowerShotResult = function(ballsPotted, reward, wasDoubled) {
    let message = "Power Shot Complete!\n\n";
    message += "Balls Potted: " + ballsPotted + "\n";
    message += "Base Reward: " + (wasDoubled ? reward/2 : reward) + " tokens\n";
    
    if (wasDoubled) {
        message += "🎉 DOUBLE BONUS ACTIVATED! 🎉\n";
        message += "Final Reward: " + reward + " tokens\n";
    } else {
        message += "No double this time (40% chance)\n";
    }
    
    if (ballsPotted > 0) {
        message += "\nExcellent power shot! ⚡";
    } else {
        message += "\nTry again for better results! 💪";
    }
    
    // Log result instead of blocking alert for immediate screen reset
    console.log("=== POWER SHOT RESULT ===");
    console.log("Balls Potted:", ballsPotted);
    console.log("Reward:", reward, "tokens");
    console.log("Double Bonus:", wasDoubled);
    console.log("Message:", ballsPotted > 0 ? "Excellent power shot! ⚡" : "Try again for better results! 💪");
    
    // No blocking alert - return immediately
};

GameWorld.prototype.countPottedBalls = function() {
    let count = 0;
    for (let i = 0; i < this.balls.length; i++) {
        if (this.balls[i].inHole && this.balls[i] !== this.whiteBall) {
            count++;
        }
    }
    return count;
};

GameWorld.prototype.trackPowerShot = function(power, success) {
    if (power >= 0.6 && success) {
        // Add heat for successful power shot
        GlobalHeatMeter.addHeatForAction('power_shot');
        
        const powerReward = Math.floor(power * 5);
        SolanaWalletManager.addPendingReward(powerReward, "Power Shot");
        rewardsDashboard.showNotification(`⚡ Power shot! +${powerReward} tokens`, 'success');
        
        return powerReward;
    }
    
    return 0;
};

