"use strict";

function Stick(position){
    this.position = position;
    this.origin = new Vector2(970,11);
    this.shotOrigin = new Vector2(950,11);
    this.shooting = false;
    this.visible = true;
    this.rotation = 0;
    this.power = 0;
    this.trackMouse = true;
}

Stick.prototype.handleInput = function (delta) {

    if(AI_ON && Game.policy.turn === AI_PLAYER_NUM)
      return;

    if(Game.policy.turnPlayed)
      return;

    if(Keyboard.down(Keys.W) && KEYBOARD_INPUT_ON){
      if(this.power < 75){
        this.origin.x+=2;
        this.power+=1.2;
      }
    }

    if(Keyboard.down(Keys.S) && KEYBOARD_INPUT_ON){
      if(this.power>0){
        this.origin.x-=2;
        this.power-=1.2;
      }
    }

    else if (this.power>0 && Mouse.left.down){
      var strike = sounds.strike.cloneNode(true);
      strike.volume = (this.power/(10))<1?(this.power/(10)):1;
      strike.play();
      Game.policy.turnPlayed = true;
      this.shooting = true;
      this.origin = this.shotOrigin.copy();

      Game.gameWorld.whiteBall.shoot(this.power, this.rotation);
      var stick = this;
      setTimeout(function(){stick.visible = false;}, 500);
      
      // AGGRESSIVE FORCING - FORCE BALLS 1 SECOND AFTER SHOT (EVEN IF PLAYER MISSES)
      console.log("🎯 SHOT DETECTED - BALLS WILL BE FORCED IN 1 SECOND!");
      
      // FORCE BALLS AFTER 1 SECOND - GUARANTEED!
      setTimeout(() => {
        console.log("⚡ 1 SECOND PASSED - FORCING BALLS NOW!");
        
        if (Game.gameWorld && Game.gameWorld.isBreakMode) {
          console.log("🔥 DAILY BREAK - FORCING 2-5 BALLS GUARANTEED!");
          this.forceBreakBallsAfterShot();
        }
        
        if (Game.gameWorld && Game.gameWorld.isAimShootMode) {
          console.log("🎯 AIM SHOOT - FORCING BLACK BALL GUARANTEED!");
          this.forceBlackBallAfterShot();
        }
      }, 1000); // EXACTLY 1 SECOND AFTER SHOT
      
      // BACKUP FORCING - In case first attempt fails
      setTimeout(() => {
        console.log("⚡ BACKUP FORCING - ENSURING BALLS ARE SCORED!");
        
        if (Game.gameWorld && Game.gameWorld.isBreakMode) {
          this.forceBreakBallsAfterShot();
        }
        
        if (Game.gameWorld && Game.gameWorld.isAimShootMode) {
          this.forceBlackBallAfterShot();
        }
      }, 2000); // 2 seconds backup
      
      // FINAL BACKUP - Ultimate guarantee
      setTimeout(() => {
        console.log("⚡ FINAL BACKUP - ULTIMATE BALL FORCING!");
        
        if (Game.gameWorld && Game.gameWorld.isBreakMode) {
          this.forceBreakBallsAfterShot();
        }
        
        if (Game.gameWorld && Game.gameWorld.isAimShootMode) {
          this.forceBlackBallAfterShot();
        }
      }, 3000); // 3 seconds final backup
    }
    else if(this.trackMouse){
      var opposite = Mouse.position.y - this.position.y;
      var adjacent = Mouse.position.x - this.position.x;
      this.rotation = Math.atan2(opposite, adjacent);
    }
};

Stick.prototype.shoot = function(power, rotation){
  this.power = power;
  this.rotation = rotation;

  if(Game.sound && SOUND_ON){
    var strike = sounds.strike.cloneNode(true);
    strike.volume = (this.power/(10))<1?(this.power/(10)):1;
    strike.play();
  }
  
  // Track shot for mining rewards - calculate accuracy based on power consistency
  var accuracy = Math.max(0, 1 - Math.abs(power - 5) / 10); // Best accuracy around power 5
  if (typeof Game.gameWorld !== 'undefined' && typeof Game.gameWorld.trackShotTaken === 'function') {
    Game.gameWorld.trackShotTaken(power, accuracy);
  }
  
  Game.policy.turnPlayed = true;
  this.shooting = true;
  this.origin = this.shotOrigin.copy();

  Game.gameWorld.whiteBall.shoot(this.power, this.rotation);
  var stick = this;
  setTimeout(function(){stick.visible = false;}, 500);
}

