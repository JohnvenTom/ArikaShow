import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

let scene, camera, renderer, composer, controls;
let blackHoleModel = null;
let clock = new THREE.Clock();
const particleSystems = [];
let circleTexture = null;
let softGlowTexture = null;

/**
 * 创建基础圆形纹理
 */
function createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

/**
 * 创建柔和羽化纹理（用于吸积盘气态效果）
 */
function createSoftGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.05)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

/**
 * 根据半径获取天体色温颜色
 * 内层亮橙/白炽 → 中层橘红 → 外层暗红
 */
function getAccretionDiskColor(radius, innerRadius, outerRadius) {
    const t = (radius - innerRadius) / (outerRadius - innerRadius);
    const clampedT = Math.max(0, Math.min(1, t));

    let r, g, b;
    if (clampedT < 0.15) {
        // 内层：刺眼白炽高光
        const localT = clampedT / 0.15;
        r = 1.0;
        g = 0.95 - localT * 0.3;
        b = 0.9 - localT * 0.6;
    } else if (clampedT < 0.4) {
        // 内中：亮橙
        const localT = (clampedT - 0.15) / 0.25;
        r = 1.0;
        g = 0.65 - localT * 0.2;
        b = 0.3 - localT * 0.2;
    } else if (clampedT < 0.7) {
        // 中层：橘红
        const localT = (clampedT - 0.4) / 0.3;
        r = 1.0 - localT * 0.2;
        g = 0.45 - localT * 0.25;
        b = 0.1 - localT * 0.05;
    } else {
        // 外层：暗红
        const localT = (clampedT - 0.7) / 0.3;
        r = 0.8 - localT * 0.3;
        g = 0.2 - localT * 0.1;
        b = 0.05;
    }

    // 添加随机扰动使颜色更自然
    const noise = (Math.random() - 0.5) * 0.1;
    return {
        r: Math.max(0, Math.min(1, r + noise)),
        g: Math.max(0, Math.min(1, g + noise)),
        b: Math.max(0, Math.min(1, b + noise))
    };
}

/**
 * 初始化场景
 */
function init() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 8);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    // 主 Bloom：场景整体辉光（粒子、吸积盘）
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.2,    // 强度降低，避免过曝
        0.5,    // 半径适中
        0.2     // 阈值提高，只让较亮区域发光
    );
    composer.addPass(bloomPass);

    // 摄像头/镜头光晕效果：模拟相机镜头面对强光源时的散射
    const lensFlarePass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.15,
        0.4,
        0.5
    );
    composer.addPass(lensFlarePass);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.autoRotate = false;
    controls.minDistance = 2;
    controls.maxDistance = 20;

    circleTexture = createCircleTexture();
    softGlowTexture = createSoftGlowTexture();

    initParticleSystems();
    loadModel();
    window.addEventListener('resize', onWindowResize);
}

/**
 * 初始化所有粒子系统
 */
function initParticleSystems() {
    createStaticStars();
    createTwinklingStars();
    createLayeredStars();
    createDustParticles();
    createNebulaParticles();
    createGasFlowParticles();
    createGravityPullParticles();
    createAccretionDiskParticles();

    createMeteorParticles();
    createIceCrystalParticles();
    createSpaceDebrisParticles();
    createDriftParticles();
    createTurbulenceParticles();
    createDeepFogParticles();
}

