import ExplodeAnimation from "src/ExplodeAnimation";
import LightBike from "src/LightBike";
import {constrain} from "src/func";
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'stats.js';


export default abstract class GameState {

    // Scene & Camera
    renderer = new THREE.WebGLRenderer({antialias: true});
    canvas = this.renderer.domElement;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    cameraOrbit = new OrbitControls(this.camera, this.renderer.domElement);

    rimCoords: any[] = [];
    panningModel: PanningModelType = "equalpower";
    altCycleModel: boolean = false;
    paused: boolean = true;
    showInfo: boolean = false;
    view: number = 0;
    viewTarget: number = 0;

    // time
    clock = new THREE.Clock();
    elapsedTime: number;
    delta: number;
    frameTime: number = 0;

    // Stats
    stats = new Stats();

    // Speed Dynamics
    maxRubber: number = 5;
    maxSpeed: number = 5;
    regularSpeed: number = this.maxSpeed / 3;
    startingSpeed: number = this.regularSpeed / 2;
    cycleEnginePitchFactor: number = this.regularSpeed;
    maxBrakes: number = 5;
    constrainSpeed = constrain(this.regularSpeed * 0.7, this.maxSpeed);


    // HTML Selectors
    gauge = {
        rubber: {
            val: document.getElementById('rubber-val') as HTMLElement,
            bar: document.getElementById('rubber-bar') as HTMLElement,
            max: document.getElementById('rubber-max') as HTMLElement,
            maxVal: this.maxRubber
        },
        speed: {
            val: document.getElementById('speed-val') as HTMLElement,
            bar: document.getElementById('speed-bar') as HTMLElement,
            max: document.getElementById('speed-max') as HTMLElement,
            maxVal: this.maxSpeed
        },
        brakes: {
            val: document.getElementById('brake-val') as HTMLElement,
            bar: document.getElementById('brake-bar') as HTMLElement,
            max: document.getElementById('brake-max') as HTMLElement,
            maxVal: this.maxBrakes
        }
    }

    pauseMsg = document.getElementById('pause-msg') as HTMLElement;
    pressZ = document.getElementById('press-z') as HTMLElement;
    pressX = document.getElementById('press-x') as HTMLElement;

    // Visual
    grid: any;
    arenaSize: number = 390;
    gridTileSize: number = 3;
    gridHQ: boolean = false;
    easing: number = 0.08;
    maxTailLength: number = 2000;
    turnDelay: number = 0.02;

    wallAccelRange: number = 15;
    wallAccelFactor: number = 1.5;
    wallTextureProportion: number;

    textureSource = 'images/white.png';
    textureBlending = true;

    rubberMinDistance: number = 2.5;
    rubberMinAdjust: number = 0.5;
    digFactor: number = 0.4;

    rubberUseFactor: number = 0.08; // higher consumes faster
    rubberRestoreFactor: number = 0.03; // higher restores faster

    brakeUseFactor: number = 0.05;
    brakeRestoreFactor: number = 0.05;

    brakeFactor: number = 0.5;
    boostFactor: number = 1.5;
    turnSpeedFactor: number = 0.05;

    explode = {
        velocity: 3,
        particleCount: 200,
        particleSize: 0.8,
        time: 3,
        decay: 0.98
    };

    explosions: ExplodeAnimation[] = [];

    findLastAlivePlayer(players: LightBike[]) {
        for (let i = players.length - 1; i >= 0; i--) {
            if (players[i].alive === true) {
                return players[i];
            }
        }
        return null; // No alive player found
    }

    // players should be defined last!
    player1 = new LightBike({
        x: -320,
        z: -2,
        dir: 0,
        color: 0x0044ff,
        engineType: 0,
        ai: false,
        playerID: 1,
        name: "player 1"
    }, this);

    otherPlayers: LightBike[] = [
        new LightBike({
            x: 0,
            z: 0,
            dir: 0,
            color: 0xff6600,
            engineType: 1,
            ai: true,
            playerID: 2,
            name: "player 2"
        }, this), new LightBike({
            x: 0,
            z: 0,
            dir: 0,
            color: 0x44ff00,
            engineType: 2,
            ai: true,
            playerID: 3,
            name: "player 3"
        }, this), new LightBike({
            x: 0,
            z: 0,
            dir: 0,
            color: 0x00dddd,
            engineType: 3,
            ai: true,
            playerID: 4,
            name: "player 4"
        }, this),
        new LightBike({
            x: 0,
            z: 0,
            dir: 0,
            color: 0xdd0099,
            engineType: 4,
            ai: true,
            playerID: 5,
            name: "player 5"
        }, this)
    ];
    activePlayers: LightBike[] = [];

}