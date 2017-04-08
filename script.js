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

const fadeInTime = 1;
const fadeOutTime = 0.5;

var audioContext;

const debug = false;

function Vector2(x, y) {
    this.x = x;
    this.y = y;
}

function SpriteSheet(sheet, frameWidth, frameHeight, numFrames, x, y, rotation, framesPerSecond) {
    this.invFPS = 1000/framesPerSecond;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.numFrames = numFrames;
    this.pos = new Vector2(x, y);
    this.frame = 0;
    this.rotation = rotation;
    this.elapsed = 0;
    
    this.update = function (deltaTime) {
        this.elapsed += deltaTime;
        if(this.elapsed >= this.invFPS) {
            this.frame++;
            this.elapsed -= this.invFPS;
        }
    };
    
    this.draw = function (ctx) {
        const mX = this.pos.x + (canvasWidth/2);
        const mY = this.pos.y * -1 + 144 + 202;

        ctx.translate(mX, mY);
        ctx.rotate(-this.rotation);
        ctx.drawImage(sheet, this.frame * this.frameWidth, 0, this.frameWidth, this.frameHeight, -this.frameWidth/2, -this.frameHeight/2, this.frameWidth, this.frameHeight);
        ctx.rotate(this.rotation);
        ctx.translate(-mX, -mY);
    };
}

function Player() {
    this.pos = new Vector2(0, 0);
    this.vel = new Vector2(0, 0);
    this.speed = 0.25;
    this.name = "Player";
    this.angle = 0;
    this.radius = 16;
    this.pickup = "";
    this.pickupttl = 0;
    this.pickupactive = false;

    this.update = function (deltaTime) {
        this.vel.x = ((Key.isDown(Key.LEFT) || Key.isDown(Key.A)) ? -1 : 0) + ((Key.isDown(Key.RIGHT) || Key.isDown(Key.D)) ? 1 : 0);
        this.vel.y = ((Key.isDown(Key.DOWN) || Key.isDown(Key.S)) ? -1 : 0) + ((Key.isDown(Key.UP) || Key.isDown(Key.W)) ? 1 : 0);

        if(this.pickupttl <= 0) {
            if(this.pickup != "" && this.pickupactive) {
                if(this.pickup === "BeeTime") {
                    // Reset the game speed
                    game.gameSpeed = 1;
                }
                this.pickup = "";
                this.pickupactive = false;
            }

            if(Key.pressed(Key.SPACE) && this.pickupttl <= 0) {
                if(this.pickup === "BeeTime") {
                    this.pickupttl = 5000;
                    // Set the game speed
                    game.gameSpeed = 0.5;
                    this.pickupactive = true;
                }
            }
        } else {
            this.pickupttl -= deltaTime / game.gameSpeed;
        }


        this.pos.x += this.vel.x * deltaTime * this.speed * (this.vel.x != 0 && this.vel.y != 0 ? Math.sqrt(2)/2 : 1);
        this.pos.y += this.vel.y * deltaTime * this.speed * (this.vel.x != 0 && this.vel.y != 0 ? Math.sqrt(2)/2 : 1);

        // collide with edges of screen
        if(Math.abs(this.pos.y) + this.radius >= 202) {
            const dist = 202 - (Math.abs(this.pos.y) + this.radius);
            if(this.pos.y < 0) {
                this.pos.y -= dist;
            } else {
                this.pos.y += dist;
            }
        }
        if(Math.abs(this.pos.x) + this.radius >= 506) {
            const dist = 506 - (Math.abs(this.pos.x) + this.radius);
            if(this.pos.x < 0) {
                this.pos.x -= dist;
            } else {
                this.pos.x += dist;
            }
        }
    };

    this.draw = function (ctx) {
        const mX = this.pos.x + (canvasWidth/2);
        const mY = this.pos.y * -1 + 144 + 202;

        if(this.vel.x != 0 || this.vel.y != 0) {
            if(Math.abs(this.vel.x) > Math.abs(this.vel.y)) {
                this.angle = Math.PI / 2;
            } else if(this.vel.x === -1 * this.vel.y) {
                this.angle = -Math.PI / 4;
            } else if(this.vel.x === this.vel.y) {
                this.angle = Math.PI / 4;
            } else if(Math.abs(this.vel.y) > Math.abs(this.vel.x)) {
                this.angle = 0;
            }
        }

        ctx.translate(mX, mY);
        ctx.rotate(this.angle);
        ctx.drawImage(resources.player, -34, -18);
        if(debug) {
            ctx.beginPath();
            ctx.fillStyle = 'green';
            ctx.arc(0, 0, this.radius, 0, 360);
            ctx.fill();
        }
        ctx.rotate(-this.angle);
        ctx.translate(-mX, -mY);
    };
}

function BasicBee() {
    this.pos = new Vector2(0, 0);
    this.vel = new Vector2(0, 0);
    this.speed = 0.2;
    this.name = "BaB";
    this.angle = 0;
    this.hasEntered = false;
    this.radius = 12;

    this.update = function (deltaTime) {
        const invNorm = 1/Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
        this.pos.x += this.vel.x * deltaTime * this.speed * invNorm;
        this.pos.y += this.vel.y * deltaTime * this.speed * invNorm;

        // We'll start the bee outside the room's bounds
        if(!this.hasEntered) {
            if(Math.abs(this.pos.y) + this.radius < 202 && Math.abs(this.pos.x) + this.radius < 506) {
                this.hasEntered = true;
            }
        } else {
            // Check for collision once we've gotten inside the room!
            // collide with edges of screen
            if(Math.abs(this.pos.y) + this.radius >= 202) {
                const dist = 202 - (Math.abs(this.pos.y) + this.radius);
                if(this.pos.y < 0) {
                    this.pos.y -= dist;
                } else {
                    this.pos.y += dist;
                }

                this.vel.y *= -1;
                this.vel.x = Math.random() * 2 - 1;
                this.vel.y = Math.random() * (this.vel.y < 0 ? -1 : 1);
            }
            if(Math.abs(this.pos.x) + this.radius >= 506) {
                const dist = 506 - (Math.abs(this.pos.x) + this.radius);
                if(this.pos.x < 0) {
                    this.pos.x -= dist;
                } else {
                    this.pos.x += dist;
                }

                this.vel.x *= -1;
                this.vel.x = Math.random() * (this.vel.x < 0 ? -1 : 1);
                this.vel.y = Math.random() * 2 - 1;
            }

            // Check collision with player
            const dx = this.pos.x - game.player.pos.x;
            const dy = this.pos.y - game.player.pos.y;
            const radDist = this.radius + game.player.radius;
            const distSq = dx * dx + dy * dy;
            if(distSq <= radDist * radDist) {
                game.isGameOver = true;
            } else {
                const dist = Math.sqrt(distSq) - (this.radius + game.player.radius);
                if(dist <= 32) {
                    game.score += (-67*dist*dist/1024 + 2*dist + 4) * deltaTime / 100;
                } else {
                    game.score += deltaTime / 100;
                }
            }
        }
    };

    this.draw = function (ctx) {
        const mX = this.pos.x + (canvasWidth/2);
        const mY = this.pos.y * -1 + 144 + 202;

        this.angle = Math.atan2(this.vel.y, this.vel.x) + Math.PI/2;

        ctx.translate(mX, mY);
        ctx.rotate(-this.angle);
        ctx.drawImage(resources.basicbee, -36, -18);
        if(debug) {
            ctx.beginPath();
            ctx.fillStyle = 'red';
            ctx.arc(0, 0, this.radius, 0, 360);
            ctx.fill();
        }
        ctx.rotate(this.angle);
        ctx.translate(-mX, -mY);
    };
}