// ========== 一、基础星空粒子（数量增加，更精细）==========
function createStaticStars() {
    const count = 6000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        const radius = 20 + Math.random() * 100;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        const brightness = 0.3 + Math.random() * 0.7;
        const colorChoice = Math.random();
        if (colorChoice < 0.6) {
            colors[i * 3] = brightness; colors[i * 3 + 1] = brightness; colors[i * 3 + 2] = brightness;
        } else if (colorChoice < 0.85) {
            colors[i * 3] = brightness * 0.7; colors[i * 3 + 1] = brightness * 0.8; colors[i * 3 + 2] = brightness;
        } else {
            colors[i * 3] = brightness; colors[i * 3 + 1] = brightness * 0.85; colors[i * 3 + 2] = brightness * 0.5;
        }
        sizes[i] = 0.3 + Math.random() * 1.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 0.02, vertexColors: true, transparent: true, opacity: 1.0,
        sizeAttenuation: true, blending: THREE.AdditiveBlending,
        map: circleTexture, alphaTest: 0.01, depthWrite: false
    });
    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
    particleSystems.push({ mesh: stars, type: 'static', update: null });
}

function createTwinklingStars() {
    const count = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        const radius = 25 + Math.random() * 80;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
        phases[i] = Math.random() * Math.PI * 2;
        speeds[i] = 2 + Math.random() * 4;
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
        size: 0.25, vertexColors: true, transparent: true, opacity: 1.0,
        sizeAttenuation: true, blending: THREE.AdditiveBlending,
        map: circleTexture, alphaTest: 0.01, depthWrite: false
    });
    const twinkleStars = new THREE.Points(geometry, material);
    scene.add(twinkleStars);

    const update = (time) => {
        const colors = twinkleStars.geometry.attributes.color.array;
        for (let i = 0; i < count; i++) {
            const brightness = 0.5 + Math.sin(time * speeds[i] + phases[i]) * 0.5;
            colors[i * 3] = brightness;
            colors[i * 3 + 1] = brightness;
            colors[i * 3 + 2] = brightness;
        }
        twinkleStars.geometry.attributes.color.needsUpdate = true;
    };
    particleSystems.push({ mesh: twinkleStars, type: 'twinkling', update: update });
}

function createLayeredStars() {
    createStarLayer(80, 0.08, 1.0, 0xffffff, 18, 50);
    createStarLayer(800, 0.03, 1.0, 0xccddff, 25, 70);
    createStarLayer(4000, 0.01, 1.0, 0x8899aa, 35, 120);
}

function createStarLayer(count, size, opacity, color, minRadius, maxRadius) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: color, size: size, transparent: true, opacity: opacity,
        sizeAttenuation: true, blending: THREE.AdditiveBlending,
        map: circleTexture, alphaTest: 0.01, depthWrite: false
    });
    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
    particleSystems.push({ mesh: stars, type: 'layer', update: null });
}

// ========== 二、深空氛围粒子（数量增加）==========
function createDustParticles() {
    const count = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 80;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
        velocities.push({ x: (Math.random() - 0.5) * 0.003, y: (Math.random() - 0.5) * 0.003, z: (Math.random() - 0.5) * 0.003 });
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0x555566, size: 0.06, transparent: true, opacity: 0.2,
        sizeAttenuation: true, map: circleTexture, alphaTest: 0.01, depthWrite: false
    });
    const dust = new THREE.Points(geometry, material);
    scene.add(dust);

    const update = (time) => {
        const positions = dust.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y;
            positions[i * 3 + 2] += velocities[i].z;
            if (Math.abs(positions[i * 3]) > 40) velocities[i].x *= -1;
            if (Math.abs(positions[i * 3 + 1]) > 40) velocities[i].y *= -1;
            if (Math.abs(positions[i * 3 + 2]) > 40) velocities[i].z *= -1;
        }
        dust.geometry.attributes.position.needsUpdate = true;
    };
    particleSystems.push({ mesh: dust, type: 'dust', update: update });
}

