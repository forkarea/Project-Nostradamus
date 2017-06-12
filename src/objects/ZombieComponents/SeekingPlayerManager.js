import { ZOMBIE_SIGHT_ANGLE, ZOMBIE_SIGHT_RANGE, ZOMBIE_HEARING_RANGE } from '../../constants/ZombieConstants';
import { isInDegreeRange } from '../../utils/MathUtils';

export default class SeekingPlayerManager {
  constructor( zombie, player, walls ) {
    this.zombie = zombie;
    this.player = player;
    this.walls = walls;

    this.state = 'searching';

    this.isPlayerInViewRange = false;
    this.isPlayerInHearingRange = false;

    const body = zombie.body;

    const viewSensor = body.addCircle( ZOMBIE_SIGHT_RANGE );
    viewSensor.sensor = true;
    viewSensor.sensorType = 'view';

    const hearSensor = body.addCircle( ZOMBIE_HEARING_RANGE );
    hearSensor.sensor = true;
    hearSensor.sensorType = 'hear';

    this.chasePlayerSignal = new Phaser.Signal();
  }
  update() {
    if ( this.canDetectPlayer() ) {
      this.changeStateToChasing();
    }
  }

  canDetectPlayer() {
    if ( this.isPlayerDead ) {
      return false;
    }

    /** Draw line between player and zombie and check if it can see him. If yes, chase him. */
    const playerSeekingRay = new Phaser.Line();
    playerSeekingRay.start.set( this.zombie.x, this.zombie.y );
    playerSeekingRay.end.set( this.player.x, this.player.y );

    const tileHits = this.walls.getRayCastTiles( playerSeekingRay, 0, false, false );

    for ( let i = 0; i < tileHits.length; i++ ) {
      if ( tileHits[ i ].index >= 0 ) {
        return false;
      }
    }
    return this.canSeePlayer() || this.canHearPlayer();
  }
  canSeePlayer() {
    return ( this.isPlayerInViewRange && isInDegreeRange( this.zombie, this.player, ZOMBIE_SIGHT_ANGLE ) );
  }
  canHearPlayer() {
    return ( this.isPlayerInHearingRange && !this.player.isSneaking && this.player.isMoving() );
  }
  onCollisionEnter( bodyA, bodyB, shapeA ) {
    if ( this.isItSensorArea( bodyA, shapeA ) ) {
      if ( shapeA.sensorType === 'view' && bodyA.sprite.key === 'player' ) {
        this.isPlayerInViewRange = true;
      } else if ( shapeA.sensorType === 'hear' && bodyA.sprite.key === 'player' ) {
        this.isPlayerInHearingRange = true;
      }
    }
  }
  onCollisionLeave( bodyA, bodyB, shapeA ) {
    if ( this.isItSensorArea( bodyA, shapeA ) ) {
      if ( shapeA.sensorType === 'view' && bodyA.sprite.key === 'player' ) {
        this.isPlayerInViewRange = false;
      } else if ( shapeA.sensorType === 'hear' && bodyA.sprite.key === 'player' ) {
        this.isPlayerInHearingRange = false;
      }
    }
  }
  isItSensorArea( body, shape ) {
    if ( body == null || body.sprite == null || shape.sensor == null ) {
      return false;
    }

    return shape.sensor;
  }
  changeStateToChasing() {
    this.chasePlayerSignal.dispatch();
  }
}
