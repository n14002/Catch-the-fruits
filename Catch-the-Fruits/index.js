
// Catch the Fruits
//

//
var URL_BEAR_CHARS     = 'http://enchantjs.com/assets/images/chara1.gif';
var URL_MAP_TEXTURES   = 'http://enchantjs.com/assets/images/map0.gif';
var URL_ICON_IMAGES    = 'http://enchantjs.com/assets/images/icon0.gif';
var URL_EXPLOSION      = 'http://enchantjs.com/assets/images/effect0.gif';
var URL_SE_FRUIT       = 'http://enchantjs.com/assets/sounds/se2.wav';
var URL_SE_BOMB        = 'http://enchantjs.com/assets/sounds/bomb1.wav';
var URL_SE_STAR        = 'http://enchantjs.com/assets/sounds/se1.wav';
var URL_SE_CLOCK       = 'http://enchantjs.com/assets/sounds/se3.wav';
var URL_SE_HEART       = 'http://enchantjs.com/assets/sounds/se1.wav';
var URL_SE_DIAMOND     = 'http://enchantjs.com/assets/sounds/jingle05.wav';
var URL_SE_GAMEOVER    = 'http://enchantjs.com/assets/sounds/se5.wav';
var URL_SE_WALK        = 'http://jsrun.it/assets/r/h/I/B/rhIBu.mp3';
var URL_BGM = "http://www.tam-music.com/mp3/tfsafe.cgi/accessIP_check_mp3_I1iLl1hihTLb/tammb08.mp3";
var SCREEN_CX = 320;
var SCREEN_CY = 320;
var CHARSIZE = 32;
var CHARHALFSIZE = CHARSIZE / 2;
var OBJSIZE = 16;
var GROUNDHEIGHT = 16;
var BEAR_UNITSPEED = 3;
var GAMEFPS = 16;
var TOUCH_NONE = 0;
var TOUCH_RIGHT = 1;
var TOUCH_LEFT = 2;


// enchant.js voodoo

enchant();

var game = new Game( SCREEN_CX, SCREEN_CY );

// Utility functions

function rand(num){
  return Math.floor(Math.random() * num);
}

function min(a, b) {
  return (( a < b ) ? a : b);
}

function max(a, b) {
  return (( b < a ) ? a : b);
}


// Classes

DummySound = Class.create( Object, {
  initialize:function() {},
           play:function() {},
           pause:function() {},
           stop:function() {}
} );
var noSound = new DummySound();


Bear = Class.create( Sprite, {

  initialize:function() {
    Sprite.call( this, CHARSIZE, CHARSIZE );
    this.speedlevel = 3;
    this.image  = game.assets[URL_BEAR_CHARS];
    this.x      = SCREEN_CX / 2  - CHARHALFSIZE;
    this.y      = SCREEN_CX - GROUNDHEIGHT - CHARSIZE;
    this.anim   = [10, 11, 10, 12];
    this.frame  = 10;
    this.tick = 0;
  },

     onenterframe:function() {
       ++this.tick;
       if (game.input.left || game.touch === TOUCH_LEFT)  {
         this.x -= BEAR_UNITSPEED * this.speedlevel;
         this.x = max( 0, this.x );
         this.scaleX = -1;
       } else if (game.input.right || game.touch === TOUCH_RIGHT) {
         this.x += BEAR_UNITSPEED * this.speedlevel;
         this.x = min( SCREEN_CX - CHARSIZE, this.x );
         this.scaleX =  1;
       }
       if (!game.input.left && !game.input.right && game.touch === TOUCH_NONE) {
         game.seWalk.pause();
         this.frame = this.anim[0];            
       } else {
         game.seWalk.play();
         this.frame = this.anim[this.tick % 4];            
       }
     }
} );

Explosion = Class.create( Sprite, {

  initialize:function(x, y) {
    Sprite.call( this, OBJSIZE, OBJSIZE );
    this.x = x;
    this.y = y;
    this.image  = game.assets[URL_EXPLOSION];
    this.frame  = 0;
    this.tick = 0;
  },

          onenterframe:function() {
            ++this.tick;
            if ( this.tick % 2 === 0 ) {
              if ( this.frame < 4 ) {
                this.frame++;
              } else {
                game.rootScene.removeChild(this); 
              }
            }
          }
} );

