import ExplodeAnimation from "src/ExplodeAnimation";
import {
    animateCycle,
    constrain,
    createLabel,
    distanceBetween,
    fadeInLabel,
    minDistIndex,
    normal_random
} from "src/func";
import GameObjects from "src/GameObjects";
import GameState from "src/GameState";
import LightBike, {CycleConfig} from "src/LightBike";
import {doLineSegmentsIntersect, Point} from "src/line-intersect";
import {
    addWall,
    cycleHitVisuals,
    turnLeft, turnRight,
    wallLightFade
} from "src/main";

import {bufferLoader, ctx, playSound} from "src/sound";
import {Object3D} from "three";
import * as THREE from "three";


export default class Game extends GameObjects {

    public static instance: Game;

    public static getInstance(): Game {
        if (!Game.instance) {
            Game.instance = new Game();
        }
        return Game.instance;
    }

    public static animate() {

        requestAnimationFrame(Game.animate);

        const CurrentState = Game.getInstance();

        CurrentState.frameTime = 1.016 - CurrentState.clock.getDelta();

        if (CurrentState.paused === false) {
            CurrentState.animateOneFrame();
        }

        CurrentState.stats.update();

        CurrentState.renderer.render(CurrentState.scene, CurrentState.camera);

    }

    public constructor() {
        super();

        this.renderer.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(this.canvas);

        this.camera.position.set(-550, 250, 100);

        this.cameraOrbit.enableDamping = true; // an animation loop is required when either damping or auto-rotation is enabled
        this.cameraOrbit.dampingFactor = 0.25;
        this.cameraOrbit.screenSpacePanning = false;
        this.cameraOrbit.minDistance = 100;
        this.cameraOrbit.maxDistance = 500;
        this.cameraOrbit.maxPolarAngle = Math.PI / 2;

        window.addEventListener('resize', this.resizeWindow);

        this.stats.dom.style.position = 'absolute';
        this.stats.dom.style.top = '0px';
        this.stats.dom.style.visibility = 'hidden';
        document.body.appendChild(this.stats.dom);

        this.pauseMsg.style.visibility = "hidden";

    }

    animateOneFrame = (): void => {
        this.activePlayers.forEach((cycle: LightBike) => {
            if (cycle.alive) {
                this.executeTurn(cycle);
                this.handleBraking(cycle);
                this.changeVelocity(cycle);
                this.wallCheck(cycle);
                this.wallAccelCheck(cycle);
                this.AIWallCheck(cycle);
                this.moveStuff(cycle);
                this.handleRubber(cycle);
                this.updateLabel(cycle);
            }

            cycle.renderList.forEach((el: () => void, i: number) => {
                el();
            });

            this.audioMixing(cycle);
        });

        this.explosions.forEach(p => {
            p.update();
            if (p.time <= 0.0001) {
                this.scene.remove(this.explosions.shift().object);
            }
        });

        if (this.activePlayers[this.viewTarget]
            && this.activePlayers[this.viewTarget].alive === true) {
            this.cameraView(this.activePlayers[this.viewTarget]);
            this.updateGauges(this.activePlayers[this.viewTarget]);
        }
    };

