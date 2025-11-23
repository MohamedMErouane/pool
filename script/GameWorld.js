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
    this.aimShootTargetForced = false; // Flag for aim & shoot target forcing
    this.aimShootShotTriggered = false; // Flag for aim & shoot shot detection
    this.powerShotActive = false;
    this.breakCompleted = false; // Flag to prevent multiple break completions
    this.instantBallsForced = false; // Flag for instant ball forcing
    this.ballsForced = false; // Simple flag for guaranteed ball forcing
    this.dailyBreakShotTaken = false; // Flag for daily break shot taken
    this.dailyBreakCollisionDetected = false; // Flag for first collision detection
    
    // CLIENT SPECIFICATION: 3-shot system tracking
    this.dailyBreakAttempts = parseInt(localStorage.getItem('dailyBreakAttempts') || '0');
    this.aimShootAttempts = parseInt(localStorage.getItem('aimShootAttempts') || '0');
    this.lastPlayDate = localStorage.getItem('lastPlayDate') || '';
    
    // Check if it's a new day (reset attempts)
    const today = new Date().toDateString();
    if (this.lastPlayDate !== today) {
        this.dailyBreakAttempts = 0;
        this.aimShootAttempts = 0;
        localStorage.setItem('dailyBreakAttempts', '0');
        localStorage.setItem('aimShootAttempts', '0');
        localStorage.setItem('lastPlayDate', today);
    }
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

// GUARANTEED BALL FORCING - CLIENT REQUIREMENT: NO SCENARIO WHERE BALLS DON'T GO IN
GameWorld.prototype.forceGuaranteedBallsSimple = function() {
    if (this.ballsForced) return; // Already done
    
    console.log("🔥 GUARANTEED BALL FORCING - CLIENT REQUIREMENT ENFORCEMENT");
    this.ballsForced = true;
    
    // Reset everything first
    this.ballsPocketedInBreak = 0;
    
    // CLIENT REQUIREMENT: Force 4-7 balls ALWAYS (NO SCENARIO WHERE BALLS DON'T GO IN)
    const ballsToForce = 4 + Math.floor(Math.random() * 4); // 4-7 balls GUARANTEED
    console.log("🎯 FORCING", ballsToForce, "BALLS - GUARANTEED ACCORDING TO CLIENT REQUIREMENTS!");
    
    let ballsForced = 0;
    
    // Go through balls and FORCE them into holes - NO CONDITIONS, NO FAILURES
    for (let i = 1; i < this.balls.length && ballsForced < ballsToForce; i++) {
        const ball = this.balls[i];
        if (ball && ball !== this.whiteBall) {
            // ABSOLUTE FORCING - CLIENT REQUIREMENT: BALLS MUST GO IN
            ball.inHole = true;
            ball.visible = false;
            ball.moving = false;
            ball.velocity = Vector2.zero;
            ball.position = new Vector2(-1000, -1000); // Move completely off screen
            
            this.ballsPocketedInBreak++;
            ballsForced++;
            
            console.log("✅ GUARANTEED: Ball", ballsForced, "FORCED into hole - CLIENT REQUIREMENT MET!");
            
            // Play sound effect for each ball
            if (Game.sound && SOUND_ON && typeof sounds !== 'undefined' && sounds.hole) {
                try {
                    const holeSound = sounds.hole.cloneNode(true);
                    holeSound.volume = 0.5;
                    holeSound.play();
                } catch (error) {
                    console.log("Sound effect error:", error);
                }
            }
        }
    }
    
    console.log("🎉 GUARANTEED FORCING COMPLETE:", ballsForced, "balls FORCED into holes - NO FAILURES ALLOWED!");
    
    // IMMEDIATE CALLBACK TO HANDLE COMPLETION
    setTimeout(() => {
        if (this.isBreakMode && this.miniGameActive) {
            console.log("🔄 Triggering break completion with guaranteed results");
            this.handleBreakComplete();
        }
    }, 500);
};

// GUARANTEED AIM & SHOOT TARGET FORCING - CLIENT REQUIREMENT: BALL MUST ALWAYS GO IN
GameWorld.prototype.forceAimShootTargetBall = function() {
    if (this.aimShootTargetForced) return; // Already forced
    
    console.log("🎯 GUARANTEED AIM & SHOOT TARGET FORCING - CLIENT REQUIREMENT!");
    this.aimShootTargetForced = true;
    
    // Find the target ball (non-white ball) and FORCE it into hole
    for (let i = 0; i < this.balls.length; i++) {
        const ball = this.balls[i];
        if (ball && ball !== this.whiteBall && ball.visible && !ball.inHole) {
            // ABSOLUTE FORCING - CLIENT REQUIREMENT: BALL MUST GO IN
            ball.inHole = true;
            ball.visible = false;
            ball.moving = false;
            ball.velocity = Vector2.zero;
            ball.position = new Vector2(-1000, -1000); // Move completely off screen
            
            console.log("✅ GUARANTEED: Target ball FORCED into hole - CLIENT REQUIREMENT MET!");
            
            // Play hole sound
            if (Game.sound && SOUND_ON && typeof sounds !== 'undefined' && sounds.hole) {
                try {
                    const holeSound = sounds.hole.cloneNode(true);
                    holeSound.volume = 0.6;
                    holeSound.play();
                } catch (error) {
                    console.log("Sound effect error:", error);
                }
            }
            
            // Only need to force one ball in aim & shoot mode
            break;
        }
    }
    
    console.log("🎯 AIM & SHOOT TARGET FORCING COMPLETE - NO FAILURES ALLOWED!");
    
    // IMMEDIATE CALLBACK TO HANDLE COMPLETION
    setTimeout(() => {
        if (this.isAimShootMode && this.miniGameActive) {
            console.log("🔄 Triggering aim & shoot completion with guaranteed results");
            this.handleAimShootComplete();
        }
    }, 300);
};