function HoneyBee() {
    this.pos = new Vector2(0, 0);
    this.vel = new Vector2(0, 0);
    this.speed = 0.18;
    this.name = "HB";
    this.angle = 0;
    this.hasEntered = false;
    this.radius = 12;
    this.honey = [];
    this.secondsPerHoneyDrop = 1/10;
    this.timeSinceHoney = 0;
    this.isTouchingPlayer = false;
    this.slowMult = 0.4;

    this.update = function (deltaTime) {
        const invNorm = 1/Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
        this.pos.x += this.vel.x * deltaTime * this.speed * invNorm;
        this.pos.y += this.vel.y * deltaTime * this.speed * invNorm;

        // We'll start the bee outside the room's bounds
        if(!this.hasEntered) {
            if(Math.abs(this.pos.y) + this.radius < 202 && Math.abs(this.pos.x) + this.radius < 506) {
                this.hasEntered = true;
            }
        } else {
            // Check for collision once we've gotten inside the room!
            // collide with edges of screen
            if(Math.abs(this.pos.y) + this.radius >= 202) {
                const dist = 202 - (Math.abs(this.pos.y) + this.radius);
                if(this.pos.y < 0) {
                    this.pos.y -= dist;
                } else {
                    this.pos.y += dist;
                }

                this.vel.y *= -1;
                this.vel.x = Math.random() * 2 - 1;
                this.vel.y = Math.random() * (this.vel.y < 0 ? -1 : 1);
            }
            if(Math.abs(this.pos.x) + this.radius >= 506) {
                const dist = 506 - (Math.abs(this.pos.x) + this.radius);
                if(this.pos.x < 0) {
                    this.pos.x -= dist;
                } else {
                    this.pos.x += dist;
                }

                this.vel.x *= -1;
                this.vel.x = Math.random() * (this.vel.x < 0 ? -1 : 1);
                this.vel.y = Math.random() * 2 - 1;
            }

            // Check collision with player
            const dx = this.pos.x - game.player.pos.x;
            const dy = this.pos.y - game.player.pos.y;
            const radDist = this.radius + game.player.radius;
            const distSq = dx * dx + dy * dy;
            if(distSq <= radDist * radDist) {
                game.isGameOver = true;
            } else {
                const dist = Math.sqrt(distSq) - (this.radius + game.player.radius);
                if(dist <= 32) {
                    game.score += (-67*dist*dist/1024 + 2*dist + 4) * 2 * deltaTime / 100;
                } else {
                    game.score += 2 * deltaTime / 100;
                }
            }

            this.timeSinceHoney += deltaTime / 1000;
            if(this.timeSinceHoney >= this.secondsPerHoneyDrop) {
                this.honey.push(new Honey(new Vector2(this.pos.x, this.pos.y)));
                this.timeSinceHoney -= this.secondsPerHoneyDrop;
            }

            var i;

            for(i=0; i<this.honey.length; i++) {
                this.honey[i].update(deltaTime);
            }

            while(this.honey[0] && this.honey[0].isDead) {
                this.honey.shift();
            }

            var didTouch = false;
            for(i=0; i<this.honey.length; i++) {
                if(this.honey[i].isTouchingPlayer) {
                    if(!this.isTouchingPlayer) {
                        game.player.speed *= this.slowMult;
                    }
                    this.isTouchingPlayer = true;
                    didTouch = true;
                    break;
                }
            }
            if(!didTouch && this.isTouchingPlayer) {
                game.player.speed /= this.slowMult;
                this.isTouchingPlayer = false;
            }
        }
    };

    this.draw = function (ctx) {
        const mX = this.pos.x + (canvasWidth/2);
        const mY = this.pos.y * -1 + 144 + 202;

        this.angle = Math.atan2(this.vel.y, this.vel.x) + 3 * Math.PI/2;
        for(var i=0; i<this.honey.length; i++) {
            this.honey[i].draw(ctx);
        }

        ctx.translate(mX, mY);
        ctx.rotate(-this.angle);
        ctx.drawImage(resources.honeybee, -36, -18);
        if(debug) {
            ctx.beginPath();
            ctx.fillStyle = 'red';
            ctx.arc(0, 0, this.radius, 0, 360);
            ctx.fill();
        }
        ctx.rotate(this.angle);
        ctx.translate(-mX, -mY);
    };
}

function Honey(pos) {
    this.pos = pos;
    this.name = "Hon";
    this.angle = 0;
    this.radius = 12;
    this.isTouchingPlayer = false;
    this.isDead = false;
    this.spriteSheet = new SpriteSheet(resources.honey, 56, 48, 5, this.pos.x, this.pos.y, Math.random() * Math.PI * 2, 3);

    this.update = function (deltaTime) {
        // Check collision with player
        const dx = this.pos.x - game.player.pos.x;
        const dy = this.pos.y - game.player.pos.y;
        const radDist = this.radius + game.player.radius;
        const distSq = dx * dx + dy * dy;
        if(distSq <= radDist * radDist) {
            this.isTouchingPlayer = true;
        } else {
            this.isTouchingPlayer = false;
        }
        this.spriteSheet.update(deltaTime);
        if(this.spriteSheet.frame > this.spriteSheet.numFrames) {
            this.isDead = true;
        }
    };

    this.draw = function (ctx) {
        this.spriteSheet.draw(ctx);
    };
}

