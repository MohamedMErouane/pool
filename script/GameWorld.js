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

    for (var i = 0; i < this.balls.length; i++) {
        this.balls[i].reset();
    }

    this.stick.reset();

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
    // Check if in break mode
    if (this.isBreakMode && this.miniGameActive) {
        this.ballsPocketedInBreak++;
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
    this.miniGameActive = false;
    
    if (!Game.miniGames) {
        Game.miniGames = new MiniGames();
    }
    
    const result = Game.miniGames.completeBreakShot(this.ballsPocketedInBreak);
    
    // Show result overlay
    this.showBreakResult(result);
    
    // AUTO-RESET: Reset the game after completion
    setTimeout(() => {
        this.reset(); // Reset balls and cue stick to starting positions
    }, 1500);
    
    // Return to main menu after delay
    setTimeout(() => {
        Game.initMenus(false);
        Game.mainMenu.active = true;
        GAME_STOPPED = true;
    }, 3000);
};

GameWorld.prototype.showBreakResult = function(result) {
    // Simple alert for now - can be enhanced with proper UI later
    if (result.success) {
        alert("Daily Break Complete!\nBalls Pocketed: " + result.ballsPocketed + "\nPoints: " + result.points);
    } else {
        alert("Daily Break Result:\nBalls Pocketed: " + result.ballsPocketed + "\n" + result.message);
    }
};

GameWorld.prototype.handleAimShootComplete = function() {
    this.miniGameActive = false;
    this.aimShootCompleted = true;
    
    // Calculate reward based on accuracy and balls potted
    const ballsPotted = this.countPottedBalls();
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
    
    // Show result
    this.showAimShootResult(ballsPotted, totalReward);
    
    // AUTO-RESET: Reset the game after completion
    setTimeout(() => {
        this.reset(); // Reset balls and cue stick to starting positions
    }, 1500);
    
    // Return to main menu after delay
    setTimeout(() => {
        if (typeof showMobileInterface === 'function') {
            showMobileInterface();
        }
    }, 3000);
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
    
    alert(message);
};

GameWorld.prototype.handlePowerShotComplete = function() {
    this.miniGameActive = false;
    this.powerShotActive = false;
    
    // Calculate reward based on balls potted
    const ballsPotted = this.countPottedBalls();
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
    
    // Show result
    this.showPowerShotResult(ballsPotted, baseReward, doubleChance);
    
    // AUTO-RESET: Reset the game after completion
    setTimeout(() => {
        this.reset(); // Reset balls and cue stick to starting positions
    }, 1500);
    
    // Return to main menu after delay
    setTimeout(() => {
        if (typeof showMobileInterface === 'function') {
            showMobileInterface();
        }
    }, 3000);
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
    
    alert(message);
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