function createNebulaParticles() {
    const nebulaColors = [0x6644aa, 0x4466aa, 0xaa2244];
    const nebulaCenters = [{ x: -20, y: 10, z: -25 }, { x: 25, y: -12, z: -20 }, { x: -10, y: -18, z: 15 }];
    nebulaColors.forEach((color, idx) => {
        const count = 600;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const center = nebulaCenters[idx];
        for (let i = 0; i < count; i++) {
            const offset = 10 + Math.random() * 15;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = center.x + offset * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = center.y + offset * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = center.z + offset * Math.cos(phi) * 0.5;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: color, size: 0.15, transparent: true, opacity: 0.6,
            sizeAttenuation: true, blending: THREE.AdditiveBlending,
            map: circleTexture, alphaTest: 0.01, depthWrite: false
        });
        const nebula = new THREE.Points(geometry, material);
        scene.add(nebula);
        particleSystems.push({ mesh: nebula, type: 'nebula', update: null });
    });
}

function createGasFlowParticles() {
    const count = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const angles = new Float32Array(count);
    const radii = new Float32Array(count);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
        const radius = 15 + Math.random() * 30;
        const angle = Math.random() * Math.PI * 2;
        radii[i] = radius; angles[i] = angle; speeds[i] = 0.01 + Math.random() * 0.03;
        positions[i * 3] = radius * Math.cos(angle);
        positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
        positions[i * 3 + 2] = radius * Math.sin(angle);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0x3366aa, size: 0.35, transparent: true, opacity: 0.1,
        sizeAttenuation: true, blending: THREE.AdditiveBlending,
        map: circleTexture, alphaTest: 0.01, depthWrite: false
    });
    const gasFlow = new THREE.Points(geometry, material);
    scene.add(gasFlow);

    const update = (time) => {
        const positions = gasFlow.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            angles[i] += speeds[i] * 0.003;
            positions[i * 3] = radii[i] * Math.cos(angles[i]);
            positions[i * 3 + 1] += Math.sin(time * 0.08 + i * 0.1) * 0.001;
            positions[i * 3 + 2] = radii[i] * Math.sin(angles[i]);
        }
        gasFlow.geometry.attributes.position.needsUpdate = true;
    };
    particleSystems.push({ mesh: gasFlow, type: 'gasFlow', update: update });
}

// ========== 三、宇宙特效粒子 ==========
function createGravityPullParticles() {
    const count = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const angles = new Float32Array(count);
    const radii = new Float32Array(count);
    const fallSpeeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
        const radius = 1.5 + Math.random() * 10;
        const angle = Math.random() * Math.PI * 2;
        radii[i] = radius; angles[i] = angle; fallSpeeds[i] = 0.2 + Math.random() * 1.2;
        positions[i * 3] = radius * Math.cos(angle);
        positions[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
        positions[i * 3 + 2] = radius * Math.sin(angle);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0xffaa44, size: 0.08, transparent: true, opacity: 0.6,
        sizeAttenuation: true, blending: THREE.AdditiveBlending,
        map: circleTexture, alphaTest: 0.01, depthWrite: false
    });
    const gravityPull = new THREE.Points(geometry, material);
    scene.add(gravityPull);

    const update = (time) => {
        const positions = gravityPull.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            angles[i] += 0.003 * fallSpeeds[i];
            radii[i] -= 0.003 * fallSpeeds[i];
            if (radii[i] < 0.2) { radii[i] = 10 + Math.random() * 4; angles[i] = Math.random() * Math.PI * 2; }
            positions[i * 3] = radii[i] * Math.cos(angles[i]);
            positions[i * 3 + 1] *= 0.98;
            positions[i * 3 + 2] = radii[i] * Math.sin(angles[i]);
        }
        gravityPull.geometry.attributes.position.needsUpdate = true;
    };
    particleSystems.push({ mesh: gravityPull, type: 'gravityPull', update: update });
}

/**
 * 物理写实黑洞吸积盘粒子系统
 * 整体呈扁平螺旋环状环绕黑洞中心
 * 新增：粒子拖尾效果，模拟高速运动留下的光迹
 */