function BigBee() {
    this.pos = new Vector2(0, 0);
    this.vel = new Vector2(0, 0);
    this.speed = 0.05;
    this.name = "BiB";
    this.angle = 0;
    this.hasEntered = false;
    this.radius = 48;

    this.update = function (deltaTime) {
        const invNorm = 1/Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
        this.pos.x += this.vel.x * deltaTime * this.speed * invNorm;
        this.pos.y += this.vel.y * deltaTime * this.speed * invNorm;

        // We'll start the bee outside the room's bounds
        if(!this.hasEntered) {
            if(Math.abs(this.pos.y) + this.radius < 202 && Math.abs(this.pos.x) + this.radius < 506) {
                this.hasEntered = true;
            }
        } else {
            // Check for collision once we've gotten inside the room!
            // collide with edges of screen
            if(Math.abs(this.pos.y) + this.radius >= 202) {
                const dist = 202 - (Math.abs(this.pos.y) + this.radius);
                if(this.pos.y < 0) {
                    this.pos.y -= dist;
                } else {
                    this.pos.y += dist;
                }

                this.vel.y *= -1;
                this.vel.x = Math.random() * 2 - 1;
                this.vel.y = Math.random() * (this.vel.y < 0 ? -1 : 1);
            }
            if(Math.abs(this.pos.x) + this.radius >= 506) {
                const dist = 506 - (Math.abs(this.pos.x) + this.radius);
                if(this.pos.x < 0) {
                    this.pos.x -= dist;
                } else {
                    this.pos.x += dist;
                }

                this.vel.x *= -1;
                this.vel.x = Math.random() * (this.vel.x < 0 ? -1 : 1);
                this.vel.y = Math.random() * 2 - 1;
            }

            // Check collision with player
            const dx = this.pos.x - game.player.pos.x;
            const dy = this.pos.y - game.player.pos.y;
            const radDist = this.radius + game.player.radius;
            const distSq = dx * dx + dy * dy;
            if(distSq <= radDist * radDist) {
                game.isGameOver = true;
            } else {
                const dist = Math.sqrt(distSq) - (this.radius + game.player.radius);
                if(dist <= 32) {
                    game.score += (-67*dist*dist/1024 + 2*dist + 4) * 2 * deltaTime / 100;
                } else {
                    game.score += 2 * deltaTime / 100;
                }
            }
        }
    };

    this.draw = function (ctx) {
        const mX = this.pos.x + (canvasWidth/2);
        const mY = this.pos.y * -1 + 144 + 202;

        this.angle = Math.atan2(this.vel.y, this.vel.x) + Math.PI/2;

        ctx.translate(mX, mY);
        ctx.rotate(-this.angle);
        ctx.drawImage(resources.bigbee, -130, -64);
        if(debug) {
            ctx.beginPath();
            ctx.fillStyle = 'red';
            ctx.arc(0, 0, this.radius, 0, 360);
            ctx.fill();
        }
        ctx.rotate(this.angle);
        ctx.translate(-mX, -mY);
    };
}

function EldritchBee() {
    this.pos = new Vector2(0, 0);
    this.vel = new Vector2(0, 0);
    this.speed = 0.02;
    this.pullSpeed = 0.02;
    this.name = "ElB";
    this.angle = 0;
    this.hasEntered = false;
    this.radius = 48;
    this.spriteSheet = new SpriteSheet(resources.eldritchbee, 160, 164, 2, this.pos.x, this.pos.y, 0, 4);

    this.update = function (deltaTime) {
        const invNorm = 1/Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
        this.pos.x += this.vel.x * deltaTime * this.speed * invNorm;
        this.pos.y += this.vel.y * deltaTime * this.speed * invNorm;

        // We'll start the bee outside the room's bounds
        if(!this.hasEntered) {
            if(Math.abs(this.pos.y) + this.radius < 202 && Math.abs(this.pos.x) + this.radius < 506) {
                this.hasEntered = true;
            }
        } else {
            // Once we're in, we start drawing everything towards us
            for(var i=0; i<game.enemies.length; i++) {
                if(game.enemies[i].name !== this.name) { // Don't pull other eldritch bees
                    const invNorm2 = 1/Math.sqrt(Math.pow(game.enemies[i].pos.x - this.pos.x, 2) + Math.pow(game.enemies[i].pos.y - this.pos.y, 2));
                    game.enemies[i].pos.x -= this.pullSpeed * deltaTime * (game.enemies[i].pos.x - this.pos.x) * invNorm2;
                    game.enemies[i].pos.y -= this.pullSpeed * deltaTime * (game.enemies[i].pos.y - this.pos.y) * invNorm2;
                }
            }

            // Draw the player
            const invNorm2 = 1/Math.sqrt(Math.pow(game.player.pos.x - this.pos.x, 2) + Math.pow(game.player.pos.y - this.pos.y, 2));
            game.player.pos.x -= this.pullSpeed * deltaTime * (game.player.pos.x - this.pos.x) * invNorm2;
            game.player.pos.y -= this.pullSpeed * deltaTime * (game.player.pos.y - this.pos.y) * invNorm2;

            // Check for collision once we've gotten inside the room!
            // collide with edges of screen
            if(Math.abs(this.pos.y) + this.radius >= 202) {
                const dist = 202 - (Math.abs(this.pos.y) + this.radius);
                if(this.pos.y < 0) {
                    this.pos.y -= dist;
                } else {
                    this.pos.y += dist;
                }

                this.vel.y *= -1;
                this.vel.x = Math.random() * 2 - 1;
                this.vel.y = Math.random() * (this.vel.y < 0 ? -1 : 1);
            }
            if(Math.abs(this.pos.x) + this.radius >= 506) {
                const dist = 506 - (Math.abs(this.pos.x) + this.radius);
                if(this.pos.x < 0) {
                    this.pos.x -= dist;
                } else {
                    this.pos.x += dist;
                }

                this.vel.x *= -1;
                this.vel.x = Math.random() * (this.vel.x < 0 ? -1 : 1);
                this.vel.y = Math.random() * 2 - 1;
            }

            // Check collision with player
            const dx = this.pos.x - game.player.pos.x;
            const dy = this.pos.y - game.player.pos.y;
            const radDist = this.radius + game.player.radius;
            const distSq = dx * dx + dy * dy;
            if(distSq <= radDist * radDist) {
                game.isGameOver = true;
            } else {
                const dist = Math.sqrt(distSq) - (this.radius + game.player.radius);
                if(dist <= 32) {
                    game.score += (-67*dist*dist/1024 + 2*dist + 4) * 3 * deltaTime / 100;
                } else {
                    game.score += 3 * deltaTime / 100;
                }
            }
        }
        this.spriteSheet.update(deltaTime);
        if(this.spriteSheet.frame >= this.spriteSheet.numFrames) {
            this.spriteSheet.frame = 0;
        }
    };

    this.draw = function (ctx) {
        this.spriteSheet.pos.x = this.pos.x;
        this.spriteSheet.pos.y = this.pos.y;
        this.spriteSheet.rotation = Math.atan2(this.vel.y, this.vel.x) + 3 * Math.PI/2;
        this.spriteSheet.draw(ctx);
    };
}

