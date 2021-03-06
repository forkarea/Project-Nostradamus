class Boot extends Phaser.State {
  preload() {
  }
  create() {
    // this.game.stage.disableVisibilityChange = true;

    // this.game.scale.maxWidth = 800;
    // this.game.scale.maxHeight = 600;

    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.game.scale.updateLayout();

    this.game.physics.startSystem( Phaser.Physics.P2JS );
    this.game.physics.p2.setImpactEvents( true );
    this.state.start( 'Preload' );
  }
}

export default Boot;
