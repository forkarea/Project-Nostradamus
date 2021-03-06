import PathFinder from './PathFinder';
import { willZombiesPathsInterfere } from '../../utils/DeterminePathCollisionUtils';
import { getFreeTileAroundZombieExcludingOtherZombie } from '../../utils/HandlePathCollisionUtils';
import { tileToPixels, pixelsToTile } from '../../utils/MapUtils';
import { MIN_DISTANCE_TO_TARGET } from '../../constants/ZombieConstants';

export const STATES = {
  NOT_STARTED: 0,
  ON_STANDARD_PATH: 1,
  ON_TEMPORARY_PATH: 2,
  CALCULATING_PATH: 3,
};

export default class ZombiePathManager {
  constructor( zombie, targets, walls ) {
    this.zombie = zombie;
    this.targets = targets;
    this.walls = walls;

    this.pathFinder = new PathFinder();
    this.pathFinder.setGrid( walls );

    this.pathsBetweenTargets = [];

    this.currentPathIndex = 0;
    this.currentStepIndex = 0;

    this.temporaryPath = [];
    this.temporaryStepIndex = 0;

    this.state = STATES.NOT_STARTED;
  }
  start( callback ) {
    // for now it assumes that zombie is placed on first path target
    this.calculatePathsBetweenTargets( () => {
      this.state = STATES.ON_STANDARD_PATH;
      callback();
    } );
  }
  // Recursive function that calculates standard paths and save them into pathsBetweenPathTargets container.
  // Recurse approach is used to handle asynchronous nature of findPath method.
  calculatePathsBetweenTargets( doneCallback, index = 0 ) {
    if ( this.pathsBetweenTargets.length === this.targets.length ) {
      doneCallback();
      return;
    }

    const start = this.targets[ index ];
    const target = ( index === this.targets.length - 1 ) ? this.targets[ 0 ] : this.targets[ index + 1 ];

    this.pathFinder.findPath( start.x, start.y, target.x, target.y, ( path ) => {
      this.pathsBetweenTargets.push( { path, start, target } );
      this.calculatePathsBetweenTargets( doneCallback, index + 1 );
    } );
  }
  update() {
    switch ( this.state ) {
    case STATES.ON_STANDARD_PATH:
      this.moveOnStandardPath();
      break;
    case STATES.ON_TEMPORARY_PATH:
      this.moveOnTemporaryPath();
      break;
    case STATES.CALCULATING_PATH:
      this.zombie.body.velocity.x = 0;
      this.zombie.body.velocity.y = 0;
      break;
    }
  }
  moveOnStandardPath() {
    const stepTarget = this.getCurrentStepTarget();

    if ( this.isReached( stepTarget ) ) {
      this.onStepTargetReach();
    }
    this.zombie.game.physics.arcade.moveToObject( this.zombie, tileToPixels( stepTarget ) );
  }
  isReached( target ) {
    const distanceToTarget = this.zombie.game.physics.arcade.distanceBetween( this.zombie, tileToPixels( target ) );
    return distanceToTarget <= MIN_DISTANCE_TO_TARGET;
  }
  onStepTargetReach() {
    this.currentStepIndex++;

    if ( this.currentStepIndex === this.pathsBetweenTargets[ this.currentPathIndex ].path.length ) {
      this.currentStepIndex = 0;
      this.currentPathIndex++;

      if ( this.currentPathIndex === this.pathsBetweenTargets.length ) {
        this.currentPathIndex = 0;
      }
    }
  }
  getCurrentStepTarget() {
    return this.pathsBetweenTargets[ this.currentPathIndex ].path[ this.currentStepIndex ];
  }
  changePathToTemporary( startTile ) {
    this.state = STATES.CALCULATING_PATH;

    const currentTarget = this.pathsBetweenTargets[ this.currentPathIndex ].target;

    this.pathFinder.findPath( startTile.x, startTile.y, currentTarget.x, currentTarget.y, ( path ) => {
      if ( path.length === 0 ) {
        this.changePathToStandard();
        return;
      }
      this.temporaryPath = path;
      this.temporaryStepIndex = 0;

      this.state = STATES.ON_TEMPORARY_PATH;
    } );
  }
  getTemporaryStepTarget() {
    return this.temporaryPath[ this.temporaryStepIndex ];
  }
  changePathToStandard() {
    this.currentPathIndex = ( this.currentPathIndex + 1 === this.pathsBetweenTargets.length ) ? 0 : this.currentPathIndex + 1;
    this.currentStepIndex = 0;
    this.state = STATES.ON_STANDARD_PATH;
  }
  moveOnTemporaryPath() {
    const temporaryStepTarget = this.getTemporaryStepTarget();
    if ( this.isReached( temporaryStepTarget ) ) {
      this.onTemporaryStepTargetReach();
    }
    this.zombie.game.physics.arcade.moveToObject( this.zombie, tileToPixels( temporaryStepTarget ) );
  }
  onTemporaryStepTargetReach() {
    this.temporaryStepIndex++;
    if ( this.temporaryStepIndex === this.temporaryPath.length ) {
      this.changePathToStandard();
    }
  }
  onCollisionEnter( bodyA ) {
    if ( bodyA == null || bodyA.sprite == null ) {
      return;
    }

    if ( bodyA.sprite.key === 'zombie' ) {
      this.checkForCollisionPossibility( bodyA.sprite );
    }
  }
  checkForCollisionPossibility( zombieToCollideWith ) {
    if ( willZombiesPathsInterfere( this, zombieToCollideWith.walkingOnPathManager ) ) {
      const newTemporaryTarget = getFreeTileAroundZombieExcludingOtherZombie( this.zombie, zombieToCollideWith, this.walls );
      this.changePathToTemporary( newTemporaryTarget );
    }
  }
  getCurrentTileTarget() {
    if ( this.state === STATES.ON_STANDARD_PATH ) {
      return this.getCurrentStepTarget();
    } else if ( this.state === STATES.ON_TEMPORARY_PATH ) {
      return this.getTemporaryStepTarget();
    }
    return pixelsToTile( this.zombie );
  }
  getBackOnPath() {
    const zombieTile = pixelsToTile( this.zombie );
    this.changePathToTemporary( zombieTile );
  }
}
