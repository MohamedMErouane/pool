"use strict";

// NumberedBall extends Ball with numbered sprites
function NumberedBall(initPos, number) {
    Ball.call(this, initPos, Color.white); // Call parent constructor
    this.number = number;
    
    // Set the appropriate sprite based on ball number
    this.setSprite();
}

// Inherit from Ball
NumberedBall.prototype = Object.create(Ball.prototype);
NumberedBall.prototype.constructor = NumberedBall;

// Set the correct sprite based on ball number
NumberedBall.prototype.setSprite = function() {
    switch(this.number) {
        case 0: this.sprite = sprites.ball0 || sprites.ball; break;   // Cue ball
        case 1: this.sprite = sprites.ball1 || sprites.yellowBall; break;
        case 2: this.sprite = sprites.ball2 || sprites.yellowBall; break;
        case 3: this.sprite = sprites.ball3 || sprites.redBall; break;
        case 4: this.sprite = sprites.ball4 || sprites.redBall; break;
        case 5: this.sprite = sprites.ball5 || sprites.yellowBall; break;
        case 6: this.sprite = sprites.ball6 || sprites.yellowBall; break;
        case 7: this.sprite = sprites.ball7 || sprites.redBall; break;
        case 8: this.sprite = sprites.ball8 || sprites.blackBall; break;
        case 9: this.sprite = sprites.ball9 || sprites.yellowBall; break;
        case 10: this.sprite = sprites.ball10 || sprites.yellowBall; break;
        case 11: this.sprite = sprites.ball11 || sprites.redBall; break;
        case 12: this.sprite = sprites.ball12 || sprites.redBall; break;
        case 13: this.sprite = sprites.ball13 || sprites.yellowBall; break;
        case 14: this.sprite = sprites.ball14 || sprites.redBall; break;
        case 15: this.sprite = sprites.ball15 || sprites.yellowBall; break;
        default: this.sprite = sprites.ball; break;
    }
};

// Get color for the ball
NumberedBall.prototype.getColor = function() {
    if (this.number === 0) return Color.white;
    if (this.number === 8) return Color.black;
    if (this.number >= 1 && this.number <= 7) return Color.red;
    return Color.yellow;
};

// Override draw method to scale numbered balls to exact original ball size
NumberedBall.prototype.draw = function() {
    if (!this.visible) return;
    
    // Make sure we have a sprite
    if (!this.sprite) {
        this.setSprite();
    }
    
    // Make numbered balls smaller - reduced scale for smaller ball size
    var scale = 0.05; // Even smaller scale for more realistic ball size
    var origin = new Vector2(25, 25); // Keep same origin as original balls
    
    Canvas2D.drawImage(this.sprite, this.position, 0, scale, origin);
};

// Reset method
NumberedBall.prototype.reset = function(){
    this.position = this.initPos.copy();
    this.velocity = Vector2.zero;
    this.moving = false;
    this.visible = true;
    this.inHole = false;
};