function BumbleBee() {
    this.pos = new Vector2(0, 0);
    this.vel = new Vector2(0, 0);
    this.speed = 0.1;
    this.name = "BuB";
    this.radius = 20;

    this.beePos = new Vector2(0, 0);
    this.beeRadius = 0;
    this.angVel = -0.002;
    this.radVel = 0.01;
    this.maxRad = 100;
    this.angle = 0;

    this.hasEntered = false;

    this.calculateBeePos = function () {
        this.beePos.x = this.beeRadius * Math.cos(this.angle) + this.pos.x;
        this.beePos.y = this.beeRadius * Math.sin(this.angle) + this.pos.y;
    };

    this.update = function (deltaTime) {
        const invNorm = 1/Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
        this.pos.x += this.vel.x * deltaTime * this.speed * invNorm;
        this.pos.y += this.vel.y * deltaTime * this.speed * invNorm;

        this.angle += this.angVel * deltaTime;
        this.calculateBeePos();

        if(this.beeRadius < this.maxRad) {
            this.beeRadius += this.radVel * deltaTime;
        }

        // We'll start the bee outside the room's bounds
        if(!this.hasEntered) {
            if(Math.abs(this.beePos.y) + this.radius < 202 && Math.abs(this.beePos.x) + this.radius < 506) {
                this.hasEntered = true;
            }
        } else {
            // Check for collision once we've gotten inside the room!

            // collide with edges of screen
            if(Math.abs(this.pos.y) + this.radius >= 202) {
                const dist = 202 - (Math.abs(this.pos.y) + this.radius);
                if(this.pos.y < 0) {
                    this.pos.y -= dist;
                } else {
                    this.pos.y += dist;
                }

                this.vel.y *= -1;
                this.vel.x = Math.random() * 2 - 1;
                this.vel.y = Math.random() * (this.vel.y < 0 ? -1 : 1);
            }
            if(Math.abs(this.pos.x) + this.radius >= 506) {
                const dist = 506 - (Math.abs(this.pos.x) + this.radius);
                if(this.pos.x < 0) {
                    this.pos.x -= dist;
                } else {
                    this.pos.x += dist;
                }

                this.vel.x *= -1;
                this.vel.x = Math.random() * (this.vel.x < 0 ? -1 : 1);
                this.vel.y = Math.random() * 2 - 1;
            }

            this.calculateBeePos();

            // Set the angle to bee positive
            while(this.angle >= Math.PI * 2) {
                this.angle -= Math.PI * 2;
            }
            while(this.angle < 0) {
                this.angle += Math.PI * 2;
            }

            if(Math.abs(this.beePos.y) + this.radius >= 202) {
                const dist = (Math.abs(this.beePos.y) + this.radius - 202);
                var correction;
                if(this.beePos.y > 0) {
                    // We are hitting the upper wall
                    // we must be in quadrant i or ii
                    if(this.angle <= Math.PI / 4) {
                        // quadrant i
                        correction = dist / Math.sin(this.angle);
                    } else {
                        // quadrant ii
                        const mAng = Math.PI - this.angle;
                        correction = dist / Math.sin(mAng);
                    }
                } else {
                    // We are hitting the bottom wall
                    // Either quadrant iii or iv
                    if(this.angle <= 3 * Math.PI / 2) {
                        // quadrant iii
                        const mAng = this.angle - Math.PI;
                        correction = dist / Math.sin(mAng);
                    } else {
                        // quadrant iv
                        const mAng = this.angle - 3 * Math.PI / 2;
                        correction = dist / Math.cos(mAng);
                    }
                }
                this.beeRadius -= correction;
            }

            this.calculateBeePos();

            if(Math.abs(this.beePos.x) + this.radius >= 506) {
                const dist = (Math.abs(this.beePos.x) + this.radius - 506);
                var correction;
                if(this.beePos.x > 0) {
                    // we are hitting the right wall
                    // the angle must be in quadrant i or iv
                    if(this.angle <= Math.PI / 4) {
                        // We are in quadrant i
                        correction = dist / Math.cos(this.angle);
                    } else {
                        // We are in quadrant iv
                        const mAng = Math.PI * 2 - this.angle;
                        correction = dist / Math.cos(mAng);
                    }
                } else {
                    // we are hitting the left wall
                    // the angle must be in quadrant ii or iii
                    if(this.angle <= Math.PI / 2) {
                        // we are in quadrant ii
                        const mAng = Math.PI - this.angle;
                        correction = dist / Math.cos(mAng);
                    } else {
                        // we are in quadrant iii
                        const mAng = 3 * Math.PI / 2 - this.angle;
                        correction = dist / Math.sin(mAng);
                    }
                }
                this.beeRadius -= correction;
            }

            this.calculateBeePos();

            // Check collision with player
            const dx = this.beePos.x - game.player.pos.x;
            const dy = this.beePos.y - game.player.pos.y;
            const radDist = this.radius + game.player.radius;
            const distSq = dx * dx + dy * dy;
            if(distSq <= radDist * radDist) {
                game.isGameOver = true;
            } else {
                const dist = Math.sqrt(distSq) - (this.radius + game.player.radius);
                if(dist <= 32) {
                    game.score += (-67*dist*dist/1024 + 2*dist + 4) * 2 * deltaTime / 100;
                } else {
                    game.score += 2 * deltaTime / 100;
                }
            }
        }
    };

    this.draw = function (ctx) {
        const mX = this.beePos.x + (canvasWidth/2);
        const mY = this.beePos.y * -1 + 144 + 202;

        const mX1 = this.pos.x + (canvasWidth/2);
        const mY1 = this.pos.y * -1 + 144 + 202;

        // this.angle = Math.atan2(this.vel.y, this.vel.x) + Math.PI/2;

        ctx.translate(mX, mY);
        ctx.rotate(-this.angle);
        ctx.drawImage(resources.bumblebee, -46, -26);
        if(debug) {
            ctx.beginPath();
            ctx.fillStyle = 'red';
            ctx.arc(0, 0, this.radius, 0, 360);
            ctx.fill();
        }
        ctx.rotate(this.angle);
        ctx.translate(-mX, -mY);

        if(debug) {
            ctx.beginPath();
            ctx.fillStyle = 'purple';
            ctx.arc(mX1, mY1, this.radius, 0, 360);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.moveTo(mX1, mY1);
            ctx.lineTo(mX, mY);
            ctx.stroke();
        }
    };
}