VanishText = Class.create( Label, {

  initialize:function(txt, x, y, duration, xspeed, yspeed) {
    Label.call( this, txt );
    this.x = x;
    this.y = y;
    this.opaspeed = 1.0 / duration;
    this.xspeed = xspeed;
    this.yspeed = yspeed;
  },

           onenterframe:function() {
             this.x += this.xspeed;
             this.y += this.yspeed;
             var newopa = this.opacity - this.opaspeed;
             if ( newopa <= 0 ) {
               game.rootScene.removeChild(this); 
             } else {
               this.opacity = newopa;
             }
           }
} );

DropObject = Class.create( Sprite, {

  initialize:function( objtype ) {
    Sprite.call( this, OBJSIZE, OBJSIZE );
    this.x = Math.floor( Math.random() * (SCREEN_CX - OBJSIZE) );
    this.y = -OBJSIZE;
    this.image = game.assets[URL_ICON_IMAGES];
    this.frame = objtype;
    this.speed = 3 + Math.random() * 6;
  },

           vanish:function() {
             game.rootScene.removeChild(this);
           },

           onhitplayer:function() {},

           onenterframe:function() {
             if ( 0 < game.clocktick ) {
               this.y += this.speed / 2;
             } else {
               this.y += this.speed;
             }

             if ( game.player.within(this, OBJSIZE) ) {
               this.onhitplayer();
               this.vanish();
             } else if ( SCREEN_CY - OBJSIZE < this.y ) {
               game.rootScene.removeChild(this); 
             }
           }

} );

Fruit = Class.create( DropObject, {
  initialize:function() {
    var fruittype = game.fruits[ Math.floor(game.objtick / 20) % game.fruits.length ];
    DropObject.call(this, fruittype);
  },

      vanish:function() {
        game.rootScene.addChild( new VanishText( "<strong><font color=red size='+1'>30</font><strong>", this.x, this.y, 8, 0, -4 ) );
        game.rootScene.removeChild(this); 
      },

      onhitplayer:function() {
        game.seFruit.stop();
        game.seFruit.play();
        game.score += 30;
        game.tick += GAMEFPS;
      }
} );

Bomb = Class.create( DropObject, {
  initialize:function() {
    DropObject.call(this, 24);
  },

     vanish:function() {
       game.seBomb.stop();
       game.seBomb.play();
       game.rootScene.addChild( new Explosion(this.x, this.y) );
       game.rootScene.removeChild(this); 
     },

     onhitplayer:function() {
       game.player.frame = 13;
       game.tick -= 200;
     }
} );

Clock = Class.create( DropObject, {
  initialize:function() {
    DropObject.call(this, 34);
  },

      vanish:function() {
        game.rootScene.addChild( new VanishText( "<strong><font color=red size='+1'>SLOW DOWN</font><strong>", this.x, this.y, 8, 0, -4 ) );
        game.rootScene.removeChild(this); 
      },

      onhitplayer:function() {
        game.seClock.play();
        game.clocktick += 5 * GAMEFPS;
      }
} );

Heart = Class.create( DropObject, {
  initialize:function() {
    DropObject.call(this, 10);
    this.speed = 5 + game.objtick / 20;
  },

      vanish:function() {
        game.rootScene.addChild( new VanishText( "<strong><font color=green size='+1'>LIFE +80</font><strong>", this.x, this.y, 8, 0, -4 ) );
        game.rootScene.removeChild(this); 
      },

      onhitplayer:function() {
        game.seHeart.play();
        game.tick += 5 * GAMEFPS;
      }
} );

Star = Class.create( DropObject, {
  initialize:function() {
    DropObject.call(this, 30);
  },

     vanish:function() {
       game.rootScene.addChild( new VanishText( "<strong><font color=yellow size='+1'>SPEED UP</font><strong>", this.x, this.y, 8, 0, -4 ) );
       game.rootScene.removeChild(this); 
     },

     onhitplayer:function() {
       game.seStar.play();
       ++game.player.speedlevel;
     }
} );

Diamond = Class.create( DropObject, {
  initialize:function() {
    DropObject.call(this, 64);
    this.speed = 20;
  },

        onhitplayer:function() {
          game.seDiamond.play();	
          var objArray = game.rootScene.childNodes.concat();
          for ( var i = 0; i < objArray.length; ++i ) {
            if ( objArray[i] instanceof Bomb ) {
              objArray[i].vanish();
            }
          }

          var BONUS_COUNT = 50;
          for ( var i = 0; i < BONUS_COUNT; ++i ) {
            var fruit = new Fruit();
            game.rootScene.addChild( fruit );
          }
        }
});


