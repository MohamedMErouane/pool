"use strict";

/**
 * Rewards Dashboard - UI component for displaying daily rewards, heat meter, and wallet status
 */

function RewardsDashboard() {
    this.isVisible = false;
    this.element = null;
    this.updateInterval = null;
    
    this.createDashboard();
}

RewardsDashboard.prototype.createDashboard = function() {
    // Create dashboard container
    this.element = document.createElement('div');
    this.element.id = 'rewards-dashboard';
    this.element.className = 'rewards-dashboard';
    this.element.innerHTML = this.getDashboardHTML();
    
    // Add to body
    document.body.appendChild(this.element);
    
    // Bind event listeners
    this.bindEvents();
    
    // Start periodic updates
    this.startUpdateTimer();
};

RewardsDashboard.prototype.getDashboardHTML = function() {
    const dailyStats = DailyReward.getStats();
    const heatStats = GlobalHeatMeter.getStats();
    const walletStats = SolanaWalletManager.getWalletStats();
    const miniGameStats = MiniGameSystem.getStats();
    
    return `
        <div class="dashboard-header">
            <h2>🎯 Rewards Dashboard</h2>
            <button class="close-btn" onclick="rewardsDashboard.hide()">×</button>
        </div>
        
        <div class="dashboard-content">
            <!-- Daily Check-in Section -->
            <div class="reward-section daily-checkin">
                <h3>📅 Daily Check-in</h3>
                <div class="checkin-status">
                    <div class="streak-info">
                        <span class="streak-number">${dailyStats.consecutiveDays}</span>
                        <span class="streak-label">Day Streak</span>
                    </div>
                    <div class="checkin-action">
                        ${dailyStats.canCheckIn ? 
                            '<button class="checkin-btn" onclick="rewardsDashboard.performCheckIn()">Check In</button>' :
                            '<span class="already-checked">✅ Checked In Today</span>'
                        }
                    </div>
                </div>
                <div class="total-mined">
                    <span class="mined-amount">${dailyStats.totalMinedTokens.toFixed(2)}</span>
                    <span class="mined-label">Total Mined Tokens</span>
                </div>
            </div>
            
            <!-- Heat Meter Section -->
            <div class="reward-section heat-meter">
                <h3>🔥 Global Heat Meter</h3>
                <div class="heat-display">
                    <div class="heat-bar">
                        <div class="heat-fill" style="width: ${heatStats.progress}%; background-color: ${heatStats.color}"></div>
                        <span class="heat-text">${heatStats.currentHeat.toFixed(1)} / ${heatStats.maxHeat}</span>
                    </div>
                    <div class="heat-level">${heatStats.level} Level</div>
                </div>
                ${heatStats.nextThreshold ? 
                    `<div class="next-reward">Next reward at ${heatStats.nextThreshold} heat</div>` : 
                    '<div class="max-heat">🏆 Maximum heat achieved!</div>'
                }
            </div>
            
            <!-- Mini-Games Section -->
            <div class="reward-section mini-games">
                <h3>🎮 Daily Mini-Games</h3>
                <div class="minigame-grid">
                    <div class="minigame-card ${miniGameStats.dailyBreakCompleted ? 'completed' : 'available'}">
                        <h4>🎱 Daily Break</h4>
                        <div class="best-score">Best: ${miniGameStats.bestBreakScore}</div>
                        ${miniGameStats.canPlayBreak ? 
                            '<button class="play-btn" onclick="rewardsDashboard.startDailyBreak()">Play</button>' :
                            '<span class="completed-text">✅ Completed</span>'
                        }
                    </div>
                    <div class="minigame-card ${miniGameStats.powerShotCompleted ? 'completed' : 'available'}">
                        <h4>⚡ Power Shot</h4>
                        <div class="best-score">Best: ${miniGameStats.bestPowerShotScore}</div>
                        ${miniGameStats.canPlayPowerShot ? 
                            '<button class="play-btn" onclick="rewardsDashboard.startPowerShot()">Play</button>' :
                            '<span class="completed-text">✅ Completed</span>'
                        }
                    </div>
                </div>
            </div>
            
            <!-- Wallet Section -->
            <div class="reward-section wallet-section">
                <h3>💰 Solana Wallet</h3>
                <div class="wallet-info">
                    ${walletStats.isConnected ? `
                        <div class="connected-wallet">
                            <div class="wallet-address">${walletStats.address.substr(0, 8)}...${walletStats.address.substr(-6)}</div>
                            <div class="wallet-balance">Balance: ${walletStats.balance.toFixed(2)} SOL</div>
                            <div class="pending-rewards">Pending: ${walletStats.pendingRewards.toFixed(2)} tokens</div>
                            <div class="wallet-actions">
                                ${walletStats.canClaim ? 
                                    '<button class="claim-btn" onclick="rewardsDashboard.claimRewards()">Claim Rewards</button>' :
                                    `<span class="claim-info">Min ${walletStats.minimumClaim} tokens to claim</span>`
                                }
                                <button class="disconnect-btn" onclick="rewardsDashboard.disconnectWallet()">Disconnect</button>
                            </div>
                        </div>
                    ` : `
                        <div class="disconnected-wallet">
                            ${walletStats.provider === "Not Detected" ? `
                                <div class="wallet-install-prompt">
                                    <h4>🦄 Phantom Wallet Required</h4>
                                    <p>Install Phantom wallet to claim your rewards!</p>
                                    <a href="https://phantom.app/" target="_blank" class="install-btn">Install Phantom</a>
                                    <p class="install-note">After installing, refresh this page</p>
                                </div>
                            ` : `
                                <p>Connect your Phantom wallet to claim rewards</p>
                                <button class="connect-btn" onclick="rewardsDashboard.connectWallet()">Connect Phantom Wallet</button>
                            `}
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
};

