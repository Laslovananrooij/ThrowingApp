import * as THREE from 'three';
export function createFrisbee(texturePath = null) {
  // Parameters
  const outerRadius = 0.275;
  const innerRadius = 0.270;
  const height = 0.01;
  const domeHeight = 0.05;

  // Material
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.3,
    roughness: 0.2,
    side: THREE.DoubleSide,
  });

  // 1. Rim (sloped sides)
  const rimGeometry = new THREE.CylinderGeometry(outerRadius, innerRadius, height, 64, 1, true);
  const rim = new THREE.Mesh(rimGeometry, baseMaterial);

  // 2. Slightly domed top
  const curvePoints = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const r = outerRadius * (1 - t ** 5);
    const y = domeHeight * Math.sin((t * Math.PI) / 2);
    curvePoints.push(new THREE.Vector2(r, height / 2 + y));
  }
  const topGeometry = new THREE.LatheGeometry(curvePoints, 64);
  const top = new THREE.Mesh(topGeometry, baseMaterial);

  // 3. Bottom (flat disc)
  const bottomGeometry = new THREE.CircleGeometry(outerRadius * 0.9, 64);
  const bottom = new THREE.Mesh(bottomGeometry, baseMaterial);
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.y = -height / 2;

  // Group them all together
  const frisbee = new THREE.Group();
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.3,
    roughness: 0.2,
  });

  const numRings = 16;
  const domeCurvePoints = [];
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    const r = outerRadius * (1 - t ** 5);
    const y = height / 2 + domeHeight * Math.sin((t * Math.PI) / 2);
    domeCurvePoints.push({ r, y });
  }

  // Add rings
  for (let i = 1; i <= numRings; i++) {
    const idx = Math.floor(((0.65 + i / 140)) * domeCurvePoints.length);
    const { r, y } = domeCurvePoints[idx];

    const ringGeometry = new THREE.TorusGeometry(r, 0.0001, 8, 64);
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y + 0.0005;

    frisbee.add(ring);
  }

  frisbee.add(rim);
  frisbee.add(top);
  frisbee.add(bottom);

  // Optional texture
  if (texturePath) {
    const loader = new THREE.TextureLoader();
    loader.load(texturePath, function (texture) {
      const logoMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      });

      const logoGeometry = new THREE.CircleGeometry(outerRadius * 0.7, 64);
      const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);

      logoMesh.rotation.x = -Math.PI / 2;
      logoMesh.position.y = height / 2 + domeHeight + 0.0001;
      logoMesh.name = "logo"
      frisbee.add(logoMesh);
    });
  }

  const frisbeeGroup = new THREE.Group();
  frisbeeGroup.add(frisbee);


  function updateLogoTexture(texture) {
  const logoMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  const logoGeometry = new THREE.CircleGeometry(outerRadius * 0.7, 64);
  const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);
  logoMesh.rotation.x = -Math.PI / 2;
  logoMesh.position.y = height / 2 + domeHeight + 0.0001;

  // Remove old logo mesh if any
  const oldLogo = frisbee.getObjectByName('logo');
  if (oldLogo) frisbee.remove(oldLogo);

  logoMesh.name = 'logo';
  frisbee.add(logoMesh);
}


  return { frisbeeGroup, frisbee,updateLogoTexture };
}


export function createGroundPlane() {
  const loader = new THREE.TextureLoader();

  const color = loader.load('/textures/grass_color.png');
  const normal = loader.load('/textures/grass_normal.png');
  const rough = loader.load('/textures/grass_roughness.png');

  [color, normal, rough].forEach(tex => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(200, 200);
  });

  const material = new THREE.MeshStandardMaterial({
    map: color,
    normalMap: normal,
    roughnessMap: rough,
    roughness: 1.0,
    metalness: 0,
  });

  const geometry = new THREE.PlaneGeometry(1000, 1000);
  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.name = 'groundPlane';

  return ground;
}

import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

export function createUltimateField(backlineDistance) {
const positions = [
  0, 0, -18.5,
  110, 0, -18.5,
  110, 0, 18.5,
  0, 0, 18.5,
  0, 0, -18.5,
  18, 0, -18.5,
  18, 0, 18.5,
  92, 0, 18.5,
  92, 0, -18.5,
  ];
  const geometry = new LineGeometry();
  geometry.setPositions(positions);

  const material = new LineMaterial({
    color: 0xffffff,
    linewidth: 4, // Thickness in world units
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight), // Must set this!
    dashed: false,
  });

  const line = new Line2(geometry, material);
  line.position.x = -backlineDistance
  line.name = 'ultimateField';

  return line;
}


window.addEventListener('resize', () => {
  material.resolution.set(window.innerWidth, window.innerHeight);
  material.needsUpdate = true;
});
// export function createUltimateField() {
//   const points = [
//     new THREE.Vector3(-5, 0, -18.5),
//     new THREE.Vector3(105, 0, -18.5),
//     new THREE.Vector3(105, 0, 18.5),
//     new THREE.Vector3(-5, 0, 18.5),
//     new THREE.Vector3(-5, 0, -18.5),
//     new THREE.Vector3(13, 0, -18.5),
//     new THREE.Vector3(13, 0, 18.5),
//     new THREE.Vector3(105 - 18, 0, 18.5),
//     new THREE.Vector3(105 - 18, 0, -18.5),
//   ];

//   const geometry = new THREE.BufferGeometry().setFromPoints(points);
//   const material = new THREE.LineBasicMaterial({ color: 0xffffff });
//   const line = new THREE.Line(geometry, material);
//   line.name = 'ultimateField';
//   return line;
// }
