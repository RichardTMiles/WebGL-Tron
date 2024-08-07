import Game from "src/Game";
import GameState from "src/GameState";
import LightBike from "src/LightBike";
import * as THREE from "three";


export default class ExplodeAnimation {
    object: THREE.Points;
    status: boolean;
    xDir: number;
    yDir: number;
    zDir: number;
    time: number;
    update: () => void;

    constructor(cycle: LightBike) {

        const GameState = Game.getInstance()

        const dirs: { x: number; y: number; z: number; }[] = [];
        const geometry = new THREE.BufferGeometry();
        const vertices: number[] = [];

        const s1 = GameState.maxSpeed / cycle.speed;
        const s2 = cycle.speed / GameState.maxSpeed;
        const dir = cycle.position.clone().normalize().multiplyScalar(s1 * s2);

        for (let i = 0; i < GameState.explode.particleCount; i++) {
            const vertex = new THREE.Vector3(cycle.position.x, cycle.position.y, cycle.position.z);
            vertices.push(vertex.x, vertex.y, vertex.z);
            dirs.push({
                x: (Math.random() * GameState.explode.velocity) - (GameState.explode.velocity / 2) * dir.x,
                y: (Math.random() * GameState.explode.velocity) - (GameState.explode.velocity / 2),
                z: (Math.random() * GameState.explode.velocity) - (GameState.explode.velocity / 2) * dir.z
            });
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        const material = new THREE.PointsMaterial({
            size: GameState.explode.particleSize,
            color: cycle.color,
            transparent: true
        });

        this.object = new THREE.Points(geometry, material);
        this.status = true;

        this.xDir = (Math.random() * GameState.explode.velocity) - (GameState.explode.velocity / 2);
        this.yDir = (Math.random() * GameState.explode.velocity) - (GameState.explode.velocity / 2);
        this.zDir = (Math.random() * GameState.explode.velocity) - (GameState.explode.velocity / 2);

        GameState.scene.add(this.object);

        this.time = GameState.explode.time;

        this.update = function () {
            this.time *= GameState.explode.decay;

            if (this.status == true) {
                const positions = this.object.geometry.attributes.position.array as Float32Array;
                for (let i = 0; i < GameState.explode.particleCount; i++) {
                    positions[i * 3 + 0] += dirs[i].x;
                    positions[i * 3 + 1] += dirs[i].y;
                    positions[i * 3 + 2] += dirs[i].z;
                }
                this.object.geometry.attributes.position.needsUpdate = true;
                (this.object.material as THREE.PointsMaterial).size = this.time * GameState.explode.particleSize;
                (this.object.material as THREE.PointsMaterial).opacity = this.time;
            }
        };
    }
}