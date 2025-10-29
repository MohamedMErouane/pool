"use strict";

/**
 * ReferralSystem - Manages referral codes, tracking, and rewards
 */
function ReferralSystem() {
    this.currentUser = null;
    this.referralCode = null;
    this.referredBy = null;
    this.referredUsers = [];
    this.totalReferralRewards = 0;
    this.initialized = false;
    
    console.log('🔗 ReferralSystem initialized');
}

// Initialize referral system for current user
ReferralSystem.prototype.initialize = function(userId = null) {
    if (this.initialized) return;
    
    this.currentUser = userId || this.generateUserId();
    this.loadReferralData();
    this.checkUrlForReferral();
    this.claimPendingRewards(); // Check for pending rewards immediately
    this.setupCrossWindowListener(); // Listen for notifications from other windows
    this.initialized = true;
    
    console.log('✅ ReferralSystem ready for user:', this.currentUser);
    console.log('📋 User referral code:', this.referralCode);
};

// Generate unique user ID if not provided
ReferralSystem.prototype.generateUserId = function() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', userId);
    }
    return userId;
};

// Generate unique referral code for user
ReferralSystem.prototype.generateReferralCode = function() {
    const prefix = 'REF';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}${timestamp}${random}`;
};

// Load referral data from localStorage
ReferralSystem.prototype.loadReferralData = function() {
    const referralData = localStorage.getItem(`referral_${this.currentUser}`);
    
    if (referralData) {
        const data = JSON.parse(referralData);
        this.referralCode = data.referralCode;
        this.referredBy = data.referredBy;
        this.referredUsers = data.referredUsers || [];
        this.totalReferralRewards = data.totalReferralRewards || 0;
    } else {
        // First time user - generate referral code
        this.referralCode = this.generateReferralCode();
        this.saveReferralData();
    }
};

// Save referral data to localStorage
ReferralSystem.prototype.saveReferralData = function() {
    const data = {
        referralCode: this.referralCode,
        referredBy: this.referredBy,
        referredUsers: this.referredUsers,
        totalReferralRewards: this.totalReferralRewards,
        lastUpdated: Date.now()
    };
    
    localStorage.setItem(`referral_${this.currentUser}`, JSON.stringify(data));
};

// Check URL for referral code
ReferralSystem.prototype.checkUrlForReferral = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode && !this.referredBy) {
        this.processReferral(refCode);
        
        // Clean URL after processing referral
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({path: newUrl}, '', newUrl);
    }
};

// Process new referral
ReferralSystem.prototype.processReferral = function(referralCode) {
    if (referralCode === this.referralCode) {
        console.log('⚠️ User cannot refer themselves');
        return false;
    }
    
    // Check if user was already referred
    if (this.referredBy) {
        console.log('⚠️ User was already referred by:', this.referredBy);
        return false;
    }
    
    // Set referrer
    this.referredBy = referralCode;
    this.saveReferralData();
    
    // Add this user to referrer's list
    this.addToReferrerList(referralCode);
    
    // Give welcome bonus to new user
    this.giveNewUserBonus();
    
    // Give referral bonus to referrer
    this.giveReferrerBonus(referralCode);
    
    console.log('✅ Referral processed successfully');
    return true;
};

// Add user to referrer's referred list
ReferralSystem.prototype.addToReferrerList = function(referrerCode) {
    // In a real app, this would be done on a server
    // For demo purposes, we'll simulate it locally
    
    const referralEntry = {
        userId: this.currentUser,
        referralCode: this.referralCode,
        joinedAt: Date.now(),
        totalEarnings: 0,
        status: 'active'
    };
    
    // Store in a global referrals list
    let globalReferrals = JSON.parse(localStorage.getItem('globalReferrals') || '{}');
    if (!globalReferrals[referrerCode]) {
        globalReferrals[referrerCode] = [];
    }
    globalReferrals[referrerCode].push(referralEntry);
    localStorage.setItem('globalReferrals', JSON.stringify(globalReferrals));
};

// Give bonus to new user
ReferralSystem.prototype.giveNewUserBonus = function() {
    const welcomeBonus = 50; // 50 tokens for joining via referral
    
    if (typeof DailyReward !== 'undefined') {
        DailyReward.totalTokens += welcomeBonus;
        localStorage.setItem('totalTokens', DailyReward.totalTokens.toString());
    }
    
    // Show special welcome modal for referred users
    this.showWelcomeModal(welcomeBonus);
};

// Show welcome modal for new referred users
ReferralSystem.prototype.showWelcomeModal = function(bonus) {
    setTimeout(() => {
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'welcome-referral-modal';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10001;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
            padding: 40px;
            border-radius: 20px;
            color: white;
            text-align: center;
            box-shadow: 0 25px 50px rgba(0,0,0,0.7);
            max-width: 400px;
            width: 90%;
            animation: bounceIn 0.5s ease-out;
        `;
        
        modalContent.innerHTML = `
            <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
            <h2 style="margin: 0 0 15px 0; font-size: 28px;">Welcome to 8Ball Arena!</h2>
            <p style="margin: 0 0 20px 0; font-size: 16px; opacity: 0.9;">
                You've been invited by a friend!
            </p>
            
            <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 15px; margin: 20px 0;">
                <div style="font-size: 24px; font-weight: bold; color: #fff200;">+${bonus} Bonus Tokens!</div>
                <div style="font-size: 14px; margin-top: 5px;">Welcome gift from your friend 🎁</div>
            </div>
            
            <div style="font-size: 14px; line-height: 1.6; margin: 20px 0; opacity: 0.9;">
                <div>✨ You're now part of the 8Ball Arena family!</div>
                <div>🎯 Start playing to earn more tokens</div>
                <div>🔗 Invite your own friends to earn rewards</div>
            </div>
            
            <button onclick="closeWelcomeReferralModal()" 
                    style="background: #28a745; color: white; border: none; padding: 15px 30px; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px;">
                🚀 Let's Play!
            </button>
        `;
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalContent);
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes bounceIn {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            const modal = document.getElementById('welcome-referral-modal');
            if (modal) modal.remove();
        }, 10000);
        
    }, 2000); // Show after 2 seconds to let the page load
};

