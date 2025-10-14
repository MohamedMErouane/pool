// Diagnostic script to check sprite loading
console.log("=== NUMBERED BALL SPRITE DIAGNOSTIC ===");

setTimeout(() => {
    console.log("Checking if sprites.numberedBalls exists:", typeof sprites.numberedBalls);
    
    if (sprites.numberedBalls) {
        console.log("Numbered balls object exists. Checking individual balls:");
        for (let i = 0; i <= 15; i++) {
            const ball = sprites.numberedBalls[i];
            console.log(`Ball ${i}:`, ball ? "✅ Loaded" : "❌ Missing");
            if (ball) {
                console.log(`  - Width: ${ball.width}, Height: ${ball.height}`);
                console.log(`  - Complete: ${ball.complete}`);
            }
        }
    } else {
        console.log("❌ sprites.numberedBalls does not exist");
    }
    
    console.log("=== END DIAGNOSTIC ===");
}, 3000); // Wait 3 seconds for assets to load