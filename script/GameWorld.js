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
    this.breakCompleted = false; // Flag to prevent multiple break completions
    this.instantBallsForced = false; // Flag for instant ball forcing
    this.ballsForced = false; // Simple flag for guaranteed ball forcing
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

// SIMPLE BALL FORCING - ALWAYS WORKS, NO CONDITIONS
GameWorld.prototype.forceGuaranteedBallsSimple = function() {
    if (this.ballsForced) return; // Already done
    
    console.log("🔥 FORCING BALLS SIMPLE - NO COMPLEX CONDITIONS");
    this.ballsForced = true;
    
    // Reset everything first
    this.ballsPocketedInBreak = 0;
    
    // Force 4-6 balls ALWAYS (client wants guaranteed scoring)
    const ballsToForce = 4 + Math.floor(Math.random() * 3); // 4-6 balls
    console.log("🎯 FORCING", ballsToForce, "BALLS - GUARANTEED!");
    
    let ballsForced = 0;
    
    // Go through balls and force them into holes
    for (let i = 1; i < this.balls.length && ballsForced < ballsToForce; i++) {
        const ball = this.balls[i];
        if (ball && ball !== this.whiteBall) {
            // FORCE the ball into a hole - SIMPLE!
            ball.inHole = true;
            ball.visible = false;
            ball.velocity = { x: 0, y: 0 };
            
            this.ballsPocketedInBreak++;
            ballsForced++;
            
            console.log("✅ FORCED ball", ballsForced, "into hole!");
            
            // Play sound effect
            if (Game.sound && SOUND_ON && typeof sounds !== 'undefined' && sounds.hole) {
                try {
                    const holeSound = sounds.hole.cloneNode(true);
                    holeSound.volume = 0.3;
                    holeSound.play();
                } catch (error) {
                    console.log("Sound effect error:", error);
                }
            }
        }
    }
    
    console.log("🎉 SIMPLE FORCING COMPLETE:", ballsForced, "balls forced into holes!");
};

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
    
    // SIMPLE BALL FORCING: Check every frame if we need to force balls
    if (this.isBreakMode && !this.ballsForced && !this.ballsMoving()) {
        this.forceGuaranteedBallsSimple();
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
    // Prevent multiple calls in same break session
    if (this.breakCompleted) {
        console.log("⚠️ Break already completed, skipping...");
        return;
    }
    
    console.log("🎯 Break complete! Balls pocketed in break:", this.ballsPocketedInBreak);
    
    // FORCE guaranteed ball pocketing system (even if called multiple times)
    const guaranteedBalls = this.applyGuaranteedBallPocketing();
    console.log("🎲 Guaranteed balls applied:", guaranteedBalls);
    
    // Mark break as completed
    this.breakCompleted = true;
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

// INSTANT BALL FORCING - No delays, no complex conditions
GameWorld.prototype.forceBallsInstantly = function() {
    console.log("🚀 INSTANT BALL FORCING TRIGGERED!");
    
    // Simple check - only force if in break mode
    if (!this.isBreakMode) {
        console.log("❌ Not in break mode, skipping");
        return;
    }
    
    // Prevent multiple calls in same session
    if (this.instantBallsForced) {
        console.log("✅ Balls already forced in this session");
        return;
    }
    
    // Mark as forced to prevent duplicates
    this.instantBallsForced = true;
    
    // Get guaranteed ball count (minimum 3)
    const guaranteedBalls = 3 + Math.floor(Math.random() * 3); // 3-6 balls
    console.log("🎯 FORCING", guaranteedBalls, "BALLS INSTANTLY!");
    
    // Reset any existing balls first
    this.ballsPocketedInBreak = 0;
    
    // Find available balls to force into pockets
    const availableBalls = [];
    for (let i = 1; i < this.balls.length; i++) { // Skip cue ball
        const ball = this.balls[i];
        if (ball && ball !== this.whiteBall && ball.visible) {
            ball.inHole = false; // Reset state
            ball.visible = true;
            availableBalls.push(ball);
        }
    }
    
    // Force the guaranteed number of balls
    for (let i = 0; i < Math.min(guaranteedBalls, availableBalls.length); i++) {
        const ball = availableBalls[i];
        ball.inHole = true;
        ball.visible = false;
        this.ballsPocketedInBreak++;
        console.log("⚡ FORCED ball", i+1, "into pocket!");
    }
    
    console.log("✅ INSTANT FORCING COMPLETE:", this.ballsPocketedInBreak, "balls forced!");
    
    // Complete the break after forcing balls
    setTimeout(() => {
        if (this.isBreakMode) {
            this.handleBreakComplete();
        }
    }, 1000);
};

// Guaranteed Ball Pocketing System
GameWorld.prototype.applyGuaranteedBallPocketing = function() {
    // More lenient check - force balls even if not in perfect break mode
    if (!this.isBreakMode) {
        console.log("⚠️ Not in break mode, skipping guaranteed balls");
        return 0;
    }
    
    // FORCED SCORING SYSTEM: ALWAYS force 3-6 balls regardless of player performance
    const guaranteedBalls = this.getGuaranteedBallCount();
    console.log("🎯 FORCING", guaranteedBalls, "balls to be scored (regardless of player performance)");
    
    // Count current naturally pocketed balls
    const currentPocketed = this.ballsPocketedInBreak;
    console.log("Player naturally scored:", currentPocketed, "balls");
    
    // ALWAYS OVERRIDE: Force the guaranteed number of balls regardless of natural performance
    // First, reset any naturally pocketed balls back to the table
    this.resetAllBallsToTable();
    
    // Then force the exact guaranteed number of balls to be pocketed
    const ballsToForce = guaranteedBalls;
    console.log("🎯 FORCING", ballsToForce, "balls to be pocketed automatically");
    
    // Find all available balls (not cue ball) and force the guaranteed amount
    const availableBalls = [];
    for (let i = 1; i < this.balls.length; i++) { // Skip cue ball (index 0)
        const ball = this.balls[i];
        if (ball.visible && !ball.inHole && ball !== this.whiteBall) {
            availableBalls.push(ball);
        }
    }
    
    // Force the guaranteed number of balls to be pocketed
    const ballsToPocket = Math.min(ballsToForce, availableBalls.length);
    for (let i = 0; i < ballsToPocket; i++) {
        const randomIndex = Math.floor(Math.random() * availableBalls.length);
        const ballToPocket = availableBalls.splice(randomIndex, 1)[0];
        
        // Force the ball into a pocket
        this.forceBallIntoPocket(ballToPocket);
        console.log("✅ Forced ball", ballToPocket.color || ballToPocket.number, "into pocket");
    }
    
    // Update the break counter to match forced balls
    this.ballsPocketedInBreak = ballsToPocket;
    
    return ballsToPocket;
};

GameWorld.prototype.getGuaranteedBallCount = function() {
    // MINIMUM 3 BALLS GUARANTEED: Each shot guarantees AT LEAST 3 balls
    // 40% chance for 3 balls (minimum)
    // 30% chance for 4 balls (good)  
    // 20% chance for 5 balls (excellent)
    // 10% chance for 6+ balls (amazing)
    
    const random = Math.random();
    
    if (random < 0.40) {
        return 3; // 40% chance - 3 balls (MINIMUM guaranteed)
    } else if (random < 0.70) {
        return 4; // 30% chance - 4 balls (good reward)
    } else if (random < 0.90) {
        return 5; // 20% chance - 5 balls (excellent reward)
    } else {
        return 6; // 10% chance - 6 balls (amazing reward)
    }
};

GameWorld.prototype.calculateGuaranteedBalls = function(attemptNumber) {
    // Legacy function - replaced by getGuaranteedBallCount()
    return this.getGuaranteedBallCount();
};

GameWorld.prototype.resetAllBallsToTable = function() {
    // Reset all balls (except cue ball) back to visible and not in holes
    console.log("🔄 Resetting all balls back to table before forcing guaranteed balls");
    
    for (let i = 1; i < this.balls.length; i++) { // Skip cue ball (index 0)
        const ball = this.balls[i];
        if (ball !== this.whiteBall) {
            ball.inHole = false;
            ball.visible = true;
            // Reset velocity to stop any movement
            if (ball.velocity) {
                ball.velocity.x = 0;
                ball.velocity.y = 0;
            }
        }
    }
    
    // Reset break counter
    this.ballsPocketedInBreak = 0;
    console.log("✅ All balls reset to table, ready for forced scoring");
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
    
    // ALWAYS FORCE THE BALL IN AIM & SHOOT (as client requested)
    console.log("🎯 AIM & SHOOT: FORCING ball to ALWAYS score!");
    
    // Force the black ball (target) into hole - GUARANTEED
    if (this.blackBall) {
        this.blackBall.inHole = true;
        this.blackBall.visible = false;
        console.log("✅ BLACK BALL FORCED INTO HOLE - GUARANTEED SCORE!");
    }
    
    // Calculate final ball count (always 1 for aim & shoot)
    const ballsPotted = 1; // Always guaranteed 1 ball
    console.log("Final balls scored:", ballsPotted);
    
    const baseReward = 15; // Higher base reward since it's always guaranteed
    const totalReward = baseReward + (ballsPotted * 10); // Total: 25 tokens guaranteed
    
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
    console.log("Resetting to INITIAL table state...");
    
    // COMPLETE RESET TO INITIAL STATE
    this.isAimShootMode = false;
    this.miniGameActive = false;
    this.aimShootCompleted = false;
    this.isBreakMode = false;
    this.gameOver = false;
    this.ballsPocketedInBreak = 0;
    
    // Reset all balls to initial positions and make them visible
    for (var i = 0; i < this.balls.length; i++) {
        this.balls[i].reset();
        this.balls[i].visible = true;
        this.balls[i].inHole = false;
    }
    
    // Reset cue stick to initial position
    this.stick.reset();
    this.stick.position = { x: 413, y: 413 };
    
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