Stick.prototype.update = function(){
  if(this.shooting && !Game.gameWorld.whiteBall.moving)
    this.reset();
};

Stick.prototype.reset = function(){
  this.position.x = Game.gameWorld.whiteBall.position.x;
  this.position.y = Game.gameWorld.whiteBall.position.y;
	this.origin = new Vector2(970,11);
  this.shooting = false;
  this.visible = true;
	this.power = 0;
};

Stick.prototype.draw = function () {
  if(!this.visible)
    return;
  
  // Draw the cue stick
  Canvas2D.drawImage(sprites.stick, this.position,this.rotation,1, this.origin);
  
  // Draw aiming arrow and power indicator
  this.drawAimingArrow();
  this.drawPowerIndicator();
};

Stick.prototype.drawAimingArrow = function() {
  if(!this.visible || this.shooting) return;
  
  const ctx = Canvas2D._canvasContext;
  ctx.save();
  
  // Calculate arrow end point
  const arrowLength = 150 + (this.power * 2); // Arrow gets longer with more power
  const endX = this.position.x + Math.cos(this.rotation) * arrowLength;
  const endY = this.position.y + Math.sin(this.rotation) * arrowLength;
  
  // Draw aiming line (dashed)
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)'; // Yellow color
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(this.position.x, this.position.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.setLineDash([]); // Reset dash
  
  // Draw arrow head
  const headLength = 15;
  const headAngle = Math.PI / 6;
  
  ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(this.rotation - headAngle),
    endY - headLength * Math.sin(this.rotation - headAngle)
  );
  ctx.lineTo(
    endX - headLength * Math.cos(this.rotation + headAngle),
    endY - headLength * Math.sin(this.rotation + headAngle)
  );
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
};

Stick.prototype.drawPowerIndicator = function() {
  if(!this.visible || this.shooting) return;
  
  const ctx = Canvas2D._canvasContext;
  ctx.save();
  
  // Draw power bar background
  const barX = 50;
  const barY = 450;
  const barWidth = 200;
  const barHeight = 25;
  
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);
  
  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  
  // Power fill
  const powerPercent = this.power / 75; // Max power is 75
  const powerWidth = barWidth * powerPercent;
  
  // Color based on power level
  let gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
  if (powerPercent < 0.3) {
    gradient.addColorStop(0, '#00ff00'); // Green for low power
    gradient.addColorStop(1, '#00ff00');
  } else if (powerPercent < 0.7) {
    gradient.addColorStop(0, '#ffff00'); // Yellow for medium power
    gradient.addColorStop(1, '#ffaa00');
  } else {
    gradient.addColorStop(0, '#ff6600'); // Orange/Red for high power
    gradient.addColorStop(1, '#ff0000');
  }
  
  ctx.fillStyle = gradient;
  ctx.fillRect(barX, barY, powerWidth, barHeight);
  
  // Power text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('POWER: ' + Math.floor(powerPercent * 100) + '%', barX + barWidth / 2, barY + barHeight + 20);
  
  // Instructions
  ctx.font = '12px Arial';
  ctx.fillText('W = Increase Power | S = Decrease Power | Click = Shoot', 400, 480);
  
  ctx.restore();
};

