var LEVEL_DATA;
var TILE_HEIGHT = 40;
var TILE_WIDTH = 40;
var level_index = 0;
var timeouts = [];
var credits = "Credits\n\nMichael Delfino - programming, game design\nMichael Derenge - artwork\nJun Huang - logistics\nMathieu Keith - music\nEdgar Allan Poe - inspiration, text from The Tell-Tale Heart\nSithjester - character sprite\nAnastasia Turner - story, game design\nNathan Turner - programming, game design";

window.onload = function() {

    Crafty.init(800,600);

    function clearTimeouts() {
        for (var i=0; i<timeouts.length; ++i) {
            clearTimeout(timeouts[i]);
        }
        timeouts = [];
    }

    function animateText(entity, text, speed, callback) {
        var index = 0;
        function queueNextChar() {
            timeouts.push(setTimeout(function() {
                if (text[index] == '\n') {
                    entity.text(entity._text + "<br>");
                    ++index;
                } else {
                    entity.text(entity._text + text[index++]);
                }
                if (index < text.length) queueNextChar();
                else if(callback) callback();
            }, speed));
        }
        if (index < text.length) queueNextChar();
    }

    Crafty.scene("loading", function(){

        Crafty.load(["images/background.png",
                     "images/player.png",
                     "images/wall.png",
                     "images/brick.png",
                     "images/floor.jpg",
                     "images/top_fow.png",
                     "sfx/short_heartbeat.wav",
                     "music/telltale-heart-no-hb.wav"], function() {
			Crafty.sprite(32,48, "images/player.png", {
				playerSprite: [0,0]
			});
            Crafty.sprite(40, 40, "images/wood.png", {
                    floorSprite: [0,0]
            });
            Crafty.sprite(40, 40, "images/wall.png", {
                wallSprite: [0,0]
            });
            Crafty.sprite(40, 40, "images/brick.png", {
                brickSprite: [0,0]
            });
            Crafty.sprite(1600,1200, "images/top_fow.png", {
                fow1: [0,0]
            });
            Crafty.audio.add("heartbeat", "sfx/short_heartbeat.wav");
            Crafty.audio.add("music", "music/telltale-heart-no-hb.wav");
            Crafty.audio.play("music", -1, 0.3);
            Crafty.scene("intro");
        });

        Crafty.background("#000");
        Crafty.e("2D, DOM, Text").attr({w:100,h:20,x:150,y:120})
                .text("Loading")
                .css({"text-align":"center"});
    });

    Crafty.scene("loading");

    Crafty.scene("intro", function() {
        var done = false;
        var timeoutid = 0;
        var screenText = Crafty.e("2D, DOM, Text").attr({w:600,h:20,x:100,y:100})
                .text("")
                .css({"text-align":"center"});
        if(level_index >= LEVEL_DATA.Levels.length) {
            animateText(screenText, credits, 100);
        } else {
            animateText(screenText, getCurrentLevel().introText, 50, function() {
                timeouts.push(setTimeout(function(){
                    Crafty.scene("main");
                },4000));
            });
            screenText.requires('Keyboard').bind('KeyDown', function () {
                if (this.isDown('SPACE')) {
                    clearTimeouts();
                    Crafty.scene("main");
                }
            });
        }
    });

    Crafty.c('Dude', {
        Dude: function() {
                //setup animations
                this.requires("SpriteAnimation, Collision")
                .animate("walk_left", 0, 1, 3)
                .animate("walk_right", 0, 2, 3)
                .animate("walk_up", 0, 3, 3)
                .animate("walk_down", 0, 0, 3)

                //change direction when a direction change event is received
                .bind("NewDirection",
                    function (direction) {
                        if (direction.x < 0) {
                            if (!this.isPlaying("walk_left"))
                                this.stop().animate("walk_left", 10, -1);
                        }
                        if (direction.x > 0) {
                            if (!this.isPlaying("walk_right"))
                                this.stop().animate("walk_right", 10, -1);
                        }
                        if (direction.y < 0) {
                            if (!this.isPlaying("walk_up"))
                                this.stop().animate("walk_up", 10, -1);
                        }
                        if (direction.y > 0) {
                            if (!this.isPlaying("walk_down"))
                                this.stop().animate("walk_down", 10, -1);
                        }
                        if(!direction.x && !direction.y) {
                            this.stop();
                        }
                })
                .collision([0,47], [0,37], [31,37], [31,47])
                .onHit("wallSprite", function(){console.log("wallSprite onHit");})
                // A rudimentary way to prevent the user from passing solid areas
                .bind('Moved', function(from) {
                    if(this.hit('solid')){
                        this.attr({x: from.x, y:from.y});
                    }
                });
            return this;
        }
    });

    Crafty.c("playerControls", {
        init: function() {
            this.requires('Multiway');
        },

        playerControls: function(speed) {
            this.multiway(speed, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180})
            return this;
        }
    });

    //to determine if the player is close enough to the objective
    function withinRange(x1,x2,y1,y2) {
        return (distance(x1,x2,y1,y2) <= 40);
    }

    function distance(x1,x2,y1,y2) {
        return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
    }

    Crafty.scene("main", function() {
        Crafty.background("url('images/background.png')");

        //get data for the current level
        level = getCurrentLevel();
        generateMap(level);

        function getStartDirection() {
          return level.start[2];
        }
        function getStartX(level) {
            return level.start[1] * TILE_WIDTH;
        }
        function getStartY(level) {
            return level.start[0] * TILE_HEIGHT;
        }
        function getObjective(level) {
            var toRel = [];
            toRel.x = level.objective[1]*TILE_WIDTH;
            toRel.y = level.objective[0]*TILE_HEIGHT;
            return toRel;
        }
        objective = getObjective(level);

        var getHeartbeatSpeed = function() {
            speed = (distance(player._x, objective.x, player._y, objective.y))*5;
            if (speed < 1000) speed = 1000;
            return speed;
        };
        var heartbeatSpeed = getHeartbeatSpeed;
        var addHeartbeat = function(speed) {
            return setTimeout(function() {
                var distToHeart = distance(player._x, objective.x, player._y, objective.y);
                var heartbeatVolume = 1 - Math.log((distToHeart+3)/3)/10.0;
                Crafty.audio.play("heartbeat", 1, (heartbeatVolume < 1) ? ((heartbeatVolume > 0) ? heartbeatVolume : 0) : 1);
                clearTimeouts();
                timeouts.push(addHeartbeat(getHeartbeatSpeed()));
            }, speed);
        };
        timeouts.push(addHeartbeat(heartbeatSpeed));

        var player = Crafty.e("2D, DOM, playerSprite, playerControls, Collision, Dude")
                .attr({x: getStartX(level), y: getStartY(level)})
                .origin("center")
                .sprite(0, getStartDirection())
                .playerControls(1.5)
                .Dude();

        var fog_of_war_top = Crafty.e("2D, DOM, fow1, playerControls")
                .attr({x: player._x - 782, y: player._y - 576})
                .bind("EnterFrame", function() {
                    this.attr({x: player._x - 782, y: player._y - 576});
                });

        player.requires('Keyboard').bind('KeyDown', function () {
            if (this.isDown('SPACE')) {
                var digText = "";
                if(withinRange(player._x, objective.x, player._y, objective.y)){
                    ++level_index;
                    clearTimeouts();
                    Crafty.scene("intro");
                } else {
                    //consequences of digging in the wrong spot?
                }
            }
        });
    });

};

function getCurrentLevel() {
    return LEVEL_DATA.Levels[level_index];
}

//  GenerateMap
function generateMap(level) {
    var tiles = level.tiles;

    for(var j = 0; j < tiles.length; j++)
    {
        for(var i = 0; i < tiles[j].length; i++)
        {
            if(tiles[j][i]=='0')
                addFloor(i, j);
            else if(tiles[j][i]=='1')
                addWall(i, j);
            else if(tiles[j][i]=='2')
                addBrick(i, j);
        }
    }
};

function addWall(i,j) {
    Crafty.e("2D, DOM, solid, wallSprite")
        .attr({x: i*TILE_WIDTH, y: j*TILE_HEIGHT, z: 0});
}

function addFloor(i,j) {
    Crafty.e("2D, DOM, floorSprite")
        .attr({x: i*TILE_WIDTH, y: j*TILE_HEIGHT, z: 0});
}

function addBrick(i,j) {
    Crafty.e("2D, DOM, solid, brickSprite")
        .attr({x: i*TILE_WIDTH, y: j*TILE_HEIGHT, z: 0});
}
