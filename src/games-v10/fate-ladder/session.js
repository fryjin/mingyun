import { StateMachine } from '../../engine/state-machine.js';
import { TurnManager } from '../../engine/turn-manager.js';
import {
  STACK_CONFIG,
  createBaseTower,
  evaluatePlacement,
  evaluateTower,
  speedFor
} from './physics.js';

const transitions = {
  intro: ['arming'],
  arming: ['moving', 'paused'],
  moving: ['dropping', 'paused'],
  dropping: ['result', 'failed'],
  result: ['arming'],
  failed: ['final'],
  final: ['intro'],
  paused: ['arming']
};

export class FateStackSession {
  constructor(players, random) {
    if (!Array.isArray(players) || players.length < 2) throw new Error('命运叠塔至少需要两位玩家');
    this.players = players;
    this.random = random;
    this.machine = new StateMachine({ initial: 'intro', transitions });
    this.epoch = 0;
    this.reset();
  }

  reset() {
    this.epoch += 1;
    this.order = this.random.shuffle(this.players);
    this.turn = new TurnManager(this.order);
    this.tower = createBaseTower();
    this.balance = evaluateTower(this.tower);
    this.moving = null;
    this.machine.reset();
    return this.snapshot();
  }

  currentPlayer() {
    return this.turn.current();
  }

  height() {
    return Math.max(0, this.tower.length - 1);
  }

  topBlock() {
    return this.tower[this.tower.length - 1];
  }

  beginTurn() {
    const turnIndex = this.turn.turn - 1;
    const direction = (this.height() + turnIndex) % 2 === 0 ? 1 : -1;
    this.moving = {
      left: direction === 1 ? 0 : STACK_CONFIG.worldWidth - STACK_CONFIG.blockWidth,
      width: STACK_CONFIG.blockWidth,
      direction,
      speed: speedFor(this.height()),
      locked: false
    };
    this.machine.transition('arming');
    return this.moving;
  }

  armComplete() {
    this.machine.transition('moving');
  }

  advanceMoving(deltaMs) {
    if (this.machine.state !== 'moving' || !this.moving) return null;
    this.moving.left += this.moving.direction * this.moving.speed * (deltaMs / 1000);
    const maxLeft = STACK_CONFIG.worldWidth - this.moving.width;

    if (this.moving.left <= 0) {
      this.moving.left = 0;
      this.moving.direction = 1;
    } else if (this.moving.left >= maxLeft) {
      this.moving.left = maxLeft;
      this.moving.direction = -1;
    }

    return this.moving.left;
  }

  lockDrop() {
    if (this.machine.state !== 'moving' || !this.moving || this.moving.locked) return false;
    this.moving.locked = true;
    this.machine.transition('dropping');
    return true;
  }

  settleDrop() {
    if (this.machine.state !== 'dropping' || !this.moving) throw new Error('当前没有可结算的下落方块');
    const result = evaluatePlacement(this.tower, this.moving, this.currentPlayer().id);

    if (result.outcome === 'miss') {
      this.machine.transition('failed');
      return result;
    }

    this.tower = result.tower;
    if (result.outcome === 'balance') {
      this.balance = { ...result.balance, tilt: result.balance.direction * 0.95 };
      this.machine.transition('failed');
      return result;
    }

    this.balance = result.balance;
    this.machine.transition('result');
    return result;
  }

  advanceTurn() {
    if (this.machine.state !== 'result') throw new Error('只能在成功结算后进入下一位玩家');
    this.turn.next();
    return this.currentPlayer();
  }

  markFinal() {
    if (this.machine.state !== 'failed') throw new Error('只有失败状态才能进入最终结算');
    this.machine.transition('final');
  }

  pause() {
    if (!['moving', 'arming'].includes(this.machine.state)) return false;
    this.machine.transition('paused');
    return true;
  }

  snapshot() {
    return Object.freeze({
      phase: this.machine.state,
      epoch: this.epoch,
      player: this.currentPlayer(),
      order: [...this.order],
      turn: this.turn.snapshot(),
      tower: this.tower.map(block => ({ ...block })),
      balance: { ...this.balance },
      moving: this.moving ? { ...this.moving } : null,
      height: this.height()
    });
  }
}
