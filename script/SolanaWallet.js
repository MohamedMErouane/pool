"use strict";

/**
 * Solana Wallet Integration for Pool Game Rewards
 * Handles wallet connection, token management, and payouts
 */

function SolanaWallet() {
    this.isConnected = false;
    this.walletAddress = null;
    this.provider = null;
    this.balance = 0;
    this.pendingRewards = parseFloat(localStorage.getItem('pendingRewards')) || 0;
    this.totalEarned = parseFloat(localStorage.getItem('totalEarned')) || 0;
    
    this.initializeWallet();
}

SolanaWallet.prototype.initializeWallet = function() {
    // Check if Phantom wallet is available
    if (typeof window !== 'undefined' && window.solana && window.solana.isPhantom) {
        this.provider = window.solana;
        console.log("Phantom wallet detected");
    } else {
        console.log("Phantom wallet not detected - please install Phantom wallet");
        this.provider = null;
    }
};

// Real Phantom wallet integration - no mock provider needed

SolanaWallet.prototype.connectWallet = async function() {
    try {
        if (!this.provider) {
            throw new Error("Phantom wallet not detected. Please install Phantom wallet from https://phantom.app/");
        }
        
        const response = await this.provider.connect();
        this.walletAddress = response.publicKey.toString();
        this.isConnected = true;
        
        console.log("Connected to wallet:", this.walletAddress);
        
        // Update UI and load balance
        await this.updateBalance();
        
        return {
            success: true,
            message: "Phantom wallet connected successfully!",
            address: this.walletAddress,
            isMock: false
        };
    } catch (error) {
        console.error("Wallet connection failed:", error);
        let message = "Failed to connect wallet: " + error.message;
        
        if (error.code === 4001) {
            message = "Wallet connection was rejected by user";
        } else if (error.message.includes("not detected")) {
            message = "Phantom wallet not installed. Please install it from https://phantom.app/";
        }
        
        return {
            success: false,
            message: message
        };
    }
};

SolanaWallet.prototype.disconnectWallet = async function() {
    try {
        if (this.provider) {
            await this.provider.disconnect();
        }
        
        this.isConnected = false;
        this.walletAddress = null;
        this.balance = 0;
        
        console.log("Wallet disconnected");
        
        return {
            success: true,
            message: "Phantom wallet disconnected successfully!"
        };
    } catch (error) {
        console.error("Wallet disconnection failed:", error);
        return {
            success: false,
            message: "Failed to disconnect wallet: " + error.message
        };
    }
};

SolanaWallet.prototype.updateBalance = async function() {
    if (!this.isConnected || !this.walletAddress) return 0;
    
    try {
        // Connect to Solana devnet (change to mainnet for production)
        const connection = new solanaWeb3.Connection("https://api.devnet.solana.com", 'confirmed');
        const publicKey = new solanaWeb3.PublicKey(this.walletAddress);
        
        // Get SOL balance
        const balance = await connection.getBalance(publicKey);
        this.balance = balance / solanaWeb3.LAMPORTS_PER_SOL;
        
        console.log(`Wallet balance updated: ${this.balance} SOL`);
        return this.balance;
    } catch (error) {
        console.error("Failed to update balance:", error);
        this.balance = 0;
        return 0;
    }
};

SolanaWallet.prototype.addPendingReward = function(amount, source) {
    this.pendingRewards += amount;
    this.totalEarned += amount;
    
    localStorage.setItem('pendingRewards', this.pendingRewards.toString());
    localStorage.setItem('totalEarned', this.totalEarned.toString());
    
    return {
        added: amount,
        source: source,
        totalPending: this.pendingRewards,
        totalEarned: this.totalEarned
    };
};

SolanaWallet.prototype.claimRewards = async function() {
    if (!this.isConnected) {
        return {
            success: false,
            message: "Please connect your wallet first"
        };
    }
    
    if (this.pendingRewards <= 0) {
        return {
            success: false,
            message: "No rewards to claim"
        };
    }
    
    try {
        const claimAmount = this.pendingRewards;
        
        // Create and send actual Solana transaction
        const result = await this.sendRewardTransaction(claimAmount);
        
        if (result.success) {
            // Clear pending rewards after successful claim
            this.pendingRewards = 0;
            localStorage.setItem('pendingRewards', '0');
            
            return {
                success: true,
                message: `Successfully claimed ${claimAmount.toFixed(2)} tokens!`,
                amount: claimAmount,
                transactionId: result.transactionId
            };
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error("Failed to claim rewards:", error);
        return {
            success: false,
            message: "Failed to claim rewards: " + error.message
        };
    }
};

// Mock transaction simulation removed - using real Solana transactions

SolanaWallet.prototype.sendRewardTransaction = async function(amount) {
    try {
        // Connect to Solana devnet
        const connection = new solanaWeb3.Connection("https://api.devnet.solana.com", 'confirmed');
        
        // For this demo, we'll create a simple SOL transfer transaction
        // In production, you'd transfer your custom token instead
        const fromPubkey = new solanaWeb3.PublicKey(this.walletAddress);
        
        // Demo: Create a small SOL reward (convert tokens to SOL at 1000:1 ratio)
        const solReward = Math.floor(amount / 1000 * solanaWeb3.LAMPORTS_PER_SOL);
        
        if (solReward < 1) {
            return {
                success: false,
                error: "Reward amount too small for transaction"
            };
        }
        
        // Create transaction (this is a demo - in production you'd have a reward pool)
        const transaction = new solanaWeb3.Transaction().add(
            solanaWeb3.SystemProgram.transfer({
                fromPubkey: fromPubkey,
                toPubkey: fromPubkey, // Demo: sending to self
                lamports: solReward,
            })
        );
        
        // Get recent blockhash
        const { blockhash } = await connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = fromPubkey;
        
        // Sign and send transaction
        const signedTransaction = await this.provider.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        
        // Wait for confirmation
        await connection.confirmTransaction(signature);
        
        console.log("Reward transaction successful:", signature);
        
        return {
            success: true,
            transactionId: signature
        };
        
    } catch (error) {
        console.error("Transaction failed:", error);
        return {
            success: false,
            error: error.message
        };
    }
};

SolanaWallet.prototype.getMinimumClaimAmount = function() {
    return 10; // Minimum tokens required to claim
};

SolanaWallet.prototype.canClaim = function() {
    return this.isConnected && this.pendingRewards >= this.getMinimumClaimAmount();
};

SolanaWallet.prototype.getWalletStats = function() {
    return {
        isConnected: this.isConnected,
        address: this.walletAddress,
        balance: this.balance,
        pendingRewards: this.pendingRewards,
        totalEarned: this.totalEarned,
        canClaim: this.canClaim(),
        minimumClaim: this.getMinimumClaimAmount(),
        provider: this.provider ? "Phantom" : "Not Detected"
    };
};

// Initialize global instance
var SolanaWalletManager = new SolanaWallet();