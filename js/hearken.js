window.onload = function() {

    Crafty.init(800,600);

    Crafty.scene("loading", function(){
    
        Crafty.load(["images/background.png", "images/player.png", "sfx/heartbeat.wav"], function() {
			Crafty.sprite(32,48, "images/player.png", {
				player: [0,0]
			});
            Crafty.audio.add("heartbeat", "sfx/short_heartbeat.wav");
            Crafty.scene("main");
        });

        Crafty.background("#000");
        Crafty.e("2D, DOM, Text").attr({w:100,h:20,x:150,y:120})
                .text("Loading")
                .css({"text-align":"center"});
    });

    Crafty.scene("loading");

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
	
    function distance(x1,x2,y1,y2)
    {
        return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
    }
    
    Crafty.scene("main", function() {
        Crafty.background("url('images/background.png')");
        
        var beat = setInterval(function(){
                var heartbeatVolume = distance(player.x, 0, player.y, 0)/1000.0;
                Crafty.audio.play("heartbeat", 1, heartbeatVolume);
                screenText.text("volume: " + heartbeatVolume);
            }, 3000);
        
        var player = Crafty.e("2D, DOM, player, playerControls, Collision, Dude")
                .attr({x:Crafty.viewport.width/2, y:Crafty.viewport.height/2, score:0})
                .origin("center")
                .playerControls(1)
                .Dude();
                
        var screenText = Crafty.e("2D, DOM, Text").attr({w:100,h:20,x:150,y:120})
                .text("")
                .css({"text-align":"center"});
    });

};