// Give bonus to referrer
ReferralSystem.prototype.giveReferrerBonus = function(referrerCode) {
    const referrerBonus = 100; // 100 tokens for successful referral
    
    // Check if the referrer is the current user (if they're online)
    if (referrerCode === this.referralCode) {
        // The referrer is the current user, give them tokens immediately
        if (typeof DailyReward !== 'undefined') {
            DailyReward.totalTokens += referrerBonus;
            localStorage.setItem('totalTokens', DailyReward.totalTokens.toString());
        }
        this.totalReferralRewards += referrerBonus;
        this.saveReferralData();
        
        this.showNotification(`🎉 You earned ${referrerBonus} tokens from a successful referral!`, 'success');
        console.log(`💰 ${referrerBonus} tokens added directly to current user (referrer)`);
    } else {
        // Store pending rewards for when the referrer comes online
        let pendingRewards = JSON.parse(localStorage.getItem('pendingReferralRewards') || '{}');
        if (!pendingRewards[referrerCode]) {
            pendingRewards[referrerCode] = 0;
        }
        pendingRewards[referrerCode] += referrerBonus;
        localStorage.setItem('pendingReferralRewards', JSON.stringify(pendingRewards));
        
        console.log(`💰 ${referrerBonus} tokens added to referrer ${referrerCode}'s pending rewards`);
        
        // Also try to notify any other open windows/tabs of the same referrer
        this.notifyReferrerAcrossWindows(referrerCode, referrerBonus);
    }
};

