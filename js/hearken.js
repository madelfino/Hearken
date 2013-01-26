var LEVEL_DATA;
var TILE_HEIGHT = 40;
var TILE_WIDTH = 40;
var level_index = 0;

window.onload = function() {

    Crafty.init(800,600);

    function animateText(entity, text, speed, callback) {
        var index = 0;
        function queueNextChar() {
            setTimeout(function() {
                entity.text(entity._text + text[index++]);
                if (index < text.length) queueNextChar();
                else if(callback) callback();
            }, speed);
        }
        if (index < text.length) queueNextChar();
    }

    Crafty.scene("loading", function(){
    
        Crafty.load(["images/background.png", "images/player.png", "sfx/heartbeat.wav"], function() {
			Crafty.sprite(32,48, "images/player.png", {
				playerSprite: [0,0]
			});
                        Crafty.sprite(40, 40, "images/wall.png", {
                                wallSprite: [0,0]
                        });
            Crafty.audio.add("heartbeat", "sfx/short_heartbeat.wav");
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
        var screenText = Crafty.e("2D, DOM, Text").attr({w:600,h:20,x:100,y:100})
                .text("")
                .css({"text-align":"center"});
        screenText.requires('Keyboard').bind('KeyDown', function () { if (this.isDown('SPACE')) Crafty.scene("main"); });
        animateText(screenText, "TRUE! --nervous --very, very dreadfully nervous I had been and am; but why will you say that I am mad? The disease had sharpened my senses --not destroyed --not dulled them. Above all was the sense of hearing acute. I heard all things in the heaven and in the earth. I heard many things in hell. How, then, am I mad? Hearken! and observe how healthily --how calmly I can tell you the whole story.", 50, function()
        {
            setTimeout(function(){Crafty.scene("main");},4000);
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
        var objective = [];
        objective.x = 100;
        objective.y = 100;
        
        var beat = setInterval(function(){
                //var distToHeart = distance(player.x, level.objective[1]*TILE_HEIGHT, player.y, level.objective[0]*TILE_WIDTH);
                var distToHeart = distance(player._x, objective.x, player._y, objective.y);
                var heartbeatVolume = 1 - Math.log((distToHeart+3)/3)/10.0;
                Crafty.audio.play("heartbeat", 1, (heartbeatVolume < 1) ? ((heartbeatVolume > 0) ? heartbeatVolume : 0) : 1);
                textToDisplay = "Distance: " + distToHeart + " volume: " + heartbeatVolume;
                screenText.text(textToDisplay);
            }, 3000);
        
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
            if(tiles[j][i]=='1')
                addWall(i, j);
        }
    }
};

function addWall(i, j)
{
    Crafty.e("2D, DOM, solid, wallSprite")
        .attr({x: i*40, y: j*40, z: 1});
}
