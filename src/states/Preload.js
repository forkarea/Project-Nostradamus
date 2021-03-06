import { PLAYER_WIDTH, PLAYER_HEIGHT } from '../constants/PlayerConstants.js';
import { ZOMBIE_WIDTH, ZOMBIE_HEIGHT } from '../constants/ZombieConstants.js';

class Preload extends Phaser.State {
  preload() {
    this.load.image( 'tilemap_floor', 'assets/tilemaps/tilemap_floor.png' );
    this.load.image( 'tilemap_walls', 'assets/tilemaps/tilemap_walls.png' );

    this.game.load.spritesheet( 'player', './assets/images/player-sheet.png', PLAYER_WIDTH, PLAYER_HEIGHT );
    this.game.load.spritesheet( 'zombie', './assets/images/zombie-sheet.png', ZOMBIE_WIDTH, ZOMBIE_HEIGHT );

    this.game.load.image( 'computer', './assets/images/computer.png' );
    this.game.load.image( 'layer-background', './assets/images/bg-color.png' );
    this.game.load.image( 'journal-ui', './assets/images/journal-ui.png' );

    this.game.load.image( 'main-menu-btn', './assets/images/main-menu-btn.png' );
    this.game.load.image( 'restart-btn', './assets/images/restart-btn.png' );
  }
  create() {
    this.state.start( 'Menu' );
  }
}

export default Preload;
