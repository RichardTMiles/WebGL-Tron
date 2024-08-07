import Game from "src/Game";
import halfPi from "src/lib/HalfPi";
import LightBike from "src/LightBike";
import * as THREE from "three";

export const addWall = function (cycle: LightBike) {
    cycle.currentWall = Game.getInstance().createWall(cycle.color);
    cycle.currentWall.quaternion.copy(cycle.quaternion);
    cycle.currentWall.position.x = cycle.position.x;
    cycle.currentWall.position.z = cycle.position.z;
    cycle.currentWall.scale.x = 0.0001;
    cycle.walls.add(cycle.currentWall);
};

export const turnLeft = (cycle: LightBike) => {
    return () => {
        cycle.rotateY(halfPi);
        cycle.turned = true;
        cycle.windingOrder += 1;
    };
};

export const turnRight = (cycle: LightBike) => {
    return () => {
        cycle.rotateY(-halfPi);
        cycle.turned = true;
        cycle.windingOrder -= 1;
    };
};


export const wallLightFade = (cycle: LightBike) => {
    cycle.walls.children.forEach(el => {
        const material = (el as THREE.Mesh).material;
        if (material instanceof THREE.MeshBasicMaterial
            || material instanceof THREE.MeshLambertMaterial
            || material instanceof THREE.MeshPhongMaterial) {
            if (cycle.lightUpColor === 'r' && material.color.r > 0) {
                material.color.r -= 0.03;
            } else if (cycle.lightUpColor === 'g' && material.color.g > 0) {
                material.color.g -= 0.03;
            } else if (cycle.lightUpColor === 'b' && material.color.b > 0) {
                material.color.b -= 0.03;
            }
        }
    });
};

export const cycleHitVisuals = (cycle: LightBike) => {
    const updateMaterialOpacityAndColor = (mesh: THREE.Mesh, opacity: number, color: THREE.Color) => {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach(material => {
            if (material instanceof THREE.MeshBasicMaterial
                || material instanceof THREE.MeshLambertMaterial
                || material instanceof THREE.MeshPhongMaterial) {
                material.opacity = opacity;
                material.color.set(color);
            }
        });
    };

    updateMaterialOpacityAndColor(cycle.model.children[0] as THREE.Mesh, 1.0 - cycle.rubber / 6, new THREE.Color());
    updateMaterialOpacityAndColor(cycle.model.children[3] as THREE.Mesh, cycle.rubber / 5, new THREE.Color(
        0.5 + cycle.rubber / 10,
        1 - (cycle.rubber * cycle.rubber * cycle.rubber) / 50,
        0.5 - cycle.rubber / 10
    ));
};

