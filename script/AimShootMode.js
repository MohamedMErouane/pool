"use strict";

function AimShootMode() {
    // Call parent constructor
    GameWorld.call(this);

    this.whiteBallStartingPosition = new Vector2(413, 400);

    // Create only the white ball and black 8-ball for aim practice
    
    // White ball positioned for aim practice
    this.whiteBall = new NumberedBall(new Vector2(413, 400), 0); // Cue ball
    
    // Black 8-ball positioned for target practice (center-right of table)
    this.blackBall = new NumberedBall(new Vector2(1000, 413), 8); // 8 ball target

    // Only two balls in play for aim practice
    this.balls = [
        this.whiteBall, // Cue ball
        this.blackBall  // Target ball (8-ball)
    ];

    this.stick = new Stick(this.whiteBall.position);
    this.gamePolicy = new GamePolicy();
}

// Inherit from GameWorld
AimShootMode.prototype = Object.create(GameWorld.prototype);
AimShootMode.prototype.constructor = AimShootMode;

AimShootMode.prototype.getBall = function(color){
    if(color === Color.white){
        return this.whiteBall;
    }
    if(color === Color.black){
        return this.blackBall;
    }
}

AimShootMode.prototype.handleInput = function (delta) {
    this.stick.handleInput(delta);
    
    // AIM & SHOOT MODE: Mark that shot was taken based on turnPlayed or ball movement
    if (!this.aimShootShotTriggered) {
        if (Game.policy.turnPlayed) {
            this.aimShootShotTriggered = true;
            console.log("🎯🎯🎯 AIM & SHOOT: Shot detected via turnPlayed! Black ball will be forced into hole when balls stop.");
        } else if (this.whiteBall.moving) {
            this.aimShootShotTriggered = true;
            console.log("🎯🎯🎯 AIM & SHOOT: Shot detected via whiteBall.moving! Black ball will be forced into hole when balls stop.");
        }
    }
};

AimShootMode.prototype.update = function (delta) {
    // Handle input first
    this.handleInput(delta);
    
    this.stick.update(delta);

    // Handle collision between white ball and black ball
    for (var i = 0; i < this.balls.length; i++) {
        for (var j = i + 1; j < this.balls.length; j++) {
            GameWorld.prototype.handleCollision.call(this, this.balls[i], this.balls[j], delta);
        }
    }

    // Update both balls
    for (var i = 0; i < this.balls.length; i++) {
        this.balls[i].update(delta);
    }

    // Debug logging
    const ballsMoving = this.ballsMoving();
    if (this.aimShootShotTriggered && !this.aimShootCompleted) {
        console.log(`🔍 AIM SHOOT UPDATE: ballsMoving=${ballsMoving}, shotTriggered=${this.aimShootShotTriggered}, completed=${this.aimShootCompleted}`);
    }

    // AIM & SHOOT: When balls stop moving, force black ball into hole
    if (!ballsMoving && this.aimShootShotTriggered && !this.aimShootCompleted) {
        console.log("🎯🎯🎯 AIM & SHOOT: Balls stopped moving, forcing black ball into hole NOW!");
        this.forceBlackBallInHole();
        return;
    }

    this.stick.updatePosition();
};

AimShootMode.prototype.draw = function () {
    Canvas2D.drawImage(
        sprites.background, 
        { x : 0, y : 0 }, 
        0, 
        { x : 1, y : 1 }
    );

    // Draw both balls
    this.whiteBall.draw();
    this.blackBall.draw();

    // Draw the cue stick
    this.stick.draw();
};

AimShootMode.prototype.mainMenuKeyPressed = function(){
    GameStateManager.switchTo(ID.menu_state);
};

AimShootMode.prototype.reset = function(){
    
    // Reset white ball position
    this.whiteBall.reset();
    this.whiteBall.position = this.whiteBallStartingPosition.copy();
    this.whiteBall.inHole = false;

    // Reset black ball position
    this.blackBall.reset();
    this.blackBall.position = new Vector2(1000, 413);
    this.blackBall.inHole = false;

    // Reset stick position
    this.stick.position = this.whiteBall.position;
    this.stick.rotation = 0;
};

// Check if black ball is potted for scoring
AimShootMode.prototype.isBlackBallPotted = function() {
    return this.blackBall.inHole;
};

// Reset black ball to a new random position for continued practice
AimShootMode.prototype.respawnBlackBall = function() {
    // Random position on the right side of the table for target practice
    var randomX = 800 + Math.random() * 400; // Between 800-1200 on X axis
    var randomY = 300 + Math.random() * 200; // Between 300-500 on Y axis
    
    this.blackBall.position = new Vector2(randomX, randomY);
    this.blackBall.inHole = false;
    this.blackBall.velocity = Vector2.zero;
    this.blackBall.moving = false;
};