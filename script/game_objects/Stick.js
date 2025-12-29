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

      // DAILY BREAK MODE: Let white ball shoot normally, then force balls on collision
      if (localStorage.getItem('dailyBreakMode') === 'true') {
          console.log("🎯 DAILY BREAK MODE - Allowing normal shot, will force balls on collision");
          if (Game.gameWorld && !Game.gameWorld.dailyBreakShotTaken) {
              Game.gameWorld.dailyBreakShotTaken = true;
              console.log("💥 Daily break shot initiated - white ball will shoot normally");
          }
          // Don't return - let the normal shot happen below
      }

      var strike = sounds.strike.cloneNode(true);
      strike.volume = (this.power/(10))<1?(this.power/(10)):1;
      strike.play();
      Game.policy.turnPlayed = true;
      this.shooting = true;
      this.origin = this.shotOrigin.copy();

      Game.gameWorld.whiteBall.shoot(this.power, this.rotation);
      var stick = this;
      setTimeout(function(){stick.visible = false;}, 500);
      
      // BALL FORCING - Skip for Daily Break (animation handled by GameWorld.forceBallIntoPocket)
      setTimeout(function() {
        // Skip instant forcing for Daily Break - let the animation play instead
        if (localStorage.getItem('dailyBreakMode') === 'true') {
          console.log("🎬 Daily Break: Skipping instant force - using animated ball rolling");
          return; // Let GameWorld.forceDailyBreakBalls handle the animation
        }
        
        console.log("🎯 FORCING BALLS NOW!");
        
        // Check if we're in mini-game - force balls!
        if (currentMiniGame && currentMiniGame.type === 'aimShoot') {
          // AIM SHOOT: Force black ball (or any ball)
          for (var i = 0; i < Game.gameWorld.balls.length; i++) {
            var ball = Game.gameWorld.balls[i];
            if (ball && ball !== Game.gameWorld.whiteBall && !ball.inHole && ball.visible) {
              ball.inHole = true;
              ball.visible = false;
              console.log("✅ AIM SHOOT: Ball forced!");
              break; // Only one ball
            }
          }
        }
        
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