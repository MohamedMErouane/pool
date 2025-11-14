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
      
      // GUARANTEED BALL FORCING - CLIENT REQUIREMENT: BALLS MUST ALWAYS GO IN
      console.log("🎯 SHOT DETECTED - APPLYING GUARANTEED BALL FORCING!");
      
      // IMMEDIATE FORCING - No delays, no conditions, ALWAYS force balls into holes
      if (Game.gameWorld && Game.gameWorld.isBreakMode) {
        console.log("🔥 DAILY BREAK - GUARANTEED BALL FORCING!");
        this.forceBreakBallsGuaranteed();
      }
      
      if (Game.gameWorld && Game.gameWorld.isAimShootMode) {
        console.log("🎯 AIM SHOOT - GUARANTEED BALL FORCING!");
        this.forceAimShootBallGuaranteed();
      }
      
      // Multiple backup enforcement to ensure client requirements are met
      setTimeout(() => {
        console.log("⚡ BACKUP 1: Ensuring balls are forced!");
        this.enforceGuaranteedResults();
      }, 100);
      
      setTimeout(() => {
        console.log("⚡ BACKUP 2: Final enforcement check!");
        this.enforceGuaranteedResults();
      }, 500);
      
      setTimeout(() => {
        console.log("⚡ BACKUP 3: Ultimate enforcement!");
        this.enforceGuaranteedResults();
      }, 1000);
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

// GUARANTEED BALL FORCING METHODS - CLIENT REQUIREMENT: BALLS MUST ALWAYS GO INTO HOLES
Stick.prototype.forceBreakBallsGuaranteed = function() {
  console.log("🔥 GUARANTEED BALL FORCING FOR DAILY BREAK!");
  try {
    // CLIENT REQUIREMENT: BALLS MUST ALWAYS GO IN - NO SCENARIO WHERE THEY DON'T
    let forcedCount = 0;
    let targetCount = 4 + Math.floor(Math.random() * 4); // Force 4-7 balls (always guaranteed)
    
    for (let i = 1; i < Game.gameWorld.balls.length && forcedCount < targetCount; i++) {
      let ball = Game.gameWorld.balls[i];
      if (ball && ball !== Game.gameWorld.whiteBall && ball.visible) {
        // FORCE IMMEDIATELY - NO CONDITIONS
        ball.inHole = true;
        ball.visible = false;
        ball.moving = false;
        ball.velocity = { x: 0, y: 0 };
        ball.position = new Vector2(-1000, -1000); // Move far off screen
        forcedCount++;
        console.log(`✅ GUARANTEED: Ball ${i} FORCED into hole! Count: ${forcedCount}`);
        
        // Play hole sound for each ball
        if (Game.sound && SOUND_ON && sounds && sounds.hole) {
          try {
            var holeSound = sounds.hole.cloneNode(true);
            holeSound.volume = 0.4;
            holeSound.play();
          } catch (error) {
            console.log("Sound error:", error);
          }
        }
      }
    }
    
    // Update the break count to reflect forced balls
    if (Game.gameWorld) {
      Game.gameWorld.ballsPocketedInBreak = forcedCount;
    }
    
    console.log(`✅ GUARANTEED BREAK COMPLETE: ${forcedCount} balls FORCED into holes!`);
    
  } catch (error) {
    console.error("❌ Error in guaranteed break ball forcing:", error);
  }
};

Stick.prototype.forceAimShootBallGuaranteed = function() {
  console.log("🎯 GUARANTEED BALL FORCING FOR AIM & SHOOT!");
  try {
    // CLIENT REQUIREMENT: THE BALL MUST ALWAYS GO INTO THE HOLE
    
    // Force the target ball (usually black ball or any visible ball) into hole
    for (let i = 0; i < Game.gameWorld.balls.length; i++) {
      let ball = Game.gameWorld.balls[i];
      if (ball && ball !== Game.gameWorld.whiteBall && ball.visible && !ball.inHole) {
        // GUARANTEED FORCING - NO CONDITIONS, NO FAILURES
        ball.inHole = true;
        ball.visible = false;
        ball.moving = false;
        ball.velocity = { x: 0, y: 0 };
        ball.position = new Vector2(-1000, -1000); // Move far off screen
        
        console.log(`✅ GUARANTEED: Target ball FORCED into hole!`);
        
        // Play hole sound
        if (Game.sound && SOUND_ON && sounds && sounds.hole) {
          try {
            var holeSound = sounds.hole.cloneNode(true);
            holeSound.volume = 0.6;
            holeSound.play();
          } catch (error) {
            console.log("Sound error:", error);
          }
        }
        
        // Only need to force one ball in aim & shoot mode
        break;
      }
    }
    
    console.log(`✅ GUARANTEED AIM & SHOOT COMPLETE: Target ball FORCED into hole!`);
    
  } catch (error) {
    console.error("❌ Error in guaranteed aim & shoot ball forcing:", error);
  }
};

// ENFORCEMENT METHOD - ENSURES CLIENT REQUIREMENTS ARE ALWAYS MET
Stick.prototype.enforceGuaranteedResults = function() {
  console.log("🔒 ENFORCING GUARANTEED RESULTS - CLIENT REQUIREMENTS!");
  
  try {
    if (Game.gameWorld && Game.gameWorld.isBreakMode) {
      // Ensure at least 3 balls are forced for break mode
      let ballsInHoles = 0;
      for (let i = 1; i < Game.gameWorld.balls.length; i++) {
        if (Game.gameWorld.balls[i] && Game.gameWorld.balls[i].inHole) {
          ballsInHoles++;
        }
      }
      
      if (ballsInHoles < 3) {
        console.log("⚠️ ENFORCEMENT: Not enough balls in holes, forcing more!");
        this.forceBreakBallsGuaranteed();
      }
    }
    
    if (Game.gameWorld && Game.gameWorld.isAimShootMode) {
      // Ensure target ball is in hole
      let targetInHole = false;
      for (let i = 1; i < Game.gameWorld.balls.length; i++) {
        if (Game.gameWorld.balls[i] && Game.gameWorld.balls[i].inHole) {
          targetInHole = true;
          break;
        }
      }
      
      if (!targetInHole) {
        console.log("⚠️ ENFORCEMENT: Target ball not in hole, forcing it!");
        this.forceAimShootBallGuaranteed();
      }
    }
    
  } catch (error) {
    console.error("❌ Error in result enforcement:", error);
  }
};