import Boot from './states/Boot';
import Preload from './states/Preload';
import Menu from './states/Menu';
import Game from './states/Game';

class ProjectNostradamus extends Phaser.Game {
  constructor( ...args ) {
    super( ...args );

    this.state.add( 'Preload', Preload );
    this.state.add( 'Boot', Boot );
    this.state.add( 'Preload', Preload );
    this.state.add( 'Menu', Menu );
    this.state.add( 'Game', Game );

    this.state.start( 'Boot' );
  }
}
export default ProjectNostradamus;