function LaserBee() {
    this.StateEnum = {
      DRIFT: 0,
      CHARGE: 1,
      FIRE: 2
    };

    this.state = this.StateEnum.DRIFT;

    this.pos = new Vector2(0, 0);
    this.vel = new Vector2(0, 0);
    this.speed = 0.01;
    this.fireSpeed = 1;
    this.name = "LasB";
    this.radius = 20;

    this.chargePercent = 0;
    this.chargeSpeed = 0.075;

    this.driftCooldown = 3000;
    this.currentDrift = 0;

    this.beePos = new Vector2(0, 0);
    this.radVel = 0.01;
    this.maxRad = 100;
    this.angle = 0;

    this.hasEntered = false;

    this.spriteSheet = new SpriteSheet(resources.laserbee, 60, 72, 20, this.pos.x, this.pos.y, 0, 4);

    this.update = function (deltaTime) {
        if(this.state == this.StateEnum.CHARGE) {
            this.angle = Math.atan2(game.player.pos.y - this.pos.y, game.player.pos.x - this.pos.x) - Math.PI/2;
            this.vel.x = 0;
            this.vel.y = 0;
            this.chargePercent += this.chargeSpeed * deltaTime;
            if(this.chargePercent >= 100) {
                this.state = this.StateEnum.FIRE;
                this.chargePercent = 0;
            } else {
                this.spriteSheet.frame = Math.round(this.spriteSheet.numFrames * (this.chargePercent/100));
            }
        } else if(this.state == this.StateEnum.DRIFT) {
            if(this.hasEntered) {
                this.currentDrift += deltaTime;
                if(this.currentDrift >= this.driftCooldown) {
                    this.state = this.StateEnum.CHARGE;
                    this.currentDrift = 0;
                }
            }
            this.angle = Math.atan2(this.vel.y, this.vel.x) - Math.PI / 2;
        } else if(this.state == this.StateEnum.FIRE) {
            this.spriteSheet.frame = 0;
            this.vel.x = Math.cos(this.angle + Math.PI / 2);
            this.vel.y = Math.sin(this.angle + Math.PI / 2);
        }
        const invNorm = (this.vel.x != 0 || this.vel.y != 0) ? 1/Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y) : 0;
        this.pos.x += this.vel.x * deltaTime * (this.state == this.StateEnum.FIRE ? this.fireSpeed : this.speed) * invNorm;
        this.pos.y += this.vel.y * deltaTime * (this.state == this.StateEnum.FIRE ? this.fireSpeed : this.speed) * invNorm;

        // We'll start the bee outside the room's bounds
        if(!this.hasEntered) {
            if(Math.abs(this.pos.y) + this.radius < 202 && Math.abs(this.pos.x) + this.radius < 506) {
                this.hasEntered = true;
            }
        } else {
            // Check for collision once we've gotten inside the room!
            // collide with edges of screen
            if(Math.abs(this.pos.y) + this.radius >= 202) {
                const dist = 202 - (Math.abs(this.pos.y) + this.radius);
                if(this.pos.y < 0) {
                    this.pos.y -= dist;
                } else {
                    this.pos.y += dist;
                }

                this.vel.y *= -1;
                this.vel.x = Math.random() * 2 - 1;
                this.vel.y = Math.random() * (this.vel.y < 0 ? -1 : 1);
                if(this.state == this.StateEnum.FIRE) {
                    this.state = this.StateEnum.DRIFT;
                }
            }
            if(Math.abs(this.pos.x) + this.radius >= 506) {
                const dist = 506 - (Math.abs(this.pos.x) + this.radius);
                if(this.pos.x < 0) {
                    this.pos.x -= dist;
                } else {
                    this.pos.x += dist;
                }

                this.vel.x *= -1;
                this.vel.x = Math.random() * (this.vel.x < 0 ? -1 : 1);
                this.vel.y = Math.random() * 2 - 1;
                if(this.state == this.StateEnum.FIRE) {
                    this.state = this.StateEnum.DRIFT;
                }
            }

            // Check collision with player
            const dx = this.pos.x - game.player.pos.x;
            const dy = this.pos.y - game.player.pos.y;
            const radDist = this.radius + game.player.radius;
            const distSq = dx * dx + dy * dy;
            if(distSq <= radDist * radDist) {
                game.isGameOver = true;
            } else {
                const dist = Math.sqrt(distSq) - (this.radius + game.player.radius);
                if(dist <= 32) {
                    game.score += (-67*dist*dist/1024 + 2*dist + 4) * 2 * deltaTime / 100;
                } else {
                    game.score += 2 * deltaTime / 100;
                }
            }
        }
    };

    this.draw = function (ctx) {
        if(this.state == this.StateEnum.CHARGE) {
            // Draw a targeting laser
            const mX = this.pos.x + (canvasWidth/2);
            const mY = this.pos.y * -1 + 144 + 202;

            const playerDeltaX = game.player.pos.x - this.pos.x;
            const playerDeltaY = game.player.pos.y - this.pos.y;

            ctx.translate(mX, mY);
            ctx.rotate(-Math.PI/2);
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.lineTo(playerDeltaY, playerDeltaX);
            ctx.strokeStyle="red";
            ctx.lineWidth=3;
            ctx.stroke();
            ctx.rotate(Math.PI/2);
            ctx.translate(-mX, -mY);
        }

        this.spriteSheet.pos.x = this.pos.x;
        this.spriteSheet.pos.y = this.pos.y;
        this.spriteSheet.rotation = this.angle;
        this.spriteSheet.draw(ctx);
    };
}

function BeeTime() {
    this.pos = new Vector2(0, 0);
    this.ttl = 3000;
    this.radius = 12;

    this.update = function (deltaTime) {
        this.ttl -= deltaTime;

        if(this.ttl <= 0) {
            game.pickups.shift();
        }

        // Check collision with player if they're not currently holding a pickup
        if(game.player.pickup == "") {
            const dx = this.pos.x - game.player.pos.x;
            const dy = this.pos.y - game.player.pos.y;
            const radDist = this.radius + game.player.radius;
            const distSq = dx * dx + dy * dy;
            if (distSq <= radDist * radDist) {
                game.player.pickup = "BeeTime";
                game.pickups.shift();
            }
        }
    };
    
    this.draw = function (ctx) {
        const mX = this.pos.x + (canvasWidth/2);
        const mY = this.pos.y * -1 + 144 + 202;

        ctx.translate(mX, mY);
        ctx.drawImage(resources.beetime, -12, -14);
        if(debug) {
            ctx.beginPath();
            ctx.fillStyle = 'cyan';
            ctx.arc(0, 0, this.radius, 0, 360);
            ctx.fill();
        }
        ctx.translate(-mX, -mY);
    }
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
    },

    clearScores: function() {
        for(var i=0; i<10; i++) {
            localStorage.removeItem("hs" + i);
            localStorage.removeItem("hsname" + i);
        }
    }
};

