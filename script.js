/**
 * Created by Alic Szecsei on 1/23/2017.
 */

/*

BEE DODGER
A game about dodging bees
The story: Oprah's new show involves her kidnapping someone, locking them in a room, and then pumping bees into the room.
You play as one such victim. Your only goal: survival.

BEE TYPES
- Normal Bee
 * Flies in a direction until it hits a wall
 * Chooses a new flight direction
- Big Bee
 * Same behavior pattern as Normal Bee
 * Just, you know. Big. And slow.
- Bumble Bee
 * Flies in circles!
 * Keep track of current angle and circle position. Circle position moves similar to Normal Bee, current angle
   constantly increases.
- Honey Bee
 * Same behavior pattern as normal bee
 * Leaves a trail of Sticky Honey behind it that slows the player
- Eldritch Bee
 * Moves very slowly
 * Constantly sucks the player towards it
- Laser Bee
 * Shines a laser light towards the player; pauses for 1 second
 * Shoots towards the laser light at High Speed
 * Stays still for 3 seconds

PICKUP TYPES
Players carry 1 pickup at a time; they press SPACE to activate it. Pickups disappear after a short time; players may not
pick up any others until the current pickup's effects have worn off.

- Bee Time
 * Slows the game clock for 5 seconds
- Force Field
 * Impenetrable shield for 2 seconds; the bees just bounce right off!
- Chaff
 * All targeting effects are slightly off for 5 seconds.
- Flipper
 * All bees immediately reverse their current direction.

 */

var canvasWidth = 1100;
var canvasHeight = 600;

function Vector2(x, y) {
    this.x = x;
    this.y = y;
}

function GameObject(pos, name) {
    this.pos = pos;
    this.vel = new Vector2(0, 0);
    this.name = name;
}

var Key = {
    _pressed: {},
    _lastPressed: {},

    ENTER: 13,
    ESC: 27,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    A: 65,
    D: 68,
    S: 83,
    W: 87,

    isDown: function(keyCode) {
        return this._pressed[keyCode];
    },

    pressed: function (keyCode) {
      return this._pressed[keyCode] && undefined === this._lastPressed[keyCode];
    },

    released: function (keyCode) {
        return (undefined === this._pressed[keyCode]) && this._lastPressed[keyCode];
    },

    onKeydown: function(event) {
        this._pressed[event.keyCode] = true;
    },

    onKeyup: function(event) {
        delete this._pressed[event.keyCode];
    },

    flush: function() {
        this._lastPressed = jQuery.extend({}, this._pressed);
    }
};

// Automatically handle localStorage vs cookies; only use cookies if localStorage is unavailable.
var Options = {
    setOption: function(option, data) {
        if (typeof(Storage) !== "undefined") {
            localStorage.setItem(option, data);
        } else {
            // Sorry! No Web Storage support..
            document.cookie = option + "=" + data;
        }
    },

    getOption: function(option) {
        if (typeof(Storage) !== "undefined") {
            return localStorage.getItem(option);
        } else {
            var name = option + "=";
            var ca = document.cookie.split(';');
            for(var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return "";
        }
    }
};

function TitleScreen() {
    this.init = function() {
        this.selected = 0;
        this.menuItems = ['Start', 'Options', 'Credits'];
    };

    this.update = function(deltaTime) {
        if(Key.pressed(Key.UP) || Key.pressed(Key.W)) {
            if(this.selected != 0) {
                this.selected -= 1;
            }
        }
        if(Key.pressed(Key.DOWN) || Key.pressed(Key.S)) {
            if(this.selected != this.menuItems.length - 1) {
                this.selected += 1;
            }
        }
        if(Key.pressed(Key.ENTER) || Key.pressed(Key.SPACE)) {
            // Selection
            if(this.selected === 0) {
                SetUpScreen(GameScreen);
            } else if(this.selected === 1) {
                SetUpScreen(OptionsScreen);
            } else if(this.selected === 2) {
                SetUpScreen(CreditsScreen);
            }
        }
    };

    this.draw = function(ctx, deltaTime) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = 'white';
        ctx.font = "64pt 'Press Start 2P'";
        const titleText = "Bee Dodger";
        ctx.fillText(titleText, (canvasWidth - ctx.measureText(titleText).width)/2, canvasHeight/2 - 50);

        ctx.font = "32px 'Press Start 2P'";
        for(var i=0; i<this.menuItems.length; i++) {
            if(i === this.selected) {
                ctx.fillStyle = 'yellow';
            } else {
                ctx.fillStyle = 'white';
            }
            ctx.fillText((i === this.selected ? "- " : "") + this.menuItems[i], 150 + (i === this.selected ? 50 : 0), 400 + (i * 50));
        }
    };
}