window.onload = function() {

  game.preload( URL_BEAR_CHARS, URL_MAP_TEXTURES, URL_ICON_IMAGES, URL_EXPLOSION );

  game.seFruit = noSound;
  game.seBomb = noSound;
  game.seStar = noSound;
  game.seClock = noSound;
  game.seHeart = noSound;
  game.seDiamond = noSound;
  game.seGameover = noSound;
  game.seWalk = noSound;
  game.bgm = noSound;

  var strUA = "";
  strUA = navigator.userAgent.toLowerCase();

  if ( strUA.indexOf("chrome") != -1 || strUA.indexOf("safari") == -1) {
    game.seFruit = Sound.load( URL_SE_FRUIT );
    game.seBomb = Sound.load( URL_SE_BOMB );
    game.seStar = Sound.load( URL_SE_STAR );
    game.seClock = Sound.load( URL_SE_CLOCK );
    game.seHeart = Sound.load( URL_SE_HEART );
    game.seDiamond = Sound.load( URL_SE_DIAMOND );
    game.seGameover = Sound.load( URL_SE_GAMEOVER );
    game.seWalk = Sound.load( URL_SE_WALK );
    game.bgm = Sound.load( URL_BGM );
  }

  game.fps = GAMEFPS;    
  game.score = 0;
  game.touch = TOUCH_NONE;
  game.fruits = [15, 16, 17, 18, 27, 28, 29, 32];
  var label;

  game.rootScene.addEventListener( 'touchstart', function(e) {
    if ( e.x < SCREEN_CX / 2 ) {
      game.touch = TOUCH_LEFT;
    } else {
      game.touch = TOUCH_RIGHT;
    }
  } );
  game.rootScene.addEventListener( 'touchmove', function(e) {
    if ( e.x < SCREEN_CX / 2 ) {
      game.touch = TOUCH_LEFT;
    } else {
      game.touch = TOUCH_RIGHT;
    }
  } );
  game.rootScene.addEventListener( 'touchend', function(e) {
    game.touch = TOUCH_NONE;
  } );

  game.onload = function() {
    //Draw background
    var bg = new Sprite( 320, 320 );
    bg.backgroundColor = "rgb(0, 200, 255)";
    var maptip = game.assets[URL_MAP_TEXTURES];
    var image = new Surface(320, 320);
    for ( var i = 0; i < 320; i += 16 ) {
      image.draw(maptip, 7 * 16, 0, 16, 16, i, 320 - 16, 16, 16);
    }
    bg.image = image;
    game.rootScene.addChild(bg);

    //! Create label
    label = new Label("");
    game.rootScene.addChild(label);

    //! Create bear
    bear = new Bear();
    game.rootScene.addChild( bear );
    game.player = bear;
  };

  game.updateLabel = function() {
    var slowdownLabel = "";
    if ( 0 < game.clocktick ) {
      slowdownLabel = "<BR>SLOW DOWN:" + Math.floor(game.clocktick / GAMEFPS);
    }
    label.text = "<STRONG>LIFE:" + game.tick  + "<BR>SCORE:" + game.score + "<BR>SPEED:" + game.player.speedlevel + slowdownLabel + "</STRONG>";
  };

  game.objtick = 1;

  game.tick = GAMEFPS * 30;
  game.clocktick = 0;
  game.rootScene.addEventListener(Event.ENTER_FRAME, function() {
    game.bgm.play();
    game.tick--;
    if ( 0 < game.clocktick ) {
      if ( game.clocktick % 2 == 0 ) {
        ++game.tick;
      }
      --game.clocktick;
    }
    if (game.tick > 0) {
      if ((game.tick % 10) === 0) {		
        if ( game.objtick % 30 === 0 ) {
          game.rootScene.addChild( new Diamond() );
        } else if ( game.objtick % 20 === 0 ) {
          game.rootScene.addChild( new Star() );
        } else if ( game.objtick % 15 === 0 ) {
          game.rootScene.addChild( new Heart() );
        } else if ( game.objtick % 10 === 0 ) {
          game.rootScene.addChild( new Clock() );
        } else {
          game.rootScene.addChild( new Fruit() );
          var bombcount = min(5, game.objtick / 100);
          for ( var i = 0; i < bombcount; ++ i ) {
            game.rootScene.addChild( new Bomb() );
          }
        }
        game.objtick++;
      }
      game.updateLabel();
    } else if (game.tick <= 0) {
      game.bgm.stop();
      game.seWalk.stop();
      game.player.frame = 13;
      game.tick = 0;
      game.updateLabel();
      game.seGameover.play();
      game.end(game.score, game.score + "点でした" );
    }
  });
  game.start();
};