function createAccretionDiskParticles() {
    const count = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const angles = new Float32Array(count);
    const radii = new Float32Array(count);
    const baseSpeeds = new Float32Array(count);
    const turbulenceOffsets = new Float32Array(count);
    const isFalling = new Float32Array(count);

    const innerRadius = 0.8;
    const outerRadius = 5.0;

    for (let i = 0; i < count; i++) {
        // 半径分布：内密外疏，符合物理规律
        const rNorm = Math.random();
        const radius = innerRadius + (outerRadius - innerRadius) * (rNorm * rNorm);
        const angle = Math.random() * Math.PI * 2;

        radii[i] = radius;
        angles[i] = angle;
        // 角速度：越靠近黑洞越快（开普勒定律近似）
        baseSpeeds[i] = 0.8 / Math.sqrt(radius);
        turbulenceOffsets[i] = Math.random() * 100;
        // 少量粒子标记为被引力吸入
        isFalling[i] = Math.random() < 0.05 ? 1 : 0;

        // 扁平盘状分布，Y轴极薄
        const diskThickness = 0.05 + (radius - innerRadius) * 0.08;
        const yOffset = (Math.random() - 0.5) * diskThickness * (1 + Math.random());

        positions[i * 3] = radius * Math.cos(angle);
        positions[i * 3 + 1] = yOffset;
        positions[i * 3 + 2] = radius * Math.sin(angle);

        // 天体色温色彩
        const color = getAccretionDiskColor(radius, innerRadius, outerRadius);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        // 粒子大小：内层小且密，外层大且疏
        sizes[i] = 0.04 + (1 - rNorm) * 0.12 + Math.random() * 0.06;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        map: softGlowTexture,   // 使用柔和羽化纹理
        alphaTest: 0.001,
        depthWrite: false
    });

    const accretionDisk = new THREE.Points(geometry, material);
    scene.add(accretionDisk);

    // ========== 拖尾系统 ==========
    // 为每个主粒子创建拖尾粒子，记录历史位置
    const trailLength = 120; // 每个粒子拖尾段数 - 更长更长更长更长
    const trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(count * trailLength * 3);
    const trailColors = new Float32Array(count * trailLength * 3);
    const trailSizes = new Float32Array(count * trailLength);
    const trailLengths = new Float32Array(count); // 每个粒子随机拖尾长度

    // 初始化拖尾数据
    for (let i = 0; i < count; i++) {
        // 随机拖尾时长：40-120段，更长更长更长更长
        trailLengths[i] = 40 + Math.floor(Math.random() * 81);
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        const particleSize = sizes[i];

        for (let t = 0; t < trailLength; t++) {
            const idx = (i * trailLength + t) * 3;
            trailPositions[idx] = x;
            trailPositions[idx + 1] = y;
            trailPositions[idx + 2] = z;

            // 拖尾颜色：逐渐变淡
            const fade = 1 - (t / trailLength);
            trailColors[idx] = colors[i * 3] * fade;
            trailColors[idx + 1] = colors[i * 3 + 1] * fade;
            trailColors[idx + 2] = colors[i * 3 + 2] * fade;

            // 拖尾大小：与主粒子大小相等
            trailSizes[i * trailLength + t] = particleSize;
        }
    }

    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
    trailGeometry.setAttribute('size', new THREE.BufferAttribute(trailSizes, 1));

    const trailMaterial = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.35,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        map: softGlowTexture,
        alphaTest: 0.001,
        depthWrite: false
    });

    const trailParticles = new THREE.Points(trailGeometry, trailMaterial);
    scene.add(trailParticles);

    const update = (time) => {
        const positions = accretionDisk.geometry.attributes.position.array;
        const colors = accretionDisk.geometry.attributes.color.array;
        const trailPositions = trailParticles.geometry.attributes.position.array;
        const trailColors = trailParticles.geometry.attributes.color.array;
        const trailSizes = trailParticles.geometry.attributes.size.array;

        // 计算相机到黑洞中心的距离，用于动态调整拖尾长度
        const cameraDistance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
        // 距离映射：远(20) -> 长(120段), 近(2) -> 短(5段)
        const minDist = 2, maxDist = 20;
        const minLen = 5, maxLen = 120;
        const distFactor = Math.max(0, Math.min(1, (cameraDistance - minDist) / (maxDist - minDist)));
        const dynamicTrailLength = Math.floor(minLen + distFactor * (maxLen - minLen));

        for (let i = 0; i < count; i++) {
            // 保存当前位置到拖尾历史（移位）
            // 使用动态长度和粒子自身随机长度的较小值
            const currentLen = Math.min(dynamicTrailLength, trailLengths[i]);
            const particleSize = sizes[i];

            // 从后往前移位：位置历史
            for (let t = currentLen - 1; t > 0; t--) {
                const fromIdx = (i * trailLength + t - 1) * 3;
                const toIdx = (i * trailLength + t) * 3;
                trailPositions[toIdx] = trailPositions[fromIdx];
                trailPositions[toIdx + 1] = trailPositions[fromIdx + 1];
                trailPositions[toIdx + 2] = trailPositions[fromIdx + 2];

                // 颜色也移位并衰减
                const fade = 1 - (t / currentLen);
                trailColors[toIdx] = colors[i * 3] * fade * 0.6;
                trailColors[toIdx + 1] = colors[i * 3 + 1] * fade * 0.6;
                trailColors[toIdx + 2] = colors[i * 3 + 2] * fade * 0.6;

                // 拖尾大小：与主粒子大小相等，保持不变
                trailSizes[i * trailLength + t] = particleSize;
            }

            // 将当前主粒子位置写入拖尾头部
            const headIdx = (i * trailLength) * 3;
            trailPositions[headIdx] = positions[i * 3];
            trailPositions[headIdx + 1] = positions[i * 3 + 1];
            trailPositions[headIdx + 2] = positions[i * 3 + 2];
            trailColors[headIdx] = colors[i * 3];
            trailColors[headIdx + 1] = colors[i * 3 + 1];
            trailColors[headIdx + 2] = colors[i * 3 + 2];
            trailSizes[i * trailLength] = particleSize;

            // 超出当前长度的拖尾段隐藏（移到远处）
            for (let t = currentLen; t < trailLength; t++) {
                const hideIdx = (i * trailLength + t) * 3;
                trailPositions[hideIdx] = 9999;
                trailPositions[hideIdx + 1] = 9999;
                trailPositions[hideIdx + 2] = 9999;
                trailColors[hideIdx] = 0;
                trailColors[hideIdx + 1] = 0;
                trailColors[hideIdx + 2] = 0;
            }

            // 基础公转速度 + 湍流扰动
            const turbulence = Math.sin(time * 2 + turbulenceOffsets[i]) * 0.002;
            const currentSpeed = baseSpeeds[i] + turbulence;

            angles[i] += currentSpeed * 0.008;

            // 被引力吸入的粒子：螺旋收缩
            if (isFalling[i] > 0.5) {
                radii[i] -= 0.003;
                if (radii[i] < innerRadius * 0.5) {
                    // 到达中心后重置到外层
                    radii[i] = outerRadius * (0.5 + Math.random() * 0.5);
                    angles[i] = Math.random() * Math.PI * 2;
                }
            }

            // 引力弯曲、拉伸效果
            const stretchFactor = 1 + (1 / radii[i]) * 0.1;
            const spiralTightness = 0.02 / radii[i];

            // 计算螺旋位置
            const spiralAngle = angles[i] + (outerRadius - radii[i]) * spiralTightness;

            positions[i * 3] = radii[i] * Math.cos(spiralAngle) * stretchFactor;
            positions[i * 3 + 2] = radii[i] * Math.sin(spiralAngle) * stretchFactor;

            // 轻微垂直扰动（絮状效果）
            const verticalWobble = Math.sin(time * 3 + turbulenceOffsets[i] * 2) * 0.02 * (radii[i] / outerRadius);
            positions[i * 3 + 1] += verticalWobble * 0.1;

            // 动态颜色更新（内层粒子变亮）
            if (radii[i] < innerRadius * 1.5) {
                const brighten = 1 + Math.sin(time * 5 + i) * 0.3;
                colors[i * 3] = Math.min(1, colors[i * 3] * brighten);
                colors[i * 3 + 1] = Math.min(1, colors[i * 3 + 1] * brighten);
                colors[i * 3 + 2] = Math.min(1, colors[i * 3 + 2] * brighten);
            }
        }
        accretionDisk.geometry.attributes.position.needsUpdate = true;
        accretionDisk.geometry.attributes.color.needsUpdate = true;
        trailParticles.geometry.attributes.position.needsUpdate = true;
        trailParticles.geometry.attributes.color.needsUpdate = true;
        trailParticles.geometry.attributes.size.needsUpdate = true;
    };

    particleSystems.push({ mesh: accretionDisk, type: 'accretionDisk', update: update });
}