    resizeWindow = (): void => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.render(this.scene, this.camera);
    };

    changeViewTargetTo = (i: number): void => {
        let viewTarget = i;

        const alivePlayersLength = this.activePlayers.filter(player => player.alive === true).length;

        if (viewTarget > alivePlayersLength) {
            viewTarget = 0;
        } else if (viewTarget < 0) {
            viewTarget = alivePlayersLength;
        }

        this.cameraOrbit.target = this.activePlayers[viewTarget].position;
    }

    updateGauge = (elem: any, num: number) => {
        elem.val.innerHTML = num.toFixed(2);
        elem.bar.style.width = Math.min(100, num / (elem.maxVal * 0.01)) + '%';
        elem.bar.style.backgroundColor = `rgb(${Math.floor(num * 50)}, ${255 - Math.floor(num * num * num * 2)}, 0)`;
    }

    fixCockpitCam = (): void => {
        this.activePlayers.forEach((cycle: any) => {
            if (cycle.walls.children.length) {
                cycle.walls.children[cycle.walls.children.length - 1].visible = true;
            }
            if (!this.altCycleModel) {
                cycle.model.visible = true;
            }
        });
    };

    pause = (): void => {

        this.paused = !this.paused;


        if (this.paused === true) {

            this.pauseMsg.style.visibility = "visible";

            this.activePlayers.forEach((player: any) => {
                player.audio.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
            });

        } else {

            this.pauseMsg.style.visibility = "hidden";

            this.activePlayers.forEach((player: any) => {
                player.audio.gain.setTargetAtTime(6, ctx.currentTime, 0.02);
                player.turnQueue = []; // clear in case turn keys were pressed while paused
            });

        }

    };

    updateGauges = (cycle: LightBike) => {
        this.updateGauge(this.gauge.rubber, cycle.rubber);
        this.updateGauge(this.gauge.speed, cycle.speed);
        this.updateGauge(this.gauge.brakes, cycle.brakes);
    }

    updateLabel = (cycle: LightBike) => {
        const proj = this.toScreenPosition(cycle, this.camera);
        cycle.textLabel.style.left = (proj.x - cycle.textLabel.offsetWidth / 2) + 'px';
        cycle.textLabel.style.top = (proj.y - 50) + 'px';
    };

    cameraView = (cycle: LightBike) => {

        let relativeCameraOffset: THREE.Vector3;
        let cameraOffset: THREE.Vector3;

        if (this.view === 0) {
            relativeCameraOffset = new THREE.Vector3(-5, (5 / this.regularSpeed + cycle.speed * cycle.speed * cycle.speed), 0);
            cameraOffset = relativeCameraOffset.applyMatrix4(cycle.matrixWorld);
            this.camera.position.x += (cameraOffset.x - this.camera.position.x) * this.easing / 3;
            this.camera.position.y += (cameraOffset.y - this.camera.position.y) * this.easing / 5;
            this.camera.position.z += (cameraOffset.z - this.camera.position.z) * this.easing / 3;
            this.camera.lookAt(cycle.position);
        } else if (this.view === 1) {
            relativeCameraOffset = new THREE.Vector3(-40 - (5 * cycle.speed), 15 + (18 * cycle.speed), 0);
            cameraOffset = relativeCameraOffset.applyMatrix4(cycle.matrixWorld);
            this.camera.position.x += (cameraOffset.x - this.camera.position.x) * this.easing;
            this.camera.position.y += (cameraOffset.y - this.camera.position.y) * this.easing;
            this.camera.position.z += (cameraOffset.z - this.camera.position.z) * this.easing;
            this.camera.lookAt(cycle.position);
        } else if (this.view === 2) {
            // stationary
        } else if (this.view === 3) {
            this.camera.lookAt(cycle.position);
        } else if (this.view === 4) {
            const center = new THREE.Vector3(0, 0, 0);
            this.camera.position.set(-1, 550, 0);
            this.camera.lookAt(center);
        } else if (this.view === 5) {
            relativeCameraOffset = new THREE.Vector3(-2 + (2.5 * cycle.speed), 0, 0);
            cameraOffset = relativeCameraOffset.applyMatrix4(cycle.matrixWorld);
            this.camera.position.x += (cameraOffset.x - this.camera.position.x) * 0.5;
            this.camera.position.y = 2;
            this.camera.position.z += (cameraOffset.z - this.camera.position.z) * 0.5;

            this.camera.lookAt(cameraOffset);

            cycle.audio.gain.setTargetAtTime(0.2, ctx.currentTime, 0.02);
            cycle.textLabel.style.visibility = 'hidden';
            cycle.model.visible = false;

            if (cycle.walls.children[cycle.walls.children.length - 2]) {
                cycle.walls.children[cycle.walls.children.length - 1].visible = false;
                cycle.walls.children[cycle.walls.children.length - 2].visible = true;
            }
        }
    }

    moveStuff = (cycle: LightBike) => {

        if (!cycle.stopped) {
            if (!cycle.collision) {
                cycle.velocity = cycle.speed;
            }

            cycle.velocity *= this.frameTime;
            cycle.translateX(cycle.velocity);

            // Type casting cycle.currentWall.children[0] to Object3D with material property
            const currentWallChild = cycle.currentWall.children[0] as Object3D & {
                material: { map: { repeat: { x: number } } }
            };

            currentWallChild.material.map.repeat.x = cycle.currentWall.scale.x / this.wallTextureProportion;

            cycle.walls.netLength += cycle.velocity;

            if (cycle.walls.netLength > this.maxTailLength) {
                cycle.walls.children[0].scale.x -= cycle.velocity;
                cycle.walls.children[0].translateX(cycle.velocity);
                currentWallChild.material.map.repeat.x = -(cycle.walls.children[0].scale.x / this.wallTextureProportion);
                cycle.walls.netLength -= cycle.velocity;

                if (cycle.walls.children[0].scale.x <= 0 && cycle.walls.children.length > 0) {
                    cycle.walls.remove(cycle.walls.children[0]);
                }
            }
        }
    };

    changeVelocity = (cycle: LightBike) => {

        if (cycle.braking) {
            cycle.targetSpeed = this.constrainSpeed(cycle.speed * this.brakeFactor);
            cycle.friction = 0.03;
        } else if (cycle.boosting) {
            cycle.targetSpeed = this.constrainSpeed(cycle.speed * this.boostFactor);
            cycle.friction = 0.05;
        } else if (cycle.wallAccel) {
            cycle.targetSpeed = Math.max(this.regularSpeed + 0.2, (cycle.speed * cycle.wallAccelAmount));
            cycle.friction = 0.05;
        } else {
            cycle.targetSpeed = this.regularSpeed;

            if (cycle.speed > cycle.lastSpeed) {
                cycle.lastSpeed = cycle.speed;
                cycle.friction = 0.05;
            } else {
                cycle.lastSpeed = cycle.speed;
                cycle.friction = 0.002;
            }
        }

        if (cycle.turned) {
            addWall(cycle);
            cycle.turnSound = playSound(bufferLoader.bufferList[5], 0.7, 10, false, cycle.audio);
            cycle.collisionHandled = false;
            cycle.friction = 0.08;
            cycle.targetSpeed = this.constrainSpeed(cycle.speed * this.turnSpeedFactor);
            cycle.turned = false;
        }

        cycle.speed = cycle.speed + (cycle.targetSpeed - cycle.speed) * cycle.friction;
    }

    executeTurn = (cycle: LightBike) => {
        const elapsedTime = this.clock.getElapsedTime();
        if (cycle.turnQueue.length > 0) {
            if ((elapsedTime - cycle.lastTurnTime) > this.turnDelay / cycle.speed) {
                const shifted = cycle.turnQueue.shift();
                shifted();
                cycle.lastTurnTime = elapsedTime;
            }
        }
    };

    handleKeyDown = (e) => {

        if (e.repeat) {
            if (this.paused && e.keyCode === 187) {
                this.animateOneFrame();
            }
            return;
        }

        switch (e.keyCode) {
            case 70: // left
            case 68:
            case 83:
            case 65:
                this.player1.turnQueue.push(turnLeft(this.player1));
                break;

            case 74: // right
            case 75:
            case 76:
            case 186:
                this.player1.turnQueue.push(turnRight(this.player1));
                break;

            case 32: // space
                this.player1.braking = true;
                break;
            case 66: // b
                this.player1.boosting = true;
                break;

            case 80: // p
                this.pause();
                break;
            case 67: // c
                this.view += 1;
                if (this.view > 5) {
                    this.view = 0;
                    this.fixCockpitCam();
                    if (this.paused === false) {
                        this.activePlayers.forEach(function (cycle) {
                            cycle.audio.gain.setTargetAtTime(6, ctx.currentTime, 1.0);
                            cycle.textLabel.style.visibility = 'visible';
                            if (!this.altCycleModel) {
                                cycle.model.visible = true;
                            }
                        });
                    }
                }
                break;
            case 90: // z
                if (this.player1.respawnAvailable === true) {
                    this.player1.turnQueue = []; // clear in case turn keys were pressed while dead

                    var spawnCheck = function () {

                        var randX = Math.max(-this.arenaSize + 20, Math.min(-200, (Math.random() * this.arenaSize - this.arenaSize)));
                        var randZ = (Math.random() * this.arenaSize * 2 - this.arenaSize) / 2;

                        var offset = new THREE.Vector3(randX, 0, randZ);
                        var offset2 = new THREE.Vector3(randX + 150, 0, randZ);
                        var spawnCollision = this.detectCollisionsBetween(this.player1, offset, offset2, true);

                        return (function () {

                            if (spawnCollision) {
                                return spawnCheck();

                            } else {
                                return {
                                    x: randX,
                                    z: randZ
                                };
                            }
                        }());
                    };

                    var spawn = spawnCheck();

                    this.player1 = this.spawnCycle(this.player1, spawn.x, spawn.z, 1, false);

                    this.fixCockpitCam();
                }
                break;
            case 88: // x
                // spawn first available player in list
                const i = this.otherPlayers.findIndex(player => player.respawnAvailable === true)


                if (i >= 0) {
                    this.otherPlayers[i] = this.spawnCycle(this.otherPlayers[i], 300, i * 12 - 12, 3, true)
                }

                break;
            case 220: // \|
                const alivePlayersLength = this.findLastAlivePlayer(this.activePlayers);
                if (null === alivePlayersLength) {
                    this.crash(alivePlayersLength);
                }
                break;
            case 73: // i
                this.showInfo = !this.showInfo;
                if (this.showInfo) {
                    this.stats.dom.style.visibility = "visible";
                    this.player1.add(this.distLine);
                    this.player1.add(this.distLine2);
                    this.player1.add(this.stopLine);
                    this.player1.add(this.accelBoundingLine);
                    this.player1.renderList.push(this.animateInfoMetrics(this.player1));
                } else {
                    this.stats.dom.style.visibility = "hidden";
                    this.player1.remove(this.distLine);
                    this.player1.remove(this.distLine2);
                    this.player1.remove(this.stopLine);
                    this.player1.remove(this.accelBoundingLine);
                    this.player1.renderList.splice(this.player1.renderList.indexOf(this.animateInfoMetrics(this.player1)), 1);
                }
                break;
            case 219: // [
                this.panningModel = "equalpower";
                this.activePlayers.forEach(function (cycle) {
                    cycle.audio.panner.panningModel = "equalpower";
                });
                break;
            case 221: // ]
                this.panningModel = "HRTF";
                this.activePlayers.forEach(function (cycle) {
                    cycle.audio.panner.panningModel = "HRTF";
                });
                break;
            case 188: // <
                if (this.activePlayers.length > 0) {
                    this.changeViewTargetTo(this.viewTarget + 1);
                    this.fixCockpitCam();
                }
                break;
            case 190: // >
                if (this.activePlayers.length > 0) {
                    this.changeViewTargetTo(this.viewTarget - 1);
                    this.fixCockpitCam();
                }
                break;
            case 192: // ~`
                this.player1.AI = !this.player1.AI;
                if (this.player1.AI) {
                    this.player1.add(this.indicator);
                    this.player1.renderList.push(this.chatIndicator);
                } else {
                    this.player1.remove(this.indicator);
                    this.player1.renderList.splice(this.player1.renderList.indexOf(this.chatIndicator), 1);
                }
                break;
            case 84: // t
                this.textureBlending = !this.textureBlending;
                break;
            case 49: // 1
                this.textureSource = 'images/dir_wall.png';
                break;
            case 50: // 2
                this.textureSource = 'images/legacy.png';
                break;
            case 51: // 3
                this.textureSource = 'images/white.png';
                break;
            case 53: // 5
                this.altCycleModel = !this.altCycleModel
                if (this.altCycleModel) {
                    this.activePlayers.forEach(function (cycle) {
                        cycle.model.visible = false;
                        cycle.children[1].visible = true;
                    });
                } else {
                    this.activePlayers.forEach(function (cycle) {
                        cycle.model.visible = true;
                        cycle.children[1].visible = false;
                    });
                }
                break;
            case 48: // 0
                this.gridHQ = !this.gridHQ;
                this.createGrid(this.gridHQ);
                break;
            case 187: // +
                if (this.paused) {
                    this.animateOneFrame();
                }
                break;
            case 8:	// delete
            case 9: // tab
                if (!this.paused) {
                    e.preventDefault();
                }
                break;
        }
    };

    handleKeyUp = function (e) {
        switch (e.keyCode) {

            case 32: // space
                this.player1.braking = false;
                break;
            case 66: // b
                this.player1.boosting = false;
                break;
        }
    };


    toScreenPosition = (obj: THREE.Object3D, camera: THREE.Camera): { x: number; y: number } => {
        const vector = new THREE.Vector3();

        const widthHalf = 0.5 * this.canvas.width;
        const heightHalf = 0.5 * this.canvas.height;

        obj.updateMatrixWorld();
        vector.setFromMatrixPosition(obj.matrixWorld);
        vector.project(camera);

        vector.x = (vector.x * widthHalf) + widthHalf;
        vector.y = -(vector.y * heightHalf) + heightHalf;

        return {
            x: vector.x,
            y: vector.y
        };
    };

    audioMixing = (cycle: LightBike) => {

        if (cycle.engineSound !== undefined) {
            cycle.engineSound.playbackRate.value = cycle.speed / this.cycleEnginePitchFactor;
        }

        cycle.audio.panner.setPosition(cycle.position.x, cycle.position.y, cycle.position.z);
        ctx.listener.setPosition(this.camera.position.x, this.camera.position.y, this.camera.position.z);

        const m = new THREE.Matrix4();
        m.copy(this.camera.matrix);
        const mx = m.elements[12], my = m.elements[13], mz = m.elements[14];
        m.elements[12] = m.elements[13] = m.elements[14] = 0;

        const vec = new THREE.Vector3(0, 0, 1);
        vec.applyMatrix4(m);
        vec.normalize();
        const up = new THREE.Vector3(0, -1, 0);
        up.applyMatrix4(m);
        up.normalize();

        ctx.listener.setOrientation(vec.x, vec.y, vec.z, up.x, up.y, up.z);

        m.elements[12] = mx;
        m.elements[13] = my;
        m.elements[14] = mz;
    }

    activateAI = (cycle: LightBike) => {
        if ((this.elapsedTime - cycle.lastTurnTime) > 0.1) {
            if (!cycle.collisionLEFT && !cycle.collisionRIGHT) {
                cycle.forceTurn = 0;
                cycle.windingOrder = 0;
            }

            if (cycle.windingOrder < -3) {
                cycle.turnQueue.push(turnLeft(cycle));
                cycle.turnQueue.push(turnLeft(cycle));
                cycle.windingOrder = -3;
                cycle.forceTurn = 1;
            } else if (cycle.windingOrder > 3) {
                cycle.turnQueue.push(turnRight(cycle));
                cycle.turnQueue.push(turnRight(cycle));
                cycle.windingOrder = 3;
                cycle.forceTurn = -1;
            }

            if (cycle.collisionLEFT && cycle.collisionRIGHT) {
                if (cycle.collisionLEFTdist > cycle.collisionRIGHTdist) {
                    cycle.turnQueue.push(turnLeft(cycle));
                } else {
                    cycle.turnQueue.push(turnRight(cycle));
                }
            } else if (cycle.collisionLEFT) {
                cycle.turnQueue.push(turnRight(cycle));
            } else if (cycle.collisionRIGHT) {
                cycle.turnQueue.push(turnLeft(cycle));
            } else {
                if (Math.random() > 0.5) {
                    cycle.turnQueue.push(turnLeft(cycle));
                } else {
                    cycle.turnQueue.push(turnRight(cycle));
                }
            }
        }
    }

    AIWallCheck = (cycle: LightBike) => {

        if (cycle.AI) {
            let offset;
            if (cycle.forceTurn === 0) {
                offset = new THREE.Vector3(this.wallAccelRange - 2, 0, 0).applyMatrix4(cycle.matrixWorld);
            } else {
                offset = new THREE.Vector3(this.wallAccelRange - 8, 0, 0).applyMatrix4(cycle.matrixWorld);
            }

            const collision = this.detectCollisionsBetween(cycle, cycle.currentWall.position, offset, true);

            if (collision) {
                this.activateAI(cycle);
                return;
            }

            if ((this.elapsedTime - cycle.lastTurnTime) > cycle.rand) {
                this.activateAI(cycle);
                cycle.rand = constrain(0.5, 4)(normal_random(1.5, 2));
            }
        }
    }

    spawnCycle = (config: CycleConfig, x: number, z: number, dir: number, ai: boolean) => {
        const cycle = new LightBike({
            x: x,
            z: z,
            dir: dir,
            color: config.color,
            engineType: config.engineType,
            ai: ai,
            playerID: config.playerID,
            name: config.name
        }, this);


        this.scene.add(cycle);

        cycle.textLabel = createLabel(cycle.name);

        cycle.respawnAvailable = false;

        cycle.renderList.push(animateCycle(cycle));
        cycle.renderList.push(fadeInLabel(cycle));

        cycle.rand = 3.8 - cycle.playerID / 6;

        addWall(cycle);

        cycle.engineSound = playSound(bufferLoader.bufferList[cycle.engineType], 0.5, 1, true, cycle.audio);

        cycle.audio.gain.setTargetAtTime(6, ctx.currentTime, 1.0);

        this.audioMixing(cycle);

        this.activePlayers.push(cycle);

        if (cycle.playerID === 1) {

            const alivePlayers = this.activePlayers.filter(player => player.alive === true);

            const lastIndex = alivePlayers.lastIndexOf(cycle);

            this.changeViewTargetTo(lastIndex);

            this.pressZ.style.visibility = "hidden";

        } else {

            this.pressX.style.visibility = "hidden";

        }

        return cycle;
    };


    crash = (cycle: LightBike) => {

        const CurrentState = Game.getInstance();

        CurrentState.explosions.push(new ExplodeAnimation(cycle));

        cycle.targetSpeed = 0;
        cycle.speed = 0;
        cycle.alive = false;

        this.updateLabel(cycle);

        const txt = document.getElementById(cycle.name);
        txt.parentNode.removeChild(txt);

        this.scene.remove(cycle);

        if (cycle.riseSound) cycle.riseSound.stop();

        cycle.engineSound.stop();
        cycle.explosionSound = playSound(bufferLoader.bufferList[8], 1.2, 1, false, cycle.audio);
        cycle.explosionSound = playSound(bufferLoader.bufferList[9], 0.2, 1.2, false, cycle.audio);
        cycle.renderList.splice(cycle.renderList.indexOf(animateCycle(cycle)), 1);

        setTimeout(() => {
            cycle.renderList.push(this.collapseWalls(cycle));
            cycle.wallCollapseSound = playSound(bufferLoader.bufferList[7], 1, 1.8, false, cycle.audio);
            cycle.walls.children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    child.material.opacity = 0.8;
                    child.material.color.setRGB(1.0, 1.0, 1.0);
                }
            });
        }, 1500);
    };


    collapseWalls = (cycle: LightBike) => {
        return () => {

            cycle.walls.scale.y -= 0.04;

            cycle.walls.children.forEach(child => {
                if (child instanceof THREE.Mesh && child.material.map) {
                    child.material.map.repeat.y -= 0.04;
                }
            });

            if (cycle.walls.scale.y <= 0) {
                this.scene.remove(cycle.walls);
                cycle.respawnAvailable = true;

                if (cycle.playerID === 1) {
                    this.pressZ.style.visibility = "visible";
                } else {
                    this.pressX.style.visibility = "visible";
                }

                this.activePlayers.splice(this.activePlayers.indexOf(cycle), 1);

                const alivePlayers = this.activePlayers.filter(player => player.alive === true);

                if (this.viewTarget > alivePlayers.length - 1) {

                    this.viewTarget -= 1;

                }

                const targetedCycleIndex = alivePlayers.indexOf(alivePlayers[this.viewTarget]);

                if (0 < alivePlayers.length) {
                    if (this.cameraOrbit.target === cycle.position) {
                        this.changeViewTargetTo(this.viewTarget - 1);
                    } else {
                        this.changeViewTargetTo(targetedCycleIndex);
                    }
                }

                // Remove this specific collapseWalls function from renderList
                const index = cycle.renderList.indexOf(this.collapseWalls(cycle));
                if (index !== -1) {
                    cycle.renderList.splice(index, 1);
                }

            }
        };
    };

    wallLightUp = (cycle: LightBike, wallIndex: number) => {
        const wall = cycle.walls.children[wallIndex] as THREE.Mesh;
        if (wall.material instanceof THREE.MeshBasicMaterial || wall.material instanceof THREE.MeshLambertMaterial || wall.material instanceof THREE.MeshPhongMaterial) {
            if (cycle.lightUpColor === 'r') {
                wall.material.color.r = 1;
            } else if (cycle.lightUpColor === 'g') {
                wall.material.color.g = 1;
            } else {
                wall.material.color.b = 1;
            }
        }
    };

    handleBraking = (cycle: LightBike) => {
        if (cycle.braking) {
            cycle.brakes = Math.min(this.maxBrakes, cycle.brakes += this.brakeUseFactor);
            if (cycle.brakes >= this.maxBrakes) {
                cycle.braking = false;
            }
        } else if (cycle.brakes > 0) {
            cycle.brakes = Math.max(0, cycle.brakes -= this.brakeRestoreFactor);
        }
    }

    handleRubber = (cycle: LightBike) => {

        wallLightFade(cycle);

        if (cycle.collision) {

            if (cycle.rubber >= this.maxRubber) {

                cycle.riseSound.stop();

                this.crash(cycle);

                return;

            }

            cycle.rubber = Math.min(this.maxRubber, cycle.rubber += cycle.speed * this.rubberUseFactor);

            cycle.riseSound.playbackRate.value = 0.5 + cycle.rubber / this.maxRubber;

            cycle.riseSound.gainNode.gain.value = 0.5 + cycle.rubber / this.maxRubber;

        } else if (cycle.rubber > 0) {

            cycle.rubber = Math.max(0, cycle.rubber -= this.rubberRestoreFactor);

            cycle.riseSound.playbackRate.value = 0.1 + cycle.rubber / this.maxRubber;

            cycle.riseSound.gainNode.gain.value = cycle.rubber / this.maxRubber;

        } else {

            if (cycle.riseSound) {

                cycle.riseSound.stop();

            }

        }

        cycleHitVisuals(cycle);
    };

    detectCollisionsBetween = (cycle: LightBike, point_A: THREE.Vector3, point_B: THREE.Vector3, checkRim: boolean) => {

        const collisionWalls: any[] = [];

        this.activePlayers.forEach(player => {
            const obj = new THREE.Object3D();
            obj.position.set(player.position.x, player.position.y, player.position.z);
            player.walls.children.push(obj);

            for (let w = 1; w < player.walls.children.length; w++) {
                const intersect = doLineSegmentsIntersect(
                    point_A, point_B, player.walls.children[w - 1].position, player.walls.children[w].position
                );

                if (intersect.check) {
                    collisionWalls.push({
                        dist: distanceBetween(cycle.position, intersect as Point),
                        intersect,
                        wallIndex: w - 1,
                        player
                    });
                }
            }

            player.walls.children.pop();
        });

        if (checkRim) {
            for (let w = 1; w < this.rimCoords.length; w++) {
                const intersect = doLineSegmentsIntersect(
                    point_A, point_B, this.rimCoords[w - 1], this.rimCoords[w]
                );

                if (intersect.check) {
                    collisionWalls.push({
                        dist: distanceBetween(cycle.position, intersect as Point),
                        intersect,
                        wallIndex: undefined,
                        player: 'rim'
                    });
                }
            }
        }

        if (collisionWalls.length === 1) {
            return collisionWalls[0];
        } else if (collisionWalls.length >= 2) {
            return collisionWalls[minDistIndex(collisionWalls)];
        } else {
            return false;
        }
    };

    handleCollision = (cycle: LightBike, wallIndex: number, player: any) => {

        cycle.rubberSound = playSound(bufferLoader.bufferList[6], 0.2, Math.max(0.5, cycle.speed / this.regularSpeed), false, cycle.audio);

        if (cycle.riseSound) {
            cycle.riseSound.stop();
        }
        cycle.riseSound = playSound(bufferLoader.bufferList[10], 0.01, cycle.rubber / 2, false, cycle.audio);

        if (wallIndex !== undefined) {
            this.wallLightUp(player, wallIndex);
        }
    }

    handleMinDistance = (cycle: LightBike, collision: any) => {
        const tailToWallDist = distanceBetween(cycle.currentWall.position, collision.intersect);

        if ((tailToWallDist - 0.9) > cycle.rubberMinDistance) {
            if (cycle.wallAccel) {
                if (cycle.wallAccelAmount < 1.05) {
                    cycle.stopDistance = cycle.rubberMinDistance;
                }
            } else {
                cycle.stopDistance = cycle.rubberMinDistance;
            }
        } else {
            cycle.stopDistance *= (1 - cycle.rubberMinAdjust);

            cycle.updateMatrixWorld();
            const offset = new THREE.Vector3(-(cycle.speed + cycle.rubberMinDistance), 0, 0).applyMatrix4(cycle.matrixWorld);
            const rearCollision = this.detectCollisionsBetween(cycle, cycle.currentWall.position, offset, true);

            if (rearCollision) {
                cycle.stopDistance = tailToWallDist * (1 - cycle.rubberMinAdjust);
            }

            if (cycle.stopDistance < 0.001) {
                cycle.stopDistance = 0.001;
            }
        }

        if (this.showInfo && cycle.playerID === 1) {
            this.stopLine.position.set(cycle.stopDistance, 0, 0);
        }
    };

    handleDig = (cycle: LightBike, collision: any) => {

        const dist = distanceBetween(cycle.position, collision.intersect) - cycle.stopDistance;

        cycle.velocity = dist * this.digFactor;

        if (cycle.stopDistance < 0.001) {
            cycle.velocity = 0;
            cycle.stopped = true;
            return;
        }
    };


    wallCheck = (cycle: LightBike) => {
        cycle.updateMatrixWorld();

        const offset = new THREE.Vector3(cycle.speed * 2 + cycle.rubberMinDistance, 0, 0).applyMatrix4(cycle.matrixWorld);
        const collision = this.detectCollisionsBetween(cycle, cycle.currentWall.position, offset, true);

        if (collision) {
            cycle.collision = true;

            if (!cycle.collisionHandled) {
                this.handleMinDistance(cycle, collision);
                this.handleCollision(cycle, collision.wallIndex, collision.player);
                cycle.collisionHandled = true;
            }

            if (!cycle.stopped) {
                this.handleDig(cycle, collision);
            }
        } else {
            cycle.stopped = false;
            cycle.collision = false;
            cycle.collisionHandled = false;
        }
    };

    wallAccelCheck = (cycle: LightBike) => {

        const offsetLEFT = new THREE.Vector3(0, 0, -this.wallAccelRange).applyMatrix4(cycle.matrixWorld);
        const offsetRIGHT = new THREE.Vector3(0, 0, this.wallAccelRange).applyMatrix4(cycle.matrixWorld);

        const collisionLEFT = this.detectCollisionsBetween(cycle, cycle.position, offsetLEFT, true);
        const collisionRIGHT = this.detectCollisionsBetween(cycle, cycle.position, offsetRIGHT, true);

        cycle.wallAccel = false;
        cycle.collisionLEFT = false;
        cycle.collisionRIGHT = false;

        let dist;
        if (collisionLEFT) {
            if (collisionLEFT.player !== 'rim') {
                cycle.wallAccel = true;
            }

            cycle.collisionLEFT = true;
            cycle.collisionLEFTdist = collisionLEFT.dist;
            cycle.collisionLEFTplayer = collisionLEFT.player;
            dist = collisionLEFT.dist;
        }

        if (collisionRIGHT) {
            if (collisionRIGHT.player !== 'rim') {
                cycle.wallAccel = true;
            }

            cycle.collisionRIGHT = true;
            cycle.collisionRIGHTdist = collisionRIGHT.dist;
            cycle.collisionRIGHTplayer = collisionRIGHT.player;

            if (collisionLEFT) {
                dist = Math.min(collisionLEFT.dist, collisionRIGHT.dist);
            } else {
                dist = collisionRIGHT.dist;
            }
        }

        cycle.wallAccelAmount = ((this.wallAccelRange - dist) * ((this.wallAccelFactor - 1) / 100)) + 1;
    };


}