function TitleScreen() {
    this.init = function() {
        this.selected = 0;
        this.menuItems = ['Start', 'Options', 'Help', 'Credits'];
    };

    this.update = function() {
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
                SetUpScreen(HelpScreen);
            } else if(this.selected === 3) {
                SetUpScreen(CreditsScreen);
            }
        }
    };

    this.draw = function(ctx) {
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

// TODO: Add more options.
function OptionsScreen() {
    this.init = function(prevScreen) {
        this.prevScreen = prevScreen;
        this.options = ["Clear High Scores", "Back"];
        this.selected = this.options.length - 1;
    };

    this.update = function() {
        if(Key.pressed(Key.UP) || Key.pressed(Key.W)) {
            this.selected = (this.selected == 0 ? this.options.length - 1 : this.selected - 1);
        }
        if(Key.pressed(Key.DOWN) || Key.pressed(Key.S)) {
            this.selected = (this.selected == this.options.length - 1 ? 0 : this.selected + 1);
        }

        if(Key.pressed(Key.ENTER) || Key.pressed(Key.SPACE) || Key.pressed(Key.ESC)) {
            if(this.selected === 1) {
                game = this.prevScreen;
            } else if(this.selected === 0) {
                // Clear high scores
                Options.clearScores();
                game = this.prevScreen;
            }
        }
    };

    this.draw = function(ctx) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = 'red';
        ctx.font = "32pt 'Press Start 2P'";
        const titleText = "OPTIONS";
        ctx.fillText(titleText, (canvasWidth - ctx.measureText(titleText).width)/2, canvasHeight/2);

        ctx.font = "16pt 'Press Start 2P'";
        for(var i=0; i<this.options.length; i++) {
            if(i === this.selected) {
                ctx.fillStyle = 'yellow';
            } else {
                ctx.fillStyle = 'white';
            }
            ctx.fillText(this.options[i], (canvasWidth - ctx.measureText(this.options[i]).width)/2, 400 + (i * 50));
        }
    };
}

function HelpScreen() {
    this.init = function(prevScreen) {
        this.prevScreen = prevScreen;
        this.instructions = ['Arrow keys to move', 'Spacebar to activate pickups', 'Dodge the bees to survive!'];
    };

    this.update = function() {
        if(Key.pressed(Key.ENTER) || Key.pressed(Key.SPACE) || Key.pressed(Key.ESC)) {
            game = this.prevScreen;
        }
    };

    this.draw = function(ctx) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = 'red';
        ctx.font = "64pt 'Press Start 2P'";
        const titleText = "Bee Dodger";
        ctx.fillText(titleText, (canvasWidth - ctx.measureText(titleText).width)/2, 150);
        ctx.fillStyle = 'white';
        ctx.font = "32px 'Press Start 2P'";
        for(var i=0; i<this.instructions.length; i++) {
            ctx.fillText(this.instructions[i], (canvasWidth - ctx.measureText(this.instructions[i]).width)/2, 250 + (i * 50));
        }
        ctx.fillStyle = 'yellow';
        ctx.font = "32px 'Press Start 2P'";
        const backText = "Back";
        ctx.fillText(backText, (canvasWidth - ctx.measureText(backText).width)/2, 400);
    };
}

