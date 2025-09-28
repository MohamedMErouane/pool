"use strict";

/**
 * Mini-Games System - Daily Break and Power Shot challenges
 */

function MiniGames() {
    this.lastPlayedDate = localStorage.getItem('lastMiniGameDate') || null;
    this.dailyBreakCompleted = false;
    this.powerShotCompleted = false;
    this.bestBreakScore = parseInt(localStorage.getItem('bestBreakScore')) || 0;
    this.bestPowerShotScore = parseInt(localStorage.getItem('bestPowerShotScore')) || 0;
    
    this.checkDailyStatus();
}

MiniGames.prototype.checkDailyStatus = function() {
    const today = new Date().toDateString();
    if (this.lastPlayedDate !== today) {
        this.dailyBreakCompleted = false;
        this.powerShotCompleted = false;
        this.lastPlayedDate = today;
        this.saveToStorage();
    } else {
        this.dailyBreakCompleted = localStorage.getItem('dailyBreakCompleted') === 'true';
        this.powerShotCompleted = localStorage.getItem('powerShotCompleted') === 'true';
    }
};

/**
 * Daily Break Mini-Game
 * Player has 3 attempts to achieve the best break shot
 */
MiniGames.prototype.startDailyBreak = function() {
    if (this.dailyBreakCompleted) {
        return {
            success: false,
            message: "Daily Break already completed today!"
        };
    }
    
    // Initialize break mini-game
    const breakGame = {
        attempts: 3,
        currentAttempt: 0,
        bestScore: 0,
        balls: this.setupBreakBalls(),
        isActive: true
    };
    
    return {
        success: true,
        message: "Daily Break started! You have 3 attempts.",
        gameData: breakGame
    };
};

MiniGames.prototype.setupBreakBalls = function() {
    // Setup balls in triangle formation for break shot
    const balls = [];
    const startX = 1022;
    const startY = 354;
    const ballRadius = 15;
    const rowSpacing = ballRadius * 1.8;
    
    let ballIndex = 0;
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col <= row; col++) {
            const x = startX + (row * rowSpacing);
            const y = startY + (col * ballRadius * 2) - (row * ballRadius);
            
            let color = Color.red;
            if (ballIndex % 3 === 1) color = Color.yellow;
            if (ballIndex === 4) color = Color.black; // 8-ball in center
            
            balls.push({
                position: new Vector2(x, y),
                color: color,
                potted: false,
                index: ballIndex
            });
            ballIndex++;
        }
    }
    
    return balls;
};

MiniGames.prototype.evaluateBreakShot = function(ballsSpread, ballsPotted, cueballScratch) {
    let score = 0;
    
    // Points for ball spread (more spread = higher score)
    score += Math.min(ballsSpread * 2, 50);
    
    // Points for balls potted (excluding 8-ball and cue ball scratch)
    if (!cueballScratch) {
        score += ballsPotted * 10;
    }
    
    // Penalty for cue ball scratch
    if (cueballScratch) {
        score -= 20;
    }
    
    // Bonus for no scratch and good spread
    if (!cueballScratch && ballsSpread > 20) {
        score += 15;
    }
    
    return Math.max(score, 0);
};

MiniGames.prototype.completeDailyBreak = function(finalScore) {
    this.dailyBreakCompleted = true;
    
    let reward = {
        tokens: Math.floor(finalScore / 2),
        experience: finalScore,
        isNewRecord: false
    };
    
    if (finalScore > this.bestBreakScore) {
        this.bestBreakScore = finalScore;
        reward.isNewRecord = true;
        reward.tokens += 20; // Bonus for new record
    }
    
    // Add heat for completing mini-game
    GlobalHeatMeter.addHeatForAction('break_shot');
    
    this.saveToStorage();
    
    return {
        success: true,
        message: reward.isNewRecord ? "New record! Daily Break completed!" : "Daily Break completed!",
        score: finalScore,
        reward: reward
    };
};

/**
 * Power Shot Mini-Game
 * Player needs to pot balls with increasing power requirements
 */
MiniGames.prototype.startPowerShot = function() {
    if (this.powerShotCompleted) {
        return {
            success: false,
            message: "Power Shot already completed today!"
        };
    }
    
    const powerGame = {
        level: 1,
        maxLevel: 5,
        score: 0,
        targets: this.setupPowerShotTargets(1),
        powerThreshold: 0.6, // Minimum power required
        isActive: true
    };
    
    return {
        success: true,
        message: "Power Shot challenge started!",
        gameData: powerGame
    };
};

MiniGames.prototype.setupPowerShotTargets = function(level) {
    const targets = [];
    const numTargets = level + 1;
    
    for (let i = 0; i < numTargets; i++) {
        const angle = (i / numTargets) * 360;
        const distance = 200 + (level * 30);
        const x = 800 + Math.cos(angle * Math.PI / 180) * distance;
        const y = 400 + Math.sin(angle * Math.PI / 180) * distance;
        
        targets.push({
            position: new Vector2(x, y),
            color: level % 2 === 0 ? Color.red : Color.yellow,
            potted: false,
            value: level * 10
        });
    }
    
    return targets;
};

MiniGames.prototype.evaluatePowerShot = function(shotPower, ballPotted, level) {
    let score = 0;
    
    if (shotPower >= 0.6 && ballPotted) {
        score = level * 10;
        
        // Bonus for perfect power
        if (shotPower >= 0.9) {
            score += 5;
        }
        
        return { success: true, score: score };
    }
    
    return { success: false, score: 0 };
};

MiniGames.prototype.advancePowerShotLevel = function(currentLevel, totalScore) {
    if (currentLevel >= 5) {
        return this.completePowerShot(totalScore);
    }
    
    const nextLevel = currentLevel + 1;
    return {
        levelComplete: true,
        nextLevel: nextLevel,
        targets: this.setupPowerShotTargets(nextLevel),
        powerThreshold: 0.6 + (nextLevel * 0.05) // Increase power requirement
    };
};

MiniGames.prototype.completePowerShot = function(finalScore) {
    this.powerShotCompleted = true;
    
    let reward = {
        tokens: Math.floor(finalScore / 3),
        experience: finalScore * 2,
        isNewRecord: false
    };
    
    if (finalScore > this.bestPowerShotScore) {
        this.bestPowerShotScore = finalScore;
        reward.isNewRecord = true;
        reward.tokens += 30; // Bonus for new record
    }
    
    // Add heat for completing mini-game
    GlobalHeatMeter.addHeatForAction('power_shot');
    
    this.saveToStorage();
    
    return {
        success: true,
        message: reward.isNewRecord ? "New record! Power Shot completed!" : "Power Shot completed!",
        score: finalScore,
        reward: reward
    };
};

MiniGames.prototype.saveToStorage = function() {
    localStorage.setItem('lastMiniGameDate', this.lastPlayedDate);
    localStorage.setItem('dailyBreakCompleted', this.dailyBreakCompleted.toString());
    localStorage.setItem('powerShotCompleted', this.powerShotCompleted.toString());
    localStorage.setItem('bestBreakScore', this.bestBreakScore.toString());
    localStorage.setItem('bestPowerShotScore', this.bestPowerShotScore.toString());
};

MiniGames.prototype.getStats = function() {
    return {
        dailyBreakCompleted: this.dailyBreakCompleted,
        powerShotCompleted: this.powerShotCompleted,
        bestBreakScore: this.bestBreakScore,
        bestPowerShotScore: this.bestPowerShotScore,
        canPlayBreak: !this.dailyBreakCompleted,
        canPlayPowerShot: !this.powerShotCompleted
    };
};

// Initialize global instance
var MiniGameSystem = new MiniGames();