// TODO: Make this work.
function OptionsScreen() {
    this.init = function(prevScreen) {
        this.prevScreen = prevScreen;
    };

    this.update = function(deltaTime) {
        if(Key.pressed(Key.ENTER) || Key.pressed(Key.SPACE) || Key.pressed(Key.ESC)) {
            game = this.prevScreen;
        }
    };

    this.draw = function(ctx, deltaTime) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = 'red';
        ctx.font = "32pt 'Press Start 2P'";
        const titleText = "OPTIONS";
        ctx.fillText(titleText, (canvasWidth - ctx.measureText(titleText).width)/2, canvasHeight/2);
        ctx.fillStyle = 'yellow';
        ctx.font = "32px 'Press Start 2P'";
        const backText = "Back";
        ctx.fillText(backText, (canvasWidth - ctx.measureText(backText).width)/2, 400);
    };
}

function CreditsScreen() {
    this.init = function(prevScreen) {
        this.prevScreen = prevScreen;
        this.credits = ['Designed by Alic Szecsei', 'Artwork by Alyse Giznsky'];
    };

    this.update = function(deltaTime) {
        if(Key.pressed(Key.ENTER) || Key.pressed(Key.SPACE) || Key.pressed(Key.ESC)) {
            game = this.prevScreen;
        }
    };

    this.draw = function(ctx, deltaTime) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = 'red';
        ctx.font = "64pt 'Press Start 2P'";
        const titleText = "Bee Dodger";
        ctx.fillText(titleText, (canvasWidth - ctx.measureText(titleText).width)/2, 150);
        ctx.fillStyle = 'white';
        ctx.font = "32px 'Press Start 2P'";
        for(var i=0; i<this.credits.length; i++) {
            ctx.fillText(this.credits[i], (canvasWidth - ctx.measureText(this.credits[i]).width)/2, 250 + (i * 50));
        }
        ctx.fillStyle = 'yellow';
        ctx.font = "32px 'Press Start 2P'";
        const backText = "Back";
        ctx.fillText(backText, (canvasWidth - ctx.measureText(backText).width)/2, 400);
    };
}

function PauseScreen() {
    this.init = function(prevScreen) {
        this.prevScreen = prevScreen;
        this.selected = 0;
        this.menuItems = ['Resume', 'Options', 'Quit'];
    };

    this.update = function (deltaTime) {
        if(Key.pressed(Key.UP) || Key.pressed(Key.W)) {
            if(this.selected != 0) {
                this.selected -= 1;
            }
        }
        if(Key.pressed(Key.DOWN) || Key.pressed(Key.S)) {
            if(this.selected != this.menuItems.length - 1) {
                this.selected += 1;
            }
        }
        if(Key.pressed(Key.ENTER) || Key.pressed(Key.SPACE)) {
            // Selection
            if(this.selected === 0) {
                game = this.prevScreen;
            } else if(this.selected === 1) {
                SetUpScreen(OptionsScreen);
            } else if(this.selected === 2) {
                SetUpScreen(TitleScreen);
            }
        }
    };

    this.draw = function (ctx, deltaTime) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = 'red';
        ctx.font = "32pt 'Press Start 2P'";
        const titleText = "PAUSED";
        ctx.fillText(titleText, (canvasWidth - ctx.measureText(titleText).width)/2, canvasHeight/2);

        ctx.font = "32px 'Press Start 2P'";
        for(var i=0; i<this.menuItems.length; i++) {
            if(i === this.selected) {
                ctx.fillStyle = 'yellow';
            } else {
                ctx.fillStyle = 'white';
            }
            ctx.fillText(this.menuItems[i], (canvasWidth - ctx.measureText(this.menuItems[i]).width)/2, 400 + (i * 50));
        }
    };
}

