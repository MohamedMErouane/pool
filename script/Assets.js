"use strict";

var sprites = {};
var sounds = {};

Game.loadAssets = function () {
    var loadSprite = function (sprite) {
        return Game.loadSprite("assets/sprites/" + sprite);
    };
    
    var loadBallSprite = function (ballNumber) {
        return Game.loadSprite("assets/Balls/style2/" + ballNumber + ".png");
    };

     var loadSound = function (sound) {
        return new Audio("assets/sounds/" + sound);
    };

    sprites.mainMenuBackground = loadSprite("main_menu_background.png");
    sprites.background = loadSprite("spr_background4.png");
    
    // Load numbered ball sprites from style2 folder
    sprites.ball = loadBallSprite("0");        // Cue ball (white)
    sprites.redBall = loadBallSprite("3");     // Red ball example
    sprites.yellowBall = loadBallSprite("1");  // Yellow ball example  
    sprites.blackBall = loadBallSprite("8");   // 8-ball (black)
    
    // Load all numbered balls (1-15 + cue ball 0)
    sprites.ball0 = loadBallSprite("0");   // Cue ball
    sprites.ball1 = loadBallSprite("1");   // 1 ball
    sprites.ball2 = loadBallSprite("2");   // 2 ball
    sprites.ball3 = loadBallSprite("3");   // 3 ball
    sprites.ball4 = loadBallSprite("4");   // 4 ball
    sprites.ball5 = loadBallSprite("5");   // 5 ball
    sprites.ball6 = loadBallSprite("6");   // 6 ball
    sprites.ball7 = loadBallSprite("7");   // 7 ball
    sprites.ball8 = loadBallSprite("8");   // 8 ball
    sprites.ball9 = loadBallSprite("9");   // 9 ball
    sprites.ball10 = loadBallSprite("10"); // 10 ball
    sprites.ball11 = loadBallSprite("11"); // 11 ball
    sprites.ball12 = loadBallSprite("12"); // 12 ball
    sprites.ball13 = loadBallSprite("13"); // 13 ball
    sprites.ball14 = loadBallSprite("14"); // 14 ball
    sprites.ball15 = loadBallSprite("15"); // 15 ball
    
    sprites.stick = loadSprite("spr_stick.png");
    sprites.twoPlayersButton = loadSprite("2_players_button.png");
    sprites.twoPlayersButtonHover = loadSprite("2_players_button_hover.png");
    sprites.onePlayersButton = loadSprite("1_player_button.png");
    sprites.onePlayersButtonHover = loadSprite("1_player_button_hover.png");
    sprites.muteButton = loadSprite("mute_button.png");
    sprites.muteButtonHover = loadSprite("mute_button_hover.png");
    sprites.muteButtonPressed = loadSprite("mute_button_pressed.png");
    sprites.muteButtonPressedHover = loadSprite("mute_button_pressed_hover.png");
    sprites.easyButton = loadSprite("easy_button.png");
    sprites.easyButtonHover = loadSprite("easy_button_hover.png");
    sprites.mediumButton = loadSprite("medium_button.png");
    sprites.mediumButtonHover = loadSprite("medium_button_hover.png");
    sprites.hardButton = loadSprite("hard_button.png");
    sprites.hardButtonHover = loadSprite("hard_button_hover.png");
    sprites.backButton = loadSprite("back_button.png");
    sprites.backButtonHover = loadSprite("back_button_hover.png");
    sprites.continueButton = loadSprite("continue_button.png");
    sprites.continueButtonHover = loadSprite("continue_button_hover.png");
    sprites.insaneButton = loadSprite("insane_button.png");
    sprites.insaneButtonHover = loadSprite("insane_button_hover.png");
    sprites.aboutButton = loadSprite("about_button.png");
    sprites.aboutButtonHover = loadSprite("about_button_hover.png");
    sprites.controls = loadSprite("controls.png");

    sounds.side = loadSound("Side.wav");
    sounds.ballsCollide = loadSound("BallsCollide.wav");
    sounds.strike = loadSound("Strike.wav");
    sounds.hole = loadSound("Hole.wav");
    
    // Bossa Antigua Kevin MacLeod (incompetech.com)
    // Licensed under Creative Commons: By Attribution 3.0 License
    // http://creativecommons.org/licenses/by/3.0/
    sounds.jazzTune = loadSound("Bossa Antigua.mp3");
}

sounds.fadeOut = function(sound) {

    var fadeAudio = setInterval(function () {

        if(GAME_STOPPED)
            return;

        // Only fade if past the fade out point or not at zero already
        if ((sound.volume >= 0.05)) {
            sound.volume -= 0.05;
        }
        else{
            sound.pause();
            clearInterval(fadeAudio);
        }
    }, 400);
}