// FORCE MINIMUM BALLS - ENSURES AT LEAST 2-5 BALLS ARE ALWAYS SCORED
GameWorld.prototype.forceMinimumBalls = function() {
    console.log("🔥 FORCING MINIMUM BALLS - ENSURING 2-5 BALLS SCORE!");
    
    // Determine how many balls to force (2-5 guaranteed)
    const minBalls = 2;
    const maxBalls = 5;
    const targetCount = minBalls + Math.floor(Math.random() * (maxBalls - minBalls + 1));
    
    console.log("🎯 FORCING", targetCount, "BALLS - GUARANTEED SCORING!");
    
    let forcedCount = 0;
    
    // Force balls into holes
    for (let i = 1; i < this.balls.length && forcedCount < targetCount; i++) {
        const ball = this.balls[i];
        if (ball && ball !== this.whiteBall && ball.visible && !ball.inHole) {
            // FORCE IMMEDIATELY
            ball.inHole = true;
            ball.visible = false;
            ball.moving = false;
            ball.velocity = Vector2.zero;
            ball.position = new Vector2(-3000, -3000); // Move completely off screen
            
            this.ballsPocketedInBreak++;
            forcedCount++;
            
            console.log(`✅ FORCED BALL ${forcedCount} INTO HOLE!`);
            
            // Play hole sound for each ball
            if (Game.sound && SOUND_ON && typeof sounds !== 'undefined' && sounds.hole) {
                try {
                    setTimeout(() => {
                        const holeSound = sounds.hole.cloneNode(true);
                        holeSound.volume = 0.5;
                        holeSound.play();
                    }, forcedCount * 150); // Stagger sounds
                } catch (error) {
                    console.log("Sound effect error:", error);
                }
            }
            
            // Trigger hole detection
            setTimeout(() => {
                if (Game.policy && Game.policy.handleBallInHole) {
                    Game.policy.handleBallInHole(ball);
                }
            }, forcedCount * 100);
        }
    }
    
    console.log(`✅ MINIMUM BALLS FORCING COMPLETE: ${forcedCount} balls FORCED!`);
};

// FORCE BLACK BALL INTO HOLE - FOR AIM & SHOOT MODE
GameWorld.prototype.forceBlackBallInHole = function() {
    console.log("🎯 FORCING BLACK BALL INTO HOLE - GUARANTEED SCORING!");
    
    let targetBall = null;
    
    // In Aim & Shoot mode, find the BLACK ball (ball #8, NOT the white cue ball)
    for (let i = 0; i < this.balls.length; i++) {
        const ball = this.balls[i];
        
        if (!ball || ball.inHole || !ball.visible) {
            console.log(`Skipping ball ${i}: inHole=${ball?.inHole}, visible=${ball?.visible}`);
            continue;
        }
        
        // Log ball info
        console.log(`Ball ${i}: number=${ball.number}, isWhiteBall=${ball === this.whiteBall}`);
        
        // IMPORTANT: Skip white/cue ball (ball number 0)
        if (ball.number === 0 || ball === this.whiteBall) {
            console.log("⚪ Skipping WHITE ball (cue ball)");
            continue;
        }
        
        // This MUST be the BLACK ball - the only other ball in Aim & Shoot mode
        targetBall = ball;
        console.log(`🎱 Found BLACK BALL - Number: ${ball.number}, Position: (${ball.position.x.toFixed(0)}, ${ball.position.y.toFixed(0)})`);
        break;
    }
    
    if (!targetBall) {
        console.log("❌ ERROR: No black ball found! Balls in game:", this.balls.length);
        // Emergency: Force any non-white ball
        for (let i = 0; i < this.balls.length; i++) {
            if (this.balls[i] !== this.whiteBall && this.balls[i].visible && !this.balls[i].inHole) {
                targetBall = this.balls[i];
                console.log("⚠️ EMERGENCY: Using ball at index", i);
                break;
            }
        }
        if (!targetBall) {
            console.log("❌ CRITICAL: Still no target ball found!");
            return;
        }
    }
    
    // Find closest pocket
    const pockets = [
        { x: 62, y: 62 },     // Top-left
        { x: 400, y: 50 },    // Top-center
        { x: 738, y: 62 },    // Top-right
        { x: 62, y: 438 },    // Bottom-left
        { x: 400, y: 450 },   // Bottom-center
        { x: 738, y: 438 }    // Bottom-right
    ];
    
    // Find closest pocket to ball
    let closestPocket = pockets[0];
    let minDistance = Infinity;
    for (let pocket of pockets) {
        const dist = Math.sqrt(
            Math.pow(targetBall.position.x - pocket.x, 2) + 
            Math.pow(targetBall.position.y - pocket.y, 2)
        );
        if (dist < minDistance) {
            minDistance = dist;
            closestPocket = pocket;
        }
    }
    
    console.log(`🎯 BLACK BALL at (${targetBall.position.x.toFixed(0)}, ${targetBall.position.y.toFixed(0)})`);
    console.log(`🎯 Closest pocket at (${closestPocket.x}, ${closestPocket.y})`);
    console.log(`📏 Distance to pocket: ${minDistance.toFixed(0)} pixels`);
    
    // Store reference for use in interval
    const gameWorld = this;
    
    // Mark ball as being forced
    targetBall.isBeingForced = true;
    targetBall.friction = 0;
    
    console.log(`✅ Starting GUARANTEED forced roll to pocket...`);
    
    // AGGRESSIVE FORCING: Move ball directly toward pocket every frame
    let checkCount = 0;
    const maxChecks = 300; // 15 seconds max
    
    const checkInterval = setInterval(() => {
        checkCount++;
        
        if (!targetBall || !targetBall.position) {
            clearInterval(checkInterval);
            return;
        }
        
        // Calculate current distance to pocket
        const dx = closestPocket.x - targetBall.position.x;
        const dy = closestPocket.y - targetBall.position.y;
        const distToPocket = Math.sqrt(dx * dx + dy * dy);
        
        if (checkCount % 20 === 0) {
            console.log(`📍 Count: ${checkCount}, Distance: ${distToPocket.toFixed(0)}px, Ball pos: (${targetBall.position.x.toFixed(0)}, ${targetBall.position.y.toFixed(0)})`);
        }
        
        // If close enough, pocket the ball immediately
        if (distToPocket < 50) {
            clearInterval(checkInterval);
            
            // POCKET THE BALL
            targetBall.isBeingForced = false;
            targetBall.position = new Vector2(closestPocket.x, closestPocket.y);
            targetBall.inHole = true;
            targetBall.visible = false;
            targetBall.moving = false;
            targetBall.velocity = Vector2.zero;
            
            console.log("✅✅✅ BLACK BALL SCORED - ENTERED HOLE!");
            
            // Play hole sound
            if (Game.sound && SOUND_ON && typeof sounds !== 'undefined' && sounds.hole) {
                try {
                    const holeSound = sounds.hole.cloneNode(true);
                    holeSound.volume = 0.8;
                    holeSound.play();
                } catch (error) {
                    console.log("Sound effect error:", error);
                }
            }
            
            // Trigger completion
            setTimeout(() => {
                if (gameWorld.isAimShootMode) {
                    console.log("🎯 Calling completeAimShootShot...");
                    gameWorld.completeAimShootShot();
                }
            }, 500);
            
            return;
        }
        
        // FORCE MOVEMENT: Directly update position toward pocket
        const speed = 3; // Pixels per frame (50ms = 60 pixels/second)
        const stepX = (dx / distToPocket) * speed;
        const stepY = (dy / distToPocket) * speed;
        
        targetBall.position = new Vector2(
            targetBall.position.x + stepX,
            targetBall.position.y + stepY
        );
        
        // Also set velocity for visual effect
        targetBall.velocity = new Vector2(
            (dx / distToPocket) * 200,
            (dy / distToPocket) * 200
        );
        targetBall.moving = true;
        targetBall.visible = true;
        targetBall.friction = 0;
        
        // Safety: If taking too long, just teleport to pocket
        if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
            console.log("⚠️ Max time reached, forcing ball into pocket NOW!");
            
            targetBall.isBeingForced = false;
            targetBall.position = new Vector2(closestPocket.x, closestPocket.y);
            targetBall.inHole = true;
            targetBall.visible = false;
            targetBall.moving = false;
            targetBall.velocity = Vector2.zero;
            
            setTimeout(() => {
                if (gameWorld.isAimShootMode) {
                    gameWorld.completeAimShootShot();
                }
            }, 500);
        }
    }, 50); // Every 50ms
};

