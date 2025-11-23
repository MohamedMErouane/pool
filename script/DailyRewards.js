"use strict";

/**
 * Cue Shot Mining System - Simple Daily Check-in
 * Player hits cue ball once per day and receives reward
 */

function DailyRewards() {
    this.lastCheckIn = localStorage.getItem('lastCueShotDate') || null;
    this.totalTokens = parseFloat(localStorage.getItem('totalTokens')) || 0;
    this.dailyReward = 10; // Base tokens per day
    this.isCompletedToday = false;
    
    this.checkTodayStatus();
}

DailyRewards.prototype.checkTodayStatus = function() {
    const today = new Date().toDateString();
    this.isCompletedToday = (this.lastCheckIn === today);
};

DailyRewards.prototype.performDailyCheckIn = function() {
    if (this.isCompletedToday) {
        return {
            success: false,
            message: "Cue Shot already completed today! Come back tomorrow.",
            reward: 0
        };
    }
    
    // Set daily break mode
    localStorage.setItem('dailyBreakMode', 'true');

    const today = new Date().toDateString();
    const reward = this.dailyReward;
    
    // Complete the daily cue shot
    this.lastCheckIn = today;
    this.isCompletedToday = true;
    this.totalTokens += reward;
    
    // Save to storage
    localStorage.setItem('lastCueShotDate', today);
    localStorage.setItem('totalTokens', this.totalTokens.toString());
    
    return {
        success: true,
        message: `Daily Cue Shot completed!`,
        reward: reward,
        totalTokens: this.totalTokens
    };
};

DailyRewards.prototype.getStats = function() {
    return {
        lastCheckIn: this.lastCheckIn,
        totalTokens: this.totalTokens,
        isCompletedToday: this.isCompletedToday,
        canCheckIn: !this.isCompletedToday
    };
};

// Initialize global instance
var DailyReward = new DailyRewards();