// Notify referrer across different browser windows/tabs
ReferralSystem.prototype.notifyReferrerAcrossWindows = function(referrerCode, bonus) {
    // Use localStorage event to communicate between windows
    const notification = {
        type: 'referral_reward',
        referrerCode: referrerCode,
        bonus: bonus,
        timestamp: Date.now()
    };
    
    // Store notification temporarily
    localStorage.setItem('referral_notification', JSON.stringify(notification));
    
    // Remove it immediately (this triggers the storage event in other windows)
    setTimeout(() => {
        localStorage.removeItem('referral_notification');
    }, 100);
};

// Setup cross-window communication listener
ReferralSystem.prototype.setupCrossWindowListener = function() {
    // Listen for localStorage changes from other windows
    window.addEventListener('storage', (e) => {
        if (e.key === 'referral_notification' && e.newValue) {
            const notification = JSON.parse(e.newValue);
            
            // Check if this notification is for the current user
            if (notification.referrerCode === this.referralCode && notification.type === 'referral_reward') {
                this.claimReferralReward(notification.bonus);
            }
        }
    });
};

// Claim referral reward immediately
ReferralSystem.prototype.claimReferralReward = function(bonus) {
    if (typeof DailyReward !== 'undefined') {
        DailyReward.totalTokens += bonus;
        localStorage.setItem('totalTokens', DailyReward.totalTokens.toString());
    }
    
    this.totalReferralRewards += bonus;
    this.saveReferralData();
    
    this.showNotification(`🎉 You earned ${bonus} tokens from a successful referral!`, 'success');
    console.log(`💰 ${bonus} tokens added from cross-window referral notification`);
};

// Claim pending rewards (called on initialization)
ReferralSystem.prototype.claimPendingRewards = function() {
    const pendingRewards = JSON.parse(localStorage.getItem('pendingReferralRewards') || '{}');
    const myPendingRewards = pendingRewards[this.referralCode] || 0;
    
    if (myPendingRewards > 0) {
        // Add tokens to user's balance
        if (typeof DailyReward !== 'undefined') {
            DailyReward.totalTokens += myPendingRewards;
            localStorage.setItem('totalTokens', DailyReward.totalTokens.toString());
        }
        
        this.totalReferralRewards += myPendingRewards;
        this.saveReferralData();
        
        // Clear pending rewards
        delete pendingRewards[this.referralCode];
        localStorage.setItem('pendingReferralRewards', JSON.stringify(pendingRewards));
        
        this.showNotification(`💰 You received ${myPendingRewards} tokens from referrals!`, 'success');
        console.log(`💰 Claimed ${myPendingRewards} pending referral tokens`);
    }
};

// Get user's referral statistics
ReferralSystem.prototype.getReferralStats = function() {
    const globalReferrals = JSON.parse(localStorage.getItem('globalReferrals') || '{}');
    const myReferrals = globalReferrals[this.referralCode] || [];
    
    return {
        referralCode: this.referralCode,
        totalReferred: myReferrals.length,
        totalEarned: this.totalReferralRewards,
        referredUsers: myReferrals,
        referredBy: this.referredBy
    };
};

// Generate referral link
ReferralSystem.prototype.getReferralLink = function() {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?ref=${this.referralCode}`;
};

// Share referral link
ReferralSystem.prototype.shareReferral = function(platform) {
    const referralLink = this.getReferralLink();
    const message = "🎯 Join me in 8Ball Arena! Use my referral code for bonus tokens!";
    
    let shareUrl;
    switch (platform) {
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(referralLink)}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(message + ' ' + referralLink)}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(message)}`;
            break;
        default:
            this.copyToClipboard(referralLink);
            return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
};