function CreditsScreen() {
    this.init = function(prevScreen) {
        this.prevScreen = prevScreen;
        this.credits = ['Designed by Alic Szecsei', 'Artwork by Ren Neymeyer'];
    };

    this.update = function() {
        if(Key.pressed(Key.ENTER) || Key.pressed(Key.SPACE) || Key.pressed(Key.ESC)) {
            game = this.prevScreen;
        }
    };

    this.draw = function(ctx) {
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

    this.update = function () {
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
                if(this.prevScreen.gainNode) {
                    this.prevScreen.gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime);
                    this.prevScreen.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + fadeOutTime);
                }
                SetUpScreen(TitleScreen);
            }
        }
    };

    this.draw = function (ctx) {
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
        this.score = 0;
        this.player = new Player();
        this.enemies = [];
        this.pickups = [];
        this.spawners = [
            new Vector2(-540, 0),
            new Vector2(540, 0),
            new Vector2(-376, 252),
            new Vector2(376, 252),
            new Vector2(-376, -240),
            new Vector2(376, -240)
        ];
        this.pickupSpawners = [
            new Vector2(0, 150),
            new Vector2(0, 0),
            new Vector2(0, -150),
            new Vector2(-200, 150),
            new Vector2(-200, 0),
            new Vector2(-200, -150),
            new Vector2(200, 150),
            new Vector2(-200, 0),
            new Vector2(200, -150),
            new Vector2(480, 150),
            new Vector2(480, 0),
            new Vector2(480, -150),
            new Vector2(-480, 150),
            new Vector2(-480, 0),
            new Vector2(-480, -150)
        ];

        this.lastSpawned = 0;
        this.toSpawn = 2000;
        this.numSpawnedAtOnce = 2;
        this.isGameOver = false;

        this.types = "bb--BB--UU--EH--EH--LLLL--";
        this.pickupTypes = [BeeTime];
        this.currentSpawn = 0;

        this.gameSpeed = 1;

        this.source = audioContext.createBufferSource();
        if(resources.bgm !== null) {
            this.source.buffer = resources.bgm;
            this.source.loop = true;

            this.gainNode = audioContext.createGain();

            this.source.connect(this.gainNode);
            this.gainNode.connect(audioContext.destination);
            this.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime);
            this.gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + fadeInTime);
            this.source.start(0);
        }
    }

    this.update = function(deltaTime) {

        this.player.update(deltaTime * this.gameSpeed);
        var i;

        for(i=0; i<this.enemies.length; i++) {
            this.enemies[i].update(deltaTime * this.gameSpeed);
        }

        for(i=0; i<this.pickups.length; i++) {
            this.pickups[i].update(deltaTime * this.gameSpeed);
        }

        // Spawn a new enemy
        if(this.lastSpawned >= this.toSpawn) {
            this.lastSpawned = 0;
            if(this.enemies.length >= 10) {
                this.toSpawn = 5000;
            }
            var enemy;

            for(i=0; i<this.numSpawnedAtOnce; i++) {
                if(this.types.charAt(this.currentSpawn) == 'b') {
                    enemy = new BasicBee();
                    const spawn = this.spawners.randomElement();
                    enemy.pos = new Vector2(spawn.x, spawn.y);
                    enemy.vel = new Vector2((enemy.pos.x < -500 ? 1 : (enemy.pos.x > 500 ? -1 : Math.random() * 2 - 1)), (enemy.pos.y < -100 ? 1 : (enemy.pos.y > 100 ? -1 : Math.random() * 2 - 1)));
                    game.enemies.push(enemy);
                } else if(this.types.charAt(this.currentSpawn) == 'B') {
                    enemy = new BigBee();
                    const spawn = this.spawners[Math.random() > 0.5 ? 1 : 0];
                    enemy.pos = new Vector2(spawn.x, spawn.y);
                    enemy.vel = new Vector2((enemy.pos.x < -500 ? 1 : (enemy.pos.x > 500 ? -1 : Math.random() * 2 - 1)), (enemy.pos.y < -100 ? 1 : (enemy.pos.y > 100 ? -1 : Math.random() * 2 - 1)));
                    game.enemies.push(enemy);
                } else if(this.types.charAt(this.currentSpawn) == 'U') {
                    enemy = new BumbleBee();
                    const spawn = this.spawners.randomElement();
                    enemy.pos = new Vector2(spawn.x, spawn.y);
                    enemy.vel = new Vector2((enemy.pos.x < -500 ? 1 : (enemy.pos.x > 500 ? -1 : Math.random() * 2 - 1)), (enemy.pos.y < -100 ? 1 : (enemy.pos.y > 100 ? -1 : Math.random() * 2 - 1)));
                    enemy.calculateBeePos();
                    game.enemies.push(enemy);
                } else if(this.types.charAt(this.currentSpawn) == 'H') {
                    enemy = new HoneyBee();
                    const spawn = this.spawners.randomElement();
                    enemy.pos = new Vector2(spawn.x, spawn.y);
                    enemy.vel = new Vector2((enemy.pos.x < -500 ? 1 : (enemy.pos.x > 500 ? -1 : Math.random() * 2 - 1)), (enemy.pos.y < -100 ? 1 : (enemy.pos.y > 100 ? -1 : Math.random() * 2 - 1)));
                    game.enemies.push(enemy);
                } else if(this.types.charAt(this.currentSpawn) == 'E') {
                    enemy = new EldritchBee();
                    const spawn = this.spawners[Math.random() > 0.5 ? 1 : 0];
                    enemy.pos = new Vector2(spawn.x, spawn.y);
                    enemy.vel = new Vector2((enemy.pos.x < -500 ? 1 : (enemy.pos.x > 500 ? -1 : Math.random() * 2 - 1)), (enemy.pos.y < -100 ? 1 : (enemy.pos.y > 100 ? -1 : Math.random() * 2 - 1)));
                    game.enemies.push(enemy);
                } else if(this.types.charAt(this.currentSpawn) == 'L') {
                    enemy = new LaserBee();
                    const spawn = this.spawners.randomElement();
                    enemy.pos = new Vector2(spawn.x, spawn.y);
                    enemy.vel = new Vector2((enemy.pos.x < -500 ? 1 : (enemy.pos.x > 500 ? -1 : Math.random() * 2 - 1)), (enemy.pos.y < -100 ? 1 : (enemy.pos.y > 100 ? -1 : Math.random() * 2 - 1)));
                    game.enemies.push(enemy);
                }

                this.currentSpawn = (this.currentSpawn + 1) % this.types.length;
            }

            // Randomly spawn pickups with enemies...this isn't optimal :/
            if(Math.random() > 0.8) {
                var bt = new (this.pickupTypes.randomElement())();
                const pSpawn = this.pickupSpawners.randomElement();
                bt.pos = new Vector2(pSpawn.x, pSpawn.y);
                this.pickups.push(bt);
            }
        } else {
            this.lastSpawned += deltaTime * this.gameSpeed;
        }

        if(this.isGameOver) {
            Options.setOption("lastScore", game.score.toFixed(0));
            SetUpScreen(GameOverScreen);
            if(this.gainNode) {
                this.gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime);
                this.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + fadeOutTime);
            }
        }

        if(Key.isDown(Key.ESC)) {
            SetUpScreen(PauseScreen);
        }
    };

    this.draw = function(ctx, deltaTime) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(resources.bgImg, 0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = 'white';
        ctx.font = "16pt 'Press Start 2P'";
        const titleText = "Score: " + this.score.toFixed(0);
        ctx.fillText(titleText, 700, 50);

        if(this.player.pickup === "BeeTime") {
            ctx.drawImage(resources.beetime, 650, 36);
        }

        this.player.draw(ctx, deltaTime * this.gameSpeed);
        var i;
        for(i=0; i<this.enemies.length; i++) {
            this.enemies[i].draw(ctx, deltaTime * this.gameSpeed);
        }
        for(i=0; i<this.pickups.length; i++) {
            this.pickups[i].draw(ctx, deltaTime * this.gameSpeed);
        }

        if(debug) {
            for (i = 0; i < this.spawners.length; i++) {
                const mX = this.spawners[i].x + (canvasWidth / 2);
                const mY = this.spawners[i].y * -1 + 144 + 202;

                ctx.translate(mX, mY);
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, 360);
                ctx.fillStyle = 'blue';
                ctx.fill();
                ctx.translate(-mX, -mY);
            }
        }
    };
}

function GameOverScreen() {
    this.init = function() {
    };

    this.update = function() {
        if(Key.pressed(Key.ENTER) || Key.pressed(Key.SPACE) || Key.pressed(Key.ESC)) {
            SetUpScreen(HighScoreScreen);
        }
    };

    this.draw = function(ctx) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = 'red';
        ctx.font = "32pt 'Press Start 2P'";
        const titleText = "GAME OVER";
        ctx.fillText(titleText, (canvasWidth - ctx.measureText(titleText).width)/2, canvasHeight/2);

        ctx.font = "16pt 'Press Start 2P'";
        ctx.fillStyle = 'white';
        const scoreText = "Score: " + Options.getOption("lastScore");
        ctx.fillText(scoreText, (canvasWidth - ctx.measureText(scoreText).width)/2, 400);
        ctx.fillStyle = 'yellow';
        const backText = "High Scores";
        ctx.fillText(backText, (canvasWidth - ctx.measureText(backText).width)/2, 500);
    };
}

