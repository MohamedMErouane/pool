# 🔧 Debug Instructions - Game & Wallet Issues

## **How to Test & Debug:**

### **Step 1: Open the Game**
1. Open `index.html` in your browser (Chrome/Firefox recommended)
2. Open **Developer Console** (F12 → Console tab)
3. Look for initialization messages

### **Step 2: Check Console Messages**
You should see messages like:
```
=== INITIALIZING GAME SYSTEMS ===
✅ Wallet manager initialized
✅ Daily rewards initialized
✅ Heat meter initialized
✅ Mini games initialized
=== GAME SYSTEMS STATUS ===
Game object: [object Object]
Canvas element: [HTMLCanvasElement]
Game area element: [HTMLDivElement]
Phantom wallet available: false/true
=== INITIALIZATION COMPLETE ===
```

### **Step 3: Test Wallet Connection**
1. Click "CONNECT WALLET" button
2. Check console for wallet debug messages:
```
=== WALLET CONNECTION ATTEMPT ===
Game object available: true
Game.walletManager available: true/false
Phantom wallet available: true/false
```

### **Step 4: Test Game Display**
1. Click "Aim & Shoot" button
2. Check console for game interface messages:
```
=== SHOWING GAME INTERFACE ===
Mobile interface element: [HTMLDivElement]
Game canvas container: [HTMLDivElement]
Game interface should now be visible
```

---

## **Common Issues & Solutions:**

### **🎮 Game Not Displaying:**
- **Issue**: Black screen when clicking game buttons
- **Check**: Console for canvas initialization errors
- **Fix**: The canvas should be visible in the game-canvas-container

### **💳 Wallet Not Connecting:**
- **Issue**: "Phantom Wallet Required" message
- **Check**: Install Phantom wallet extension from https://phantom.app/
- **Alternative**: Console shows direct connection attempt

### **📱 Mobile Interface Issues:**
- **Issue**: Buttons not working
- **Check**: Console for JavaScript errors
- **Fix**: All buttons should show console debug messages

---

## **What Should Work Now:**

✅ **Mobile Interface**: Blue header, heat meter, mini-game buttons
✅ **Game Display**: Canvas shows when clicking "Aim & Shoot" or "Game"
✅ **Back Button**: Returns to mobile interface
✅ **Wallet Connection**: Works with or without Phantom wallet
✅ **Console Debugging**: Detailed messages for troubleshooting

---

## **If Issues Persist:**

1. **Check Console Errors**: Look for red error messages
2. **Try Different Browser**: Chrome usually works best
3. **Clear Cache**: Hard refresh (Ctrl+F5)
4. **Check File Paths**: All scripts should load without 404 errors

**The game should now properly display the canvas and connect to wallets with detailed debugging info! 🎯**