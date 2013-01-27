var LEVEL_DATA;
var TILE_HEIGHT = 40;
var TILE_WIDTH = 40;
var level_index = 0;
var timeouts = [];
var heartbeatTimeouts = [];
var credits = "Credits\n\nMichael Delfino - programming,\ngame design, project management\nMichael Derenge - artwork\nJun Huang - logistics\nMathieu Keith - music\nAnastasia Turner - story, game design\nNathan Turner - programming, game design\n\nThanks to:\nEmily Boots - beer\nEdgar Allan Poe - inspiration, text from The Tell-Tale Heart\nRunJumpDev and everyone behind GGJ2013\nSithjester - character sprite";
var DEBUG = false;

window.onload = function() {

    Crafty.init(800,600);

    function clearTimeouts(timeout_list) {
        if (!timeout_list) timeout_list = timeouts;
        for (var i=0; i<timeout_list.length; ++i) {
            clearTimeout(timeout_list[i]);
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
                     "images/tiles.png",
                     "images/top_fow.png",
                     "images/heart.png",
                     "images/pulse.png",
                     "images/logo.png",
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
            Crafty.sprite(40, 40, "images/tiles.png", {
                tileSprite: [0,0]
            });
            Crafty.sprite(80, 80, "images/pulse.png", {
                pulseSprite: [0,0]
            });
            Crafty.sprite(1600,1200, "images/top_fow.png", {
                fow1: [0,0]
            });
            Crafty.sprite(400,400, "images/heart.png", {
                heartSprite: [0,0]
            });
            Crafty.sprite(800,600, "images/logo.png", {
                titleScreen: [0,0]
            });
            Crafty.audio.add("heartbeat", "sfx/short_heartbeat.wav");
            Crafty.audio.add("music", "music/telltale-heart-no-hb.wav");
            Crafty.scene("title");
        });

        Crafty.background("#000");
        Crafty.e("2D, DOM, Text").attr({w:100,h:20,x:150,y:120})
                .text("Loading")
                .css({"text-align":"center"});
    });

    Crafty.scene("loading");

    Crafty.scene("title", function() {
        var logo = Crafty.e("2D, DOM, titleScreen")
            .attr({x:0, y:0, z:0, w:800, h:600});
        setTimeout(function() {
            Crafty.audio.play("music", -1, 0.3);
            Crafty.scene("intro");
        }, 3000);
    });

    Crafty.scene("intro", function() {
        var done = false;
        var timeoutid = 0;
        var screenText = Crafty.e("2D, DOM, Text").attr({w:600,h:20,x:100,y:100})
                .text("")
                .css({"text-align":"center"});
        if(level_index >= LEVEL_DATA.Levels.length) {
            //After beating the final level
            screenText.css({"text-align":"right"});
            var zoom = 0.2, dzoom = 0.003, ddzoom = -0.008, count = 0, stopGrowth = false, beat = false;
            Crafty.audio.play("heartbeat", 1, 1);
            var cover = Crafty.e("2D, DOM, fow1").attr({x:0,y:0,z:10});
            var heart = Crafty.e("2D, DOM, heartSprite")
                .attr({x: 0, y: 0, z: 0})
                .css({"zoom":zoom, //IE
                      "-webkit-transform": "scale("+zoom+")", //Chrome
                      "-moz-transform":"scale("+zoom+")" //Firefox
                      })
                .bind("EnterFrame", function() {
                    ++count; if(cover && count > 10) cover.destroy();
                    zoom = zoom + dzoom + ddzoom;
                    if (zoom < 0) zoom = 0;
                    if(stopGrowth) {
                        if (count >= 12 && !beat) {dzoom = -dzoom; beat = true;}
                        if (count >= 24) {dzoom = 0; beat = false;}
                    } else {
                        if (count >= 20) ddzoom = 0;
                        if (zoom > 1.2) {stopGrowth = true; ddzoom = 0;}
                    }
                    //zoom is different for different browsers,
                    //for the sake of cross compatibilty, we'll implement as many as we can
                    this.css({"zoom":zoom, //IE
                              "-webkit-transform": "scale("+zoom+")", //Chrome
                              "-moz-transform":"scale("+zoom+")" //Firefox
                              });
                });
                setInterval(function() {
                    Crafty.audio.play("heartbeat", 1, 1);
                    if (stopGrowth) {dzoom = -0.01; count = 0;}
                    else {ddzoom = -0.008; count = 0;};
                }, 2000);

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
        return (distance(x1,x2,y1,y2) <= 25);
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

        var triggered = false;
        var player = Crafty.e("2D, DOM, playerSprite, playerControls, Collision, Dude")
                .attr({x: getStartX(level), y: getStartY(level), z: 2})
                .origin("center")
                .sprite(0, getStartDirection())
                .playerControls(1.5)
                .Dude()
                .bind("EnterFrame", function() {
                    if(withinRange(this._x, objective.x, this._y, objective.y) && !triggered) {
                        triggered = true;
                        animateText(screenText, level.triggerText, 50, function() {
                            timeouts.push(setTimeout(function() {
                                ++level_index;
                                clearTimeouts(heartbeatTimeouts);
                                clearTimeouts();
                                Crafty.scene("intro");
                                }, 3000));
                            });
                        }
                    });

        var fog_of_war_top = Crafty.e("2D, DOM, fow1, playerControls")
                .attr({x: player._x - 782, y: player._y - 576})
                .bind("EnterFrame", function() {
                    this.attr({x: player._x - 782, y: player._y - 576});
                });

        var getHeartbeatSpeed = function() {
            speed = (distance(player._x, objective.x, player._y, objective.y))*5;
            if (speed < 1000) speed = 1000;
            return speed;
        };
        var addHeartbeat = function(speed) {
            return setTimeout(function() {
                var distToHeart = distance(player._x, objective.x, player._y, objective.y);
                var heartbeatVolume = 1 - Math.log((distToHeart+3)/3)/10.0;
                Crafty.audio.play("heartbeat", 1, (heartbeatVolume < 1) ? ((heartbeatVolume > 0) ? heartbeatVolume : 0) : 1);
                Crafty.trigger("beat");
                clearTimeouts(heartbeatTimeouts);
                heartbeatTimeouts.push(addHeartbeat(getHeartbeatSpeed()));
            }, speed);
        };
        heartbeatTimeouts.push(addHeartbeat(getHeartbeatSpeed()));

        var pulse = Crafty.e("2D, DOM, SpriteAnimation, pulseSprite,  playerControls")
                .attr({x: player._x - 782, y: player._y - 576, z: 1})
                .animate("do_pulse", 0, 0, 3 )
                .animate("do_down_pulse", 3, 0, 0 )
                .bind("EnterFrame", function() {
                    this.attr({x: player._x - 23, y: player._y - 13})
                    this.updateSprite();
                })
                .bind("beat", function() {
                    this.animate("do_pulse", 40, 0)
                    this.animate("do_down_pulse", 40, 0)
                });


        player.requires('Keyboard').bind('KeyDown', function () {
            if (this.isDown('SPACE') && DEBUG) {
                //skipLevel
                ++level_index;
                clearTimeouts(heartbeatTimeouts);
                clearTimeouts();
                Crafty.scene("intro");
            }
        });

        var screenText = Crafty.e("2D, DOM, Text").attr({w:600,h:20,x:100,y:500})
            .text("")
            .css({"text-align":"left"});
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
                addTile(i, j,"floorSprite");
            else if(tiles[j][i]=='1')
                addTile(i, j,"wallSprite", true);
            else if(tiles[j][i]=='2')
                addTile(i, j,"brickSprite", true);
            else if(tiles[j][i]=='3')
                addTile(i, j,"tileSprite");
        }
    }
};

function addTile(i,j,tileSprite,solid)
{
    var solidString = solid ? "solid," : "";
    Crafty.e("2D, DOM, " + solidString + tileSprite)
        .attr({x: i*TILE_WIDTH, y: j*TILE_HEIGHT, z: 0});
}