// ========== 四、太空天体碎片（数量增加）==========
function createMeteorParticles() {
    const count = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0x665544, size: 0.15, transparent: true, opacity: 0.4,
        sizeAttenuation: true, map: circleTexture, alphaTest: 0.01, depthWrite: false
    });
    const meteors = new THREE.Points(geometry, material);
    scene.add(meteors);

    const update = (time) => {
        const positions = meteors.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            positions[i * 3] += Math.sin(time * 0.08 + i) * 0.0015;
            positions[i * 3 + 1] += Math.cos(time * 0.06 + i) * 0.0015;
        }
        meteors.geometry.attributes.position.needsUpdate = true;
    };
    particleSystems.push({ mesh: meteors, type: 'meteor', update: update });
}

function createIceCrystalParticles() {
    const count = 800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const radius = 20 + Math.random() * 50;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
        const brightness = 0.7 + Math.random() * 0.3;
        colors[i * 3] = brightness * 0.7;
        colors[i * 3 + 1] = brightness * 0.85;
        colors[i * 3 + 2] = brightness;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
        size: 0.02, vertexColors: true, transparent: true, opacity: 1.0,
        sizeAttenuation: true, blending: THREE.AdditiveBlending,
        map: circleTexture, alphaTest: 0.01, depthWrite: false
    });
    const iceCrystals = new THREE.Points(geometry, material);
    scene.add(iceCrystals);
    particleSystems.push({ mesh: iceCrystals, type: 'iceCrystal', update: null });
}

