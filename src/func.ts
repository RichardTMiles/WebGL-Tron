// src/func.ts
import {Point} from "src/line-intersect";
import * as THREE from 'three';

export const constrain = (min: number, max: number) => {
    return (n: number): number => {
        return Math.max(min, Math.min(n, max));
    };
};

export const normal_random = (mean: number = 0.0, variance: number = 1.0): number => {
    let V1: number, V2: number, S: number, X: number;
    do {
        const U1 = Math.random();
        const U2 = Math.random();
        V1 = 2 * U1 - 1;
        V2 = 2 * U2 - 1;
        S = V1 * V1 + V2 * V2;
    } while (S > 1);

    X = Math.sqrt(-2 * Math.log(S) / S) * V1;
    X = mean + Math.sqrt(variance) * X;
    return X;
};

export const createLabel = (name: string): HTMLDivElement => {
    const text = document.createElement('div');
    text.setAttribute('class', 'playerLabel');
    text.setAttribute('id', name);
    text.innerHTML = name;
    document.getElementById('player-labels')?.appendChild(text);
    return text;
};


export const fadeInLabel = (cycle: any): (() => void) => {
    cycle.textLabel.style.opacity = 0;
    return (): void => {
        cycle.textLabel.style.opacity = (parseFloat(cycle.textLabel.style.opacity) + 0.04).toString();

        if (parseFloat(cycle.textLabel.style.opacity) >= 0.85) {
            cycle.renderList.splice(cycle.renderList.indexOf(this), 1);
        }
    };
};

export const sanitize = (str: string): string => {
    return str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim, "");
};

export const hexToRGB = (hex: number): [number, number, number] => {
    const r = hex >> 16;
    const g = (hex >> 8) & 0xFF;
    const b = hex & 0xFF;
    return [r, g, b];
};

export const darkestRGB = (hex: number): string => {
    const rgb = hexToRGB(hex);
    const darkest = Math.min(...rgb);
    if (darkest === rgb[0]) {
        return 'r';
    } else if (darkest === rgb[1]) {
        return 'g';
    } else {
        return 'b';
    }
};

export const minDistIndex = (array: { dist: number }[]): number => {
    const minObj = array.reduce((prev, curr) => (prev.dist < curr.dist ? prev : curr));
    return array.indexOf(minObj);
};

export const distanceBetween = (p1: Point, p2: Point): number => {
    return Math.abs((p2.x - p1.x) + (p2.z - p1.z));
};

export const hideElement = (elem: HTMLElement, el2: HTMLElement): void => {
    const hide = (): void => {
        elem.style.visibility = 'hidden';
        elem.style.opacity = '1';
        el2.style.display = 'none';
    };
    elem.style.opacity = '1';
    (function fadeOut() {
        0 > (parseFloat(elem.style.opacity ?? '0') - 0.1) ? hide() : setTimeout(fadeOut, 40);
    }());
};


export const animateCycle = (cycle: any): (() => void) => {
    return (): void => {
        cycle.model.children[1].rotation.y -= cycle.speed / 3.2;
        cycle.model.children[2].rotation.y -= cycle.speed / 2;
        cycle.model.children[4].rotation.y -= cycle.speed / 3.2;
        cycle.model.children[5].rotation.y -= cycle.speed / 2;
        cycle.model.children[6].rotation.x += cycle.speed / 3;
    };
};

export const cycleModel = (colorCode: number): THREE.Object3D => {
    const cycleMaterial = new THREE.MeshLambertMaterial({
        map: new THREE.TextureLoader().load('images/cautionsolid.png'),
        color: colorCode,
        transparent: true,
        opacity: 1.0
    });

    const wireMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        wireframe: true,
        wireframeLinewidth: 2,
        transparent: true,
        opacity: 0.0
    });

    const cube = new THREE.Mesh(new THREE.BoxGeometry(5.5, 4, 2), cycleMaterial);
    cube.position.set(-0.75, 0, 0);

    const cubeWire = new THREE.Mesh(new THREE.BoxGeometry(5.5, 4, 2), wireMaterial);
    cubeWire.position.set(-0.75, 0, 0);

    const bcylinder = new THREE.CylinderGeometry(2, 2, 3, 16);
    const bwheel = new THREE.Mesh(bcylinder, cycleMaterial);
    bwheel.position.set(-1.5, 0, 0);
    bwheel.rotateX(Math.PI / 2);

    const bcylinderWire = new THREE.CylinderGeometry(2, 2, 3, 8, 1, true);
    const bwheelWire = new THREE.Mesh(bcylinderWire, wireMaterial);
    bwheelWire.position.set(-1.5, 0, 0);
    bwheelWire.rotateX(Math.PI / 2);

    const fcylinder = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 10);
    const fwheel = new THREE.Mesh(fcylinder, cycleMaterial);
    fwheel.position.set(2, -1.3, 0);
    fwheel.rotateX(Math.PI / 2);

    const fcylinderWire = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 8, 1, true);
    const fwheelWire = new THREE.Mesh(fcylinderWire, wireMaterial);
    fwheelWire.position.set(2, -1.3, 0);
    fwheelWire.rotateX(Math.PI / 2);

    const ecylinder = new THREE.CylinderGeometry(0.5, 0.5, 2.5, 4);
    const eng = new THREE.Mesh(ecylinder, wireMaterial);
    eng.position.set(-0.2, -1, 0);
    eng.rotateZ(Math.PI / 2);

    const windshieldMaterial = new THREE.MeshNormalMaterial({side: THREE.DoubleSide});

    const windshieldgeom = new THREE.PlaneGeometry(2.01, 0.9);
    const windshield = new THREE.Mesh(windshieldgeom, windshieldMaterial);
    windshield.position.set(2.01, 1.1, 0);
    windshield.rotateY(Math.PI / 2);

    const windshieldSideGeom = new THREE.PlaneGeometry(1.45, 0.9);
    const windshield2 = new THREE.Mesh(windshieldSideGeom, windshieldMaterial);
    windshield2.position.set(1.285, 1.1, 1.01);
    const windshield3 = new THREE.Mesh(windshieldSideGeom, windshieldMaterial);
    windshield3.position.set(1.285, 1.1, -1.01);

    const model = new THREE.Object3D();
    model.add(cube);
    model.add(bwheel);
    model.add(fwheel);
    model.add(cubeWire);
    model.add(bwheelWire);
    model.add(fwheelWire);
    model.add(eng);
    model.add(windshield);
    model.add(windshield2);
    model.add(windshield3);

    return model;
};

