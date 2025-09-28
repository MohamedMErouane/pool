"use strict";

/**
 * Daily Rewards System for Pool Game
 * Handles daily check-ins, mining mechanics, and reward distribution
 */

function DailyRewards() {
    this.lastCheckIn = localStorage.getItem('lastCheckIn') || null;
    this.consecutiveDays = parseInt(localStorage.getItem('consecutiveDays')) || 0;
    this.totalMinedTokens = parseFloat(localStorage.getItem('totalMinedTokens')) || 0;
    this.dailyMiningRate = 10; // Base tokens per day
    this.isCheckedInToday = false;
    
    this.checkTodayStatus();
}

DailyRewards.prototype.checkTodayStatus = function() {
    const today = new Date().toDateString();
    const lastCheckIn = this.lastCheckIn;
    
    if (lastCheckIn === today) {
        this.isCheckedInToday = true;
    } else {
        this.isCheckedInToday = false;
        
        // Check if streak is broken
        if (lastCheckIn) {
            const lastDate = new Date(lastCheckIn);
            const todayDate = new Date();
            const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff > 1) {
                this.consecutiveDays = 0; // Reset streak
            }
        }
    }
};

DailyRewards.prototype.performDailyCheckIn = function() {
    if (this.isCheckedInToday) {
        return {
            success: false,
            message: "Already checked in today!",
            reward: 0
        };
    }
    
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if maintaining streak
    if (this.lastCheckIn === yesterday.toDateString()) {
        this.consecutiveDays++;
    } else {
        this.consecutiveDays = 1;
    }
    
    // Calculate reward based on consecutive days
    const baseReward = this.dailyMiningRate;
    const streakBonus = Math.min(this.consecutiveDays * 0.1, 2.0); // Max 200% bonus
    const totalReward = baseReward * (1 + streakBonus);
    
    // Update storage
    this.lastCheckIn = today;
    this.totalMinedTokens += totalReward;
    this.isCheckedInToday = true;
    
    this.saveToStorage();
    
    return {
        success: true,
        message: `Check-in successful! Day ${this.consecutiveDays} streak!`,
        reward: totalReward,
        consecutiveDays: this.consecutiveDays,
        totalTokens: this.totalMinedTokens
    };
};

DailyRewards.prototype.getCueShootingMining = function(shotAccuracy, ballsPotted) {
    // Mining based on gameplay performance
    const accuracyBonus = shotAccuracy * 0.5; // 0-0.5 tokens per shot
    const pottingBonus = ballsPotted * 2; // 2 tokens per ball potted
    const totalMined = accuracyBonus + pottingBonus;
    
    this.totalMinedTokens += totalMined;
    this.saveToStorage();
    
    return {
        mined: totalMined,
        accuracy: accuracyBonus,
        potting: pottingBonus,
        total: this.totalMinedTokens
    };
};

DailyRewards.prototype.saveToStorage = function() {
    localStorage.setItem('lastCheckIn', this.lastCheckIn);
    localStorage.setItem('consecutiveDays', this.consecutiveDays.toString());
    localStorage.setItem('totalMinedTokens', this.totalMinedTokens.toString());
};

DailyRewards.prototype.getStats = function() {
    return {
        lastCheckIn: this.lastCheckIn,
        consecutiveDays: this.consecutiveDays,
        totalMinedTokens: this.totalMinedTokens,
        isCheckedInToday: this.isCheckedInToday,
        canCheckIn: !this.isCheckedInToday
    };
};

// Initialize global instance
var DailyReward = new DailyRewards();