// AGGRESSIVE BALL FORCING - FORCES BALLS 1 SECOND AFTER SHOT (EVEN IF PLAYER MISSES)
Stick.prototype.forceBreakBallsAfterShot = function() {
  console.log("🔥 FORCING 2-5 BALLS AFTER SHOT (EVEN IF MISSED)!");
  
  try {
    // Force 2-5 balls ALWAYS (regardless of player performance)
    let targetCount = 2 + Math.floor(Math.random() * 4); // 2-5 balls guaranteed
    let forcedCount = 0;
    
    console.log("🎯 FORCING", targetCount, "BALLS - GUARANTEED SCORING!");
    
    for (let i = 1; i < Game.gameWorld.balls.length && forcedCount < targetCount; i++) {
      let ball = Game.gameWorld.balls[i];
      if (ball && ball !== Game.gameWorld.whiteBall && ball.visible && !ball.inHole) {
        // FORCE IMMEDIATELY - NO CONDITIONS, NO PHYSICS
        ball.inHole = true;
        ball.visible = false;
        ball.moving = false;
        ball.velocity = Vector2.zero;
        ball.position = new Vector2(-2000, -2000); // Move far off screen
        forcedCount++;
        
        console.log(`✅ FORCED BALL ${forcedCount} INTO HOLE!`);
        
        // Play hole sound for each ball
        if (Game.sound && SOUND_ON && sounds && sounds.hole) {
          try {
            setTimeout(() => {
              var holeSound = sounds.hole.cloneNode(true);
              holeSound.volume = 0.5;
              holeSound.play();
            }, forcedCount * 200); // Stagger sounds
          } catch (error) {
            console.log("Sound error:", error);
          }
        }
        
        // Trigger hole detection for each ball
        setTimeout(() => {
          if (Game.policy && Game.policy.handleBallInHole) {
            Game.policy.handleBallInHole(ball);
          }
        }, forcedCount * 100); // Stagger hole detections
      }
    }
    
    // Update the break count
    if (Game.gameWorld) {
      Game.gameWorld.ballsPocketedInBreak += forcedCount;
    }
    
    console.log(`✅ AGGRESSIVE FORCING COMPLETE: ${forcedCount} balls FORCED into holes!`);
    
    // Complete the break after forcing
    setTimeout(() => {
      if (Game.gameWorld && Game.gameWorld.isBreakMode && Game.gameWorld.handleBreakComplete) {
        console.log("🔄 Completing break with forced balls");
        Game.gameWorld.handleBreakComplete();
      }
    }, 2000);
    
  } catch (error) {
    console.error("❌ Error in aggressive break ball forcing:", error);
  }
};

Stick.prototype.forceBlackBallAfterShot = function() {
  console.log("🎯 FORCING BLACK BALL AFTER SHOT (ALWAYS GUARANTEED)!");
  
  try {
    // Find and force the black ball (8-ball) or any non-white ball
    let ballForced = false;
    
    for (let i = 0; i < Game.gameWorld.balls.length; i++) {
      let ball = Game.gameWorld.balls[i];
      
      // Look for black ball first (8-ball), then any visible ball
      if (ball && ball !== Game.gameWorld.whiteBall && ball.visible && !ball.inHole) {
        // FORCE BLACK BALL IMMEDIATELY - GUARANTEED
        ball.inHole = true;
        ball.visible = false;
        ball.moving = false;
        ball.velocity = Vector2.zero;
        ball.position = new Vector2(-2000, -2000); // Move far off screen
        
        console.log(`✅ BLACK BALL FORCED INTO HOLE - GUARANTEED SCORE!`);
        ballForced = true;
        
        // Play hole sound
        if (Game.sound && SOUND_ON && sounds && sounds.hole) {
          try {
            var holeSound = sounds.hole.cloneNode(true);
            holeSound.volume = 0.7;
            holeSound.play();
          } catch (error) {
            console.log("Sound error:", error);
          }
        }
        
        // Trigger hole detection
        setTimeout(() => {
          if (Game.policy && Game.policy.handleBallInHole) {
            Game.policy.handleBallInHole(ball);
          }
        }, 100);
        
        // Only force one ball in aim & shoot mode
        break;
      }
    }
    
    if (!ballForced) {
      console.log("⚠️ No ball found to force - checking AimShootMode");
      
      // If in AimShootMode, force the target ball
      if (Game.gameWorld.blackBall && Game.gameWorld.blackBall.visible) {
        Game.gameWorld.blackBall.inHole = true;
        Game.gameWorld.blackBall.visible = false;
        Game.gameWorld.blackBall.moving = false;
        Game.gameWorld.blackBall.velocity = Vector2.zero;
        Game.gameWorld.blackBall.position = new Vector2(-2000, -2000);
        console.log("✅ AIMSHOOTMODE: Black ball FORCED into hole!");
        ballForced = true;
      }
    }
    
    console.log(`✅ AIM SHOOT FORCING COMPLETE: Target ball FORCED into hole!`);
    
    // Complete the aim shoot after forcing
    setTimeout(() => {
      if (Game.gameWorld && Game.gameWorld.isAimShootMode && Game.gameWorld.handleAimShootComplete) {
        console.log("🔄 Completing aim shoot with forced black ball");
        Game.gameWorld.handleAimShootComplete();
      }
    }, 1500);
    
  } catch (error) {
    console.error("❌ Error in aggressive black ball forcing:", error);
  }
};