// Generate QR code for referral link
ReferralSystem.prototype.generateQRCode = function(containerId) {
    const referralLink = this.getReferralLink();
    console.log('🔗 Generating QR code for:', referralLink);
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('QR container not found:', containerId);
        return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    // Check if QRCode library is available
    console.log('QRCode library check:', typeof QRCode);
    
    if (typeof QRCode !== 'undefined') {
        try {
            console.log('✅ QRCode library found, generating...');
            
            // Create a canvas element
            const canvas = document.createElement('canvas');
            container.appendChild(canvas);
            
            // Generate QR code on the canvas
            QRCode.toCanvas(canvas, referralLink, {
                width: 180,
                height: 180,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            }, function (error) {
                if (error) {
                    console.error('❌ QR Code generation failed:', error);
                    container.innerHTML = `
                        <div style="color: #ff6b6b; text-align: center; padding: 20px;">
                            <div style="font-size: 48px;">📱</div>
                            <div>QR Code Error</div>
                            <div style="font-size: 12px; margin-top: 5px;">Copy link instead</div>
                        </div>
                    `;
                } else {
                    console.log('✅ QR Code generated successfully');
                }
            });
        } catch (error) {
            console.error('❌ QR Code creation error:', error);
            // Try alternative approach with QR API
            this.generateQRCodeWithAPI(container, referralLink);
        }
    } else {
        console.warn('⚠️ QRCode library not loaded, trying alternative method');
        // Use online QR code API as fallback
        this.generateQRCodeWithAPI(container, referralLink);
    }
};

// Alternative QR code generation using online API
ReferralSystem.prototype.generateQRCodeWithAPI = function(container, url) {
    console.log('🌐 Generating QR code using API fallback');
    
    try {
        // Use QR Server API as fallback
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
        
        const img = document.createElement('img');
        img.src = qrUrl;
        img.style.cssText = 'width: 180px; height: 180px; border-radius: 8px;';
        img.alt = 'Referral QR Code';
        
        img.onload = function() {
            console.log('✅ QR Code loaded via API');
            container.innerHTML = '';
            container.appendChild(img);
        };
        
        img.onerror = function() {
            console.error('❌ API QR Code failed');
            container.innerHTML = `
                <div style="color: #ffd700; text-align: center; padding: 20px;">
                    <div style="font-size: 48px;">📱</div>
                    <div>Use Link Instead</div>
                    <div style="font-size: 12px; margin-top: 5px;">QR temporarily unavailable</div>
                </div>
            `;
        };
        
        // Show loading while image loads
        container.innerHTML = `
            <div style="color: #17a2b8; text-align: center; padding: 20px;">
                <div style="font-size: 48px;">⏳</div>
                <div>Loading QR Code...</div>
                <div style="font-size: 12px; margin-top: 5px;">Please wait</div>
            </div>
        `;
        
    } catch (error) {
        console.error('❌ API QR Code generation failed:', error);
        container.innerHTML = `
            <div style="color: #ff6b6b; text-align: center; padding: 20px;">
                <div style="font-size: 48px;">📱</div>
                <div>Copy Link Instead</div>
                <div style="font-size: 12px; margin-top: 5px;">QR Code unavailable</div>
            </div>
        `;
    }
};

// Copy referral link to clipboard
ReferralSystem.prototype.copyToClipboard = function(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('📋 Referral link copied to clipboard!', 'success');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.showNotification('📋 Referral link copied to clipboard!', 'success');
    }
};

// Show notification
ReferralSystem.prototype.showNotification = function(message, type) {
    // Try to use existing notification system
    if (typeof rewardsDashboard !== 'undefined' && rewardsDashboard.showNotification) {
        rewardsDashboard.showNotification(message, type);
    } else {
        // Fallback to alert
        alert(message);
    }
};

// Global referral system instance
let ReferralManager = null;

// Initialize referral system immediately when script loads
if (typeof window !== 'undefined') {
    window.initializeReferralSystem = function() {
        if (!ReferralManager) {
            ReferralManager = new ReferralSystem();
            ReferralManager.initialize();
            console.log('🔗 ReferralManager initialized via window function');
        }
        return ReferralManager;
    };
    
    // Try to initialize immediately
    setTimeout(() => {
        window.initializeReferralSystem();
    }, 500);
}

// Fallback initialization when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (!ReferralManager) {
            window.initializeReferralSystem();
            console.log('🔗 ReferralManager initialized via DOMContentLoaded fallback');
        }
    }, 1000);
});