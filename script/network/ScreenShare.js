class ScreenShare {
    constructor(game) {
        this.game = game;
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.pendingCandidates = [];
        this.isConnectionReady = false;
        this.setupVideoElements();
    }

    setupVideoElements() {
        console.log('Setting up video elements');
        
        // Create and add styles for video display
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            #videoContainer {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: #000;
                z-index: 1000;
            }
            #remoteVideo {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                max-width: 100%;
                max-height: 100%;
                width: 1500px;
                height: 825px;
                background: #000;
            }
            #videoStatus {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                color: white;
                font-size: 20px;
                z-index: 1001;
                font-family: Arial, sans-serif;
                background: rgba(0,0,0,0.5);
                padding: 10px 20px;
                border-radius: 5px;
            }
        `;
        document.head.appendChild(styleSheet);

        // Remove any existing container
        const existingContainer = document.getElementById('videoContainer');
        if (existingContainer) {
            existingContainer.remove();
        }

        // Create container for video elements
        const videoContainer = document.createElement('div');
        videoContainer.id = 'videoContainer';

        // Create status display
        const statusDisplay = document.createElement('div');
        statusDisplay.id = 'videoStatus';
        statusDisplay.textContent = 'Waiting for host stream...';
        videoContainer.appendChild(statusDisplay);

        // Create remote video element
        this.remoteVideo = document.createElement('video');
        this.remoteVideo.id = 'remoteVideo';
        this.remoteVideo.autoplay = true;
        this.remoteVideo.playsInline = true;

        videoContainer.appendChild(this.remoteVideo);
        document.body.appendChild(videoContainer);
        
        // Initially hide the container
        videoContainer.style.display = 'none';
        
        console.log('Video elements setup complete');
    }

    async initializeConnection(isInitiator, stream = null) {
        console.log('Initializing WebRTC connection, isInitiator:', isInitiator);
        try {
            if (this.peerConnection) {
                console.log('Cleaning up existing connection');
                this.cleanup();
            }

            this.reconnectAttempts = 0;
            this.isConnectionReady = false;

            const configuration = {
                iceServers: [
                    { 
                        urls: [
                            'stun:stun.l.google.com:19302',
                            'stun:stun1.l.google.com:19302',
                            'stun:stun2.l.google.com:19302',
                            'stun:stun3.l.google.com:19302',
                            'stun:stun4.l.google.com:19302'
                        ]
                    },
                    {
                        urls: 'turn:openrelay.metered.ca:80',
                        username: 'openrelayproject',
                        credential: 'openrelayproject'
                    },
                    {
                        urls: 'turn:openrelay.metered.ca:443',
                        username: 'openrelayproject',
                        credential: 'openrelayproject'
                    },
                    {
                        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                        username: 'openrelayproject',
                        credential: 'openrelayproject'
                    }
                ],
                iceCandidatePoolSize: 10,
                bundlePolicy: 'max-bundle',
                rtcpMuxPolicy: 'require',
                iceTransportPolicy: 'all',
                sdpSemantics: 'unified-plan'
            };

            this.peerConnection = new RTCPeerConnection(configuration);
            
            // Add connection state monitoring
            this.peerConnection.onconnectionstatechange = () => {
                console.log('Connection state:', this.peerConnection.connectionState);
                this.handleConnectionStateChange();
            };

            this.peerConnection.oniceconnectionstatechange = () => {
                console.log('ICE state:', this.peerConnection.iceConnectionState);
                this.handleIceConnectionStateChange();
            };

            this.peerConnection.onicegatheringstatechange = () => {
                console.log('ICE gathering state:', this.peerConnection.iceGatheringState);
            };

            // Handle ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('New ICE candidate');
                    Game.network.socket.emit('iceCandidate', { candidate: event.candidate });
                }
            };

            // Handle incoming stream
            this.peerConnection.ontrack = (event) => {
                console.log('Received remote track:', event);
                if (!isInitiator && event.streams[0]) {
                    console.log('Stream received:', event.streams[0]);
                    
                    this.remoteStream = event.streams[0];
                    const videoContainer = document.getElementById('videoContainer');
                    const remoteVideo = document.getElementById('remoteVideo');
                    const statusDisplay = document.getElementById('videoStatus');
                    
                    if (videoContainer && remoteVideo) {
                        console.log('Setting up remote video display');
                        
                        // Show the video container
                        videoContainer.style.display = 'block';
                        
                        // Update status
                        if (statusDisplay) {
                            statusDisplay.textContent = 'Connecting to host stream...';
                        }

                        // Set up video stream
                        remoteVideo.srcObject = this.remoteStream;
                        
                        remoteVideo.onloadedmetadata = () => {
                            console.log('Remote video metadata loaded');
                            console.log('Video dimensions:', remoteVideo.videoWidth, 'x', remoteVideo.videoHeight);
                            
                            remoteVideo.play().then(() => {
                                console.log('Video playback started successfully');
                                if (statusDisplay) {
                                    statusDisplay.textContent = 'Connected to host game';
                                    // Hide status after a few seconds
                                    setTimeout(() => {
                                        statusDisplay.style.opacity = '0';
                                        setTimeout(() => statusDisplay.style.display = 'none', 1000);
                                    }, 3000);
                                }
                            }).catch(error => {
                                console.error('Error playing remote video:', error);
                                if (statusDisplay) {
                                    statusDisplay.textContent = 'Error: Could not play video stream';
                                }
                            });
                        };

                        // Add more event listeners for debugging
                        remoteVideo.onplay = () => {
                            console.log('Video play event fired');
                            remoteVideo.style.opacity = '1';
                        };
                        
                        remoteVideo.onplaying = () => console.log('Video playing event fired');
                        remoteVideo.onwaiting = () => console.log('Video waiting for data');
                        remoteVideo.onstalled = () => console.log('Video playback stalled');
                        
                        remoteVideo.onerror = (error) => {
                            console.error('Video playback error:', error);
                            if (statusDisplay) {
                                statusDisplay.textContent = 'Error: Video playback failed';
                            }
                        };
                    } else {
                        console.error('Video elements not found');
                    }
                }
            };

            // Add track event listener
            this.peerConnection.onaddstream = (event) => {
                console.log('Stream added:', event.stream);
            };

            // If host, add stream
            if (isInitiator && stream) {
                console.log('Adding local stream');
                this.localStream = stream;
                stream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, stream);
                });

                stream.getVideoTracks()[0].onended = () => {
                    console.log('Screen sharing ended by user');
                    Game.network.handleError(new Error('Screen sharing ended'));
                };
            }

            this.isConnectionReady = true;
            
            // Process any pending candidates
            while (this.pendingCandidates.length > 0) {
                const candidate = this.pendingCandidates.shift();
                await this.handleIceCandidate({ candidate });
            }

        } catch (error) {
            console.error('Error initializing connection:', error);
            throw error;
        }
    }

    handleConnectionStateChange() {
        if (!this.peerConnection) return;

        switch (this.peerConnection.connectionState) {
            case 'connected':
                console.log('WebRTC connection established successfully');
                Game.network.clearConnectionTimeout();
                this.reconnectAttempts = 0;
                break;
            case 'disconnected':
                console.error('WebRTC connection disconnected');
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    console.log('Attempting to reconnect...');
                    this.attemptReconnection();
                } else {
                    console.error('Max reconnection attempts reached');
                    Game.network.handleError(new Error('Connection failed after multiple attempts'));
                }
                break;
            case 'failed':
                console.error('WebRTC connection failed');
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    console.log('Attempting recovery...');
                    this.attemptReconnection();
                } else {
                    console.error('Max reconnection attempts reached');
                    Game.network.handleError(new Error('Connection failed after multiple attempts'));
                }
                break;
            case 'closed':
                console.log('WebRTC connection closed');
                break;
        }
    }

    handleIceConnectionStateChange() {
        if (!this.peerConnection) return;

        switch (this.peerConnection.iceConnectionState) {
            case 'checking':
                console.log('Checking ICE connection...');
                break;
            case 'connected':
                console.log('ICE connection established');
                break;
            case 'failed':
                console.error('ICE connection failed');
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    console.log('Attempting ICE restart...');
                    this.attemptIceRestart();
                } else {
                    console.error('Max ICE restart attempts reached');
                    Game.network.handleError(new Error('ICE connection failed after multiple attempts'));
                }
                break;
            case 'disconnected':
                console.log('ICE connection disconnected');
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    console.log('Attempting ICE restart...');
                    this.attemptIceRestart();
                } else {
                    console.error('Max ICE restart attempts reached');
                    Game.network.handleError(new Error('ICE connection failed after multiple attempts'));
                }
                break;
        }
    }

    async attemptReconnection() {
        try {
            this.reconnectAttempts++;
            console.log(`Reconnection attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}`);

            if (this.peerConnection.connectionState === 'failed' || 
                this.peerConnection.connectionState === 'disconnected') {
                const stream = this.localStream;
                await this.initializeConnection(true, stream);
                const offer = await this.createOffer();
                Game.network.socket.emit('offer', { sdp: offer });
            }
        } catch (error) {
            console.error('Reconnection attempt failed:', error);
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                Game.network.handleError(error);
            }
        }
    }

    async attemptIceRestart() {
        try {
            this.reconnectAttempts++;
            console.log(`ICE restart attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}`);

            if (this.peerConnection.iceConnectionState === 'failed' || 
                this.peerConnection.iceConnectionState === 'disconnected') {
                const offer = await this.peerConnection.createOffer({ iceRestart: true });
                await this.peerConnection.setLocalDescription(offer);
                Game.network.socket.emit('offer', { sdp: offer });
            }
        } catch (error) {
            console.error('ICE restart failed:', error);
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                this.attemptReconnection();
            }
        }
    }

    async requestScreenShare() {
        try {
            console.log('Requesting screen share...');
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                    displaySurface: 'window',
                    logicalSurface: true,
                    width: { ideal: 1500 },
                    height: { ideal: 825 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            });
            
            console.log('Screen share stream obtained:', stream);
            console.log('Stream active:', stream.active);
            console.log('Video tracks:', stream.getVideoTracks());
            
            // Ensure we got a video track
            const videoTrack = stream.getVideoTracks()[0];
            if (!videoTrack) {
                throw new Error('No video track in screen share stream');
            }
            
            console.log('Video track settings:', videoTrack.getSettings());
            
            // Set track to high priority
            if (videoTrack.priority) {
                videoTrack.priority = 'high';
            }
            
            return stream;
        } catch (error) {
            console.error('Error getting screen share:', error);
            throw error;
        }
    }

    async createOffer() {
        console.log('Creating offer');
        try {
            const offer = await this.peerConnection.createOffer({
                offerToReceiveVideo: true,
                iceRestart: true
            });
            console.log('Setting local description');
            await this.peerConnection.setLocalDescription(offer);
            return offer;
        } catch (error) {
            console.error('Error creating offer:', error);
            throw error;
        }
    }

    async createAnswer() {
        console.log('Creating answer');
        try {
            const answer = await this.peerConnection.createAnswer();
            console.log('Setting local description');
            await this.peerConnection.setLocalDescription(answer);
            return answer;
        } catch (error) {
            console.error('Error creating answer:', error);
            throw error;
        }
    }

    async handleOffer(data) {
        console.log('Handling offer from host');
        try {
            if (!this.peerConnection) {
                console.error('No peer connection available');
                throw new Error('No peer connection available');
            }
            
            // Log the offer data for debugging
            console.log('Offer SDP:', data.sdp);
            
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
            console.log('Remote description set successfully');
        } catch (error) {
            console.error('Error handling offer:', error);
            throw error;
        }
    }

    async handleAnswer(data) {
        console.log('Handling answer from guest');
        try {
            if (!this.peerConnection) {
                console.error('No peer connection available');
                throw new Error('No peer connection available');
            }

            // Log the answer data for debugging
            console.log('Answer SDP:', data.sdp);
            
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
            console.log('Remote description set successfully');
            
            // Start ICE candidate gathering if needed
            if (this.peerConnection.iceGatheringState !== 'complete') {
                console.log('ICE gathering not complete, waiting...');
            }
        } catch (error) {
            console.error('Error handling answer:', error);
            throw error;
        }
    }

    async handleIceCandidate(data) {
        try {
            if (!this.peerConnection || !this.isConnectionReady) {
                console.log('Queuing ICE candidate');
                this.pendingCandidates.push(data.candidate);
                return;
            }

            if (data.candidate) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                console.log('Added ICE candidate');
            }
        } catch (error) {
            console.error('Error handling ICE candidate:', error);
        }
    }

    cleanup() {
        console.log('Cleaning up screen share');
        
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.stop();
            });
            this.localStream = null;
        }

        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => {
                track.stop();
            });
            this.remoteStream = null;
        }

        if (this.peerConnection) {
            this.peerConnection.onicecandidate = null;
            this.peerConnection.ontrack = null;
            this.peerConnection.oniceconnectionstatechange = null;
            this.peerConnection.onconnectionstatechange = null;
            this.peerConnection.close();
            this.peerConnection = null;
        }

        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) {
            remoteVideo.srcObject = null;
        }

        const videoContainer = document.getElementById('videoContainer');
        if (videoContainer) {
            videoContainer.style.display = 'none';
        }

        this.isConnectionReady = false;
        this.pendingCandidates = [];
    }
} 