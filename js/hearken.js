var LEVEL_DATA;
var TILE_HEIGHT = 40;
var TILE_WIDTH = 40;
var level_index = 0;
var timeouts = [];
var intervals = [];

window.onload = function() {

    Crafty.init(800,600);

    function animateText(entity, text, speed, callback) {
        var index = 0;
        function queueNextChar() {
            timeouts.push(setTimeout(function() {
                entity.text(entity._text + text[index++]);
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
                     "images/floor.jpg",
                     "sfx/short_heartbeat.wav",
                     "music/telltale-heart-no-hb.wav"], function() {
			Crafty.sprite(32,48, "images/player.png", {
				playerSprite: [0,0]
			});
                        Crafty.sprite(40, 40, "images/wall.png", {
                                wallSprite: [0,0]
                        });
                        Crafty.sprite(40, 40, "images/wood.png", {
                                floorSprite: [0,0]
                        });
            Crafty.audio.add("heartbeat", "sfx/short_heartbeat.wav");
            Crafty.audio.add("music", "music/telltale-heart-no-hb.wav");
            Crafty.audio.play("music", -1, 1);
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
        animateText(screenText, getCurrentLevel().introText, 50, function()
        {
            timeouts.push(setTimeout(function(){
                Crafty.scene("main");
            },4000));
        });
        screenText.requires('Keyboard').bind('KeyDown', function () {
            if (this.isDown('SPACE')) {
                for (var i=0; i<timeouts.length; ++i) clearTimeout(timeouts[i]);
                timeouts = [];
                Crafty.scene("main");
            }
        });
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
                // A rudimentary way to prevent the user from passing solid areas
                .bind('Moved', function(from) {
                    if(this.hit('solid')){
                        this.attr({x: from.x, y:from.y});
                        this.stop();
                    }
                }).onHit("fire", function() {
                    this.destroy();
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
    function withinRange(x1,x2,y1,y2)
    {
        return (distance(x1,x2,y1,y2) <= 40);
    }

    function distance(x1,x2,y1,y2)
    {
        return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
    }

    Crafty.scene("main", function() {
        Crafty.background("url('images/background.png')");

        level = getCurrentLevel();
        generateMap(level);
        objective = getObjective(level);

        console.log(level);
        function getObjective(level)
        {
            var toRel = [];
            toRel.x = level.objective[1]*TILE_WIDTH;
            toRel.y = level.objective[0]*TILE_HEIGHT;
            console.log(toRel);
            return toRel;
        }
        intervals.push(setInterval(function(){
                var distToHeart = distance(player._x, objective.x, player._y, objective.y);
                var heartbeatVolume = 1 - Math.log((distToHeart+3)/3)/10.0;
                Crafty.audio.play("heartbeat", 1, (heartbeatVolume < 1) ? ((heartbeatVolume > 0) ? heartbeatVolume : 0) : 1);
                textToDisplay = "Distance: " + distToHeart + " volume: " + heartbeatVolume;
                screenText.text(textToDisplay);
            }, 3000));

        var player = Crafty.e("2D, DOM, playerSprite, playerControls, Collision, Dude, Keyboard")
                .attr({x: getStartX(level), y: getStartY(level), score:0})
                .origin("center")
                .playerControls(2)
                .Dude();
        function getStartX(level)
        {
            return level.start[1] * TILE_WIDTH;
        }
        function getStartY(level)
        {
            return level.start[0] * TILE_HEIGHT;
        }

        player.requires('Keyboard').bind('KeyDown', function () {
            if (this.isDown('SPACE')) {
                var digText = "";
                if(withinRange(player._x, objective.x, player._y, objective.y)){
                    digText = "HIT";
                    ++level_index;
                    for (var i=0; i<intervals.length; ++i) clearInterval(intervals[i]);
                    intervals = [];
                    Crafty.scene("intro");
                } else {
                    digText = "MISS";
                }
                screenText.text(digText);
            }
        });

        var screenText = Crafty.e("2D, DOM, Text").attr({w:100,h:20,x:150,y:120})
                .text("")
                .css({"text-align":"center"});
    });

};

function getCurrentLevel()
{
    return LEVEL_DATA.Levels[level_index];
}

//  GenerateMap
function generateMap(level)
{
    var tiles = level.tiles;

    for(var j = 0; j < tiles.length; j++)
    {
        for(var i = 0; i < tiles[j].length; i++)
        {
            if(tiles[j][i]=='0')
                addFloor(i, j);
            else if(tiles[j][i]=='1')
                addWall(i, j);
        }
    }
};

function addWall(i, j)
{
    Crafty.e("2D, DOM, solid, wallSprite")
        .attr({x: i*40, y: j*40, z: 0});
}

function addFloor(i, j)
{
    Crafty.e("2D, DOM, floorSprite")
        .attr({x: i*40, y: j*40, z: 0});
}
