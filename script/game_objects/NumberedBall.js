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
    if (this.number === 0) {
        // Cue ball (white)
        this.sprite = sprites.ball;
    } else if (this.number === 8) {
        // 8-ball (black)
        this.sprite = sprites.blackBall || sprites.ball;
    } else if (this.number >= 1 && this.number <= 7) {
        // Solid balls (red)
        this.sprite = sprites.redBall || sprites.ball;
    } else {
        // Stripe balls (yellow)
        this.sprite = sprites.yellowBall || sprites.ball;
    }
};

// Get color for the ball
NumberedBall.prototype.getColor = function() {
    if (this.number === 0) return Color.white;
    if (this.number === 8) return Color.black;
    if (this.number >= 1 && this.number <= 7) return Color.red;
    return Color.yellow;
};

// Override draw method to show numbers
NumberedBall.prototype.draw = function() {
    if (!this.visible) return;
    
    // Make sure we have a sprite
    if (!this.sprite) {
        this.setSprite();
    }
    
    // Draw the ball sprite (same as parent Ball class)
    if (this.sprite) {
        Canvas2D.drawImage(this.sprite, this.position, 0, 1, new Vector2(25, 25));
    }
    
    // Draw the number on top (except for cue ball)
    if (this.number !== 0) {
        let textColor = this.number === 8 ? Color.white : Color.black;
        Canvas2D.drawText(
            this.number.toString(),
            this.position,
            new Vector2(8, 8), // Offset to center text
            textColor,
            "center",
            "Arial",
            "16px"
        );
    }
};

// Reset method
NumberedBall.prototype.reset = function(){
    this.position = this.initPos.copy();
    this.velocity = Vector2.zero;
    this.moving = false;
    this.visible = true;
    this.inHole = false;
};