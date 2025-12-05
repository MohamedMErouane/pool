function Menu(){
    
}

Menu.prototype.init = function
(
    backgroundSprite,
    labels,
    buttons,
    sound
){  
    this.background = backgroundSprite;
    this.labels = labels || [];
    this.buttons = buttons || [];
    this.sound = sound ? sound : undefined;

    this.active = false;
}

Menu.prototype.load = function(){
    // SKIP MENU if Daily Break mode is active - go straight to game!
    if (localStorage.getItem('dailyBreakMode') === 'true') {
        console.log('🎯 Daily Break mode detected - SKIPPING MENU');
        this.active = false;
        return; // Don't load menu, don't play music
    }
    
    this.sound.currentTime = 0;
    this.active = true;

    requestAnimationFrame(this.menuLoop.bind(this));
    if(SOUND_ON){
        this.sound.volume = 0.8;
    }

    this.sound.play();
}

Menu.prototype.draw = function(){

    Canvas2D._canvas.style.cursor = "auto"; 

    Canvas2D.drawImage(
        this.background, 
        Vector2.zero, 
        0, 
        1, 
        Vector2.zero
    );


    for(let i = 0 ; i < this.labels.length ; i++){
        this.labels[i].draw();
    }

    for(let i = 0 ; i < this.buttons.length ; i++){
        this.buttons[i].draw();
    }
}

Menu.prototype.handleInput = function(){

    for(let i = 0 ; i < this.buttons.length ; i++){
        this.buttons[i].handleInput();
    }
}

Menu.prototype.menuLoop = function(){
    // STOP MENU if Daily Break mode is active
    if (localStorage.getItem('dailyBreakMode') === 'true') {
        console.log('🎯 Daily Break mode - stopping menu loop');
        this.active = false;
        if (this.sound) {
            this.sound.pause();
            this.sound.currentTime = 0;
        }
        return;
    }

    if(this.active){
        this.handleInput();
        Canvas2D.clear();
        this.draw();
        Mouse.reset();
        requestAnimationFrame(this.menuLoop.bind(this));
    }

}

