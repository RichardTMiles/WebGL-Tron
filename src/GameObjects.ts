import GameState from "src/GameState";
import halfPi from "src/lib/HalfPi";
import * as THREE from "three";
import {anisotropy} from "three/examples/jsm/nodes/core/PropertyNode";


export default class GameObjects extends GameState {
    /*—–––––––––––––helper stuff—––––––––––––––*/
    yellowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        wireframe: true,
        wireframeLinewidth: 1
    });
    indicatorGeo = new THREE.TetrahedronGeometry(1, 0);
    indicator = new THREE.Mesh(this.indicatorGeo, this.yellowMaterial);
    chatIndicator = () => {
        this.indicator.rotation.y += 0.05;
        this.indicator.rotation.z += 0.02;
    };
    lineMaterial = new THREE.LineBasicMaterial({color: 0xff00ff, linewidth: 2});
    bounds = new THREE.BufferGeometry();
    distV = new THREE.BufferGeometry();
    accelBoundingLine = new THREE.Line(this.bounds, new THREE.LineBasicMaterial({color: 0xffff00, linewidth: 1}));
    distLine = new THREE.Line(this.distV, this.lineMaterial);
    dist2V = new THREE.BufferGeometry();
    distLine2 = new THREE.Line(this.dist2V, this.lineMaterial);
    stopV = new THREE.BufferGeometry();
    stopLine = new THREE.Line(this.stopV, new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 2}));
    /*–––––––––––––––––lights––––––––––––––––––*/
    pointLight = new THREE.PointLight(0xcccccc);
    ambLight = new THREE.AmbientLight(0x999999);
    /*—–––––––––––––––grid—–––––––––––––––*/
    grid: THREE.Object3D;

    constructor() {
        super();

        this.indicator.position.set(0, 5, 0);

        this.bounds.setFromPoints([
            new THREE.Vector3(0, -1.9, -this.wallAccelRange),
            new THREE.Vector3(0, -1.9, this.wallAccelRange)
        ]);

        this.distV.setFromPoints([
            new THREE.Vector3(0, -1.9, 0),
            new THREE.Vector3(1, -1.9, 0)
        ]);

        this.dist2V.setFromPoints([
            new THREE.Vector3(0, -1.9, -0.5),
            new THREE.Vector3(0, -1.9, 0.5)
        ]);

        this.stopV.setFromPoints([
            new THREE.Vector3(0, -1.9, -3),
            new THREE.Vector3(0, -1.9, 3)
        ]);

        this.pointLight.position.set(0, 150, 0);

        this.scene.add(this.pointLight);

        this.scene.add(this.ambLight);

    }

    animateInfoMetrics = (cycle: any) => {
        return () => {
            this.distLine.position.x = -cycle.currentWall.scale.x;
            this.distLine.scale.x = cycle.currentWall.scale.x + (cycle.speed + cycle.rubberMinDistance);
            this.distLine2.position.set((cycle.speed + cycle.rubberMinDistance), 0, 0);
            this.stopLine.position.set(cycle.stopDistance, 0, 0);
        };
    };

    createGrid = (q: boolean = false) => {
        if (this.grid) this.scene.remove(this.grid);

        if (q === true) {
            const floorTexture = new THREE.TextureLoader().load('images/grid09.png');
            floorTexture.wrapS = THREE.RepeatWrapping;
            floorTexture.wrapT = THREE.RepeatWrapping;
            floorTexture.repeat.set(this.arenaSize / this.gridTileSize, this.arenaSize / this.gridTileSize);
            // @ts-ignore - THREE isn't officially typescript typed, just community maintained
            floorTexture.anisotropy = anisotropy;

            const floorMaterial = new THREE.MeshBasicMaterial({map: floorTexture});
            const floorGeometry = new THREE.PlaneGeometry(this.arenaSize * 2, this.arenaSize * 2, 1, 1);

            this.grid = new THREE.Mesh(floorGeometry, floorMaterial);
            this.grid.rotateX(-halfPi);
            this.scene.add(this.grid);
        } else {
            this.grid = new THREE.GridHelper(this.arenaSize, 6, 0x555555, 0x555555);
            this.scene.add(this.grid);
        }

        let rimCoords = [
            {x: this.arenaSize, z: this.arenaSize},
            {x: -this.arenaSize, z: this.arenaSize},
            {x: -this.arenaSize, z: -this.arenaSize},
            {x: this.arenaSize, z: -this.arenaSize},
            {x: this.arenaSize, z: this.arenaSize}
        ];
    };

    createWall = (colorCode: number) => {
        const group = new THREE.Group();

        const texture = new THREE.TextureLoader().load(this.textureSource);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        if (texture.image) {
            this.wallTextureProportion = (texture.image.width / texture.image.height) * 8;
        }

        const wallMaterial = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            map: texture,
            color: colorCode,
            blending: this.textureBlending ? THREE.AdditiveBlending : THREE.NormalBlending,
            transparent: true,
            opacity: 1
        });

        const wallGeometry = new THREE.PlaneGeometry(1, 4);
        const m = new THREE.Matrix4();
        m.makeRotationX(halfPi);
        m.makeTranslation(0.5, 2, 0);
        wallGeometry.applyMatrix4(m);

        const wall = new THREE.Mesh(wallGeometry, wallMaterial);

        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setFromPoints([
            new THREE.Vector3(0, 4, 0),
            new THREE.Vector3(1, 4, 0)
        ]);

        const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({color: colorCode, linewidth: 1}));

        group.add(wall);
        group.add(line);

        return group;
    };


}