RewardsDashboard.prototype.bindEvents = function() {
    // Close dashboard when clicking outside
    document.addEventListener('click', (e) => {
        if (this.isVisible && !this.element.contains(e.target) && !e.target.classList.contains('rewards-btn')) {
            this.hide();
        }
    });
};

RewardsDashboard.prototype.show = function() {
    this.isVisible = true;
    this.element.style.display = 'block';
    this.update();
};

RewardsDashboard.prototype.hide = function() {
    this.isVisible = false;
    this.element.style.display = 'none';
};

RewardsDashboard.prototype.toggle = function() {
    if (this.isVisible) {
        this.hide();
    } else {
        this.show();
    }
};

RewardsDashboard.prototype.update = function() {
    if (this.isVisible) {
        this.element.innerHTML = this.getDashboardHTML();
    }
};

RewardsDashboard.prototype.startUpdateTimer = function() {
    // Update dashboard every 30 seconds
    this.updateInterval = setInterval(() => {
        this.update();
    }, 30000);
};

// Action methods
RewardsDashboard.prototype.performCheckIn = function() {
    const result = DailyReward.performDailyCheckIn();
    
    if (result.success) {
        // Add tokens to wallet
        SolanaWalletManager.addPendingReward(result.reward, "Daily Check-in");
        
        // Add heat
        GlobalHeatMeter.addHeatForAction('daily_checkin');
        
        this.showNotification(`✅ ${result.message} Earned ${result.reward.toFixed(2)} tokens!`, 'success');
    } else {
        this.showNotification(`ℹ️ ${result.message}`, 'info');
    }
    
    this.update();
};

RewardsDashboard.prototype.startDailyBreak = function() {
    this.hide();
    const result = MiniGameSystem.startDailyBreak();
    
    if (result.success) {
        // Start the mini-game
        Game.startMiniGame('dailyBreak', result.gameData);
        this.showNotification("🎱 Daily Break started! Get the best break shot!", 'info');
    } else {
        this.showNotification(`ℹ️ ${result.message}`, 'info');
    }
};

RewardsDashboard.prototype.startPowerShot = function() {
    this.hide();
    const result = MiniGameSystem.startPowerShot();
    
    if (result.success) {
        // Start the mini-game
        Game.startMiniGame('powerShot', result.gameData);
        this.showNotification("⚡ Power Shot challenge started!", 'info');
    } else {
        this.showNotification(`ℹ️ ${result.message}`, 'info');
    }
};

RewardsDashboard.prototype.connectWallet = async function() {
    this.showNotification("🔄 Connecting to Phantom wallet...", 'info');
    const result = await SolanaWalletManager.connectWallet();
    
    if (result.success) {
        this.showNotification(`✅ ${result.message}`, 'success');
    } else {
        this.showNotification(`❌ ${result.message}`, 'error');
    }
    
    this.update();
};

RewardsDashboard.prototype.disconnectWallet = async function() {
    const result = await SolanaWalletManager.disconnectWallet();
    
    if (result.success) {
        this.showNotification(`✅ ${result.message}`, 'success');
    } else {
        this.showNotification(`❌ ${result.message}`, 'error');
    }
    
    this.update();
};

RewardsDashboard.prototype.claimRewards = async function() {
    this.showNotification("🔄 Claiming rewards...", 'info');
    const result = await SolanaWalletManager.claimRewards();
    
    if (result.success) {
        this.showNotification(`💰 ${result.message}`, 'success');
    } else {
        this.showNotification(`❌ ${result.message}`, 'error');
    }
    
    this.update();
};

RewardsDashboard.prototype.showNotification = function(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
};

// Initialize global dashboard
var rewardsDashboard = new RewardsDashboard();