function createSpaceDebrisParticles() {
    const count = 150;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0x888899, size: 0.18, transparent: true, opacity: 0.35,
        sizeAttenuation: true, map: circleTexture, alphaTest: 0.01, depthWrite: false
    });
    const debris = new THREE.Points(geometry, material);
    scene.add(debris);

    const update = (time) => {
        const positions = debris.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            positions[i * 3] += Math.sin(time * 0.04 + i * 0.5) * 0.002;
            positions[i * 3 + 1] += Math.cos(time * 0.025 + i * 0.3) * 0.0015;
        }
        debris.geometry.attributes.position.needsUpdate = true;
    };
    particleSystems.push({ mesh: debris, type: 'debris', update: update });
}

// ========== 五、动态氛围粒子（数量增加）==========
function createDriftParticles() {
    const count = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const driftDirections = [];
    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        driftDirections.push({ x: (Math.random() - 0.5) * 0.002, y: (Math.random() - 0.5) * 0.002, z: (Math.random() - 0.5) * 0.002 });
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0x444455, size: 0.04, transparent: true, opacity: 0.15,
        sizeAttenuation: true, map: circleTexture, alphaTest: 0.01, depthWrite: false
    });
    const drift = new THREE.Points(geometry, material);
    scene.add(drift);

    const update = (time) => {
        const positions = drift.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            positions[i * 3] += driftDirections[i].x;
            positions[i * 3 + 1] += driftDirections[i].y;
            positions[i * 3 + 2] += driftDirections[i].z;
            if (Math.abs(positions[i * 3]) > 50) driftDirections[i].x *= -1;
            if (Math.abs(positions[i * 3 + 1]) > 50) driftDirections[i].y *= -1;
            if (Math.abs(positions[i * 3 + 2]) > 50) driftDirections[i].z *= -1;
        }
        drift.geometry.attributes.position.needsUpdate = true;
    };
    particleSystems.push({ mesh: drift, type: 'drift', update: update });
}

