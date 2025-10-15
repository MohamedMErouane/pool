"use strict";

function AimShootMode() {

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
};

AimShootMode.prototype.update = function (delta) {
    this.stick.update(delta);

    // Handle collision between white ball and black ball
    this.handleCollision(this.whiteBall, this.blackBall, delta);

    // Update both balls
    this.whiteBall.update(delta);
    this.blackBall.update(delta);

    this.stick.update(delta);
    this.handleInput(delta);

    this.stick.updatePosition();
};

AimShootMode.prototype.handleCollision = function(ball1, ball2, delta){
    if(!ball1.moving || !ball2.moving)
        return;
    
    var squaredDistance = ball1.position.distanceFrom(ball2.position);
    if(squaredDistance < BALL_SIZE){
        
        ball1.moving = false;
        ball2.moving = false;

        var mtd = ball2.position.subtract(ball1.position).multiplyWith(
            (BALL_SIZE - squaredDistance) / squaredDistance);

        ball1.position = ball1.position.subtract(mtd.multiplyWith(1/2));
        ball2.position = ball2.position.add(mtd.multiplyWith(1/2));

        var velocity1 = ball1.velocity;
        var velocity2 = ball2.velocity;
        var newVelocity1 = velocity1.subtract(velocity2);
        var newVelocity2 = velocity2.subtract(velocity1);

        ball1.velocity = newVelocity1.multiplyWith(0.00001);
        ball2.velocity = newVelocity2.multiplyWith(0.00001);
    }
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