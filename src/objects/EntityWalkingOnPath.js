import Entity from './Entity';
import PathFinder from '../objects/PathFinder.js';
import { ZOMBIE_SPEED, ZOMBIE_ROTATING_SPEED, MIN_DISTANCE_TO_TARGET } from '../constants/ZombieConstants';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';
import { tileToPixels, getWallsPostions } from '../utils/MapUtils.js';

/** Create Entity that is supposed to walk on given path. Set position of entity on first given target*/
export default class EntityWalkingOnPath extends Entity {
  constructor( game, imageKey, frame, targets, walls ) {
    const position = tileToPixels( targets[ 0 ] );

    super( game, position.x, position.y, imageKey, frame );

    this.pathfinder = new PathFinder();
    this.wallsPositions = getWallsPostions( walls );

    this.pathfinder.setGrid( this.wallsPositions );

    this.targets = targets;

    this.pathsBetweenPathTargets = [];

    this.currentPathIndex = 0;
    this.currentStepIndex = 0;

    this.isOnStandardPath = true;
    this.temporaryPath = [];
    this.temporaryStepIndex = 0;

    /* disable update until paths are calculated */
    this.isInitialized = false;
    this.canMove = false;

    this.calculatePathsBetweenTargets( () => {
      this.stepTarget = this.pathsBetweenPathTargets[ this.currentPathIndex ].path[ this.currentStepIndex ];
      this.isInitialized = true;
      this.canMove = true;
    } );
  }
  /**Recursive function that calculates standard paths and save them into pathsBetweenPathTargets container.  Recurse approach is used to handle asynchronous nature of findPath method */
  calculatePathsBetweenTargets( doneCallback, index = 0 ) {
    if ( this.pathsBetweenPathTargets.length === this.targets.length ) {
      doneCallback();
      return;
    }

    const start = this.targets[ index ];
    const target = ( index === this.targets.length - 1 ) ? this.targets[ 0 ] : this.targets[ index + 1 ];

    this.pathfinder.findPath( start.x, start.y, target.x, target.y, ( path ) => {
      this.pathsBetweenPathTargets.push( { path, start, target } );
      this.calculatePathsBetweenTargets( doneCallback, index + 1 );
    } );
  }
  update() {
    /** Check if current target or step target is reached. Move body in stepTarget direction. */
    if ( this.canMove ) {
      if ( this.isReached( this.stepTarget ) ) {
        this.onStepTargetReach();
      }
      this.game.physics.arcade.moveToObject( this, tileToPixels( this.stepTarget ), ZOMBIE_SPEED );

      this.updateLookDirection();
    }
  }
  /** When current step target or temporary step target is reached, set step target to the next one.*/
  /** If current target is reached or temporary target is reached set path to the next one, or get back to standard path*/
  onStepTargetReach() {
    if ( this.isOnStandardPath ) {
      if ( this.currentStepIndex + 1 === this.pathsBetweenPathTargets[ this.currentPathIndex ].path.length ) {
        this.currentPathIndex = ( this.currentPathIndex + 1 === this.pathsBetweenPathTargets.length ) ? 0 : this.currentPathIndex + 1;
        this.currentStepIndex = 0;
      } else {
        this.currentStepIndex++;
      }
      this.stepTarget = this.pathsBetweenPathTargets[ this.currentPathIndex ].path[ this.currentStepIndex ];
    } else {
      if ( this.temporaryStepIndex + 1 === this.temporaryPath.length ) {
        this.changePathToStandard();
      } else {
        this.temporaryStepIndex++;
        this.stepTarget = this.temporaryPath[ this.temporaryStepIndex ];
      }
    }
  }
  updateLookDirection() {
    const lookTarget = this.getTilesEndCoords( this.stepTarget );
    const targetPoint = new Phaser.Point( lookTarget.x, lookTarget.y );
    const entityCenter = new Phaser.Point( this.body.x + this.width / 2, this.body.y + this.height / 2 );

    let deltaTargetRad = this.rotation - Phaser.Math.angleBetweenPoints( targetPoint, entityCenter ) - 1.5 * Math.PI;

    deltaTargetRad = deltaTargetRad % ( Math.PI * 2 );

    if ( deltaTargetRad != deltaTargetRad % ( Math.PI ) ) {
      deltaTargetRad = deltaTargetRad + Math.PI * ( ( deltaTargetRad < 0 ) ? 2 : -2 );
    }

    this.body.rotateLeft( ZOMBIE_ROTATING_SPEED * deltaTargetRad );
  }
  getTilesEndCoords( tile ) {
    const tileCoords = tileToPixels( tile );
    const veryFarAway = 1000;
    if ( Math.abs( this.body.velocity.x ) > Math.abs( this.body.velocity.y ) ) {
      if ( this.body.velocity.x > 0 ) {
        tileCoords.x += veryFarAway * TILE_WIDTH;
      } else {
        tileCoords.x -= veryFarAway * TILE_WIDTH;
      }
    } else if ( Math.abs( this.body.velocity.x ) < Math.abs( this.body.velocity.y ) ) {
      if ( this.body.velocity.y > 0 ) {
        tileCoords.y += veryFarAway * TILE_HEIGHT;
      } else {
        tileCoords.y -= veryFarAway * TILE_HEIGHT;
      }
    }

    return tileCoords;
  }
  isReached( target ) {
    const distanceToTarget = this.game.physics.arcade.distanceBetween( this, tileToPixels( target ) );
    return distanceToTarget <= MIN_DISTANCE_TO_TARGET;
  }
  calculateTemporaryPath( start, target, callback ) {
    this.pathfinder.findPath( start.x, start.y, target.x, target.y, callback );
  }
  /**
  * Change path to temporary and automatically get back to standard path, after reaching temporary target.
  * @param {tile} start - start tile coordinates, if this tile is different that entity's tile then it goes straight to this tile.
  */
  changePathToTemporary( start ) {
    const currentTarget = this.pathsBetweenPathTargets[ this.currentPathIndex ].target;

    this.canMove = false;
    this.calculateTemporaryPath( start, currentTarget, ( path ) => {
      if ( path.length === 0 ) {
        this.changePathToStandard();
        return;
      }
      this.temporaryPath = path;
      this.temporaryStepIndex = 0;
      this.stepTarget = path[ this.temporaryStepIndex ];
      this.isOnStandardPath = false;
      this.canMove = true;
    } );
  }
  changePathToStandard() {
    this.currentPathIndex = ( this.currentPathIndex + 1 === this.pathsBetweenPathTargets.length ) ? 0 : this.currentPathIndex + 1;
    this.currentStepIndex = 0;
    this.stepTarget = this.pathsBetweenPathTargets[ this.currentPathIndex ].path[ this.currentStepIndex ];
    this.isOnStandardPath = true;
  }
  disableMovement() {
    this.canMove = false;
    this.resetVelocity();
  }
  enableMovement() {
    this.canMove = true;
  }
}