import { JOURNAL_TEXT_FIELD_WIDTH, JOURNAL_TEXT_FIELD_HEIGHT, JOURNAL_TEXT_SCROLL_STEP, JOURNAL_TEXT_FONT_SIZE, JOURNAL_SCROLL_BAR_WIDTH, MAGIC_OFFSET_FIXING_VALUE } from '../constants/ItemConstants';
import { showBackgroundLayer, getScreenCenter } from '../utils/UserInterfaceUtils';

export default class JournalsManager extends Phaser.Group {
  constructor( game, player ) {
    super( game );

    const style = { font: '24px Arial', fill: '#fff' };

    this.messageText = this.game.add.text( 0, 0, '', style );
    this.messageText.x = 24;
    this.messageText.y = this.game.height - 24 - 32;
    this.messageText.fixedToCamera = true;

    this.player = player;

    this.activateKey = this.game.input.keyboard.addKey( Phaser.Keyboard.E );
    this.activateKey.onDown.add( this.tryToShowJournal, this );
    this.game.input.keyboard.removeKeyCapture( Phaser.Keyboard.E );

    this.activateKey = this.game.input.keyboard.addKey( Phaser.Keyboard.ESC );
    this.activateKey.onDown.add( this.tryToHideJournal, this );
    this.game.input.keyboard.removeKeyCapture( Phaser.Keyboard.ESC );

    this.isJournalOpened = false;
  }
  tryToShowJournal() {
    if ( this.isJournalOpened ) {
      return;
    }
    const approachedJournals = this.children.filter( journal => journal.hasPlayerApproached );
    if ( approachedJournals.length > 0 ) {
      this.isJournalOpened = true;
      this.game.paused = true;
      this.messageText.setText( 'Press \'ESC\' to close personal journal.' );

      const nearestJournal = this.getJournalNearestToPlayer( approachedJournals );
      this.showJournal( nearestJournal );
    }
  }
  getJournalNearestToPlayer( journals ) {
    let nearestJournal = journals[ 0 ];

    journals.forEach( ( journal ) => {
      if ( Phaser.Math.distance( this.player.x, this.player.y, journal.x, journal.y )
      < Phaser.Math.distance( this.player.x, this.player.y, nearestJournal.x, nearestJournal.y ) ) {
        nearestJournal = journal;
      }
    } );

    return nearestJournal;
  }
  showJournal( journalToShow ) {
    const screenCenter = getScreenCenter( this.game );

    this.backgroundLayer = showBackgroundLayer( this.game );

    this.ui = this.game.add.sprite( screenCenter.x, screenCenter.y + MAGIC_OFFSET_FIXING_VALUE, 'journal-ui' );
    this.ui.anchor.setTo( 0.5 );

    const textStyle = {
      align: 'left',
      fill: '#10aede',
      font: `bold ${JOURNAL_TEXT_FONT_SIZE}px Arial`,
      padding: '0',
      margin: '0',
    };

    this.uiText = this.game.add.text( screenCenter.x - JOURNAL_TEXT_FIELD_WIDTH / 2, screenCenter.y - JOURNAL_TEXT_FIELD_HEIGHT / 2, journalToShow.content, textStyle );
    this.uiText.wordWrap = true;
    this.uiText.wordWrapWidth = JOURNAL_TEXT_FIELD_WIDTH;

    this.maskGraphics = this.game.add.graphics( 0, 0 );
    this.maskGraphics.beginFill( 0xffffff );
    this.maskGraphics.drawRect( screenCenter.x - JOURNAL_TEXT_FIELD_WIDTH / 2, this.uiText.y, JOURNAL_TEXT_FIELD_WIDTH, JOURNAL_TEXT_FIELD_HEIGHT );

    this.uiText.mask = this.maskGraphics;

    this.scrollBar = this.game.add.graphics( screenCenter.x + JOURNAL_TEXT_FIELD_WIDTH / 2, this.uiText.y );
    this.scrollBar.alpha = 0.5;
    this.scrollBarHeight = ( this.uiText.height > JOURNAL_TEXT_FIELD_HEIGHT ) ? Math.pow( JOURNAL_TEXT_FIELD_HEIGHT, 2 ) / this.uiText.height : JOURNAL_TEXT_FIELD_HEIGHT;
    this.scrollBarOffset = 0;
    this.scrollBarStep = ( JOURNAL_TEXT_SCROLL_STEP / this.uiText.height ) * JOURNAL_TEXT_FIELD_HEIGHT;

    this.drawScrollBar();
  }
  tryToHideJournal() {
    if ( this.isJournalOpened && this.game.paused ) {
      this.isJournalOpened = false;
      this.game.paused = false;
      this.messageText.setText( 'Press \'E\' to open personal journal.' );
      this.backgroundLayer.destroy();
      this.ui.destroy();
      this.uiText.destroy();
      this.maskGraphics.destroy();
      this.scrollBar.destroy();
    }
  }
  onCollisionEnter( bodyA, bodyB, shapeA, shapeB ) {
    if ( this.isItSensorArea( bodyA, shapeB ) ) {
      this.messageText.setText( 'Press \'E\' to open personal journal.' );
      bodyA.sprite.hasPlayerApproached = true;
    }
  }
  onCollisionLeave( bodyA, bodyB, shapeA, shapeB ) {
    if ( this.isItSensorArea( bodyA, shapeB ) ) {
      this.messageText.setText( '' );
      bodyA.sprite.hasPlayerApproached = false;
    }
  }
  isItSensorArea( body, shape ) {
    if ( body.sprite == null || shape.sensor == null ) {
      return false;
    }
    // for now this line assume that there is only one type of computer's textures
    // TODO enable different sprite key's handling
    return body.sprite.key === 'computer' && shape.sensor;
  }
  onMouseWheel( ) {
    if ( this.isJournalOpened === false ) {
      return;
    }
    const directionY = this.game.input.mouse.wheelDelta;

    if ( directionY === 1 && this.uiText.y < this.game.camera.y + this.game.camera.height / 2 - JOURNAL_TEXT_FIELD_HEIGHT / 2 ) {
      this.uiText.y += JOURNAL_TEXT_SCROLL_STEP;
      this.drawScrollBar( -this.scrollBarStep );
    } else if ( directionY === -1 && this.uiText.y > this.game.camera.y + this.game.camera.height / 2 + JOURNAL_TEXT_FIELD_HEIGHT / 2 - this.uiText.height ) {
      this.uiText.y -= JOURNAL_TEXT_SCROLL_STEP;
      this.drawScrollBar( this.scrollBarStep );
    }
  }
  drawScrollBar( y = 0 ) {
    this.scrollBarOffset += y;
    this.scrollBar.clear();
    this.scrollBar.beginFill( 0xffffff );
    this.scrollBar.drawRect( 0, this.scrollBarOffset, JOURNAL_SCROLL_BAR_WIDTH, this.scrollBarHeight );
    this.scrollBar.endFill();
  }
  clearUI() {
    this.tryToHideJournal();
    this.messageText.destroy();
  }
}