function createTurbulenceParticles() {
    const count = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const basePositions = [];
    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 50;
        const y = (Math.random() - 0.5) * 50;
        const z = (Math.random() - 0.5) * 50;
        positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
        basePositions.push({ x, y, z });
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0x333344, size: 0.08, transparent: true, opacity: 0.12,
        sizeAttenuation: true, map: circleTexture, alphaTest: 0.01, depthWrite: false
    });
    const turbulence = new THREE.Points(geometry, material);
    scene.add(turbulence);

    const update = (time) => {
        const positions = turbulence.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            const noise = 0.4;
            positions[i * 3] = basePositions[i].x + Math.sin(time * 0.15 + i * 0.7) * noise;
            positions[i * 3 + 1] = basePositions[i].y + Math.cos(time * 0.12 + i * 0.5) * noise;
            positions[i * 3 + 2] = basePositions[i].z + Math.sin(time * 0.08 + i * 0.3) * noise;
        }
        turbulence.geometry.attributes.position.needsUpdate = true;
    };
    particleSystems.push({ mesh: turbulence, type: 'turbulence', update: update });
}

function createDeepFogParticles() {
    const count = 300;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
        const radius = 50 + Math.random() * 80;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
        sizes[i] = 2 + Math.random() * 5;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    const material = new THREE.PointsMaterial({
        color: 0x4455aa, size: 0.8, transparent: true, opacity: 0.15,
        sizeAttenuation: true, blending: THREE.AdditiveBlending,
        map: softGlowTexture, alphaTest: 0.001, depthWrite: false
    });
    const deepFog = new THREE.Points(geometry, material);
    scene.add(deepFog);
    particleSystems.push({ mesh: deepFog, type: 'deepFog', update: null });
}

// ========== 加载模型 ==========
function loadModel() {
    const loader = new GLTFLoader();
    const modelPath = './asset/black_holesinister_titan_clockman.glb';
    loader.load(modelPath, function (gltf) {
        blackHoleModel = gltf.scene;
        if (gltf.animations && gltf.animations.length > 0) {
            console.log('模型包含 ' + gltf.animations.length + ' 个动画，已禁用自动播放');
        }
        blackHoleModel.traverse(function (child) {
            if (child.isMesh) {
                child.material.transparent = true;
                child.material.opacity = 0.95;
                if (child.material.emissive) child.material.emissiveIntensity = 0.8;
                child.material.roughness = 0.3;
                child.material.metalness = 0.7;
            }
        });
        fitModelToView(blackHoleModel);
        scene.add(blackHoleModel);
        document.getElementById('loading').style.opacity = '0';
        console.log('黑洞模型加载完成');
    }, function (xhr) {
        console.log('模型加载进度：' + (xhr.loaded / xhr.total * 100).toFixed(0) + '%');
    }, function (error) {
        console.error('模型加载失败：', error);
        document.getElementById('loading').textContent = '模型加载失败，请检查路径';
    });
}

function fitModelToView(model) {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 3;
    const scale = targetSize / maxDim;
    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));
    console.log('模型尺寸：', size);
    console.log('自动缩放比例：', scale);
}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
}

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    controls.update();
    if (blackHoleModel) blackHoleModel.rotation.y -= 0.01;
    particleSystems.forEach(system => { if (system.update) system.update(time); });
    composer.render();
}

init();
animate();
