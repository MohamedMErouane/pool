"use strict";

/**
 * Heat Meter System - Global engagement tracking
 * Increases based on player activity and provides rewards
 */

function HeatMeter() {
    this.currentHeat = parseFloat(localStorage.getItem('globalHeat')) || 0;
    this.maxHeat = 100;
    this.heatDecayRate = 0.1; // Heat decreases over time when not playing
    this.lastActivity = localStorage.getItem('lastHeatActivity') || Date.now();
    this.heatRewardThresholds = [25, 50, 75, 100];
    this.claimedRewards = JSON.parse(localStorage.getItem('claimedHeatRewards')) || [];
    
    this.startDecayTimer();
}

HeatMeter.prototype.addHeat = function(amount, activity) {
    const previousHeat = this.currentHeat;
    this.currentHeat = Math.min(this.currentHeat + amount, this.maxHeat);
    this.lastActivity = Date.now();
    
    this.saveToStorage();
    
    // Check for threshold rewards
    const rewardsEarned = this.checkThresholdRewards(previousHeat, this.currentHeat);
    
    return {
        heatAdded: amount,
        currentHeat: this.currentHeat,
        activity: activity,
        rewardsEarned: rewardsEarned
    };
};

HeatMeter.prototype.addHeatForAction = function(action) {
    let heatAmount = 0;
    let activityName = "";
    
    switch(action) {
        case 'shot_taken':
            heatAmount = 0.5;
            activityName = "Shot Taken";
            break;
        case 'ball_potted':
            heatAmount = 2;
            activityName = "Ball Potted";
            break;
        case 'game_won':
            heatAmount = 5;
            activityName = "Game Won";
            break;
        case 'daily_checkin':
            heatAmount = 3;
            activityName = "Daily Check-in";
            break;
        case 'power_shot':
            heatAmount = 1.5;
            activityName = "Power Shot";
            break;
        case 'break_shot':
            heatAmount = 1;
            activityName = "Break Shot";
            break;
        case 'multiplayer_game':
            heatAmount = 3;
            activityName = "Multiplayer Game";
            break;
        default:
            heatAmount = 0.1;
            activityName = "Activity";
    }
    
    return this.addHeat(heatAmount, activityName);
};

HeatMeter.prototype.checkThresholdRewards = function(previousHeat, currentHeat) {
    const rewards = [];
    
    for (let threshold of this.heatRewardThresholds) {
        if (previousHeat < threshold && currentHeat >= threshold) {
            if (!this.claimedRewards.includes(threshold)) {
                const reward = this.getThresholdReward(threshold);
                rewards.push(reward);
                this.claimedRewards.push(threshold);
            }
        }
    }
    
    if (rewards.length > 0) {
        this.saveToStorage();
    }
    
    return rewards;
};

HeatMeter.prototype.getThresholdReward = function(threshold) {
    const rewardMapping = {
        25: { tokens: 5, item: "Bronze Cue Skin", rarity: "common" },
        50: { tokens: 15, item: "Silver Cue Skin", rarity: "uncommon" },
        75: { tokens: 30, item: "Gold Cue Skin", rarity: "rare" },
        100: { tokens: 50, item: "Diamond Cue Skin", rarity: "legendary" }
    };
    
    return {
        threshold: threshold,
        ...rewardMapping[threshold],
        timestamp: Date.now()
    };
};

HeatMeter.prototype.applyDecay = function() {
    const now = Date.now();
    const timeDiff = now - this.lastActivity;
    const hoursInactive = timeDiff / (1000 * 60 * 60);
    
    if (hoursInactive > 1) {
        const decayAmount = Math.min(hoursInactive * this.heatDecayRate, this.currentHeat);
        this.currentHeat = Math.max(this.currentHeat - decayAmount, 0);
        this.saveToStorage();
    }
};

HeatMeter.prototype.startDecayTimer = function() {
    // Apply decay every 5 minutes
    setInterval(() => {
        this.applyDecay();
    }, 5 * 60 * 1000);
};

HeatMeter.prototype.getHeatLevel = function() {
    if (this.currentHeat >= 75) return "Legendary";
    if (this.currentHeat >= 50) return "Epic"; 
    if (this.currentHeat >= 25) return "Rare";
    if (this.currentHeat >= 10) return "Uncommon";
    return "Common";
};

HeatMeter.prototype.getHeatColor = function() {
    if (this.currentHeat >= 75) return "#ff6b00";
    if (this.currentHeat >= 50) return "#ff9500"; 
    if (this.currentHeat >= 25) return "#ffbf00";
    if (this.currentHeat >= 10) return "#4CAF50";
    return "#9E9E9E";
};

HeatMeter.prototype.saveToStorage = function() {
    localStorage.setItem('globalHeat', this.currentHeat.toString());
    localStorage.setItem('lastHeatActivity', this.lastActivity.toString());
    localStorage.setItem('claimedHeatRewards', JSON.stringify(this.claimedRewards));
};

HeatMeter.prototype.getStats = function() {
    return {
        currentHeat: this.currentHeat,
        maxHeat: this.maxHeat,
        level: this.getHeatLevel(),
        color: this.getHeatColor(),
        progress: (this.currentHeat / this.maxHeat) * 100,
        nextThreshold: this.heatRewardThresholds.find(t => t > this.currentHeat) || null,
        claimedRewards: this.claimedRewards
    };
};

// Initialize global instance
var GlobalHeatMeter = new HeatMeter();