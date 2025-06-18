class MultiplayerManager {
    constructor(game) {
        this.game = game;
        this.socket = io();
        this.roomCode = null;
        this.role = null;  // 'host' or 'guest'
        this.isHost = false;
        this.screenShare = new ScreenShare(game);
        this.connectionTimeout = null;
        this.setupSocketHandlers();
    }

    // Call this when the local player takes a shot
    sendShot(shotData) {
        if (!this.roomCode) return;
        this.socket.emit('playerShot', {
            roomCode: this.roomCode,
            shotData: shotData
        });
    }

    // Call this to set up multiplayer event handlers
    setupSocketHandlers() {
        this.socket.on('connect', () => {
            console.log('Connected to server with ID:', this.socket.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.cleanup();
        });

        this.socket.on('roomCreated', (roomCode) => {
            console.log('Room created:', roomCode);
            this.roomCode = roomCode;
            this.role = 'host';
            this.isHost = true;
            
            // Update menu with room code
            Game.mainMenu.labels = generateHostMenuLabels(roomCode);
            Game.mainMenu.buttons = generateHostMenuButtons();
        });

        this.socket.on('guestJoined', () => {
            console.log('Guest joined, preparing for screen share');
            Game.mainMenu.labels = [
                new Label(
                    "Player joined! Starting game...", 
                    new Vector2(650, 300),
                    Vector2.zero,
                    "white",
                    "center",
                    "Bookman",
                    "40px"
                )
            ];
            Game.mainMenu.buttons = [];
        });

        this.socket.on('joinedRoom', (roomCode) => {
            console.log('Joined room:', roomCode);
            this.roomCode = roomCode;
            this.role = 'guest';
            this.isHost = false;
            
            // Hide game canvas for guest
            const gameCanvas = document.getElementById('screen');
            const gameArea = document.getElementById('gameArea');
            if (gameCanvas) {
                gameCanvas.style.display = 'none';
            }
            if (gameArea) {
                gameArea.style.display = 'none';
            }

            // Update menu for guest
            Game.mainMenu.labels = [
                new Label(
                    "Connected! Waiting for host...", 
                    new Vector2(650, 300),
                    Vector2.zero,
                    "white",
                    "center",
                    "Bookman",
                    "40px"
                )
            ];
            Game.mainMenu.buttons = [];
        });

        this.socket.on('joinError', (error) => {
            console.error('Join error:', error);
            alert(error);
            // Show the input field again on error
            const input = document.getElementById('roomCodeInput');
            if (input) {
                input.style.display = 'block';
                input.value = '';
            }
            Game.mainMenu.labels = generateJoinMenuLabels();
            Game.mainMenu.buttons = generateJoinMenuButtons();
        });

        this.socket.on('startGame', ({ roomCode, firstTurn }) => {
            this.roomCode = roomCode;
            this.isHost = (firstTurn === this.socket.id);
            this.game.startNewGame(); // or whatever starts the actual game board
            this.updateTurnUI();
        });

        this.socket.on('opponentShot', ({ shotData, nextTurn }) => {
            this.game.applyOpponentShot(shotData); // You must implement this in your game logic!
            this.isHost = (nextTurn === this.socket.id);
            this.updateTurnUI();
        });

        this.socket.on('startScreenShare', async () => {
            if (this.role === 'host') {
                console.log('Starting screen share process');
                try {
                    // Set a timeout for the entire connection process
                    this.setConnectionTimeout();

                    // Update host menu to show connecting status
                    Game.mainMenu.labels = [
                        new Label(
                            "Starting screen sharing...", 
                            new Vector2(650, 300),
                            Vector2.zero,
                            "white",
                            "center",
                            "Bookman",
                            "40px"
                        )
                    ];
                    Game.mainMenu.buttons = [];

                    // Initialize game state for host
                    window.CURRENT_PLAYER = 0;
                    window.AI_ON = false;
                    window.GAME_STOPPED = false;
                    Game.mainMenu.active = false;

                    // Initialize game world and policy
                    Game.gameWorld = new GameWorld();
                    Game.policy = new GamePolicy();
                    
                    // Make sure game canvas is visible and properly positioned for host
                    const gameCanvas = document.getElementById('screen');
                    if (gameCanvas) {
                        gameCanvas.style.display = 'block';
                        gameCanvas.style.zIndex = '1000';  // Ensure canvas is above video container
                    }

                    // Start the game for host
                    Game.startNewGame();

                    // Request screen sharing
                    console.log('Requesting screen share permission...');
                    const stream = await this.screenShare.requestScreenShare();
                    console.log('Screen share permission granted');
                    
                    // Initialize connection
                    await this.screenShare.initializeConnection(true, stream);
                    console.log('Connection initialized');
                    
                    // Create and send offer
                    const offer = await this.screenShare.createOffer();
                    console.log('Sending offer to guest');
                    this.socket.emit('offer', { sdp: offer });

                    // Update menu to show waiting for guest connection
                    Game.mainMenu.labels = [
                        new Label(
                            "Connecting to guest...", 
                            new Vector2(650, 300),
                            Vector2.zero,
                            "white",
                            "center",
                            "Bookman",
                            "40px"
                        )
                    ];
                } catch (error) {
                    console.error('Screen share setup error:', error);
                    this.handleError(error);
                }
            }
        });

        this.socket.on('offer', async (data) => {
            if (this.role === 'guest') {
                console.log('Received offer from host');
                try {
                    // Set a timeout for the connection process
                    this.setConnectionTimeout();

                    // Initialize game state for guest
                    window.CURRENT_PLAYER = 1;
                    window.AI_ON = false;
                    window.GAME_STOPPED = false;
                    Game.mainMenu.active = false;

                    // Hide game canvas for guest as they'll see the stream
                    const gameCanvas = document.getElementById('screen');
                    if (gameCanvas) {
                        gameCanvas.style.display = 'none';
                    }

                    // Initialize connection
                    await this.screenShare.initializeConnection(false);
                    await this.screenShare.handleOffer(data);
                    
                    // Create and send answer
                    const answer = await this.screenShare.createAnswer();
                    console.log('Sending answer to host');
                    this.socket.emit('answer', { sdp: answer });

                    // Update menu to show connecting status
                    Game.mainMenu.labels = [
                        new Label(
                            "Connecting to host's game...", 
                            new Vector2(650, 300),
                            Vector2.zero,
                            "white",
                            "center",
                            "Bookman",
                            "40px"
                        )
                    ];
                } catch (error) {
                    console.error('Guest connection error:', error);
                    this.handleError(error);
                }
            }
        });

        this.socket.on('answer', async (data) => {
            if (this.role === 'host') {
                console.log('Received answer from guest');
                try {
                    await this.screenShare.handleAnswer(data);
                    console.log('Connection established with guest');
                    
                    // Clear the timeout since connection is established
                    this.clearConnectionTimeout();
                    
                    // Ensure game canvas is visible and properly positioned
                    const gameCanvas = document.getElementById('screen');
                    if (gameCanvas) {
                        gameCanvas.style.display = 'block';
                        gameCanvas.style.zIndex = '1000';
                    }

                    // Clear any existing canvas content and redraw
                    Canvas2D.clear();
                    Game.gameWorld.draw();
                } catch (error) {
                    console.error('Host answer handling error:', error);
                    this.handleError(error);
                }
            }
        });

        this.socket.on('iceCandidate', async (data) => {
            console.log('Received ICE candidate');
            try {
                await this.screenShare.handleIceCandidate(data);
            } catch (error) {
                console.error('ICE candidate error:', error);
            }
        });

        this.socket.on('playerDisconnected', () => {
            console.log('Other player disconnected');
            this.cleanup();
            alert('Other player disconnected');
            
            // Reset to multiplayer menu
            Game.mainMenu.active = true;
            GAME_STOPPED = true;
            Game.mainMenu.labels = generateMultiplayerMenuLabels();
            Game.mainMenu.buttons = generateMultiplayerMenuButtons();
            
            // Reset display states
            const gameCanvas = document.getElementById('screen');
            if (gameCanvas) {
                gameCanvas.style.display = 'block';
            }
        });
    }

    setConnectionTimeout() {
        // Clear any existing timeout
        this.clearConnectionTimeout();
        
        // Set a longer timeout (30 seconds instead of default)
        this.connectionTimeout = setTimeout(() => {
            console.log('Connection attempt timed out');
            this.handleError(new Error('Connection timed out. Please check your firewall settings and try again.'));
        }, 30000);
    }

    clearConnectionTimeout() {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }
    }

    handleError(error) {
        console.error('Connection error:', error);
        
        // Clear any existing timeout
        this.clearConnectionTimeout();
        
        // Cleanup existing connections
        if (this.screenShare) {
            this.screenShare.cleanup();
        }

        // Show error message to user with instructions
        const errorMessage = 'Connection failed. Please ensure:\n' +
            '1. You are using a modern browser (Chrome, Firefox, or Edge)\n' +
            '2. Your firewall is not blocking WebRTC connections\n' +
            '3. You have allowed screen sharing permissions\n\n' +
            'Try refreshing the page and connecting again.';
        
        alert(errorMessage);

        // Reset the menu state
        Game.mainMenu.labels = [
            new Label(
                "Connection failed. Please try again.", 
                new Vector2(650, 300),
                Vector2.zero,
                "white",
                "center",
                "Bookman",
                "40px"
            )
        ];
        
        // Add retry button
        Game.mainMenu.buttons = [
            new Button(
                sprites.continueButton,
                new Vector2(650, 400),
                () => {
                    if (this.role === 'host') {
                        this.hostGame();
                    } else {
                        Game.mainMenu.labels = generateJoinMenuLabels();
                        Game.mainMenu.buttons = generateJoinMenuButtons();
                    }
                },
                "Try Again"
            )
        ];
    }

    cleanup() {
        this.clearConnectionTimeout();
        this.screenShare.cleanup();
        this.roomCode = null;
        this.role = null;
        this.isHost = false;
    }

    hostGame() {
        console.log('Requesting to host game...');
        // Show waiting screen before we get the room code
        Game.mainMenu.labels = generateHostMenuLabels();
        Game.mainMenu.buttons = [];
        this.socket.emit('hostGame');
    }

    joinGame(roomCode) {
        this.socket.emit('joinGame', roomCode);
    }

    async startScreenSharing() {
        if (this.role === 'host') {
            console.log('Starting screen share process');
            try {
                // Set a timeout for the entire connection process
                this.setConnectionTimeout();

                // Update host menu to show connecting status
                Game.mainMenu.labels = [
                    new Label(
                        "Starting screen sharing...", 
                        new Vector2(650, 300),
                        Vector2.zero,
                        "white",
                        "center",
                        "Bookman",
                        "40px"
                    )
                ];
                Game.mainMenu.buttons = [];

                // Request screen sharing
                console.log('Requesting screen share permission...');
                const stream = await this.screenShare.requestScreenShare();

                console.log('Screen share permission granted');
                
                // Initialize connection
                await this.screenShare.initializeConnection(true, stream);
                console.log('Connection initialized');
                
                // Create and send offer
                const offer = await this.screenShare.createOffer();
                console.log('Sending offer to guest');
                this.socket.emit('offer', { sdp: offer });

                // Notify guest that host is ready
                this.socket.emit('hostReady');

                // Update menu to show waiting for guest
                Game.mainMenu.labels = [
                    new Label(
                        "Connecting to guest...", 
                        new Vector2(650, 300),
                        Vector2.zero,
                        "white",
                        "center",
                        "Bookman",
                        "40px"
                    )
                ];
            } catch (error) {
                console.error('Screen share setup error:', error);
                this.handleError(error);
            }
        }
    }

    // Helper to check if it's our turn
    isOurTurn() {
        return this.isHost;
    }

    // Update UI to show whose turn it is
    updateTurnUI() {
        document.getElementById('queue-status').textContent = this.isHost ? "Your turn!" : "Opponent's turn!";
    }

    // Add helper methods for game state
    completeTurn(state) {
        this.socket.emit('turnComplete', this.roomCode, state);
    }
}