function GameScreen() {
    this.init = function() {

    };

    this.update = function(deltaTime) {
        if(Key.isDown(Key.ESC)) {
            SetUpScreen(PauseScreen);
        }
    };

    this.draw = function(ctx, deltaTime) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(resources.bgImg, 0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = 'white';
        ctx.font = "64pt 'Press Start 2P'";
        const titleText = "GAME GAME GAME";
        ctx.fillText(titleText, (canvasWidth - ctx.measureText(titleText).width)/2, canvasHeight/2);
    };
}

var game;
var resources = {};

function SetUpScreen(screen) {
    var oldGame = game;
    game = new screen();
    game.init(oldGame);
}

SetUpScreen(TitleScreen);

$(function() {
    var body = $("body");
    var blackColor = "#000";
    var whiteColor = "#fff";
    body.html("<br /><br /><br /><p><canvas id='canvas' width='1100' height='600'></canvas></p>");
    body.css("background", blackColor);
    body.css('color', whiteColor);
    var qCanvas = $("#canvas");
    var canvas = qCanvas.get(0);
    qCanvas.css("background", blackColor);
    qCanvas.css("display", "block");
    qCanvas.css("margin", "0 auto 0 auto");
    // qCanvas.css("border", "1px solid white");
    var ctx = canvas.getContext("2d", {alpha: false});
    ctx.imageSmoothingEnabled = false;
    ctx.textBaseline="middle";
    var FPS = 30;

    CanvasRenderingContext2D.prototype.wrapText = function (text, x, y, maxWidth, lineHeight) {
        var lines = text.split("\n");
        for (var i = 0; i < lines.length; i++) {
            var words = lines[i].split(' ');
            var line = '';

            for (var n = 0; n < words.length; n++) {
                var testLine = line + words[n] + ' ';
                var metrics = this.measureText(testLine);
                var testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    this.fillText(line, x, y);
                    line = words[n] + ' ';
                    y += lineHeight;
                }
                else {
                    line = testLine;
                }
            }

            this.fillText(line, x, y);
            y += lineHeight;
        }
    };

    /* load all resources */
    resources.bgImg = new Image();
    resources.bgImg.src = "sprites/bg.png";
    WebFont.load({
        google: {
            families: ['Press Start 2P']
        }
    });

    window.requestAnimationFrame = window.requestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.msRequestAnimationFrame
        || function(f){return setTimeout(f, 1000/60, 1000/60)}; // simulate calling code 60

    var last = -1;

    const showFPS = true;
    var fpsList = [0];

    window.addEventListener('keyup', function(event) { if(Key.isDown(event.keyCode)) { Key.onKeyup(event); } event.preventDefault(); }, false);
    window.addEventListener('keydown', function(event) { if(!Key.isDown(event.keyCode)) { Key.onKeydown(event); } event.preventDefault(); }, false);

    function gameloop(ts) {
        var inc = 0;
        if(last === -1) {
            last = ts;
        } else {
            inc = ts - last;
            last = ts;
        }

        // Key.flush();

        game.update(inc);
        game.draw(ctx, inc);

        /* FPS Counter */
        if(showFPS) {
            fpsList.push(inc);
            if(fpsList.length > 10) {
                fpsList.shift();
                ctx.fillStyle = 'white';
                ctx.font = "16pt 'Press Start 2P'";
                var avgFPS = fpsList.reduce(function(x, y) { return x + y; }, 0) / 10;
                ctx.fillText("FPS: " + (1000 / avgFPS).toFixed(3), 50, 50);
            }
        }

        Key.flush();

        window.requestAnimationFrame(gameloop);
    }
    window.requestAnimationFrame(gameloop);
});