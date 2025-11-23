"use strict";

function Ball(initPos,color){
	this.initPos = initPos;
    this.position = initPos.copy();
    this.origin = new Vector2(25,25);
    this.velocity = Vector2.zero;
    this.color = color; 
    this.moving = false;
    this.visible = true;
    this.inHole = false;
}

Object.defineProperty(Ball.prototype, "color",
    {
    	get: function(){
    		if(this.sprite == sprites.redBall){
    			return Color.red;
    		}
    		else if(this.sprite == sprites.yellowBall){
    			return Color.yellow;
    		}
			else if(this.sprite == sprites.blackBall){
    			return Color.black;
    		}
    		else{
    			return Color.white;
    		}
    	},
        set: function (value) {
            if (value === Color.red){
                this.sprite = sprites.redBall;
            }
            else if(value == Color.yellow){
            	this.sprite = sprites.yellowBall;
            }
			else if(value == Color.black){
            	this.sprite = sprites.blackBall;
            }
            else{
            	this.sprite = sprites.ball;
            }
        }
    });

Ball.prototype.shoot = function(power, angle){
    if(power <= 0)
        return;

    this.moving = true;

    this.velocity = calculateBallVelocity(power,angle);
}

var calculateBallVelocity = function(power, angle){

    return new Vector2(100*Math.cos(angle)*power,100*Math.sin(angle)*power);
}

Ball.prototype.update = function(delta){

    this.updatePosition(delta);

    // Only apply friction if ball is NOT being forced into a hole
    if (!this.isBeingForced) {
        this.velocity.multiplyWith(0.98);
    }

	if(this.moving && Math.abs(this.velocity.x) < 1 && Math.abs(this.velocity.y) < 1){
        // Don't stop if ball is being forced
        if (!this.isBeingForced) {
            this.stop();
        }
    }
    
    // CLIENT REQUIREMENT ENFORCEMENT: Check if ball should be forced into hole
    if (!this.inHole && this.shouldBeForced()) {
        this.forceIntoHole();
    }
}

// CLIENT REQUIREMENT: Method to force ball into hole (guaranteed scoring)
Ball.prototype.forceIntoHole = function() {
    console.log("🎯 FORCING ball into hole - CLIENT REQUIREMENT");
    
    this.inHole = true;
    this.visible = false;
    this.moving = false;
    this.velocity = Vector2.zero;
    this.position = new Vector2(-1000, -1000); // Move completely off screen
    
    // Play hole sound effect
    if(Game.sound && SOUND_ON && sounds && sounds.hole){
        try {
            var holeSound = sounds.hole.cloneNode(true);
            holeSound.volume = 0.6;
            holeSound.play();
        } catch(error) {
            console.log("Sound system error:", error);
        }
    }
    
    // Trigger hole detection
    Game.policy.handleBallInHole(this);
    console.log("✅ Ball FORCED into hole successfully - CLIENT REQUIREMENT MET");
};

// Helper method to check if ball should be forced (based on game mode)
Ball.prototype.shouldBeForced = function() {
    if (!Game.gameWorld) return false;
    
    // Don't force white ball (cue ball)
    if (this === Game.gameWorld.whiteBall) return false;
    
    // Check break mode forcing conditions
    if (Game.gameWorld.isBreakMode && Game.gameWorld.miniGameActive && Game.gameWorld.ballsForced) {
        return false; // Already handled by GameWorld forcing
    }
    
    // Check aim shoot mode forcing conditions  
    if (Game.gameWorld.isAimShootMode && Game.gameWorld.miniGameActive && Game.gameWorld.aimShootTargetForced) {
        return false; // Already handled by GameWorld forcing
    }
    
    return false; // Default: don't force (let GameWorld handle it)
};

Ball.prototype.updatePosition = function(delta){

    if(!this.moving || this.inHole)
        return;
    var ball = this;
    var newPos = this.position.add(this.velocity.multiply(delta));


	if(Game.policy.isInsideHole(newPos)){
        // Enhanced sound system with fallback and better audio handling
        if(Game.sound && SOUND_ON && sounds && sounds.hole){
            try {
                var holeSound = sounds.hole.cloneNode(true);
                holeSound.volume = 0.7; // Increased volume for better audibility
                holeSound.play().catch(function(error) {
                    console.log("Audio play failed (user interaction required):", error);
                });
                console.log("🔊 Ball-in-hole sound played successfully!");
            } catch(error) {
                console.log("Sound system error:", error);
            }
        } else {
            console.log("🔇 Sound disabled or not available - Game.sound:", Game.sound, "SOUND_ON:", SOUND_ON, "sounds.hole:", !!sounds.hole);
        }
        
		this.position = newPos;
        this.inHole = true;
        
        // Track ball potted for mining rewards
        if (typeof Game.gameWorld !== 'undefined' && typeof Game.gameWorld.trackBallPotted === 'function') {
            Game.gameWorld.trackBallPotted(this);
        }
        
        setTimeout(function(){ball.visible=false;ball.velocity = Vector2.zero;}, 100);
        Game.policy.handleBallInHole(this);
		return;
	}

    var collision = this.handleCollision(newPos);

    if(collision){
		this.velocity.multiplyWith(0.95);
    }else{
    	this.position = newPos;
    }
}

Ball.prototype.handleCollision = function(newPos){

	var collision = false;

	if(Game.policy.isXOutsideLeftBorder(newPos, this.origin)){
        this.velocity.x = -this.velocity.x;
        this.position.x = Game.policy.leftBorderX + this.origin.x;
        collision = true;
    }
    else if(Game.policy.isXOutsideRightBorder(newPos, this.origin)){
        this.velocity.x = -this.velocity.x;
        this.position.x = Game.policy.rightBorderX - this.origin.x;
        collision = true;
    }

    if(Game.policy.isYOutsideTopBorder(newPos, this.origin)){
        this.velocity.y = -this.velocity.y;
        this.position.y = Game.policy.topBorderY + this.origin.y;
        collision = true;
    }
    else if(Game.policy.isYOutsideBottomBorder(newPos, this.origin)){
        this.velocity.y = -this.velocity.y;
        this.position.y = Game.policy.bottomBorderY - this.origin.y;
        collision = true;
    }

    return collision;
}

Ball.prototype.stop = function(){

    this.moving = false;
    this.velocity = Vector2.zero;
}

Ball.prototype.reset = function(){
	this.inHole = false;
	this.moving = false;
	this.velocity = Vector2.zero;
	this.position = this.initPos;
	this.visible = true;
}

Ball.prototype.out = function(){

	this.position = new Vector2(0, 900);
	this.visible = false;
	this.inHole = true;

}

Ball.prototype.draw = function () {
    if (!this.visible) {
        return;
    }
    Canvas2D.drawImage(this.sprite, this.position, 0, this.origin);
};