GameWorld.prototype.handleInput = function (delta) {
    // AIM & SHOOT MODE: Just mark that shot was taken, forcing will happen when balls stop
    if (this.isAimShootMode && !this.aimShootShotTriggered) {
        if (this.stick.shot) {
            this.aimShootShotTriggered = true;
            console.log("🎯 AIM & SHOOT: Shot detected! Black ball will be forced into hole when balls stop.");
        }
    }

    // Daily Break Mode handling
    if (localStorage.getItem('dailyBreakMode') === 'true' && !this.dailyBreakCollisionTriggered) {
        if (this.stick.shot) {
            this.dailyBreakCollisionTriggered = true;
            console.log("💥 Daily Break Shot Triggered! Forcing outcome now.");

            // Immediately force the balls into the pockets
            this.forceDailyBreakBalls();

            // Make the other balls scatter for a visual effect
            this.balls.forEach(ball => {
                if (ball !== this.whiteBall && !ball.inHole) {
                    const randomVelocity = new Vector2(Math.random() * 2000 - 1000, Math.random() * 2000 - 1000);
                    ball.velocity = randomVelocity;
                    ball.moving = true;
                }
            });

            // Stop the white ball
            this.whiteBall.stop();
            this.stick.shot = false; // Prevent normal shot logic

            // Complete the break after a short visual delay
            setTimeout(() => {
                this.handleBreakComplete();
            }, 800); // 800ms for the scatter effect to be visible

            return; // Bypass normal input handling
        }
    }
    this.stick.handleInput(delta);
};

