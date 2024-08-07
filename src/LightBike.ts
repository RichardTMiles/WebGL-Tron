import { cycleModel, darkestRGB } from "src/func";
import GameState from "src/GameState";
import * as THREE from "three";
import {ctx, iPlaySoundReturn} from "./sound"; // Adjust the path as necessary


export interface CycleConfig {
    x: number;
    z: number;
    dir: number;
    color: number;
    engineType: number;
    ai: boolean;
    playerID: number;
    name: string;
}

interface ExtendedObject3D extends THREE.Object3D {
    netLength?: number;
}

export default class LightBike extends THREE.Object3D {
    public model: THREE.Object3D;
    public currentWall: THREE.Group<THREE.Object3DEventMap>
    public color: number;
    public lightUpColor: string;
    public walls: ExtendedObject3D;
    public turned: boolean;
    public turnQueue: Array<() => void>;
    public lastTurnTime: number;
    public windingOrder: number;
    public forceTurn: number;
    public rubber: number;
    public rubberMinDistance: number;
    public rubberMinAdjust: number;
    public stopDistance: number;
    public speed: number;
    public targetSpeed: number;
    public lastSpeed: number;
    public friction: number;
    public braking: boolean;
    public brakes: number;
    public boosting: boolean;
    public wallAccel: boolean;
    public wallAccelAmount: number;
    public collisionLEFT: boolean;
    public collisionRIGHT: boolean;
    public collisionLEFTplayer: any;
    public collisionRIGHTplayer: any;
    public collisionLEFTdist: number;
    public collisionRIGHTdist: number;
    public collision: boolean;
    public stopped: boolean;
    public collisionHandled: boolean;
    public alive: boolean;
    public respawnAvailable: boolean;
    public AI: boolean;
    public rand: number;
    public playerID: number;
    public name: string;
    public textLabel: HTMLParagraphElement;
    public renderList: Array<() => void>;
    public engineType: number;
    public audio: GainNode & { panner: PannerNode };
    public engineSound: iPlaySoundReturn;
    public rubberSound: iPlaySoundReturn;
    public riseSound: iPlaySoundReturn;
    public explosionSound: iPlaySoundReturn;
    public wallCollapseSound: iPlaySoundReturn;
    public turnSound: iPlaySoundReturn;
    public x: number;
    public z: number;
    public dir: number;
    public ai: boolean;
    public velocity: number;

    constructor(cfg: CycleConfig|LightBike, GameState: GameState) {
        super();

        this.model = cycleModel(cfg.color);
        this.add(this.model);

        const loader = new THREE.ObjectLoader();
        loader.load('models/1982.json', (obj) => {
            obj.scale.set(4, 4.1, 3.5);
            obj.position.set(-3, -2.1, 0);
            obj.rotation.y = -Math.PI / 2;
            obj.visible = false;
            this.add(obj);
        });

        this.position.set(cfg.x, 2, cfg.z);

        this.color = cfg.color;
        this.lightUpColor = darkestRGB(cfg.color);
        this.rotation.set(0, -1.5707963267948966, 0);
        this.rotateY(Math.PI / 2 * cfg.dir);

        this.walls = new THREE.Object3D() as ExtendedObject3D;
        this.walls.children = [];
        this.walls.scale.y = 1;
        this.walls.netLength = 0;
        GameState.scene.add(this.walls);

        this.turned = false;
        this.turnQueue = [];
        this.lastTurnTime = GameState.clock.getElapsedTime();
        this.windingOrder = 0;
        this.forceTurn = 0;

        this.rubber = 0;
        this.rubberMinDistance = GameState.rubberMinDistance;
        this.rubberMinAdjust = GameState.rubberMinAdjust;
        this.stopDistance = this.rubberMinDistance;

        this.speed = GameState.startingSpeed;
        this.targetSpeed = GameState.regularSpeed;
        this.lastSpeed = this.speed;
        this.friction = 0.005;

        this.braking = false;
        this.brakes = 0;
        this.boosting = false;

        this.wallAccel = false;
        this.wallAccelAmount = 0;
        this.collisionLEFT = false;
        this.collisionRIGHT = false;
        this.collisionLEFTplayer = null;
        this.collisionRIGHTplayer = null;
        this.collisionLEFTdist = 0;
        this.collisionRIGHTdist = 0;

        this.collision = false;
        this.stopped = false;
        this.collisionHandled = false;

        this.alive = true;
        this.respawnAvailable = true;
        this.AI = cfg.ai;
        this.rand = 3.7;

        this.playerID = cfg.playerID;
        this.name = cfg.name;
        this.textLabel = null;

        this.renderList = [];

        this.engineType = cfg.engineType;

        this.audio = ctx.createGain() as GainNode & { panner: PannerNode };
        this.audio.gain.value = 0.01;

        this.audio.panner = ctx.createPanner();
        this.audio.panner.panningModel = GameState.panningModel;

        this.audio.connect(this.audio.panner);
        this.audio.panner.connect(ctx.destination);
    }


}
