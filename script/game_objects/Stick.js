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
      
      // CLIENT SPECIFICATION: Ball slowly rolls into hole with realistic motion
      console.log("🎯 SHOT DETECTED - IMPLEMENTING CLIENT SPECIFICATION!");
      
      if (Game.gameWorld && Game.gameWorld.isBreakMode) {
        console.log("🔥 DAILY BREAK - Ball will slowly roll into hole");
        setTimeout(() => {
          this.makeBreakBallSlowlyRollIntoHole();
        }, 1000);
      }
      
      if (Game.gameWorld && Game.gameWorld.isAimShootMode) {
        console.log("🎯 AIM SHOOT - Ball will slowly roll into hole (guaranteed)");
        setTimeout(() => {
          this.makeAimShotBallSlowlyRollIntoHole();
        }, 1000);
      }
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

// CLIENT SPECIFICATION: Balls slowly roll into hole with realistic motion
Stick.prototype.makeBreakBallSlowlyRollIntoHole = function() {
  console.log("🎱 DAILY BREAK: Making balls slowly roll into holes");
  
  try {
    // Find balls to make roll into holes (2-5 balls as per specification)
    const targetCount = 2 + Math.floor(Math.random() * 4); // 2-5 balls
    let ballsProcessed = 0;
    
    for (let i = 1; i < Game.gameWorld.balls.length && ballsProcessed < targetCount; i++) {
      const ball = Game.gameWorld.balls[i];
      if (ball && ball !== Game.gameWorld.whiteBall && ball.visible && !ball.inHole) {
        
        // Make ball slowly roll toward a hole with realistic physics
        this.animateBallSlowlyToHole(ball, ballsProcessed);
        ballsProcessed++;
      }
    }
    
    console.log(`🎱 DAILY BREAK: ${ballsProcessed} balls will slowly roll into holes`);
    
    // After all balls are in holes, show points and reset
    setTimeout(() => {
      this.handleBreakCompletion();
    }, 4000 + (ballsProcessed * 1000)); // Wait for all animations
    
  } catch (error) {
    console.error("❌ Error in break ball slow roll:", error);
  }
};

Stick.prototype.makeAimShotBallSlowlyRollIntoHole = function() {
  console.log("🎯 AIM SHOT: Making target ball slowly roll into hole");
  
  try {
    // Find the target ball (black ball or any visible ball)
    for (let i = 0; i < Game.gameWorld.balls.length; i++) {
      const ball = Game.gameWorld.balls[i];
      if (ball && ball !== Game.gameWorld.whiteBall && ball.visible && !ball.inHole) {
        
        // Make ball slowly roll toward hole with realistic motion
        this.animateBallSlowlyToHole(ball, 0, true); // true = aim shot mode
        
        // After ball is in hole, show points and reset
        setTimeout(() => {
          this.handleAimShotCompletion();
        }, 3000);
        
        break; // Only one ball in aim shot mode
      }
    }
    
  } catch (error) {
    console.error("❌ Error in aim shot ball slow roll:", error);
  }
};

// Animate ball slowly rolling into hole with realistic physics
Stick.prototype.animateBallSlowlyToHole = function(ball, delay, isAimShot = false) {
  console.log(`🎳 Animating ball slowly to hole (delay: ${delay}s)`);
  
  setTimeout(() => {
    // Create slow, realistic rolling motion toward nearest hole
    const holePositions = [
      new Vector2(88, 88),    // Top-left hole
      new Vector2(650, 88),   // Top-middle hole  
      new Vector2(1212, 88),  // Top-right hole
      new Vector2(88, 738),   // Bottom-left hole
      new Vector2(650, 738),  // Bottom-middle hole
      new Vector2(1212, 738)  // Bottom-right hole
    ];
    
    // Find nearest hole
    let nearestHole = holePositions[0];
    let minDistance = ball.position.distanceFrom(nearestHole);
    
    holePositions.forEach(holePos => {
      const distance = ball.position.distanceFrom(holePos);
      if (distance < minDistance) {
        minDistance = distance;
        nearestHole = holePos;
      }
    });
    
    // Calculate direction to hole
    const direction = nearestHole.subtract(ball.position);
    const distance = direction.length();
    direction.normalize();
    
    // Set slow velocity toward hole
    ball.velocity = direction.multiply(Math.min(distance * 2, 50)); // Slow speed
    ball.moving = true;
    
    console.log(`🎳 Ball starting slow roll toward hole at (${nearestHole.x}, ${nearestHole.y})`);
    
    // Monitor ball movement and force into hole when close
    const checkInterval = setInterval(() => {
      const distanceToHole = ball.position.distanceFrom(nearestHole);
      
      if (distanceToHole < 40 || !ball.moving) {
        // Ball is close enough - force it into hole smoothly
        clearInterval(checkInterval);
        
        ball.inHole = true;
        ball.visible = false;
        ball.moving = false;
        ball.velocity = Vector2.zero;
        ball.position = nearestHole.copy();
        
        // Play hole sound
        if (Game.sound && SOUND_ON && sounds && sounds.hole) {
          try {
            const holeSound = sounds.hole.cloneNode(true);
            holeSound.volume = 0.6;
            holeSound.play();
          } catch (error) {
            console.log("Sound error:", error);
          }
        }
        
        // Update ball count
        if (!isAimShot && Game.gameWorld) {
          Game.gameWorld.ballsPocketedInBreak++;
        }
        
        // Trigger hole detection
        if (Game.policy && Game.policy.handleBallInHole) {
          Game.policy.handleBallInHole(ball);
        }
        
        console.log("✅ Ball slowly rolled into hole successfully!");
      }
    }, 100); // Check every 100ms
    
  }, delay * 1000); // Stagger ball animations
};