function HighScoreScreen() {
    this.init = function () {
        this.letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ ";
        this.hsIndex = -1;
        this.charAt = 0;

        this.highScores = [];
        var index = 0;
        const lastScore = parseInt(Options.getOption("lastScore"));
        const h0 = Options.getOption("hs0");
        if(undefined === h0 || "" === h0 || null === h0 || "null" === h0 ) {
            // Fill It Up With Friends
            var friends = [
                {name: "BER", score: 50000},
                {name: "DOM", score: 10000},
                {name: "RBN", score: 7500},
                {name: "PIG", score: 5000},
                {name: "RED", score: 2500}
            ];
            for(var i=0; i<friends.length; i++) {
                Options.setOption("hs" + i, friends[i].score);
                Options.setOption("hsname" + i, friends[i].name);
            }
        }
        for(var ct=0; ct<10; ct++) {
            const h = Options.getOption("hs" + index);
            if(undefined !== h && "" !== h && null !== h && "null" !== h) {
                if(lastScore > h && this.hsIndex === -1) {
                    this.highScores.push({score: lastScore, name: "AAA", isMine: true});
                    this.hsIndex = ct;
                    ct++;
                    if(this.highScores.length < 10) {
                        this.highScores.push({score: h, name: Options.getOption("hsname" + index), isMine: false});
                    }
                } else {
                    this.highScores.push({score: h, name: Options.getOption("hsname" + index), isMine: false});
                }
                index++;
            } else {
                break;
            }
        }
        if(this.highScores.length < 10 && this.hsIndex === -1) {
            this.highScores.push({score: lastScore, name: "AAA", isMine: true});
            this.hsIndex = this.highScores.length - 1;
        }
    };

    this.update = function () {
        if(Key.pressed(Key.UP) || Key.pressed(Key.W)) {
            const curIndex = this.letters.indexOf(this.highScores[this.hsIndex].name.charAt(this.charAt));
            this.highScores[this.hsIndex].name = this.highScores[this.hsIndex].name.replaceAt(this.charAt, this.letters[(curIndex + 1) % this.letters.length]);
        }
        if(Key.pressed(Key.DOWN) || Key.pressed(Key.S)) {
            const curIndex = this.letters.indexOf(this.highScores[this.hsIndex].name.charAt(this.charAt));
            this.highScores[this.hsIndex].name = this.highScores[this.hsIndex].name.replaceAt(this.charAt, this.letters[(curIndex - 1) + (curIndex == 0 ? this.letters.length : 0)]);
        }
        if(Key.pressed(Key.LEFT) || Key.pressed(Key.A)) {
            this.charAt = (this.charAt - 1)  + (this.charAt == 0 ? 3 : 0);
        }
        if(Key.pressed(Key.RIGHT) || Key.pressed(Key.D)) {
            this.charAt = (this.charAt + 1) % 3;
        }

        if(Key.pressed(Key.ENTER) || Key.pressed(Key.SPACE)) {
            // Save out the high scores
            for(var i=0; i<this.highScores.length; i++) {
                Options.setOption("hs" + i, this.highScores[i].score);
                Options.setOption("hsname" + i, this.highScores[i].name);
            }

            // Return to main menu
            SetUpScreen(TitleScreen);
        }
    };

    this.draw = function (ctx) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.font = "16pt 'Press Start 2P'";
        ctx.fillStyle = 'red';

        const hsText = "High Scores";
        ctx.fillText(hsText, (canvasWidth - ctx.measureText(hsText).width)/2, 50);

        for(var i=0; i<this.highScores.length; i++) {
            if (undefined !== this.highScores[i]) {
                if (i === this.hsIndex) {
                    var preText = this.highScores[i].name.substr(0, this.charAt);
                    var postText = this.highScores[i].name.substr(this.charAt + 1);
                    var selText = this.highScores[i].name.charAt(this.charAt);

                    const initX = canvasWidth / 2 - (50 + ctx.measureText(this.highScores[i].name).width);
                    const initY = 50 * (i + 2);

                    // Draw preText
                    // ctx.font = "16pt 'Press Start 2P'";
                    ctx.fillStyle = 'yellow';
                    ctx.fillText(preText, initX, initY);

                    // draw selText
                    // ctx.font =  "underline 16pt 'Press Start 2P'";
                    ctx.fillStyle = 'red';
                    ctx.fillText(selText, initX + ctx.measureText(preText).width, initY);

                    // draw postText
                    // ctx.font = "16pt 'Press Start 2P'";
                    ctx.fillStyle = 'yellow';
                    ctx.fillText(postText, initX + ctx.measureText(preText).width + ctx.measureText(selText).width, initY);
                } else {
                    ctx.fillStyle = 'white';
                    ctx.fillText(this.highScores[i].name, canvasWidth / 2 - (50 + ctx.measureText(this.highScores[i].name).width), 50 * (i + 2));
                }
                ctx.fillText(this.highScores[i].score, canvasWidth / 2 + 50, 50 * (i + 2));
            }
        }
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
    body.html("<br /><br /><br /><p><canvas id='canvas' width='" + canvasWidth + "' height='" + canvasHeight + "'></canvas></p>");
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
    Array.prototype.randomElement = function () {
        return this[Math.floor(Math.random() * this.length)]
    };
    String.prototype.replaceAt=function(index, character) {
        return this.substr(0, index) + character + this.substr(index+character.length);
    };

    /* load all resources */
    resources.bgImg = new Image();
    resources.bgImg.src = "sprites/bg.png";
    resources.player = new Image();
    resources.player.src = "sprites/player.png";
    resources.basicbee = new Image();
    resources.basicbee.src = "sprites/basicbee.png";
    resources.bigbee = new Image();
    resources.bigbee.src = "sprites/bigbee.png";
    resources.beetime = new Image();
    resources.beetime.src = "sprites/beetime.png";
    resources.bumblebee = new Image();
    resources.bumblebee.src = "sprites/bumblebee.png";
    resources.honey = new Image();
    resources.honey.src = "sprites/Honey_Anim.png";
    resources.honeybee = new Image();
    resources.honeybee.src = "sprites/honeybee.png";
    resources.eldritchbee = new Image();
    resources.eldritchbee.src = "sprites/eldritch_anim.png";
    resources.laserbee = new Image();
    resources.laserbee.src = "sprites/laser bee complete.png";
    resources.bgm = null;
    try {
        // Fix up for prefixing
        window.AudioContext = window.AudioContext||window.webkitAudioContext;
        audioContext = new AudioContext();
        var request = new XMLHttpRequest();
        request.open('GET', 'audio/beedodger.ogg', true);
        request.responseType = 'arraybuffer';

        // Decode asynchronously
        request.onload = function () {
            audioContext.decodeAudioData(request.response, function(buffer) {
                resources.bgm = buffer;
            }, function (error) {
                console.log("Error: " + error);
            });
        };
        request.send();
    }
    catch(e) {
        alert('Web Audio API is not supported in this browser');
    }

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

        game.update(inc);
        game.draw(ctx, inc);

        /* FPS Counter */
        if(debug) {
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