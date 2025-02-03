import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import nipplejs from 'nipplejs';

// Configuração da cena, câmera e renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Habilitar sombras
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras mais suaves

const joystick = nipplejs.create({
    zone: document.body,  // Pode ser um elemento específico
    mode: 'dynamic',      // O joystick aparece onde o jogador toca
    position: { left: '50%', bottom: '20%' }, // Posição inicial
    color: 'blue'
});

let moveDirection = { x: 0, y: 0 };

// Captura os eventos do joystick
joystick.on('move', (evt, data) => {
    if (data.vector) {
        moveDirection.x = data.vector.x;
        moveDirection.y = data.vector.y;
    }
});

// Quando soltar o joystick, para de mover
joystick.on('end', () => {
    moveDirection.x = 0;
    moveDirection.y = 0;
});

// Função para aplicar o movimento no avatar do jogo
function updatePlayerMovement(player) {
    if (player) {
        player.position.x += moveDirection.x * 0.1;
        player.position.z -= moveDirection.y * 0.1; // Invertido porque no Three.js o eixo Z vai "para dentro"
    }
}

export { updatePlayerMovement };

// Chão
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = Math.PI / 2;
floor.receiveShadow = true; // Recebe sombras
scene.add(floor);

// Rua
const streetGeometry = new THREE.PlaneGeometry(10, 100);
const streetMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const street = new THREE.Mesh(streetGeometry, streetMaterial);
street.rotation.x = Math.PI / 2;
street.position.z = -20;
street.receiveShadow = true; // Recebe sombras
scene.add(street);

// Calçadas
const sidewalkGeometry = new THREE.PlaneGeometry(2, 100);
const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });

const sidewalkLeft = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
sidewalkLeft.rotation.x = Math.PI / 2;
sidewalkLeft.position.x = -6;
sidewalkLeft.position.z = -20;
sidewalkLeft.receiveShadow = true; // Recebe sombras
scene.add(sidewalkLeft);

const sidewalkRight = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
sidewalkRight.rotation.x = Math.PI / 2;
sidewalkRight.position.x = 6;
sidewalkRight.position.z = -20;
sidewalkRight.receiveShadow = true; // Recebe sombras
scene.add(sidewalkRight);

// Postes de luz
function createStreetLight(x, z) {
    // Cria o poste
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, 2.5, z);
    pole.castShadow = true; // Lança sombras
    scene.add(pole);

    // Cria a lâmpada
    const bulbGeometry = new THREE.SphereGeometry(0.3);
    const bulbMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
    bulb.position.set(x, 5, z);
    bulb.castShadow = true; // Lança sombras
    scene.add(bulb);

    // Adiciona luz pontual
    const pointLight = new THREE.PointLight(0xffff00, 10, 20);
    pointLight.position.set(x, 5, z);
    pointLight.castShadow = true; // Luz lança sombras
    pointLight.shadow.mapSize.width = 1024; // Qualidade da sombra
    pointLight.shadow.mapSize.height = 1024;
    pointLight.shadow.camera.near = 0.5;
    pointLight.shadow.camera.far = 50;
    scene.add(pointLight);
}

createStreetLight(-6, -15); // Poste à esquerda
createStreetLight(6, -15);  // Poste à direita

// Casas
function createHouse(x, z) {
    const houseGeometry = new THREE.BoxGeometry(3, 3, 3);
    const houseMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const house = new THREE.Mesh(houseGeometry, houseMaterial);
    house.position.set(x, 1.5, z);
    house.castShadow = true; // Lança sombras
    house.receiveShadow = true; // Recebe sombras
    scene.add(house);

    const roofGeometry = new THREE.ConeGeometry(2, 2, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xA52A2A });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(x, 4, z);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true; // Lança sombras
    roof.receiveShadow = true; // Recebe sombras
    scene.add(roof);
}

createHouse(-8, -10); // Casa à esquerda
createHouse(8, -10);  // Casa à direita

// Avatar
const avatarGeometry = new THREE.BoxGeometry(1, 1, 1);
const avatarMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const avatar = new THREE.Mesh(avatarGeometry, avatarMaterial);
avatar.position.y = 0.5;
avatar.castShadow = true; // Lança sombras
avatar.receiveShadow = true; // Recebe sombras
scene.add(avatar);

// CUBO PONTOS
const loader = new GLTFLoader();
const collectibles = []; // Lista de objetos coletáveis

// Função para criar um objeto coletável
function createCollectible(x, y, z) {
    loader.load('/point.glb', (gltf) => { // Substitua 'coin.glb' pelo nome do seu arquivo
        const model = gltf.scene;
        model.position.set(x, y, z);
        model.scale.set(0.2, 0.2, 0.2); // Ajuste a escala conforme necessário
        // Aplica uma textura brilhante em vermelho
        model.traverse((child) => {
          if (child.isMesh) {
              child.material = new THREE.MeshStandardMaterial({
                  color: 0xff0000, // Cor vermelha
                  emissive: 0xff0000, // Emissão vermelha
                  emissiveIntensity: 2, // Intensidade do brilho
                  metalness: 0.5, // Metallic effect
                  roughness: 0.1 // Superfície lisa
              });
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

                // Adiciona uma propriedade para controlar a rotação
                model.rotationSpeed = 0.02; // Velocidade de rotação
                
        scene.add(model);
        collectibles.push(model); // Adiciona o modelo à lista de coletáveis
    });
}

// Cria alguns objetos coletáveis
createCollectible(-5, 0.5, -10); // Exemplo de posição
createCollectible(5, 0.5, -15);  // Exemplo de posição
createCollectible(0, 0.5, -20);  // Exemplo de posição

// colisão cubo

function checkCollisions() {
  collectibles.forEach((collectible, index) => {
      if (avatar.position.distanceTo(collectible.position) < 1) { // Distância de colisão
          scene.remove(collectible); // Remove o modelo da cena
          collectibles.splice(index, 1); // Remove o modelo da lista
          updateScore(1); // Adiciona 1 ponto
      }
  });
}

// Câmera
camera.position.set(0, 10, 10);
camera.lookAt(0, 0, -20);

// Movimentação
const moveSpeed = 0.1;
const keys = {};

window.addEventListener('keydown', (event) => {
    keys[event.code] = true;
});

window.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

function handleMovement() {
    if (keys['ArrowUp']) avatar.position.z -= moveSpeed;
    if (keys['ArrowDown']) avatar.position.z += moveSpeed;
    if (keys['ArrowLeft']) avatar.position.x -= moveSpeed;
    if (keys['ArrowRight']) avatar.position.x += moveSpeed;
}

// Animação
function animate() {
  requestAnimationFrame(animate);

  // Faz os modelos coletáveis girarem
  collectibles.forEach((collectible) => {
      collectible.rotation.y += collectible.rotationSpeed; // Gira no eixo Y
  });

  handleMovement();
  camera.updateProjectionMatrix(); // Joystick
  checkCollisions();
  renderer.render(scene, camera);
}

animate();

// Redimensionamento
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

//pontuação
let score = 0;

function updateScore(points) {
    score += points;
    document.getElementById('score').textContent = score;
}