// Handle break completion with points display and reset
Stick.prototype.handleBreakCompletion = function() {
  console.log("🎯 DAILY BREAK COMPLETION - Showing points and resetting");
  
  const ballsScored = Game.gameWorld.ballsPocketedInBreak || 0;
  const points = ballsScored * 15; // Points calculation
  
  // Increment attempt counter
  Game.gameWorld.dailyBreakAttempts++;
  localStorage.setItem('dailyBreakAttempts', Game.gameWorld.dailyBreakAttempts.toString());
  
  // Show points display
  this.showPointsDisplay(points, ballsScored, 'DAILY BREAK');
  
  // Check if this was the 3rd attempt
  setTimeout(() => {
    if (Game.gameWorld.dailyBreakAttempts >= 3) {
      // Show 24-hour message
      this.show24HourMessage('Daily Break');
    } else {
      // Reset to initial screen for next attempt
      this.resetToInitialScreen();
    }
  }, 3000); // Show points for 3 seconds
};

// Handle aim shot completion with points display and reset
Stick.prototype.handleAimShotCompletion = function() {
  console.log("🎯 AIM SHOT COMPLETION - Showing points and resetting");
  
  const points = 25; // Fixed points for aim shot
  
  // Increment attempt counter
  Game.gameWorld.aimShootAttempts++;
  localStorage.setItem('aimShootAttempts', Game.gameWorld.aimShootAttempts.toString());
  
  // Show points display
  this.showPointsDisplay(points, 1, 'AIM SHOT');
  
  // Check if this was the 3rd attempt
  setTimeout(() => {
    if (Game.gameWorld.aimShootAttempts >= 3) {
      // Show 24-hour message
      this.show24HourMessage('Aim Shot');
    } else {
      // Reset to initial screen for next attempt
      this.resetToInitialScreen();
    }
  }, 3000); // Show points for 3 seconds
};

// Show points display overlay
Stick.prototype.showPointsDisplay = function(points, ballsScored, mode) {
  console.log(`📊 Showing points display: ${points} points for ${ballsScored} balls in ${mode}`);
  
  // Create points display overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '50%';
  overlay.style.left = '50%';
  overlay.style.transform = 'translate(-50%, -50%)';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  overlay.style.color = 'white';
  overlay.style.padding = '40px';
  overlay.style.borderRadius = '10px';
  overlay.style.textAlign = 'center';
  overlay.style.fontSize = '24px';
  overlay.style.fontWeight = 'bold';
  overlay.style.zIndex = '9999';
  overlay.style.border = '3px solid #gold';
  
  overlay.innerHTML = `
    <div style="margin-bottom: 20px; font-size: 28px; color: #FFD700;">${mode} COMPLETE!</div>
    <div style="margin-bottom: 15px;">Balls Scored: ${ballsScored}</div>
    <div style="margin-bottom: 15px; font-size: 32px; color: #00FF00;">+${points} POINTS</div>
    <div style="font-size: 16px; color: #CCCCCC;">Attempt ${mode === 'DAILY BREAK' ? Game.gameWorld.dailyBreakAttempts : Game.gameWorld.aimShootAttempts} of 3</div>
  `;
  
  document.body.appendChild(overlay);
  
  // Remove overlay after 3 seconds
  setTimeout(() => {
    document.body.removeChild(overlay);
  }, 3000);
};

// Show 24-hour wait message
Stick.prototype.show24HourMessage = function(mode) {
  console.log(`⏰ Showing 24-hour message for ${mode}`);
  
  // Create 24-hour message overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '50%';
  overlay.style.left = '50%';
  overlay.style.transform = 'translate(-50%, -50%)';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  overlay.style.color = 'white';
  overlay.style.padding = '50px';
  overlay.style.borderRadius = '15px';
  overlay.style.textAlign = 'center';
  overlay.style.fontSize = '20px';
  overlay.style.fontWeight = 'bold';
  overlay.style.zIndex = '10000';
  overlay.style.border = '3px solid #FF4444';
  
  const message = mode === 'Aim Shot' ? 
    'You have completed 3 shots. Please come back in 24 hours to play again.' :
    'The game will be available again after 24 hours, and the player cannot play until then.';
  
  overlay.innerHTML = `
    <div style="margin-bottom: 25px; font-size: 26px; color: #FF6666;">3 Attempts Completed!</div>
    <div style="margin-bottom: 20px; line-height: 1.5;">${message}</div>
    <div style="font-size: 16px; color: #CCCCCC;">Come back tomorrow for more attempts!</div>
    <div style="margin-top: 25px;">
      <button onclick="this.parentElement.parentElement.remove(); Game.initMenus(false); Game.mainMenu.active = true; GAME_STOPPED = true;" 
              style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
        Return to Menu
      </button>
    </div>
  `;
  
  document.body.appendChild(overlay);
};

// Reset to initial screen
Stick.prototype.resetToInitialScreen = function() {
  console.log("🔄 Resetting to initial screen for next attempt");
  
  // Reset game state
  Game.gameWorld.isBreakMode = false;
  Game.gameWorld.isAimShootMode = false;
  Game.gameWorld.miniGameActive = false;
  Game.gameWorld.ballsForced = false;
  Game.gameWorld.aimShootTargetForced = false;
  Game.gameWorld.ballsPocketedInBreak = 0;
  
  // Reset balls to initial positions
  for (var i = 0; i < Game.gameWorld.balls.length; i++) {
    Game.gameWorld.balls[i].reset();
    Game.gameWorld.balls[i].visible = true;
    Game.gameWorld.balls[i].inHole = false;
  }
  
  // Return to main menu
  Game.initMenus(false);
  Game.mainMenu.active = true;
  GAME_STOPPED = true;
  
  console.log("✅ Reset to initial screen complete");
};