GameWorld.prototype.update = function (delta) {
    // Daily Break Mode Logging
    const dailyBreakMode = localStorage.getItem('dailyBreakMode');
    if (dailyBreakMode === 'true' && !this.dailyBreakLogged) {
        console.log("🎯🎯🎯 DAILY BREAK MODE ACTIVE! 🎯🎯🎯");
        console.log("   dailyBreakCollisionDetected:", this.dailyBreakCollisionDetected);
        console.log("   dailyBreakShotTaken:", this.dailyBreakShotTaken);
        console.log("   White ball moving:", this.whiteBall.moving);
        this.dailyBreakLogged = true; // Log once
    }
    
    this.stick.update(delta);

    for (var i = 0 ; i < this.balls.length; i++){
        for(var j = i + 1 ; j < this.balls.length ; j++){
            this.handleCollision(this.balls[i], this.balls[j], delta);
        }
    }

    for (var i = 0 ; i < this.balls.length; i++) {
        this.balls[i].update(delta);
    }
    
    // AGGRESSIVE FORCING: Force balls after any shot is detected
    if (this.isBreakMode && this.miniGameActive && !this.ballsForced) {
        // Check if white ball was shot (indicating a shot was taken)
        if (this.whiteBall.moving || Game.policy.turnPlayed) {
            console.log("🔥 Shot detected in break mode - marking for forcing");
            this.ballsForced = true; // Mark as handled to prevent multiple calls
        }
    }

    if(!this.ballsMoving() && AI.finishedSession){
        // Check if in break mode and shot is complete
        if (this.isBreakMode && this.miniGameActive) {
            this.handleBreakComplete();
            return;
        }
        
        // AIM & SHOOT: When balls stop moving, force black ball into hole if not already forced
        if (this.isAimShootMode && this.miniGameActive && this.aimShootShotTriggered && !this.aimShootCompleted) {
            console.log("🎯 AIM & SHOOT: Balls stopped moving, forcing black ball into hole NOW!");
            this.forceBlackBallInHole();
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

    // Daily Break: Force balls on first collision with white ball
    if (localStorage.getItem('dailyBreakMode') === 'true' && !this.dailyBreakCollisionDetected) {
        const isWhiteBallCollision = (ball1 === this.whiteBall || ball2 === this.whiteBall);
        
        if (isWhiteBallCollision && dist < BALL_SIZE) {
            this.dailyBreakCollisionDetected = true;
            console.log("💥💥💥 FIRST COLLISION DETECTED! FORCING BALLS NOW!");
            
            // Force balls to roll into pockets immediately after collision
            const ballsForced = this.forceDailyBreakBalls();
            console.log("✅ Forced", ballsForced, "balls after collision");
            
            // Complete break after balls finish rolling (give them time to animate)
            setTimeout(() => {
                console.log("⏰ Completing break after ball animation...");
                this.handleBreakComplete();
            }, 3500);
        }
    }

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

    // Preserve break mode stats during reset if in break mode
    const preserveBreakStats = this.isBreakMode && this.miniGameActive;
    const ballsPocketedBackup = preserveBreakStats ? this.ballsPocketedInBreak : 0;

    for (var i = 0; i < this.balls.length; i++) {
        this.balls[i].reset();
    }

    this.stick.reset();

    // Restore break stats if needed
    if (preserveBreakStats) {
        this.ballsPocketedInBreak = ballsPocketedBackup;
    } else {
        this.ballsPocketedInBreak = 0;
        // Reset forcing flags for new game
        this.ballsForced = false;
        this.aimShootTargetForced = false;
        this.instantBallsForced = false;
        this.breakCompleted = false;
        this.dailyBreakShotTaken = false;
        this.dailyBreakCollisionDetected = false;
    }

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
    console.log("🎱 Ball potted detected! Break mode:", this.isBreakMode, "Mini game active:", this.miniGameActive);
    
    // Check if in break mode
    if (this.isBreakMode && this.miniGameActive) {
        this.ballsPocketedInBreak++;
        console.log("⚡ Break mode ball count increased to:", this.ballsPocketedInBreak);
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
    // Prevent multiple calls in same break session
    if (this.breakCompleted) {
        console.log("⚠️ Break already completed, skipping...");
        return;
    }
    
    console.log("🎯 Break complete! Checking balls pocketed...");
    
    // Check if this is daily break mode
    const isDailyBreak = localStorage.getItem('dailyBreakMode') === 'true';
    
    if (!isDailyBreak) {
        // ENSURE MINIMUM BALLS ARE FORCED (CLIENT REQUIREMENT) - only for non-daily break
        if (this.ballsPocketedInBreak < 2) {
            console.log("⚠️ Not enough balls pocketed, FORCING more balls now!");
            this.forceMinimumBalls();
        }
    }
    
    console.log(" Final balls pocketed in break:", this.ballsPocketedInBreak);
    
    // Mark break as completed
    this.breakCompleted = true;
    this.miniGameActive = false;
    localStorage.setItem('dailyBreakMode', 'false');
    
    if (!Game.miniGames) {
        Game.miniGames = new MiniGames();
    }
    
    // Show custom result for daily break with points
    if (isDailyBreak && this.dailyBreakPoints && this.dailyBreakBallsScored) {
        console.log("🎉 Showing daily break result");
        this.showDailyBreakResult(this.dailyBreakBallsScored, this.dailyBreakPoints);
        
        // Reset game after showing result
        setTimeout(() => {
            this.reset();
            this.ballsPocketedInBreak = 0;
            this.dailyBreakPoints = 0;
            this.dailyBreakBallsScored = 0;
            Game.initMenus(false);
            Game.mainMenu.active = true;
            GAME_STOPPED = true;
            console.log("🔄 Returned to main menu after daily break");
        }, 4000);
        return;
    }
    
    // Enhanced break analysis (for non-daily break modes)
    const ballsRemaining = this.analyzeBallsAfterBreak();
    const result = Game.miniGames.completeBreakShot(this.ballsPocketedInBreak);
    
    console.log("🎮 Mini game result:", result);
    
    // Add detailed ball analysis to result
    result.ballAnalysis = ballsRemaining;
    
    // Show result overlay
    this.showBreakResult(result);
    
    // Explicitly reset cue stick to starting position
    console.log("🎯 Resetting cue stick after break");
    this.stick.reset();
    this.stick.position = this.whiteBall.position.copy();
    this.stick.visible = true;
    this.stick.power = 0;
    this.stick.rotation = 0;
    
    // IMMEDIATE RESET: Reset the game immediately without delays
    this.reset(); // Reset balls and cue stick to starting positions
    this.ballsPocketedInBreak = 0; // Reset counter for next attempt
    
    // Return to main menu immediately (no delay)
    Game.initMenus(false);
    Game.mainMenu.active = true;
    GAME_STOPPED = true;
    
    console.log("🔄 Immediately returned to initial screen");
};

GameWorld.prototype.forceDailyBreakBalls = function() {
    console.log("🎲🎲🎲 FORCE DAILY BREAK BALLS CALLED! 🎲🎲🎲");

    const odds = [
        { balls: 8, weight: 3, points: 800 },   // 3% - 800 points
        { balls: 6, weight: 7, points: 500 },   // 7% - 500 points
        { balls: 5, weight: 15, points: 300 },  // 15% - 300 points
        { balls: 4, weight: 20, points: 200 },  // 20% - 200 points
        { balls: 2, weight: 25, points: 100 },  // 25% - 100 points
        { balls: 1, weight: 30, points: 50 }    // 30% - 50 points
    ];

    const totalWeight = odds.reduce((sum, o) => sum + o.weight, 0);
    const random = Math.random() * totalWeight;

    let selectedOdd = odds[odds.length - 1]; // Default to 1 ball
    let cumulativeWeight = 0;
    for(const odd of odds){
        cumulativeWeight += odd.weight;
        if(random < cumulativeWeight){
            selectedOdd = odd;
            break;
        }
    }
    
    const ballsToForce = selectedOdd.balls;
    const pointsToAward = selectedOdd.points;
    
    console.log(`🎯 Daily Break Result: ${ballsToForce} balls = ${pointsToAward} points!`);
    console.log(`📊 Total balls available:`, this.balls.length);

    // Store the points for the completion message
    this.dailyBreakPoints = pointsToAward;
    this.dailyBreakBallsScored = ballsToForce;

    // Reset counter - it will be incremented as balls actually enter pockets
    this.ballsPocketedInBreak = 0;

    // Get balls that can be pocketed (not the cue ball)
    const availableBalls = [];
    for (let i = 0; i < this.balls.length; i++) {
        const ball = this.balls[i];
        if (ball !== this.whiteBall && ball.visible && !ball.inHole) {
            availableBalls.push(ball);
        }
    }
    
    console.log(`📊 Available balls to pocket:`, availableBalls.length);
    
    // Force the selected number of balls to ROLL toward pockets (not instant)
    for (let i = 0; i < ballsToForce && i < availableBalls.length; i++) {
        const ballIndex = Math.floor(Math.random() * availableBalls.length);
        const ballToPocket = availableBalls.splice(ballIndex, 1)[0];
        
        console.log(`⚡ Sending ball #${i+1} to pocket (will increment counter when it arrives)...`);
        this.forceBallIntoPocket(ballToPocket);
    }

    console.log(`🚀 Daily Break balls rolling to pockets! Will count as they enter...`);
    return ballsToForce; // Return expected count, actual count will update as balls enter
};

// INSTANT BALL FORCING - No delays, no complex conditions
GameWorld.prototype.forceBallsInstantly = function() {
    console.log("🚀 INSTANT BALL FORCING TRIGGERED!");
    
    // Simple check - only force if in break mode
    if (!this.isBreakMode) {
        console.log("❌ Not in break mode, skipping");
        return;
    }
    
    // Prevent multiple calls in same session
    if (this.instantBallsForced) {
        console.log("✅ Balls already forced in this session");
        return;
    }
    
    // Mark as forced to prevent duplicates
    this.instantBallsForced = true;
    
    // Get guaranteed ball count (minimum 3)
    const guaranteedBalls = 3 + Math.floor(Math.random() * 3); // 3-6 balls
    console.log("🎯 FORCING", guaranteedBalls, "BALLS INSTANTLY!");
    
    // Reset any existing balls first
    this.ballsPocketedInBreak = 0;
    
    // Find available balls to force into pockets
    const availableBalls = [];
    for (let i = 1; i < this.balls.length; i++) { // Skip cue ball
        const ball = this.balls[i];
        if (ball && ball !== this.whiteBall && ball.visible) {
            ball.inHole = false; // Reset state
            ball.visible = true;
            availableBalls.push(ball);
        }
    }
    
    // Force the guaranteed number of balls
    for (let i = 0; i < Math.min(guaranteedBalls, availableBalls.length); i++) {
        const ball = availableBalls[i];
        ball.inHole = true;
        ball.visible = false;
        this.ballsPocketedInBreak++;
        console.log("⚡ FORCED ball", i+1, "into pocket!");
    }
    
    console.log("✅ INSTANT FORCING COMPLETE:", this.ballsPocketedInBreak, "balls forced!");
    
    // Complete the break after forcing balls
    setTimeout(() => {
        if (this.isBreakMode) {
            this.handleBreakComplete();
        }
    }, 1000);
};

// Guaranteed Ball Pocketing System
GameWorld.prototype.applyGuaranteedBallPocketing = function() {
    // More lenient check - force balls even if not in perfect break mode
    if (!this.isBreakMode) {
        console.log("⚠️ Not in break mode, skipping guaranteed balls");
        return 0;
    }
    
    // FORCED SCORING SYSTEM: ALWAYS force 3-6 balls regardless of player performance
    const guaranteedBalls = this.getGuaranteedBallCount();
    console.log("🎯 FORCING", guaranteedBalls, "balls to be scored (regardless of player performance)");
    
    // Count current naturally pocketed balls
    const currentPocketed = this.ballsPocketedInBreak;
    console.log("Player naturally scored:", currentPocketed, "balls");
    
    // ALWAYS OVERRIDE: Force the guaranteed number of balls regardless of natural performance
    // First, reset any naturally pocketed balls back to the table
    this.resetAllBallsToTable();
    
    // Then force the exact guaranteed number of balls to be pocketed
    const ballsToForce = guaranteedBalls;
    console.log("🎯 FORCING", ballsToForce, "balls to be pocketed automatically");
    
    // Find all available balls (not cue ball) and force the guaranteed amount
    const availableBalls = [];
    for (let i = 1; i < this.balls.length; i++) { // Skip cue ball (index 0)
        const ball = this.balls[i];
        if (ball.visible && !ball.inHole && ball !== this.whiteBall) {
            availableBalls.push(ball);
        }
    }
    
    // Force the guaranteed number of balls to be pocketed
    const ballsToPocket = Math.min(ballsToForce, availableBalls.length);
    
    // Reset counter - it will increment as balls actually reach pockets
    this.ballsPocketedInBreak = 0;
    
    for (let i = 0; i < ballsToPocket; i++) {
        const randomIndex = Math.floor(Math.random() * availableBalls.length);
        const ballToPocket = availableBalls.splice(randomIndex, 1)[0];
        
        // Force the ball to ROLL into a pocket (counter will increment when it arrives)
        this.forceBallIntoPocket(ballToPocket);
        console.log("✅ Sending ball", ballToPocket.color || ballToPocket.number, "to pocket");
    }
    
    console.log(`🚀 Sent ${ballsToPocket} balls rolling to pockets! Counter will update as they arrive.`);
    
    return ballsToPocket;
};

GameWorld.prototype.getGuaranteedBallCount = function() {
    // MINIMUM 3 BALLS GUARANTEED: Each shot guarantees AT LEAST 3 balls
    // 40% chance for 3 balls (minimum)
    // 30% chance for 4 balls (good)  
    // 20% chance for 5 balls (excellent)
    // 10% chance for 6+ balls (amazing)
    
    const random = Math.random();
    
    if (random < 0.40) {
        return 3; // 40% chance - 3 balls (MINIMUM guaranteed)
    } else if (random < 0.70) {
        return 4; // 30% chance - 4 balls (good reward)
    } else if (random < 0.90) {
        return 5; // 20% chance - 5 balls (excellent reward)
    } else {
        return 6; // 10% chance - 6 balls (amazing reward)
    }
};

GameWorld.prototype.calculateGuaranteedBalls = function(attemptNumber) {
    // Legacy function - replaced by getGuaranteedBallCount()
    return this.getGuaranteedBallCount();
};

GameWorld.prototype.resetAllBallsToTable = function() {
    // Reset all balls (except cue ball) back to visible and not in holes
    console.log("🔄 Resetting all balls back to table before forcing guaranteed balls");
    
    for (let i = 1; i < this.balls.length; i++) { // Skip cue ball (index 0)
        const ball = this.balls[i];
        if (ball !== this.whiteBall) {
            ball.inHole = false;
            ball.visible = true;
            // Reset velocity to stop any movement
            if (ball.velocity) {
                ball.velocity.x = 0;
                ball.velocity.y = 0;
            }
        }
    }
    
    // Reset break counter
    this.ballsPocketedInBreak = 0;
    console.log("✅ All balls reset to table, ready for forced scoring");
};

GameWorld.prototype.forceBallIntoPocket = function(ball) {
    // Get a random pocket position
    const pockets = [
        { x: 62, y: 62 },     // Top-left
        { x: 400, y: 50 },    // Top-center
        { x: 738, y: 62 },    // Top-right
        { x: 62, y: 438 },    // Bottom-left
        { x: 400, y: 450 },   // Bottom-center
        { x: 738, y: 438 }    // Bottom-right
    ];
    
    const randomPocket = pockets[Math.floor(Math.random() * pockets.length)];
    
    // Calculate direction to pocket
    const direction = new Vector2(randomPocket.x - ball.position.x, randomPocket.y - ball.position.y);
    const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    
    // Normalize direction and set velocity (make balls roll toward pocket)
    if (distance > 0) {
        direction.x = (direction.x / distance) * 400; // Increased speed to 400
        direction.y = (direction.y / distance) * 400;
    }
    
    ball.velocity = direction;
    ball.moving = true;
    ball.visible = true; // Keep visible while rolling
    
    // DO NOT increment counter here - only increment when ball actually reaches the pocket!
    
    console.log(`⚡ Ball rolling to pocket at (${randomPocket.x}, ${randomPocket.y})`);
    console.log(`   Current position: (${ball.position.x.toFixed(0)}, ${ball.position.y.toFixed(0)})`);
    console.log(`   Velocity set to: (${ball.velocity.x.toFixed(0)}, ${ball.velocity.y.toFixed(0)})`);
    
    // Monitor ball and pocket it when it gets close
    let checkCount = 0;
    const maxChecks = 60; // 3 seconds max
    const checkInterval = setInterval(() => {
        checkCount++;
        const distToPocket = Math.sqrt(
            Math.pow(ball.position.x - randomPocket.x, 2) + 
            Math.pow(ball.position.y - randomPocket.y, 2)
        );
        
        if (checkCount % 10 === 0) {
            console.log(`   Distance to pocket: ${distToPocket.toFixed(0)}, Ball position: (${ball.position.x.toFixed(0)}, ${ball.position.y.toFixed(0)})`);
        }
        
        if (distToPocket < 40 || !ball.moving || checkCount >= maxChecks) {
            clearInterval(checkInterval);
            
            // NOW increment the counter when ball actually enters pocket
            this.ballsPocketedInBreak++;
            
            // Now pocket the ball
            ball.position.x = randomPocket.x;
            ball.position.y = randomPocket.y;
            ball.inHole = true;
            ball.visible = false;
            ball.moving = false;
            ball.velocity = Vector2.zero;
            
            // Play sound effect
            if (Game.sound && SOUND_ON && typeof sounds !== 'undefined' && sounds.hole) {
                try {
                    const holeSound = sounds.hole.cloneNode(true);
                    holeSound.volume = 0.5;
                    holeSound.play();
                } catch (error) {
                    console.log("Sound effect error:", error);
                }
            }
            
            console.log("✅ Ball entered pocket successfully! Total pocketed:", this.ballsPocketedInBreak);
        }
    }, 50); // Check every 50ms
};

GameWorld.prototype.analyzeBallsAfterBreak = function() {
    const analysis = {
        totalBalls: this.balls.length - 1, // Exclude cue ball
        ballsPocketed: this.ballsPocketedInBreak,
        ballsRemaining: 0,
        ballsNearPockets: 0,
        ballsInClusters: 0,
        spreadQuality: 0
    };
    
    let ballPositions = [];
    
    // Analyze each ball
    for (let i = 1; i < this.balls.length; i++) { // Skip cue ball (index 0)
        const ball = this.balls[i];
        if (ball.visible && !ball.inHole) {
            analysis.ballsRemaining++;
            ballPositions.push(ball.position);
            
            // Check if near pocket
            if (this.isBallNearPocket(ball.position)) {
                analysis.ballsNearPockets++;
            }
        }
    }
    
    // Calculate spread quality (how well balls are distributed)
    analysis.spreadQuality = this.calculateSpreadQuality(ballPositions);
    
    // Detect clusters (balls close together)
    analysis.ballsInClusters = this.detectBallClusters(ballPositions);
    
    return analysis;
};

GameWorld.prototype.isBallNearPocket = function(position) {
    // Pocket positions on standard 8-ball table
    const pockets = [
        { x: 62, y: 62 },     // Top-left
        { x: 400, y: 50 },    // Top-center  
        { x: 738, y: 62 },    // Top-right
        { x: 62, y: 438 },    // Bottom-left
        { x: 400, y: 450 },   // Bottom-center
        { x: 738, y: 438 }    // Bottom-right
    ];
    
    const nearDistance = 60; // Distance to be considered "near" a pocket
    
    for (let pocket of pockets) {
        const distance = Math.sqrt(
            Math.pow(position.x - pocket.x, 2) + 
            Math.pow(position.y - pocket.y, 2)
        );
        if (distance < nearDistance) {
            return true;
        }
    }
    return false;
};

GameWorld.prototype.calculateSpreadQuality = function(ballPositions) {
    if (ballPositions.length < 2) return 0;
    
    let totalDistance = 0;
    let comparisons = 0;
    
    // Calculate average distance between all balls
    for (let i = 0; i < ballPositions.length; i++) {
        for (let j = i + 1; j < ballPositions.length; j++) {
            const distance = Math.sqrt(
                Math.pow(ballPositions[i].x - ballPositions[j].x, 2) +
                Math.pow(ballPositions[i].y - ballPositions[j].y, 2)
            );
            totalDistance += distance;
            comparisons++;
        }
    }
    
    const averageDistance = totalDistance / comparisons;
    // Normalize to a 0-100 scale (higher = better spread)
    return Math.min(100, Math.floor(averageDistance / 5));
};

GameWorld.prototype.detectBallClusters = function(ballPositions) {
    let clusteredBalls = 0;
    const clusterDistance = 80; // Balls within this distance are considered clustered
    
    for (let i = 0; i < ballPositions.length; i++) {
        let nearbyBalls = 0;
        for (let j = 0; j < ballPositions.length; j++) {
            if (i !== j) {
                const distance = Math.sqrt(
                    Math.pow(ballPositions[i].x - ballPositions[j].x, 2) +
                    Math.pow(ballPositions[i].y - ballPositions[j].y, 2)
                );
                if (distance < clusterDistance) {
                    nearbyBalls++;
                }
            }
        }
        
        // If a ball has 2+ nearby balls, it's in a cluster
        if (nearbyBalls >= 2) {
            clusteredBalls++;
        }
    }
    
    return clusteredBalls;
};

GameWorld.prototype.showDailyBreakResult = function(ballsScored, pointsAwarded) {
    console.log(`🎉 Showing Daily Break Result: ${ballsScored} balls = ${pointsAwarded} points`);
    
    // HIDE ALL GAME ELEMENTS - POOL TABLE AND CONTAINERS
    const gameCanvas = document.getElementById('gameArea');
    const screenElement = document.getElementById('screen');
    const gameCanvasContainer = document.getElementById('game-canvas-container');
    
    if (gameCanvas) {
        gameCanvas.style.display = 'none';
        console.log("🎱 Pool table canvas hidden");
    }
    if (screenElement) {
        screenElement.style.display = 'none';
        console.log("🎱 Screen element hidden");
    }
    if (gameCanvasContainer) {
        gameCanvasContainer.style.display = 'none';
        console.log("🎱 Game container hidden");
    }
    
    // Create overlay with SOLID BLACK background
    const overlay = document.createElement('div');
    overlay.id = 'daily-break-result-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #000000;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        color: white;
        box-shadow: 0 25px 50px rgba(0,0,0,0.5);
        max-width: 500px;
        animation: slideIn 0.5s ease-out;
    `;
    
    content.innerHTML = `
        <h1 style="margin: 0 0 20px 0; font-size: 36px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
            🎯 DAILY BREAK!
        </h1>
        <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; margin-bottom: 20px;">
            <div style="font-size: 18px; margin-bottom: 10px; opacity: 0.9;">Balls Scored</div>
            <div style="font-size: 64px; font-weight: bold; color: #FFD700; text-shadow: 3px 3px 6px rgba(0,0,0,0.5);">
                ${ballsScored}
            </div>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; margin-bottom: 20px;">
            <div style="font-size: 18px; margin-bottom: 10px; opacity: 0.9;">Points Earned</div>
            <div style="font-size: 72px; font-weight: bold; color: #00FF88; text-shadow: 3px 3px 6px rgba(0,0,0,0.5);">
                +${pointsAwarded}
            </div>
        </div>
        <div style="font-size: 14px; opacity: 0.8; margin-top: 20px;">
            ${this.getDailyBreakMessage(ballsScored)}
        </div>
    `;
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    // Add points to user's total
    console.log("💰💰💰 ADDING POINTS TO TOTAL 💰💰💰");
    console.log("   Points to award:", pointsAwarded);
    console.log("   Game object exists:", typeof Game !== 'undefined');
    console.log("   Game.dailyRewards exists:", typeof Game !== 'undefined' && !!Game.dailyRewards);
    
    if (typeof Game !== 'undefined' && Game.dailyRewards) {
        const oldTotal = Game.dailyRewards.totalTokens;
        console.log("   BEFORE: totalTokens =", oldTotal);
        
        // Add the points
        Game.dailyRewards.totalTokens = oldTotal + pointsAwarded;
        
        // Save to localStorage
        localStorage.setItem('totalTokens', Game.dailyRewards.totalTokens.toString());
        
        console.log("   AFTER: totalTokens =", Game.dailyRewards.totalTokens);
        console.log("   Calculation:", oldTotal, "+", pointsAwarded, "=", Game.dailyRewards.totalTokens);
        console.log("   localStorage value:", localStorage.getItem('totalTokens'));
        
        // Force update the header display
        const tokenDisplay = document.getElementById('token-balance');
        console.log("   Token display element found:", !!tokenDisplay);
        
        if (tokenDisplay) {
            const newDisplayValue = Math.round(Game.dailyRewards.totalTokens) + ' P';
            console.log("   Setting display to:", newDisplayValue);
            tokenDisplay.textContent = newDisplayValue;
            console.log("   Display now shows:", tokenDisplay.textContent);
            
            // Double check it updated
            setTimeout(() => {
                console.log("   Display check after 100ms:", document.getElementById('token-balance').textContent);
            }, 100);
        } else {
            console.error("❌ Token display element 'token-balance' not found in DOM!");
        }
    } else {
        console.error("❌ Cannot add points - Game.dailyRewards not initialized!");
        console.error("   Game exists:", typeof Game !== 'undefined');
        if (typeof Game !== 'undefined') {
            console.error("   Game.dailyRewards:", Game.dailyRewards);
        }
    }
    
    // Remove overlay after 3 seconds - don't show game elements again
    setTimeout(() => {
        if (overlay.parentNode) {
            document.body.removeChild(overlay);
        }
        // Keep game elements hidden - user will return to menu
        console.log("✅ Overlay removed, game elements remain hidden");
    }, 3000);
};

GameWorld.prototype.getDailyBreakMessage = function(ballsScored) {
    if (ballsScored === 8) return "🏆 LEGENDARY! Maximum balls scored!";
    if (ballsScored === 6) return "🌟 INCREDIBLE! Amazing break!";
    if (ballsScored === 5) return "⚡ EXCELLENT! Great shot!";
    if (ballsScored === 4) return "🔥 GREAT! Well played!";
    if (ballsScored === 2) return "💪 GOOD! Nice break!";
    return "👍 Keep practicing!";
};

GameWorld.prototype.showBreakResult = function(result) {
    // Enhanced result display with odds information
    let message = "";
    
    if (result.success) {
        message = "🎯 " + result.odds.description + "\n\n" +
                 "📊 BREAK STATISTICS:\n" +
                 "Balls Entered: " + result.ballsPocketed + "\n" +
                 "Points Earned: " + result.points + "\n" +
                 "Probability: " + (result.odds.probability * 100).toFixed(1) + "%\n" +
                 "Multiplier: x" + result.odds.multiplier;
        
        if (result.ballAnalysis) {
            message += "\n\n🎱 TABLE ANALYSIS:\n" +
                      "Balls remaining: " + result.ballAnalysis.ballsRemaining + "\n" +
                      "Balls near pockets: " + result.ballAnalysis.ballsNearPockets + "\n" +
                      "Spread quality: " + result.ballAnalysis.spreadQuality + "%";
        }
        
        // Add note about guaranteed balls if system was used
        if (result.ballsPocketed >= 1) {
            message += "\n\n🎲 Note: Ball assistance system ensures fair rewards!";
        }
    } else {
        message = "❌ BREAK RESULT\n\n" +
                 "Balls Entered: " + result.ballsPocketed + "\n";
        
        if (result.ballAnalysis) {
            message += "\n� WHY BALLS DIDN'T ENTER:\n";
            
            if (result.ballAnalysis.ballsInClusters > 0) {
                message += "• " + result.ballAnalysis.ballsInClusters + " balls stuck in clusters\n";
            }
            
            if (result.ballAnalysis.ballsNearPockets === 0) {
                message += "• No balls reached pocket areas\n";
                message += "• Break power may be too low\n";
            } else {
                message += "• " + result.ballAnalysis.ballsNearPockets + " balls near pockets but didn't drop\n";
                message += "• Consider different break angle\n";
            }
            
            if (result.ballAnalysis.spreadQuality < 30) {
                message += "• Poor ball spread (Quality: " + result.ballAnalysis.spreadQuality + "%)\n";
                message += "• Try hitting the lead ball more directly\n";
            }
        }
        
        if (result.ballsNotEnteredFeedback) {
            message += "\n💭 " + result.ballsNotEnteredFeedback;
        }
        
        if (result.nextAttemptHint) {
            message += "\n\n" + result.nextAttemptHint;
        }
        
        message += "\n\n" + result.message;
        
        // Encourage player for next attempt
        if (result.attempt < result.maxAttempts) {
            message += "\n\n🎯 Next attempt will have better ball assistance!";
        }
    }
    
    // Show enhanced result
    console.log("🎯 Break Result:", message);
    
    // Optional: Show quick non-blocking notification instead of blocking alert
    if (typeof rewardsDashboard !== 'undefined') {
        const shortMessage = result.success ? 
            `${result.odds.description} - ${result.ballsPocketed} balls, ${result.points} points!` :
            `${result.ballsPocketed} balls entered`;
        rewardsDashboard.showNotification(shortMessage, result.success ? 'success' : 'info');
    }
    
    // No blocking alert - return immediately
};

GameWorld.prototype.handleAimShootComplete = function() {
    this.miniGameActive = false;
    this.aimShootCompleted = true;
    
    // CLIENT REQUIREMENT: Ball rolls slowly into hole, then show points
    console.log("🎯 AIM & SHOOT SHOT DETECTED - FORCING BALL TO ROLL SLOWLY!");
    
    // FORCE BALL TO ROLL SLOWLY INTO HOLE
    this.forceBlackBallInHole();
    
    // Note: Completion will be triggered by completeAimShootShot() after ball enters hole
};

GameWorld.prototype.completeAimShootShot = function() {
    console.log("🎯 AIM & SHOOT - Ball entered hole, calculating rewards...");
    
    // Random rewards for each shot (requirement #6)
    const rewardOptions = [
        { points: 50, probability: 0.30 },   // 30% chance - 50 points
        { points: 100, probability: 0.25 },  // 25% chance - 100 points
        { points: 150, probability: 0.20 },  // 20% chance - 150 points
        { points: 200, probability: 0.15 },  // 15% chance - 200 points
        { points: 300, probability: 0.10 }   // 10% chance - 300 points
    ];
    
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedReward = rewardOptions[0];
    
    for (const reward of rewardOptions) {
        cumulativeProbability += reward.probability;
        if (random <= cumulativeProbability) {
            selectedReward = reward;
            break;
        }
    }
    
    const totalReward = selectedReward.points;
    
    // Add to daily rewards
    if (typeof DailyReward !== 'undefined') {
        DailyReward.totalTokens += totalReward;
        localStorage.setItem('totalTokens', DailyReward.totalTokens.toString());
    }
    // Add to wallet rewards if connected
    if (typeof SolanaWalletManager !== 'undefined') {
        SolanaWalletManager.addPendingReward(totalReward, "Aim & Shoot");
    }
    
    // Increment attempt counter
    const currentAttempts = parseInt(localStorage.getItem('aimShootAttempts') || '0');
    const newAttempts = currentAttempts + 1;
    localStorage.setItem('aimShootAttempts', newAttempts.toString());
    
    console.log(`✅ Shot ${newAttempts}/3 completed! Reward: ${totalReward} points`);
    
    // Show points display (requirement #2)
    this.showAimShootReward(totalReward, newAttempts);
    
    // Auto-reset after showing points (requirements #2 and #3)
    setTimeout(() => {
        if (newAttempts >= 3) {
            // After 3rd shot, show completion message (requirement #4)
            this.showAimShoot24HourMessage();
        } else {
            // Reset for next shot (requirement #3)
            this.resetAimShootForNextShot();
        }
    }, 2500); // Show points for 2.5 seconds
};

GameWorld.prototype.showAimShootReward = function(points, shotNumber) {
    console.log(`🎉 Displaying reward: ${points} points for shot ${shotNumber}/3`);
    
    // Create reward overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '50%';
    overlay.style.left = '50%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    overlay.style.color = '#FFD700';
    overlay.style.padding = '40px 60px';
    overlay.style.borderRadius = '15px';
    overlay.style.fontSize = '32px';
    overlay.style.fontWeight = 'bold';
    overlay.style.textAlign = 'center';
    overlay.style.zIndex = '10000';
    overlay.style.border = '3px solid #FFD700';
    overlay.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 20px;">🎯</div>
        <div style="margin-bottom: 15px;">Shot ${shotNumber}/3</div>
        <div style="font-size: 56px; color: #00FF00; margin: 20px 0;">+${points}</div>
        <div style="font-size: 24px; color: #FFF;">Points Earned!</div>
    `;
    
    document.body.appendChild(overlay);
    
    // Remove overlay after delay
    setTimeout(() => {
        document.body.removeChild(overlay);
    }, 2400);
};

GameWorld.prototype.showAimShoot24HourMessage = function() {
    console.log("🎯 All 3 shots completed! Showing 24-hour message...");
    
    // Create completion message overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '50%';
    overlay.style.left = '50%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    overlay.style.color = '#FFF';
    overlay.style.padding = '50px 70px';
    overlay.style.borderRadius = '20px';
    overlay.style.fontSize = '28px';
    overlay.style.fontWeight = 'bold';
    overlay.style.textAlign = 'center';
    overlay.style.zIndex = '10000';
    overlay.style.border = '3px solid #4CAF50';
    overlay.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 25px;">✅</div>
        <div style="margin-bottom: 20px; color: #4CAF50;">Congratulations!</div>
        <div style="font-size: 24px; margin-bottom: 30px;">You have completed 3 shots.</div>
        <div style="font-size: 22px; color: #FFD700;">Please come back in 24 hours to play again.</div>
    `;
    
    document.body.appendChild(overlay);
    
    // Return to menu after showing message
    setTimeout(() => {
        document.body.removeChild(overlay);
        this.returnToMainMenu();
    }, 4000);
};

GameWorld.prototype.resetAimShootForNextShot = function() {
    console.log("🔄 Resetting for next Aim & Shoot shot...");
    
    // Reset game state
    this.isAimShootMode = false;
    this.miniGameActive = false;
    this.aimShootCompleted = false;
    this.aimShootTargetForced = false;
    this.aimShootShotTriggered = false; // Reset shot trigger flag
    
    // Restart Aim & Shoot mode for next shot
    setTimeout(() => {
        if (typeof Game !== 'undefined' && Game.startAimShootGame) {
            Game.startAimShootGame();
        }
    }, 100);
};

GameWorld.prototype.returnToMainMenu = function() {
    console.log("🏠 Returning to main menu...");
    
    // Reset all game state
    this.isAimShootMode = false;
    this.miniGameActive = false;
    this.aimShootCompleted = false;
    this.aimShootTargetForced = false;
    this.aimShootShotTriggered = false; // Reset shot trigger flag
    this.isBreakMode = false;
    this.gameOver = false;
    
    // Reset game
    if (typeof Game !== 'undefined') {
        Game.initMenus(false);
        if (Game.mainMenu) {
            Game.mainMenu.active = true;
        }
        GAME_STOPPED = true;
    }
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
    
    // Log result instead of blocking alert for immediate screen reset
    console.log("=== AIM & SHOOT RESULT ===");
    console.log("Balls Potted:", ballsPotted);
    console.log("Reward:", reward, "tokens");
    console.log("Message:", ballsPotted > 0 ? "Great shooting! 🎯" : "Keep practicing! 💪");
    
    // No blocking alert - return immediately
};

GameWorld.prototype.handlePowerShotComplete = function() {
    this.miniGameActive = false;
    this.powerShotActive = false;
    
    // Apply guaranteed ball pocketing system (same as Daily Break and Aim & Shoot)
    const ballsPottedBeforeAssist = this.countPottedBalls();
    console.log("Power Shot - balls potted before assistance:", ballsPottedBeforeAssist);
    
    // Apply guaranteed ball system for Power Shot
    this.applyGuaranteedBallPocketing();
    
    // Calculate final ball count after assistance
    const ballsPotted = this.countPottedBalls();
    console.log("Power Shot - final balls potted after assistance:", ballsPotted);
    
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
    
    // Show result with guaranteed balls
    this.showPowerShotResult(ballsPotted, baseReward, doubleChance);
    
    // IMMEDIATE RESET: No delays - reset immediately as client requested
    console.log("Power Shot completed - resetting immediately");
    this.reset(); // Reset balls and cue stick to starting positions
    
    // Return to main menu immediately
    if (typeof showMobileInterface === 'function') {
        showMobileInterface();
    }
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
    
    // Log result instead of blocking alert for immediate screen reset
    console.log("=== POWER SHOT RESULT ===");
    console.log("Balls Potted:", ballsPotted);
    console.log("Reward:", reward, "tokens");
    console.log("Double Bonus:", wasDoubled);
    console.log("Message:", ballsPotted > 0 ? "Excellent power shot! ⚡" : "Try again for better results! 💪");
    
    // No blocking alert - return immediately
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

