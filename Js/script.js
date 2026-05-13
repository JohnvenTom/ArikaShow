// ============================================
// 星空背景粒子系统 - 3D球体分布，固定在空间中，随相机视角旋转
// ============================================
class StarField {
    constructor() {
        this.canvas = document.getElementById('starfield');
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.mouseX = 0;
        this.mouseY = 0;
        // 相机视角旋转角度
        this.cameraRotationY = 0;
        this.cameraRotationX = 0;
        // 目标旋转角度（用于缓动）
        this.targetRotationY = 0;
        this.targetRotationX = 0;
        // 是否可见
        this.isVisible = true;
        // 动画帧ID
        this.animationId = null;
        this.init();
    }
    
    init() {
        this.resize();
        this.createStars();
        this.bindEvents();
        this.animate();
    }
    
    /**
     * 设置可见性状态
     * @param {boolean} visible - 是否可见
     */
    setVisible(visible) {
        if (this.isVisible === visible) return;
        this.isVisible = visible;
        if (visible && !this.animationId) {
            this.animate();
        }
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createStars() {
        // 创建3D球体分布的星星 - 带有移动速度和拖尾
        const count = 600;
        this.stars = [];

        for (let i = 0; i < count; i++) {
            // 球坐标随机分布
            const phi = Math.acos(-1 + (2 * i) / count);
            const theta = Math.sqrt(count * Math.PI) * phi;

            // 半径随机分布在球面上
            const radius = 800 + Math.random() * 600;

            const x = radius * Math.cos(theta) * Math.sin(phi);
            const y = radius * Math.cos(phi);
            const z = radius * Math.sin(theta) * Math.sin(phi);

            // 随机移动速度
            const speedX = (Math.random() - 0.5) * 0.3;
            const speedY = (Math.random() - 0.5) * 0.3;
            const speedZ = (Math.random() - 0.5) * 0.3;

            this.stars.push({
                x: x,
                y: y,
                z: z,
                // 星星在宇宙空间中的位置
                worldX: x,
                worldY: y,
                worldZ: z,
                // 移动速度
                speedX: speedX,
                speedY: speedY,
                speedZ: speedZ,
                // 拖尾历史位置
                trail: [],
                trailDecay: Math.random() * 0.02 + 0.01, // 随机消失速度
                size: Math.random() * 1.5 + 0.5,
                brightness: Math.random() * 0.5 + 0.5
            });
        }
    }
    
    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
        });
        // 移除鼠标移动事件，星空不随鼠标移动
    }
    
    // 设置相机目标旋转角度（由ModelViewer调用）
    setCameraRotation(rotX, rotY) {
        this.targetRotationX = rotX;
        this.targetRotationY = rotY;
    }
    
    animate() {
        // 缓动效果 - 更明显的平滑过渡
        const lerpFactor = 0.045;
        this.cameraRotationX += (this.targetRotationX - this.cameraRotationX) * lerpFactor;
        this.cameraRotationY += (this.targetRotationY - this.cameraRotationY) * lerpFactor;

        // 使用半透明清除，产生拖尾效果
        this.ctx.fillStyle = 'rgba(5, 5, 8, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const fov = 600;

        // 预计算旋转参数
        const cosY = Math.cos(-this.cameraRotationY);
        const sinY = Math.sin(-this.cameraRotationY);
        const cosX = Math.cos(-this.cameraRotationX);
        const sinX = Math.sin(-this.cameraRotationX);

        // 更新星星位置并绘制拖尾
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];

            // 移动星星
            star.worldX += star.speedX;
            star.worldY += star.speedY;
            star.worldZ += star.speedZ;

            // 边界检查 - 如果移动太远，重置位置
            const dist = Math.sqrt(star.worldX ** 2 + star.worldY ** 2 + star.worldZ ** 2);
            if (dist > 2000 || dist < 600) {
                star.speedX *= -1;
                star.speedY *= -1;
                star.speedZ *= -1;
            }

            // 计算当前位置
            let x = star.worldX * cosY - star.worldZ * sinY;
            let z = star.worldX * sinY + star.worldZ * cosY;
            let y = star.worldY;
            let y2 = y * cosX - z * sinX;
            let z2 = y * sinX + z * cosX;

            const scale = fov / (fov + z2 + 800);
            const x2d = centerX + x * scale;
            const y2d = centerY + y2 * scale;

            // 保存当前位置到拖尾，带随机消失
            if (x2d > 0 && x2d < this.canvas.width && y2d > 0 && y2d < this.canvas.height && z2 > -400) {
                star.trail.unshift({ x: x2d, y: y2d, scale: scale, life: 1.0 });
            }

            // 更新拖尾生命值并移除死亡的点
            for (let j = star.trail.length - 1; j >= 0; j--) {
                star.trail[j].life -= star.trailDecay;
                if (star.trail[j].life <= 0) {
                    star.trail.splice(j, 1);
                }
            }

            // 绘制拖尾 - 根据生命值调整透明度
            if (star.trail.length > 1) {
                for (let j = 0; j < star.trail.length - 1; j++) {
                    const point = star.trail[j];
                    const nextPoint = star.trail[j + 1];
                    // 根据生命值计算透明度
                    const alpha = point.life * star.brightness * 0.5;

                    this.ctx.beginPath();
                    this.ctx.moveTo(point.x, point.y);
                    this.ctx.lineTo(nextPoint.x, nextPoint.y);
                    this.ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
                    this.ctx.lineWidth = star.size * point.scale * 0.5 * point.life;
                    this.ctx.lineCap = 'round';
                    this.ctx.stroke();
                }
            }

            // 绘制星星核心
            if (x2d > 0 && x2d < this.canvas.width && y2d > 0 && y2d < this.canvas.height && z2 > -400) {
                const size = star.size * scale;

                // 光晕
                this.ctx.beginPath();
                this.ctx.arc(x2d, y2d, size * 3, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(0, 212, 255, ${star.brightness * 0.2})`;
                this.ctx.fill();

                // 核心
                this.ctx.beginPath();
                this.ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
                this.ctx.fill();
            }
        }

        // 如果不可见，停止动画循环
        if (!this.isVisible) {
            this.animationId = null;
            return;
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// ============================================
// 内容区域背景粒子系统 - 2D浮动粒子，带连线效果
// ============================================
class ContentParticles {
    constructor() {
        this.canvas = document.getElementById('content-particles');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.isVisible = false;
        this.animationId = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.bindEvents();
    }

    resize() {
        // 获取内容区域的实际高度
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.offsetWidth;
            this.canvas.height = container.offsetHeight;
        } else {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    createParticles() {
        const count = Math.min(Math.floor(this.canvas.width * this.canvas.height / 15000), 80);
        this.particles = [];

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.5 + 0.2,
                pulseSpeed: Math.random() * 0.02 + 0.01,
                pulsePhase: Math.random() * Math.PI * 2,
                // 闪烁效果参数
                flickerSpeed: Math.random() * 0.1 + 0.05,
                flickerPhase: Math.random() * Math.PI * 2,
                baseOpacity: Math.random() * 0.5 + 0.2,
                // 抖动效果参数
                jitterAmount: Math.random() * 0.3 + 0.1,
                jitterSpeed: Math.random() * 0.1 + 0.05,
                jitterPhase: Math.random() * Math.PI * 2
            });
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());

        window.addEventListener('mousemove', (e) => {
            // 获取canvas的实际显示尺寸
            const rect = this.canvas.getBoundingClientRect();
            // 计算缩放比例
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            // 将鼠标坐标转换为canvas坐标
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
        });
    }

    setVisible(visible) {
        if (this.isVisible === visible) return;
        this.isVisible = visible;

        if (visible) {
            this.canvas.classList.add('visible');
            // 显示时重新调整尺寸，确保与内容区域匹配
            this.resize();
            if (!this.animationId) {
                this.animate();
            }
        } else {
            this.canvas.classList.remove('visible');
        }
    }

    animate() {
        if (!this.isVisible) {
            this.animationId = null;
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 更新和绘制粒子
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            // 更新位置
            p.x += p.vx;
            p.y += p.vy;

            // 边界反弹
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            // 脉冲效果
            p.pulsePhase += p.pulseSpeed;
            const pulseOpacity = p.opacity * (0.7 + 0.3 * Math.sin(p.pulsePhase));

            // 闪烁效果 - 随机亮度变化
            p.flickerPhase += p.flickerSpeed;
            const flicker = Math.sin(p.flickerPhase) * 0.5 + 0.5; // 0-1之间波动
            const flickerOpacity = pulseOpacity * (0.5 + flicker * 0.8); // 亮度在50%-130%之间闪烁

            // 抖动效果 - 随机位置偏移
            p.jitterPhase += p.jitterSpeed;
            const jitterX = Math.sin(p.jitterPhase * 3.7) * p.jitterAmount;
            const jitterY = Math.cos(p.jitterPhase * 2.3) * p.jitterAmount;

            const drawX = p.x + jitterX;
            const drawY = p.y + jitterY;

            // 绘制外层辉光
            const outerGlow = this.ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, p.size * 4);
            outerGlow.addColorStop(0, `rgba(0, 212, 255, ${flickerOpacity * 0.4})`);
            outerGlow.addColorStop(0.5, `rgba(0, 212, 255, ${flickerOpacity * 0.1})`);
            outerGlow.addColorStop(1, 'rgba(0, 212, 255, 0)');
            this.ctx.beginPath();
            this.ctx.arc(drawX, drawY, p.size * 4, 0, Math.PI * 2);
            this.ctx.fillStyle = outerGlow;
            this.ctx.fill();

            // 绘制中层辉光
            const innerGlow = this.ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, p.size * 2);
            innerGlow.addColorStop(0, `rgba(0, 212, 255, ${flickerOpacity * 0.8})`);
            innerGlow.addColorStop(1, 'rgba(0, 212, 255, 0)');
            this.ctx.beginPath();
            this.ctx.arc(drawX, drawY, p.size * 2, 0, Math.PI * 2);
            this.ctx.fillStyle = innerGlow;
            this.ctx.fill();

            // 绘制核心粒子
            this.ctx.beginPath();
            this.ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(200, 240, 255, ${flickerOpacity})`;
            this.ctx.fill();
        }

        // 绘制连线
        this.drawConnections();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawConnections() {
        const maxDistance = 120;
        const maxConnections = 3;
        const mouseConnectDistance = 150; // 鼠标连线距离

        for (let i = 0; i < this.particles.length; i++) {
            let connections = 0;

            // 粒子之间的连线
            for (let j = i + 1; j < this.particles.length; j++) {
                if (connections >= maxConnections) break;

                const p1 = this.particles[i];
                const p2 = this.particles[j];

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    const opacity = (1 - distance / maxDistance) * 0.3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                    connections++;
                }
            }

            // 鼠标与粒子的连线
            const p = this.particles[i];
            const dx = p.x - this.mouseX;
            const dy = p.y - this.mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < mouseConnectDistance) {
                const opacity = (1 - distance / mouseConnectDistance) * 0.6;
                this.ctx.beginPath();
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(this.mouseX, this.mouseY);
                this.ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();

                // 鼠标靠近时粒子变大
                const scale = 1 + (1 - distance / mouseConnectDistance) * 0.5;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size * scale, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(0, 212, 255, ${p.opacity})`;
                this.ctx.fill();
            }
        }
    }
}

// ============================================
// 全局缓动工具类 - 提供平滑插值功能
// ============================================
class SmoothLerp {
    constructor(factor = 0.035) {
        this.factor = factor;
        this.values = new Map();
    }

    /**
     * 设置目标值
     * @param {string} key - 唯一标识符
     * @param {number} target - 目标值
     * @param {number} [current] - 当前值（首次设置时使用）
     */
    setTarget(key, target, current = null) {
        if (!this.values.has(key)) {
            this.values.set(key, {
                current: current !== null ? current : target,
                target: target
            });
        } else {
            this.values.get(key).target = target;
        }
    }

    /**
     * 获取当前缓动值
     * @param {string} key - 唯一标识符
     * @returns {number|null} 当前值
     */
    getCurrent(key) {
        const value = this.values.get(key);
        return value ? value.current : null;
    }

    /**
     * 更新所有值的缓动
     */
    update() {
        this.values.forEach((value) => {
            value.current += (value.target - value.current) * this.factor;
        });
    }

    /**
     * 检查是否接近目标值
     * @param {string} key - 唯一标识符
     * @param {number} threshold - 阈值
     * @returns {boolean}
     */
    isCloseToTarget(key, threshold = 0.001) {
        const value = this.values.get(key);
        if (!value) return true;
        return Math.abs(value.target - value.current) < threshold;
    }

    /**
     * 重置所有值
     */
    reset() {
        this.values.clear();
    }
}

// ============================================
// Three.js GLB模型加载和相机控制
// ============================================
class ModelViewer {
    constructor(starField, contentParticles, scrollController) {
        this.canvas = document.getElementById('model-canvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.model = null;
        this.controls = null;
        this.isVisible = true;
        this.scrollProgress = 0;
        // 相机初始更近，结束更近（优化：拉近镜头）
        this.initialCameraPosition = { x: 0, y: 0, z: 1.0 };
        this.targetCameraPosition = { x: 2, y: 1.5, z: 0.8 };
        this.starField = starField;
        this.contentParticles = contentParticles;
        this.scrollController = scrollController;
        // 使用全局缓动工具
        this.lerp = new SmoothLerp(0.035);
        // 初始化缓动值
        this.lerp.setTarget('cameraAngle', 0, 0);
        this.lerp.setTarget('cameraRadius', 1.8, 1.8);
        this.lerp.setTarget('cameraHeight', 0, 0);
        // 目标相机角度
        this.targetCameraAngle = 0;
        this.targetCameraRadius = 1.8;
        this.targetCameraHeight = 0;
        // 动画帧ID
        this.animationId = null;
        this.minAspect = 16 / 10;
        // 滚轮缓冲相关属性
        this.wheelBuffer = {
            targetProgress: 0,      // 目标滚动进度
            currentProgress: 0,     // 当前缓动进度
            velocity: 0,            // 滚动速度
            isScrolling: false,     // 是否正在滚动
            lastWheelTime: 0,       // 上次滚轮时间
            wheelAccumulator: 0,    // 滚轮累积值
            bufferFactor: 0.1,     // 缓冲系数（原0.08，越小越平滑，响应越慢）
            velocityDecay: 0.92,    // 速度衰减系数（原0.85，越大惯性越长）
            minVelocity: 0.0005     // 最小速度阈值（原0.001，越小停止越晚）
        };
        this.init();
    }

    /**
     * 计算渲染尺寸和偏移量
     * 窄屏时保持宽屏比例渲染，通过CSS裁剪两侧而非缩放模型
     * @param {number} windowWidth - 窗口宽度
     * @param {number} windowHeight - 窗口高度
     * @returns {{ renderWidth: number, renderHeight: number, offsetX: number, offsetY: number, cameraAspect: number }}
     */
    calcRenderSize(windowWidth, windowHeight) {
        const windowAspect = windowWidth / windowHeight;

        if (windowAspect >= this.minAspect) {
            return {
                renderWidth: windowWidth,
                renderHeight: windowHeight,
                offsetX: 0,
                offsetY: 0,
                cameraAspect: windowAspect
            };
        }

        const cameraAspect = this.minAspect;
        const renderWidth = Math.ceil(windowHeight * cameraAspect);
        const renderHeight = windowHeight;
        const offsetX = Math.ceil((renderWidth - windowWidth) / 2);

        return { renderWidth, renderHeight, offsetX, offsetY: 0, cameraAspect };
    }

    init() {
        this.scene = new THREE.Scene();

        const { renderWidth, renderHeight, offsetX, offsetY, cameraAspect } = this.calcRenderSize(window.innerWidth, window.innerHeight);

        this.camera = new THREE.PerspectiveCamera(
            75,
            cameraAspect,
            0.1,
            1000
        );
        this.camera.position.set(
            this.initialCameraPosition.x,
            this.initialCameraPosition.y,
            this.initialCameraPosition.z
        );
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: false,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(renderWidth, renderHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.toneMapping = THREE.LinearToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.applyCanvasClip(offsetX, offsetY);
        
        this.setupLights();
        
        this.bindEvents();

        /**
         * 延迟初始化3D渲染：等待浏览器恢复滚动位置后再判断
         * 使用 requestAnimationFrame 确保在浏览器完成滚动位置恢复后才检查
         * 非hero区域：后台预加载模型（不阻塞页面），但不启动渲染循环
         * hero区域：正常加载模型并启动渲染循环
         */
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const contentSection = document.querySelector('.content-section');
                const contentTop = contentSection ? contentSection.offsetTop : window.innerHeight * 1.7;
                const currentScrollY = window.scrollY;

                this.loadModel();

                if (currentScrollY > contentTop - 10) {
                    this.isVisible = false;
                    this.canvas.classList.add('hidden');
                    if (this.starField) {
                        this.starField.setVisible(false);
                    }
                    const starfield = document.getElementById('starfield');
                    if (starfield) {
                        starfield.style.opacity = '0';
                    }
                    if (this.contentParticles) {
                        this.contentParticles.setVisible(true);
                    }
                } else {
                    this.animate();
                }
            });
        });
    }
    
    /**
     * 应用canvas裁剪偏移
     * 窄屏时canvas渲染尺寸大于窗口，通过负margin居中裁剪两侧
     * @param {number} offsetX - 水平偏移量（像素）
     * @param {number} offsetY - 垂直偏移量（像素）
     */
    applyCanvasClip(offsetX, offsetY) {
        this.canvas.style.marginLeft = `-${offsetX}px`;
        this.canvas.style.marginTop = `-${offsetY}px`;
    }
    
    setupLights() {
        // 环境光 - 降低强度
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
        this.scene.add(ambientLight);
        
        // 主光源
        const directionalLight = new THREE.DirectionalLight(0x00d4ff, 1.5);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);
        
        // 补光
        const fillLight = new THREE.DirectionalLight(0x00fff2, 0.8);
        fillLight.position.set(-5, 0, 5);
        this.scene.add(fillLight);
        
        // 轮廓光
        const rimLight = new THREE.DirectionalLight(0xffffff, 1);
        rimLight.position.set(0, 5, -5);
        this.scene.add(rimLight);
    }
    
    loadModel() {
        const loader = new THREE.GLTFLoader();
        loader.load(
            'asset/a_windy_day_safe.glb',
            (gltf) => {
                this.model = gltf.scene;

                const box = new THREE.Box3().setFromObject(this.model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());

                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2 / maxDim;
                this.model.scale.setScalar(scale);

                this.model.position.sub(center.multiplyScalar(scale));

                this.scene.add(this.model);
                
                this.setupAnimation(gltf);

                isModelLoaded = true;
                checkAllLoaded();
            },
            (progress) => {
                // 如果是模拟加载模式，忽略真实加载进度
                if (useSimulatedLoading) {
                    return;
                }
                
                // 计算实际加载进度，但限制最大显示进度为99%（直到1.5秒后才显示100%）
                const actualPercent = Math.floor((progress.loaded / progress.total) * 100);
                const elapsedTime = Date.now() - loadingStartTime;
                
                // 如果还没满1.5秒，限制显示进度
                let displayPercent = actualPercent;
                if (elapsedTime < MIN_LOADING_TIME && actualPercent >= 100) {
                    displayPercent = 99;
                }
                
                console.log('加载进度:', actualPercent + '%');
                // 更新加载页面进度
                updateLoaderProgress(displayPercent);
            },
            (error) => {
                console.error('模型加载失败:', error);
                this.createFallbackModel();
                isModelLoaded = true;
                checkAllLoaded();
            }
        );
    }
    
    /**
     * 设置模型动画（滚动驱动模式）
     * 动画进度跟随页面滚动位置，而非自动播放
     * @param {Object} gltf - GLTF加载结果对象
     */
    setupAnimation(gltf) {
        // 检查是否包含动画
        if (gltf.animations && gltf.animations.length > 0) {
            console.log(`✅ 发现 ${gltf.animations.length} 个动画（滚动驱动模式）:`,
                gltf.animations.map(anim => `${anim.name} (${anim.duration.toFixed(2)}s)`).join(', '));

            // 创建动画混合器
            this.mixer = new THREE.AnimationMixer(this.model);

            // 存储所有动画剪辑和动作
            this.animations = gltf.animations;
            this.animationActions = [];

            // 初始化所有动画动作（不自动播放）
            gltf.animations.forEach((clip, index) => {
                const action = this.mixer.clipAction(clip);
                action.setLoop(THREE.LoopOnce); // 单次播放模式
                action.clampWhenFinished = true; // 停留在最后一帧
                action.paused = true; // 初始暂停
                action.time = 0; // 从第0帧开始
                this.animationActions.push(action);
                console.log(`📌 动画 ${index + 1}: ${clip.name} (${clip.duration.toFixed(2)}秒) - 就绪`);
            });

            // 记录动画总时长（用于映射滚动进度）
            this.animationDuration = Math.max(...gltf.animations.map(a => a.duration));

            console.log(`🎬 动画系统初始化完成 | 总时长: ${this.animationDuration.toFixed(2)}秒 | 模式: 滚动驱动`);
            console.log('💡 提示: 向下滚动页面以播放动画');
        } else {
            console.log('ℹ️ 模型不包含动画数据');
        }
    }
    
    /**
     * 根据滚动进度更新模型动画时间轴
     * 动画在滚动到指定比例时完成（可配置提前完成）
     * @param {number} scrollProgress - 当前滚动进度，范围 0-1
     */
    updateAnimationByScroll(scrollProgress) {
        // 如果没有动画或动画动作，直接返回
        if (!this.mixer || !this.animationActions || this.animationActions.length === 0) {
            return;
        }

        // 配置：动画在滚动到此比例时完成（原0.7，提高到0.95让动画播放更长）
        const animationEndThreshold = 0.95;

        // 将滚动进度限制在 0-1 范围内
        const clampedProgress = Math.max(0, Math.min(1, scrollProgress));

        // 计算动画进度：将滚动进度"压缩"，使动画提前完成
        // 例如：滚动70% → 动画100%，滚动100% → 动画仍为100%
        let animationProgress;
        if (clampedProgress <= animationEndThreshold) {
            // 在阈值之前：线性映射（0 → 0, 0.7 → 1）
            animationProgress = clampedProgress / animationEndThreshold;
        } else {
            // 超过阈值后：保持100%
            animationProgress = 1;
        }

        // 计算目标动画时间
        const targetTime = animationProgress * this.animationDuration;

        // 更新所有动画动作的时间
        this.animationActions.forEach((action) => {
            // 确保动作处于播放状态（但时间由我们手动控制）
            if (!action.isRunning()) {
                action.play();
                action.paused = true; // 保持暂停状态
            }

            // 直接设置动画时间（跳转到对应帧）
            action.time = Math.min(targetTime, action.getClip().duration);
        });

        // 强制更新混合器到指定时间（不使用delta）
        this.mixer.update(0);

        // 可选：输出调试信息（每10%动画进度输出一次）
        const animProgressPercent = Math.round(animationProgress * 100);
        if (animProgressPercent % 10 === 0 && this.lastLoggedAnimProgress !== animProgressPercent) {
            this.lastLoggedAnimProgress = animProgressPercent;
            console.log(`🎞️ 动画: ${animProgressPercent}% | 滚动: ${Math.round(clampedProgress * 100)}% | 时间: ${targetTime.toFixed(2)}s`);
        }
    }

    createFallbackModel() {
        // 如果GLB加载失败，创建一个科技感几何体
        const geometry = new THREE.IcosahedronGeometry(1, 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00d4ff,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x001133,
            emissiveIntensity: 0.5,
            wireframe: true
        });
        this.model = new THREE.Mesh(geometry, material);
        this.scene.add(this.model);
        
        // 添加内部核心
        const coreGeometry = new THREE.IcosahedronGeometry(0.6, 0);
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: 0x00fff2,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0x00fff2,
            emissiveIntensity: 0.8
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        this.model.add(core);
    }
    
    bindEvents() {
        window.addEventListener('resize', () => {
            const { renderWidth, renderHeight, offsetX, offsetY, cameraAspect } = this.calcRenderSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = cameraAspect;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(renderWidth, renderHeight);
            this.applyCanvasClip(offsetX, offsetY);
        });

        // 使用平滑滚动控制器的目标滚动回调（无缓动，立即响应）
        if (this.scrollController) {
            this.scrollController.onTargetScroll((scrollY) => {
                this.handleScroll(scrollY);
            });
        } else {
            // 降级：使用原生滚动
            window.addEventListener('scroll', () => {
                this.handleScroll(window.scrollY);
            });
        }

        // 绑定滚轮缓冲事件
        this.bindWheelBuffer();

        // 鼠标移动影响
        window.addEventListener('mousemove', (e) => {
            if (!this.isVisible) return;

            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;

            // 相机轻微跟随鼠标
            this.camera.position.x += (x * 0.5 - this.camera.position.x) * 0.05;
            this.camera.position.y += (-y * 0.5 - this.camera.position.y) * 0.05;
            this.camera.lookAt(0, 0, 0);
        });
    }

    /**
     * 绑定滚轮缓冲事件
     * 实现滚轮滚动的缓冲效果，让3D动画更加平滑
     */
    bindWheelBuffer() {
        window.addEventListener('wheel', (e) => {
            if (!this.isVisible) return;
            
            const now = Date.now();
            const timeDelta = now - this.wheelBuffer.lastWheelTime;
            this.wheelBuffer.lastWheelTime = now;
            
            // 如果间隔过长，重置累积器
            if (timeDelta > 150) {
                this.wheelBuffer.wheelAccumulator = 0;
            }
            
            // 累积滚轮值
            this.wheelBuffer.wheelAccumulator += e.deltaY;
            this.wheelBuffer.isScrolling = true;
            
            // 计算目标进度增量（基于滚轮累积值）
            const windowHeight = window.innerHeight;
            const heroHeight = windowHeight * 2.8; // 与handleScroll保持一致，280vh
            const scrollDelta = e.deltaY / heroHeight;

            // 更新目标进度（原0.5，降低到0.25使滚动距离翻倍）
            this.wheelBuffer.targetProgress += scrollDelta * 0.25;
            this.wheelBuffer.targetProgress = Math.max(0, Math.min(1, this.wheelBuffer.targetProgress));

            // 计算滚动速度（用于惯性效果，原0.3，降低到0.15）
            this.wheelBuffer.velocity = scrollDelta * 0.15;
            
        }, { passive: true });

        // 触摸设备支持
        let touchStartY = 0;
        let touchLastY = 0;
        let touchLastTime = 0;
        
        window.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            touchLastY = touchStartY;
            touchLastTime = Date.now();
            this.wheelBuffer.isScrolling = true;
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (!this.isVisible) return;
            
            const touchY = e.touches[0].clientY;
            const now = Date.now();
            const timeDelta = now - touchLastTime;
            
            if (timeDelta > 0) {
                const deltaY = touchLastY - touchY;
                const windowHeight = window.innerHeight;
                const heroHeight = windowHeight * 2.8; // 与其他地方保持一致，280vh
                const scrollDelta = deltaY / heroHeight;

                // 更新目标进度（原0.5，降低到0.25使触摸滑动距离翻倍）
                this.wheelBuffer.targetProgress += scrollDelta * 0.25;
                this.wheelBuffer.targetProgress = Math.max(0, Math.min(1, this.wheelBuffer.targetProgress));

                // 计算速度（原直接计算，现在降低灵敏度）
                this.wheelBuffer.velocity = scrollDelta / timeDelta * 8;  // 原16，降低到8
            }
            
            touchLastY = touchY;
            touchLastTime = now;
        }, { passive: true });

        window.addEventListener('touchend', () => {
            // 触摸结束，保持惯性
            this.wheelBuffer.isScrolling = false;
        }, { passive: true });
    }

    /**
     * 更新滚轮缓冲进度
     * 使用缓动算法平滑过渡滚动进度
     */
    updateWheelBuffer() {
        const buffer = this.wheelBuffer;
        
        // 如果不在滚动状态，应用惯性
        if (!buffer.isScrolling) {
            // 惯性滚动
            buffer.targetProgress += buffer.velocity;
            buffer.targetProgress = Math.max(0, Math.min(1, buffer.targetProgress));
            
            // 速度衰减
            buffer.velocity *= buffer.velocityDecay;
            
            // 速度低于阈值时停止
            if (Math.abs(buffer.velocity) < buffer.minVelocity) {
                buffer.velocity = 0;
            }
        }
        
        // 缓动到目标进度
        const diff = buffer.targetProgress - buffer.currentProgress;
        buffer.currentProgress += diff * buffer.bufferFactor;
        
        // 当接近目标时，直接同步（避免无限接近）
        if (Math.abs(diff) < 0.0001) {
            buffer.currentProgress = buffer.targetProgress;
        }
        
        return buffer.currentProgress;
    }
    
    handleScroll(scrollY) {
        const windowHeight = window.innerHeight;
        const heroHeight = windowHeight * 2.8; // 原来是1.7（170vh），现在增加到2.8（280vh），滚动区域更长

        // 首页高度现在是280vh，滚动进度在0-280vh范围内计算
        const heroScrollProgress = Math.min(scrollY / heroHeight, 1);
        
        // 同步缓冲系统的目标进度与实际滚动位置
        // 这样当用户通过其他方式滚动（如滚动条、键盘）时，缓冲系统也能正确跟随
        this.wheelBuffer.targetProgress = heroScrollProgress;
        
        // 如果缓冲进度与实际滚动差距过大，直接同步（避免不同步问题）
        const progressDiff = Math.abs(this.wheelBuffer.currentProgress - heroScrollProgress);
        if (progressDiff > 0.1) {
            this.wheelBuffer.currentProgress = heroScrollProgress;
        }
        
        // 使用缓冲进度作为当前滚动进度
        this.scrollProgress = this.wheelBuffer.currentProgress;

        // 获取内容区域的顶部位置
        const contentSection = document.querySelector('.content-section');
        const contentTop = contentSection ? contentSection.offsetTop : heroHeight;

        // 添加渐隐缓冲区：在contentTop之前100vh开始淡出，而不是突然消失
        const fadeStartDistance = window.innerHeight * 1.0;  /* 提前100vh开始淡出 */
        const fadeStart = contentTop - fadeStartDistance;

        // 当内容区域滚动到视口顶部时，3D模型被完全遮挡，停止渲染
        // 现在有100vh的渐隐缓冲区，让过渡更平滑
        if (scrollY > contentTop - 10) {
            if (this.isVisible) {
                this.isVisible = false;
                this.canvas.classList.add('hidden');
                // 停止星空动画
                if (this.starField) {
                    this.starField.setVisible(false);
                }
                // 隐藏星空canvas
                document.getElementById('starfield').style.opacity = '0';
                document.getElementById('starfield').style.transition = 'opacity 0.8s ease';
                // 显示内容区域粒子
                if (this.contentParticles) {
                    this.contentParticles.setVisible(true);
                }
            }
        } else {
            if (!this.isVisible) {
                this.isVisible = true;
                this.canvas.classList.remove('hidden');
                document.getElementById('starfield').style.opacity = '1';
                if (this.starField) {
                    this.starField.setVisible(true);
                }
                if (!this.animationId) {
                    this.animate();
                }
                if (this.contentParticles) {
                    this.contentParticles.setVisible(false);
                }
            }

            // 在渐隐缓冲区内，根据滚动位置调整透明度
            if (scrollY > fadeStart && scrollY <= contentTop) {
                const fadeProgress = (scrollY - fadeStart) / fadeStartDistance;
                const opacity = 1 - fadeProgress;
                this.canvas.style.opacity = Math.max(0, opacity);

                // 同步调整星空透明度
                const starfield = document.getElementById('starfield');
                if (starfield) {
                    starfield.style.opacity = Math.max(0, opacity);
                }
            } else if (scrollY <= fadeStart) {
                // 缓冲区外，完全显示
                this.canvas.style.opacity = '1';
                const starfield = document.getElementById('starfield');
                if (starfield) {
                    starfield.style.opacity = '1';
                }
            }
        }
    }
    
    animate() {
        // 如果不可见，不继续动画循环
        if (!this.isVisible) {
            this.animationId = null;
            return;
        }

        this.animationId = requestAnimationFrame(() => this.animate());

        // 更新滚轮缓冲进度
        const bufferedProgress = this.updateWheelBuffer();
        this.scrollProgress = bufferedProgress;

        // 基于缓冲进度计算相机参数（调整幅度让过渡更平缓）
        this.targetCameraAngle = bufferedProgress * Math.PI * 0.6; // 原来是0.8（144度），现在是0.6（108度），旋转幅度减小
        this.targetCameraRadius = 1.8 - bufferedProgress * 0.7; // 原来是1.0，现在是0.7，从1.8到1.1，距离变化减小
        this.targetCameraHeight = bufferedProgress * 1.0; // 原来是1.5，现在是1.0，高度变化减小

        // 更新缓动目标值
        this.lerp.setTarget('cameraAngle', this.targetCameraAngle);
        this.lerp.setTarget('cameraRadius', this.targetCameraRadius);
        this.lerp.setTarget('cameraHeight', this.targetCameraHeight);

        // 使用全局缓动工具更新相机参数
        this.lerp.update();

        // 获取缓动后的值
        const currentAngle = this.lerp.getCurrent('cameraAngle');
        const currentRadius = this.lerp.getCurrent('cameraRadius');
        const currentHeight = this.lerp.getCurrent('cameraHeight');

        // 更新相机位置
        if (this.camera) {
            this.camera.position.x = Math.sin(currentAngle) * currentRadius;
            this.camera.position.z = Math.cos(currentAngle) * currentRadius;
            this.camera.position.y = currentHeight;
            this.camera.lookAt(0, 0, 0);
        }

        // 根据缓冲进度驱动模型动画
        this.updateAnimationByScroll(bufferedProgress);

        // 同步更新星空视角
        if (this.starField) {
            this.starField.setCameraRotation(this.targetCameraHeight * 0.3, this.targetCameraAngle);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// ============================================
// 滚动显示动画
// ============================================
class ScrollReveal {
    constructor() {
        this.elements = document.querySelectorAll('.reveal');
        this.init();
    }
    
    init() {
        this.checkReveal();
        window.addEventListener('scroll', () => this.checkReveal());
    }
    
    checkReveal() {
        this.elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            if (rect.top < windowHeight * 0.85) {
                el.classList.add('active');
            }
        });
    }
}

// ============================================
// 技能条动画
// ============================================
class SkillAnimation {
    constructor() {
        this.skillBars = document.querySelectorAll('.skill-fill');
        this.animated = false;
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => this.checkAnimate());
    }

    checkAnimate() {
        if (this.animated) return;

        const skillsSection = document.getElementById('skills');
        const rect = skillsSection.getBoundingClientRect();

        if (rect.top < window.innerHeight * 0.5) {
            this.animated = true;
            this.skillBars.forEach((bar, index) => {
                setTimeout(() => {
                    const width = bar.getAttribute('data-width');
                    bar.style.width = width + '%';
                }, index * 100);
            });
        }
    }
}

// ============================================
// 物理文字系统 - Matter.js实现可拖拽物理文字
// ============================================
class PhysicsTextSystem {
    constructor() {
        this.container = document.getElementById('physics-container');
        this.canvas = document.getElementById('physics-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Matter.js模块
        this.Engine = Matter.Engine;
        this.Render = Matter.Render;
        this.Runner = Matter.Runner;
        this.Bodies = Matter.Bodies;
        this.Composite = Matter.Composite;
        this.Events = Matter.Events;
        this.Mouse = Matter.Mouse;
        this.MouseConstraint = Matter.MouseConstraint;
        this.Vector = Matter.Vector;

        // 技能文字列表
        this.skills = [
            { text: 'Vue.js', color: '#00d4ff', size: 32 },
            { text: 'CSS', color: '#00d4ff', size: 28 },
            { text: 'Javascript', color: '#ffffff', size: 30 },
            { text: 'Typescript', color: '#ffffff', size: 28 },
            { text: 'Python', color: '#00d4ff', size: 32 },
            { text: 'HTML', color: '#00d4ff', size: 28 },
            { text: 'C++', color: '#ffffff', size: 26 },
            { text: 'C#', color: '#00d4ff', size: 26 },
            { text: 'Java', color: '#00d4ff', size: 28 },
            { text: 'Flutter', color: '#ffffff', size: 26 },
            { text: 'Go', color: '#00d4ff', size: 28 },
            { text: 'Photoshop', color: '#ffffff', size: 26 },
            { text: 'Kotlin', color: '#ffffff', size: 26 },
            { text: 'Git', color: '#00d4ff', size: 24 },
            { text: 'TailwindCSS', color: '#00d4ff', size: 26 },
            { text: 'Vite', color: '#ffffff', size: 24 },
            { text: 'React', color: '#00d4ff', size: 28 },
            { text: 'Unity', color: '#ffffff', size: 26 },
            { text: 'Three.js', color: '#00d4ff', size: 28 },
            { text: 'Matter.js', color: '#00d4ff', size: 26 },
            { text: 'Blender', color: '#00d4ff', size: 28 },
            { text: 'Node.js', color: '#00d4ff', size: 28 },
            { text: 'NPM', color: '#00d4ff', size: 26 },
            { text: 'MySQL', color: '#ffffff', size: 26 },
            { text: 'PostgreSQL', color: '#ffffff', size: 24 },
            { text: 'Redis', color: '#00d4ff', size: 26 },
            { text: 'Nginx', color: '#00d4ff', size: 26 },
            { text: 'Docker', color: '#00d4ff', size: 28 },
            { text: 'Linux', color: '#ffffff', size: 26 }
        ];

        this.bodies = [];
        this.engine = null;
        this.runner = null;
        this.isInitialized = false;

        this.init();
    }

    init() {
        if (!this.container || !this.canvas) {
            console.log('Physics container or canvas not found');
            return;
        }

        // 立即设置canvas尺寸
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        console.log('Physics canvas size:', this.canvas.width, this.canvas.height);

        // 创建物理引擎
        this.engine = this.Engine.create();
        this.engine.world.gravity.y = 0.5; // 轻微重力

        this.isInitialized = true;

        // 创建边界
        this.createBoundaries();

        // 创建文字物体
        this.createTextBodies();

        // 添加鼠标控制
        this.addMouseControl();

        // 开始渲染循环
        this.startRenderLoop();

        // 监听窗口大小变化
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        // 如果已经初始化，更新边界
        if (this.isInitialized) {
            this.updateBoundaries();
        }
    }

    createBoundaries() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const wallThickness = 60;

        console.log('Creating boundaries for size:', width, height);

        // 地面 - 在底部
        this.ground = this.Bodies.rectangle(width / 2, height + wallThickness / 2 - 10, width, wallThickness, {
            isStatic: true,
            render: { visible: false }
        });

        // 左墙
        this.leftWall = this.Bodies.rectangle(-wallThickness / 2 + 10, height / 2, wallThickness, height * 2, {
            isStatic: true,
            render: { visible: false }
        });

        // 右墙
        this.rightWall = this.Bodies.rectangle(width + wallThickness / 2 - 10, height / 2, wallThickness, height * 2, {
            isStatic: true,
            render: { visible: false }
        });

        // 顶部 - 添加顶盖防止文字出去
        this.ceiling = this.Bodies.rectangle(width / 2, -wallThickness / 2 + 20, width, wallThickness, {
            isStatic: true,
            render: { visible: false }
        });

        this.Composite.add(this.engine.world, [this.ground, this.leftWall, this.rightWall, this.ceiling]);
    }

    updateBoundaries() {
        // 移除旧边界
        this.Composite.remove(this.engine.world, [this.ground, this.leftWall, this.rightWall, this.ceiling]);
        // 创建新边界
        this.createBoundaries();
    }

    createTextBodies() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        console.log('Creating text bodies, canvas size:', width, height);

        this.skills.forEach((skill, index) => {
            // 计算文字尺寸
            this.ctx.font = `${skill.size}px "JetBrains Mono", monospace`;
            const metrics = this.ctx.measureText(skill.text);
            const textWidth = metrics.width;
            const textHeight = skill.size;

            // 随机位置（在容器内部上方区域）
            const x = Math.random() * (width - textWidth - 40) + textWidth / 2 + 20;
            const y = Math.random() * (height * 0.3) + 50; // 从容器上方30%区域开始

            console.log(`Creating body for ${skill.text} at (${x}, ${y})`);

            // 创建矩形物体（用于物理碰撞）
            const body = this.Bodies.rectangle(x, y, textWidth + 10, textHeight + 10, {
                restitution: 0.3, // 弹性
                friction: 0.1,
                frictionAir: 0.01,
                chamfer: { radius: 5 },
                label: skill.text,
                render: {
                    fillStyle: 'transparent'
                }
            });

            // 存储文字信息
            body.skillData = skill;
            body.textWidth = textWidth;
            body.textHeight = textHeight;

            this.bodies.push(body);
            this.Composite.add(this.engine.world, body);
        });

        console.log('Total bodies created:', this.bodies.length);
    }

    addMouseControl() {
        // 创建鼠标
        const mouse = this.Mouse.create(this.canvas);

        // 创建鼠标约束（用于拖拽）
        const mouseConstraint = this.MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });

        this.Composite.add(this.engine.world, mouseConstraint);

        // 保持鼠标与canvas同步
        mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
        mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
    }

    startRenderLoop() {
        const render = () => {
            // 更新物理引擎
            this.Engine.update(this.engine, 1000 / 60);

            // 清空画布
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // 绘制所有文字
            this.bodies.forEach(body => {
                if (body.skillData) {
                    this.drawTextBody(body);
                }
            });

            requestAnimationFrame(render);
        };

        render();
    }

    drawTextBody(body) {
        const { x, y } = body.position;
        const angle = body.angle;
        const skill = body.skillData;

        // 只在可视区域内绘制（扩大范围）
        if (y < -100 || y > this.canvas.height + 100) return;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);

        // 绘制文字
        this.ctx.font = `${skill.size}px "JetBrains Mono", monospace`;
        this.ctx.fillStyle = skill.color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // 添加发光效果
        this.ctx.shadowColor = skill.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(skill.text, 0, 0);

        // 重置阴影
        this.ctx.shadowBlur = 0;

        this.ctx.restore();
    }
}

// ============================================
// 职业标签粒子文字系统 - 打字机效果 + 悬浮交互
// ============================================
class CareerTagParticleSystem {
    constructor() {
        this.container = document.getElementById('particle-text-container');
        this.canvas = document.getElementById('particle-text-canvas');
        this.ctx = this.canvas?.getContext('2d');
        this.tags = document.querySelectorAll('.career-tag');
        this.particles = [];
        this.starTrails = [];
        this.isActive = false;
        this.hasTyped = false;

        this.init();
    }

    init() {
        if (!this.container || !this.canvas || this.tags.length === 0) return;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // 初始化标签文字为空，等待滚动触发
        this.tags.forEach(tag => {
            const textElement = tag.querySelector('.tag-text');
            textElement.textContent = '';
            tag.style.color = tag.dataset.color;
        });

        // 初始化悬浮交互
        this.initHoverEffects();

        // 开始动画循环
        this.startAnimation();

        // 设置滚动监听，进入视口时触发打字机效果
        this.setupScrollObserver();

        this.isActive = true;
    }

    /**
     * 设置滚动监听，当元素进入视口时触发打字机效果
     */
    setupScrollObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.hasTyped) {
                    this.hasTyped = true;
                    this.initTypewriter();
                    observer.disconnect();
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '0px 0px -100px 0px'
        });

        observer.observe(this.container);
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    async initTypewriter() {
        for (let i = 0; i < this.tags.length; i++) {
            const tag = this.tags[i];
            const text = tag.dataset.text;
            const textElement = tag.querySelector('.tag-text');

            // 添加打字中类
            tag.classList.add('typing');

            // 逐字显示 - 每字150ms，让用户能看清
            for (let j = 0; j < text.length; j++) {
                textElement.textContent = text.substring(0, j + 1);
                await this.delay(150);
            }

            // 移除打字中类
            tag.classList.remove('typing');

            // 打完一行后等待400ms再显示下一行
            await this.delay(400);
        }
    }

    initHoverEffects() {
        this.tags.forEach(tag => {
            tag.addEventListener('mouseenter', () => {
                tag.classList.add('active');
                this.createParticleBurst(tag);
            });

            tag.addEventListener('mouseleave', () => {
                tag.classList.remove('active');
            });
        });
    }

    createParticleBurst(element) {
        const rect = element.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        const x = rect.left - containerRect.left + rect.width / 2;
        const y = rect.top - containerRect.top + rect.height / 2;

        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                decay: 0.02,
                size: Math.random() * 3 + 1,
                color: element.dataset.color
            });
        }
    }

    createStarTrail() {
        const MAX_TRAILS = 1000; // 最大星轨数量
        // 提高生成概率
        if (Math.random() > 0.5 || this.starTrails.length >= MAX_TRAILS) return;

        this.starTrails.push({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            length: Math.random() * 15 + 8,
            life: 1,
            opacity: Math.random() * 0.4 + 0.2
        });
    }

    startAnimation() {
        // 鼠标位置
        this.mouseX = this.canvas.width / 2;
        this.mouseY = this.canvas.height / 2;

        // 监听鼠标移动
        this.container.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        const animate = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // 绘制星空背景
            this.drawStarfield();

            // 创建新的星轨
            this.createStarTrail();

            // 绘制星轨（带鼠标吸附）
            this.drawStarTrailsWithMouse();

            // 绘制粒子
            this.drawParticles();

            requestAnimationFrame(animate);
        };

        animate();
    }

    drawStarfield() {
        // 绘制背景星星
        for (let i = 0; i < 50; i++) {
            const x = (i * 137.5) % this.canvas.width;
            const y = (i * 71.3) % this.canvas.height;
            const size = (i % 3) + 1;
            const opacity = 0.1 + (i % 5) * 0.05;

            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 212, 255, ${opacity})`;
            this.ctx.fill();
        }
    }

    drawStarTrails() {
        this.starTrails = this.starTrails.filter(trail => {
            trail.x += trail.vx;
            trail.y += trail.vy;

            // 边界循环
            if (trail.x < 0) trail.x = this.canvas.width;
            if (trail.x > this.canvas.width) trail.x = 0;
            if (trail.y < 0) trail.y = this.canvas.height;
            if (trail.y > this.canvas.height) trail.y = 0;

            // 绘制星轨线条
            this.ctx.beginPath();
            this.ctx.moveTo(trail.x, trail.y);
            this.ctx.lineTo(trail.x - trail.vx * trail.length, trail.y - trail.vy * trail.length);
            this.ctx.strokeStyle = `rgba(0, 212, 255, ${trail.opacity})`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            return true;
        });
    }

    drawStarTrailsWithMouse() {
        const attractionRadius = 150; // 吸附半径
        const attractionForce = 0.02; // 吸附力度

        this.starTrails = this.starTrails.filter(trail => {
            // 计算与鼠标的距离
            const dx = this.mouseX - trail.x;
            const dy = this.mouseY - trail.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 如果在吸附范围内，向鼠标移动
            if (distance < attractionRadius && distance > 5) {
                trail.vx += (dx / distance) * attractionForce;
                trail.vy += (dy / distance) * attractionForce;
            }

            // 限制最大速度
            const maxSpeed = 2;
            const speed = Math.sqrt(trail.vx * trail.vx + trail.vy * trail.vy);
            if (speed > maxSpeed) {
                trail.vx = (trail.vx / speed) * maxSpeed;
                trail.vy = (trail.vy / speed) * maxSpeed;
            }

            trail.x += trail.vx;
            trail.y += trail.vy;

            // 边界循环
            if (trail.x < 0) trail.x = this.canvas.width;
            if (trail.x > this.canvas.width) trail.x = 0;
            if (trail.y < 0) trail.y = this.canvas.height;
            if (trail.y > this.canvas.height) trail.y = 0;

            // 绘制星轨线条
            this.ctx.beginPath();
            this.ctx.moveTo(trail.x, trail.y);
            this.ctx.lineTo(trail.x - trail.vx * trail.length, trail.y - trail.vy * trail.length);
            this.ctx.strokeStyle = `rgba(0, 212, 255, ${trail.opacity})`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            return true;
        });
    }

    drawParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;

            if (p.life <= 0) return false;

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;

            return true;
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ============================================
// 音乐播放器控制
// ============================================
let bgMusic = null;
let isMusicLoaded = false;
let musicLoadProgress = 0;
let volumeFadeInterval = null;
let currentTrackIndex = 0;
let isPlaying = false;
let userHasInteracted = false;
let pendingAutoPlay = false;

/**
 * 音乐列表配置
 * 包含所有BGM文件的路径和显示名称
 */
const musicTracks = [
    { name: 'Abstract Design', src: 'asset/BGM/comastudio-abstract-design_universe-40978.mp3' },
    { name: 'Chill Beat Vlog', src: 'asset/BGM/comastudio-chill-beat-abstract-vlog_fulfillment-84177.mp3' },
    { name: 'Deep Chilled', src: 'asset/BGM/comastudio-deep-chilled-ambience-electronica_faith-303653.mp3' },
    { name: 'Deep Fashion', src: 'asset/BGM/comastudio-deep-fashion-chill-out_adaptability-122639.mp3' },
    { name: 'Dreamy Chill', src: 'asset/BGM/comastudio-dreamy-chill-beat_flowerings-40983.mp3' },
    { name: 'Fashion Abstract', src: 'asset/BGM/comastudio-fashion-abstract-beat_powered-95422.mp3' },
    { name: 'Fashion Inspire', src: 'asset/BGM/comastudio-fashion-inspire-relaxing-music_schooner-165046.mp3' },
    { name: 'Motion Abstract', src: 'asset/BGM/comastudio-motion-abstract-beat_buried-182691.mp3' },
    { name: 'On Trip Hop', src: 'asset/BGM/comastudio-on-trip-hop_ocean-194598.mp3' },
    { name: 'Upbeat Chill', src: 'asset/BGM/comastudio-the-upbeat-chill-beat_constructing-121494.mp3' },
    { name: 'Wheedling', src: 'asset/BGM/comastudio-wheedling-106807.mp3' }
];

/**
 * 从localStorage读取音量
 * @returns {number} 音量值 0-1
 */
function getSavedVolume() {
    const saved = localStorage.getItem('bgMusicVolume');
    return saved !== null ? parseFloat(saved) : 0.5;
}

/**
 * 保存音量到localStorage
 * @param {number} volume - 音量值 0-1
 */
function saveVolume(volume) {
    localStorage.setItem('bgMusicVolume', volume.toString());
}

/**
 * 从localStorage读取当前播放曲目索引
 * @returns {number} 曲目索引
 */
function getSavedTrackIndex() {
    const saved = localStorage.getItem('bgMusicTrackIndex');
    return saved !== null ? parseInt(saved, 10) : 0;
}

/**
 * 保存当前播放曲目索引到localStorage
 * @param {number} index - 曲目索引
 */
function saveTrackIndex(index) {
    localStorage.setItem('bgMusicTrackIndex', index.toString());
}

/**
 * 音量淡入淡出
 * @param {number} targetVolume - 目标音量 0-1
 * @param {number} duration - 过渡时长(ms)
 */
function fadeVolume(targetVolume, duration = 1000) {
    if (!bgMusic) return;

    const startVolume = bgMusic.volume;
    const startTime = Date.now();
    const volumeDiff = targetVolume - startVolume;

    if (volumeFadeInterval) {
        clearInterval(volumeFadeInterval);
    }

    volumeFadeInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // 使用ease-in-out缓动
        const easeProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        bgMusic.volume = startVolume + volumeDiff * easeProgress;

        if (progress >= 1) {
            clearInterval(volumeFadeInterval);
            volumeFadeInterval = null;
        }
    }, 16);
}

/**
 * 渲染音乐列表
 * 根据musicTracks数组生成列表项HTML，包含故障风格特效
 */
function renderMusicList() {
    const container = document.getElementById('musicListItems');
    if (!container) return;

    container.innerHTML = '<div class="music-list-scanline"></div>' + musicTracks.map((track, index) => `
        <div class="music-item _target ${index === currentTrackIndex ? 'active' : ''}" data-index="${index}">
            <span class="music-item-index">${String(index + 1).padStart(2, '0')}</span>
            <span class="music-item-name" data-text="${track.name}">${track.name}</span>
            <div class="music-item-playing">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `).join('');

    // 绑定列表项点击事件
    container.querySelectorAll('.music-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const index = parseInt(item.dataset.index, 10);
            if (index !== currentTrackIndex) {
                switchTrack(index);
            }
        });

        // 鼠标进入时触发故障抖动
        item.addEventListener('mouseenter', () => {
            item.classList.add('glitch-active');
            setTimeout(() => {
                item.classList.remove('glitch-active');
            }, 150);
        });
    });
}

/**
 * 更新列表高亮状态
 * 切换当前播放项的视觉高亮
 */
function updateListHighlight() {
    const items = document.querySelectorAll('.music-item');
    items.forEach((item, index) => {
        item.classList.toggle('active', index === currentTrackIndex);
    });
}

/**
 * 切换曲目
 * @param {number} index - 目标曲目索引
 */
function switchTrack(index) {
    if (!bgMusic || index < 0 || index >= musicTracks.length) return;

    const wasPlaying = !bgMusic.paused;
    currentTrackIndex = index;
    saveTrackIndex(index);

    // 更新音频源
    bgMusic.src = musicTracks[index].src;
    bgMusic.load();

    // 更新列表高亮
    updateListHighlight();

    // 如果之前在播放，自动播放新曲目
    if (wasPlaying || isPlaying) {
        bgMusic.addEventListener('canplaythrough', function onCanPlay() {
            bgMusic.removeEventListener('canplaythrough', onCanPlay);
            if (userHasInteracted) {
                const savedVolume = getSavedVolume();
                fadeVolume(savedVolume, 800);
                bgMusic.play().then(() => {
                    isPlaying = true;
                }).catch(e => {
                    console.log('切换曲目播放被阻止:', e);
                    isPlaying = false;
                });
            } else {
                pendingAutoPlay = true;
            }
        });
    }

    isMusicLoaded = false;
    musicLoadProgress = 0;
}

/**
 * 初始化音乐播放器
 * 设置音量、绑定事件、渲染列表、加载默认曲目
 */
function initMusicPlayer() {
    bgMusic = document.getElementById('bgMusic');
    const vinylIcon = document.getElementById('vinylIcon');
    const volumeSlider = document.getElementById('volumeSlider');

    if (!bgMusic) return;

    // 读取保存的音量
    const savedVolume = getSavedVolume();
    bgMusic.volume = savedVolume;
    if (volumeSlider) {
        volumeSlider.value = savedVolume * 100;
    }

    // 读取保存的曲目索引
    currentTrackIndex = getSavedTrackIndex();
    if (currentTrackIndex < 0 || currentTrackIndex >= musicTracks.length) {
        currentTrackIndex = 0;
    }

    // 渲染音乐列表
    renderMusicList();

    // 重新绑定准星事件（音乐列表项是动态生成的）
    if (typeof pointer !== 'undefined' && pointer.bind_targets_events) {
        pointer.bind_targets_events();
    }

    // 设置初始音频源
    bgMusic.src = musicTracks[currentTrackIndex].src;

    // 监听音乐加载进度
    bgMusic.addEventListener('progress', () => {
        // 如果是模拟加载模式，忽略真实加载进度
        if (useSimulatedLoading) {
            return;
        }
        
        if (bgMusic.buffered.length > 0) {
            const loaded = bgMusic.buffered.end(0);
            const duration = bgMusic.duration || 1;
            musicLoadProgress = Math.floor((loaded / duration) * 100);
            checkAllLoaded();
        }
    });

    bgMusic.addEventListener('canplaythrough', function onCanPlay() {
        isMusicLoaded = true;
        
        if (!useSimulatedLoading) {
            musicLoadProgress = 100;
            checkAllLoaded();
        }
        
        if (userHasInteracted) {
            const currentVolume = getSavedVolume();
            bgMusic.volume = 0;
            fadeVolume(currentVolume, 1000);
            bgMusic.play().then(() => {
                isPlaying = true;
            }).catch(e => {
                console.log('播放被阻止:', e);
                isPlaying = false;
            });
        } else {
            pendingAutoPlay = true;
            if (vinylIcon) vinylIcon.classList.add('paused');
        }

        bgMusic.removeEventListener('canplaythrough', onCanPlay);
    });

    bgMusic.addEventListener('seeked', () => {
        const currentVolume = getSavedVolume();
        if (Math.abs(bgMusic.volume - currentVolume) > 0.05) {
            bgMusic.volume = currentVolume;
        }
    });

    // 点击唱片暂停/播放 - 带1秒淡入淡出
    if (vinylIcon) {
        vinylIcon.addEventListener('click', () => {
            if (bgMusic.paused) {
                fadeVolume(getSavedVolume(), 1000);
                bgMusic.play();
                vinylIcon.classList.remove('paused');
                isPlaying = true;
            } else {
                fadeVolume(0, 1000);
                setTimeout(() => {
                    bgMusic.pause();
                }, 1000);
                vinylIcon.classList.add('paused');
                isPlaying = false;
            }
        });
    }

    // 音量控制
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            bgMusic.volume = volume;
            saveVolume(volume);
            if (volume === 0) {
                vinylIcon.classList.add('paused');
                isPlaying = false;
            } else if (bgMusic.paused) {
                fadeVolume(volume, 1000);
                bgMusic.play();
                vinylIcon.classList.remove('paused');
                isPlaying = true;
            }
        });
    }

    /**
     * 监听用户首次交互事件
     * 浏览器自动播放策略要求用户先与页面交互才能播放音频
     * wheel/scroll不算作用户激活，但mousedown/pointerdown算
     * 在用户首次有效交互后，尝试播放待播放的音乐
     */
    function onFirstInteraction() {
        if (userHasInteracted) return;
        userHasInteracted = true;

        const clickPrompt = document.getElementById('click-prompt');
        if (clickPrompt) {
            clickPrompt.classList.remove('visible');
            clickPrompt.classList.add('fade-out');
            setTimeout(() => {
                clickPrompt.remove();
            }, 500);
        }

        if (pendingAutoPlay && bgMusic && bgMusic.paused && isMusicLoaded) {
            pendingAutoPlay = false;
            const currentVolume = getSavedVolume();
            bgMusic.volume = 0;
            fadeVolume(currentVolume, 1000);
            bgMusic.play().then(() => {
                isPlaying = true;
                if (vinylIcon) vinylIcon.classList.remove('paused');
            }).catch(e => {
                console.log('首次交互后播放仍被阻止:', e);
                isPlaying = false;
            });
        }

        document.removeEventListener('click', onFirstInteraction);
        document.removeEventListener('touchstart', onFirstInteraction);
        document.removeEventListener('keydown', onFirstInteraction);
        document.removeEventListener('mousedown', onFirstInteraction);
        document.removeEventListener('pointerdown', onFirstInteraction);
    }

    document.addEventListener('click', onFirstInteraction, { once: false });
    document.addEventListener('touchstart', onFirstInteraction, { once: false });
    document.addEventListener('keydown', onFirstInteraction, { once: false });
    document.addEventListener('mousedown', onFirstInteraction, { once: false });
    document.addEventListener('pointerdown', onFirstInteraction, { once: false });
}

// ============================================
// 加载页面控制
// ============================================
let loaderProgress = 0;
let modelLoadProgress = 0;
let isModelLoaded = false;
let isAllLoaded = false;
let loadingStartTime = 0;
let isInHeroSection = true;
const MIN_LOADING_TIME = 1500;

// 智能缓存检测相关
let useSimulatedLoading = false;  // 是否使用模拟加载
let musicFileUrl = '';             // 音乐文件URL
let modelFileUrl = 'asset/a_windy_day_safe.glb';  // 模型文件URL
let simulationInterval = null;     // 模拟加载的定时器

// 平滑动画相关变量
let displayedProgress = 0; // 当前显示的进度
let targetProgress = 0;    // 目标进度
let progressAnimationId = null; // 动画循环ID

// 打字机效果 - 从右向左打字，随机间隔
function typeWriterEffect() {
    const launchingText = document.querySelector('#loader .launching-text');
    if (!launchingText) return;

    const text = 'LAUNCHING';
    // 初始为空，但保留宽度
    launchingText.textContent = '';

    let i = 0;

    function typeNextChar() {
        if (i < text.length) {
            // 在末尾添加字符（由于direction: rtl，会显示在右边）
            launchingText.textContent += text.charAt(i);
            i++;

            // 随机间隔 80-150ms
            const randomDelay = Math.floor(Math.random() * 70) + 80;
            setTimeout(typeNextChar, randomDelay);
        }
    }

    // 开始打字
    setTimeout(typeNextChar, 200);
}

// 平滑进度动画函数
function animateProgress() {
    if (progressAnimationId) {
        cancelAnimationFrame(progressAnimationId);
    }
    
    function animate() {
        // 使用更快的缓动算法，让进度更平滑快速
        const ease = 0.15;
        displayedProgress += (targetProgress - displayedProgress) * ease;
        
        // 如果目标是100且非常接近，直接设置为100
        if (targetProgress === 100 && displayedProgress > 99) {
            displayedProgress = 100;
        }
        
        // 取整显示
        const displayValue = Math.floor(displayedProgress);
        
        // 更新DOM
        const progressEl = document.querySelector('#loader .progress');
        if (progressEl) {
            progressEl.textContent = displayValue;
        }
        
        // 如果还没接近目标值，继续动画
        if (Math.abs(displayedProgress - targetProgress) > 0.05) {
            progressAnimationId = requestAnimationFrame(animate);
        } else if (targetProgress === 100) {
            // 确保最终能精确显示100
            if (progressEl) {
                progressEl.textContent = 100;
            }
        }
    }
    
    progressAnimationId = requestAnimationFrame(animate);
}

/**
 * 检测资源是否已缓存
 * 通过发送HEAD请求并检查响应头判断
 * @param {string} url - 资源URL
 * @returns {Promise<boolean>} 是否已缓存
 */
async function checkResourceCached(url) {
    try {
        const cached = await caches.open('asset-cache-v1').then(cache => {
            return cache.match(url);
        }).catch(() => null);

        if (cached) return true;

        if ('connection' in navigator && navigator.connection.saveData) return true;

        const testImg = new Image();
        const timeout = new Promise(resolve => setTimeout(() => resolve(false), 50));
        const loaded = new Promise(resolve => {
            testImg.onload = () => resolve(true);
            testImg.onerror = () => resolve(false);
            testImg.src = url + '?_t=' + Date.now();
        });

        const result = await Promise.race([loaded, timeout]);
        return result;
    } catch (error) {
        console.log('资源缓存检测出错:', error);
        return false;
    }
}

/**
 * 检测并决定使用哪种加载方式
 * 如果音乐和模型都已缓存 → 用模拟加载
 * 否则 → 用真实加载
 */
async function detectAndDecideLoading() {
    // 设置音乐文件URL
    musicFileUrl = musicTracks[getSavedTrackIndex()].src;
    
    try {
        // 并行检测音乐和模型
        const [musicCached, modelCached] = await Promise.all([
            isInHeroSection ? checkResourceCached(musicFileUrl) : Promise.resolve(true),
            isInHeroSection ? checkResourceCached(modelFileUrl) : Promise.resolve(true)
        ]);
        
        // 判断条件
        if (isInHeroSection) {
            useSimulatedLoading = musicCached && modelCached;
            console.log(`缓存检测: 音乐=${musicCached}, 模型=${modelCached} → ${useSimulatedLoading ? '使用模拟加载' : '使用真实加载'}`);
        } else {
            // 不在hero区域，只需要检查音乐
            useSimulatedLoading = musicCached;
            console.log(`非hero区域缓存检测: 音乐=${musicCached} → ${useSimulatedLoading ? '使用模拟加载' : '使用真实加载'}`);
        }
        
        return useSimulatedLoading;
    } catch (error) {
        console.log('缓存检测出错，默认使用模拟加载:', error);
        useSimulatedLoading = true;
        return true;
    }
}

// 检查所有资源是否加载完成
function checkAllLoaded() {
    if (isAllLoaded) return;

    let totalProgress;
    if (isInHeroSection) {
        totalProgress = Math.floor((modelLoadProgress + musicLoadProgress) / 2);
    } else {
        totalProgress = musicLoadProgress;
    }
    loaderProgress = totalProgress;
    
    targetProgress = totalProgress;
    animateProgress();

    if (isInHeroSection && !isModelLoaded) return;

    const elapsedTime = Date.now() - loadingStartTime;
    if (totalProgress >= 100 && !isAllLoaded && elapsedTime >= MIN_LOADING_TIME) {
        isAllLoaded = true;
        completeLoading();
    } else if (totalProgress >= 100 && !isAllLoaded) {
        isAllLoaded = true;
        const remainingTime = MIN_LOADING_TIME - elapsedTime;
        setTimeout(() => {
            completeLoading();
        }, remainingTime);
    }
}

function updateLoaderProgress(percent) {
    modelLoadProgress = percent;
    // 调用checkAllLoaded来处理完成逻辑
    checkAllLoaded();
}

function completeLoading() {
    document.body.classList.remove('loading-active');

    const launchingText = document.querySelector('#loader .launching-text');
    const progressEl = document.querySelector('#loader .progress');
    const cornerTexts = document.querySelectorAll('#loader .corner-text');

    if (launchingText) launchingText.classList.add('fade-out');
    if (progressEl) progressEl.classList.add('fade-out');
    cornerTexts.forEach(el => el.classList.add('fade-out'));

    // 等待Lottie动画播放完成后再开始放大
    const waitForAnimationAndExpand = () => {
        // 检查动画是否完成或已等待足够时间（最多等2秒）
        if (globeAnimationCompleted || !globeAnimation) {
            startExpandAnimation();
        } else {
            // 继续等待
            setTimeout(waitForAnimationAndExpand, 100);
        }
    };

    // 最短等待400ms后开始检查
    setTimeout(waitForAnimationAndExpand, 400);
}

function startExpandAnimation() {
    const logo = document.querySelector('#loader .logo');
    if (!logo) return;

    // 获取初始位置（First）
    const firstRect = logo.getBoundingClientRect();
    const startX = firstRect.left + firstRect.width / 2;
    const startY = firstRect.top + firstRect.height / 2;

    // 计算目标位置（Last）- 屏幕中心
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // 计算位移
    const deltaX = centerX - startX;
    const deltaY = centerY - startY;

    // 反向播放Lottie动画（收缩效果）
    if (globeAnimation) {
        globeAnimation.setDirection(-1);
        globeAnimation.play();
    }

    // 使用GSAP同时执行移动和放大
    const tl = gsap.timeline({
        onComplete: () => {
            const mask = document.querySelector('.loader-mask');
            if (mask) mask.classList.add('open');

            setTimeout(() => {
                const loader = document.getElementById('loader');
                if (loader) loader.classList.add('hidden');
            }, 600);

            if (typeof CircleMask !== 'undefined') {
                CircleMask.loadingComplete = true;
            }

            if (!userHasInteracted && pendingAutoPlay) {
                setTimeout(() => {
                    const clickPrompt = document.getElementById('click-prompt');
                    if (clickPrompt) clickPrompt.classList.add('visible');
                }, 800);
            }
        }
    });

    // 同时执行移动、放大和淡出
    tl.to(logo, {
        x: deltaX,
        y: deltaY,
        scale: 8,
        opacity: 0,
        duration: 1.5,
        ease: 'power2.inOut',
        onStart: () => {
            logo.classList.add('expanding');
        }
    });
}

// 模拟加载进度 - 固定1.5秒
function simulateLoading() {
    // 注意：typeWriterEffect已经在DOMContentLoaded中调用，这里不再重复调用
    
    // 先重置进度
    modelLoadProgress = 0;
    musicLoadProgress = 0;
    
    let progress = 0;
    simulationInterval = setInterval(() => {
        const elapsedTime = Date.now() - loadingStartTime;
        
        // 计算应该显示的进度（在1.5秒内从0到100）
        progress = Math.min(Math.floor((elapsedTime / MIN_LOADING_TIME) * 100), 99);
        
        // 如果是模拟加载模式，同时更新模型和音乐的进度
        if (useSimulatedLoading) {
            modelLoadProgress = progress;
            musicLoadProgress = progress;
        }
        
        updateLoaderProgress(progress);
        
        if (elapsedTime >= MIN_LOADING_TIME) {
            clearInterval(simulationInterval);
            simulationInterval = null;
            
            // 如果是模拟加载模式，确保都设为100
            if (useSimulatedLoading) {
                modelLoadProgress = 100;
                musicLoadProgress = 100;
            }
            
            updateLoaderProgress(100);
        }
    }, 50); // 每50ms更新一次
}

// ============================================
// 欢迎文字滚动淡出效果
// ============================================
function initWelcomeTextFade() {
    const welcomeText = document.getElementById('welcome-text');
    if (!welcomeText) return;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        // 在滚动到1.5个屏幕高度时完全淡出（适应新的170vh hero区域）
        const fadeProgress = Math.min(scrollY / (windowHeight * 1.5), 1);
        welcomeText.style.opacity = 1 - fadeProgress;
    });
}

// ============================================
// 内容区域背景随滚动从透明变为不透明 - 带缓动效果
// ============================================
function initContentSectionFade() {
    const contentSection = document.querySelector('.content-section');
    if (!contentSection) return;

    // 使用全局缓动工具
    const lerp = new SmoothLerp(0.15);
    lerp.setTarget('bgOpacity', 0, 0);

    function updateOpacity() {
        lerp.update();
        const currentOpacity = lerp.getCurrent('bgOpacity');
        contentSection.style.setProperty('--bg-opacity', currentOpacity);

        // 如果还没接近目标值，继续动画
        if (!lerp.isCloseToTarget('bgOpacity', 0.001)) {
            requestAnimationFrame(updateOpacity);
        }
    }

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const heroHeight = windowHeight * 1.7; // hero区域是170vh
        // 在滚动到1.2-1.7个屏幕高度之间，背景从透明变为不透明
        const startFade = windowHeight * 1.2;
        const endFade = heroHeight;

        let targetOpacity = 0;
        if (scrollY > startFade) {
            targetOpacity = Math.min((scrollY - startFade) / (endFade - startFade), 1);
        }

        // 设置目标值，缓动会自动处理
        lerp.setTarget('bgOpacity', targetOpacity);

        // 启动动画循环（如果还没运行）
        requestAnimationFrame(updateOpacity);
    });
}

// ============================================
// 平滑滚动控制器 - 鼠标滚轮缓动（优化版）
// 修复：使用原生滚动 + 节流，避免与浏览器冲突
// ============================================
class SmoothScrollController {
    constructor() {
        this.scrollCallbacks = [];
        this.targetScrollCallbacks = [];
        this.lastScrollY = window.scrollY;
        this.scrollThrottleTimer = null;
        this.isTicking = false;
        this.init();
    }

    init() {
        // 使用原生滚动，不再禁用
        // 监听滚动事件 - 使用 passive 提升性能
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });

        // 滚轮事件仅用于特殊处理（如About横向滚动区域）
        window.addEventListener('wheel', (e) => this.handleWheel(e), { passive: true });

        // 监听触摸事件（移动端）
        this.initTouchSupport();
    }

    // 注册滚动回调 - 接收滚动位置
    onScroll(callback) {
        this.scrollCallbacks.push(callback);
    }

    // 注册目标滚动回调 - 接收目标位置
    onTargetScroll(callback) {
        this.targetScrollCallbacks.push(callback);
    }

    // 获取当前滚动位置
    getScrollY() {
        return window.scrollY;
    }

    // 获取目标滚动位置
    getTargetScrollY() {
        return window.scrollY;
    }

    /**
     * 处理滚动事件 - 使用 requestAnimationFrame 节流
     * 避免在滚动时执行过多计算
     */
    handleScroll() {
        if (this.isTicking) return;
        this.isTicking = true;

        requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            this.lastScrollY = scrollY;

            // 触发所有滚动回调
            this.scrollCallbacks.forEach(callback => callback(scrollY));
            this.targetScrollCallbacks.forEach(callback => callback(scrollY));

            this.isTicking = false;
        });
    }

    handleWheel(e) {
        // 如果 AboutHorizontalScroll 已拦截此事件，跳过
        if (e.defaultPrevented) return;

        // 当 About 横向滚动区域已激活时，由 AboutHorizontalScroll 控制
        // 此处不再拦截，让原生滚动正常工作
    }

    initTouchSupport() {
        // 简化触摸支持，依赖原生滚动
        // 仅在需要特殊处理时（如About横向滚动）才拦截
    }
}

// ============================================
// About 视口横向滚动交互系统
// 页面滚动驱动 | 视口固定 | 拖拽 | 触摸 | 键盘 | 圆点导航
// ============================================
class AboutHorizontalScroll {
    /**
     * @param {HTMLElement} container - about-horizontal 容器元素
     * @description 初始化视口横向滚动交互，通过页面滚动驱动横向移动
     */
    constructor(container) {
        this.container = container;
        this.viewport = container.querySelector('.about-viewport');
        this.track = container.querySelector('#aboutTrack');
        this.panels = Array.from(container.querySelectorAll('.about-panel'));
        this.progressBar = container.querySelector('#aboutProgress');
        this.dotNav = container.querySelector('#aboutDotNav');
        this.dots = Array.from(this.dotNav.querySelectorAll('.dot'));

        this.panelCount = this.panels.length;
        this.panelWidth = window.innerWidth;
        this.currentIndex = 0;
        this.targetX = 0;
        this.currentX = 0;
        this.isAnimating = false;
        this.isInView = false;

        this.dragStartX = 0;
        this.dragCurrentX = 0;
        this.isDragging = false;
        this.dragStartTime = 0;

        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isTouchScrolling = null;

        this.rafId = null;
        this.scrollProgress = 0;

        this.init();
    }

    init() {
        this.layoutPanels();
        this.bindScroll();
        this.bindDrag();
        this.bindTouch();
        this.bindKeyboard();
        this.bindDots();
        this.bindResizeObserver();
        this.updateActivePanel();
        this.startRenderLoop();
    }

    /**
     * @description 计算并设置每个面板的尺寸和位置，动态适配视口
     * 使用 window.innerWidth 和 window.innerHeight 确保精确匹配浏览器窗口
     */
    layoutPanels() {
        this.panelWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        // 视口容器高度 = 视口高度
        this.viewport.style.height = viewportHeight + 'px';
        this.track.style.height = viewportHeight + 'px';
        this.panels.forEach((panel, i) => {
            panel.style.left = (i * this.panelWidth) + 'px';
            panel.style.height = viewportHeight + 'px';
            panel.style.width = this.panelWidth + 'px';
        });
    }

    /**
     * @description 监听页面滚动，将滚动位置映射为横向面板移动
     * 使用视口固定(sticky)方式，通过滚动进度控制横向位置
     */
    bindScroll() {
        const handleScroll = () => {
            const rect = this.container.getBoundingClientRect();
            const containerHeight = this.container.offsetHeight;
            const viewportHeight = window.innerHeight;
            
            // 计算滚动进度 (0 到 1)
            // 当容器顶部到达视口顶部时开始，容器底部到达视口底部时结束
            const scrollRange = containerHeight - viewportHeight;
            const scrolled = -rect.top;
            this.scrollProgress = Math.max(0, Math.min(1, scrolled / scrollRange));
            
            // 根据滚动进度计算目标位置
            const maxTranslate = -(this.panelCount - 1) * this.panelWidth;
            this.targetX = this.scrollProgress * maxTranslate;
            
            // 更新当前面板索引
            const newIndex = Math.round(Math.abs(this.targetX) / this.panelWidth);
            if (newIndex !== this.currentIndex) {
                this.currentIndex = Math.max(0, Math.min(this.panelCount - 1, newIndex));
                this.updateActivePanel();
            }
            
            // 更新进度条
            const progress = this.scrollProgress * 100;
            this.progressBar.style.width = progress + '%';
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll, { passive: true });
        // 初始化一次
        handleScroll();
    }

    /**
     * @description 监听鼠标拖拽事件，支持拖拽横向滚动
     * 在视口固定模式下，拖拽会临时改变滚动位置
     */
    bindDrag() {
        this.viewport.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragCurrentX = e.clientX;
            this.dragStartTime = Date.now();
            this.track.classList.add('is-dragging');
            // 记录拖拽开始时的滚动进度
            this.dragStartProgress = this.scrollProgress;
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            this.dragCurrentX = e.clientX;
            const diff = this.dragCurrentX - this.dragStartX;
            // 将拖拽距离转换为滚动进度变化
            const maxTranslate = -(this.panelCount - 1) * this.panelWidth;
            const progressDelta = -diff / maxTranslate;
            const newProgress = Math.max(0, Math.min(1, this.dragStartProgress + progressDelta));
            
            // 计算对应的滚动位置并滚动到该位置
            const containerHeight = this.container.offsetHeight;
            const viewportHeight = window.innerHeight;
            const scrollRange = containerHeight - viewportHeight;
            const containerTop = this.container.getBoundingClientRect().top + window.scrollY;
            const targetScroll = containerTop + newProgress * scrollRange;
            window.scrollTo({ top: targetScroll, behavior: 'auto' });
        });

        window.addEventListener('mouseup', () => {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.track.classList.remove('is-dragging');

            const diff = this.dragCurrentX - this.dragStartX;
            const elapsed = Date.now() - this.dragStartTime;
            const velocity = Math.abs(diff) / elapsed;

            if (Math.abs(diff) > 80 || velocity > 0.5) {
                const direction = diff > 0 ? -1 : 1;
                this.snapToPanel(this.currentIndex + direction);
            } else {
                this.snapToPanel(this.currentIndex);
            }
        });
    }

    /**
     * @description 监听触摸事件，支持移动端横向滑动
     */
    bindTouch() {
        this.viewport.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.isTouchScrolling = null;
            this.touchStartProgress = this.scrollProgress;
        }, { passive: true });

        this.viewport.addEventListener('touchmove', (e) => {
            const dx = e.touches[0].clientX - this.touchStartX;
            const dy = e.touches[0].clientY - this.touchStartY;

            if (this.isTouchScrolling === null) {
                this.isTouchScrolling = Math.abs(dx) > Math.abs(dy);
            }

            if (this.isTouchScrolling) {
                // 横向手势：转换为滚动进度
                e.preventDefault();
                const maxTranslate = -(this.panelCount - 1) * this.panelWidth;
                const progressDelta = -dx / maxTranslate;
                const newProgress = Math.max(0, Math.min(1, this.touchStartProgress + progressDelta));
                
                const containerHeight = this.container.offsetHeight;
                const viewportHeight = window.innerHeight;
                const scrollRange = containerHeight - viewportHeight;
                const containerTop = this.container.getBoundingClientRect().top + window.scrollY;
                const targetScroll = containerTop + newProgress * scrollRange;
                window.scrollTo({ top: targetScroll, behavior: 'auto' });
            }
            // 纵向手势：允许原生滚动
        }, { passive: false });

        this.viewport.addEventListener('touchend', (e) => {
            if (!this.isTouchScrolling) return;
            const dx = e.changedTouches[0].clientX - this.touchStartX;
            if (Math.abs(dx) > 60) {
                const direction = dx > 0 ? -1 : 1;
                this.snapToPanel(this.currentIndex + direction);
            } else {
                this.snapToPanel(this.currentIndex);
            }
        });
    }

    /**
     * @description 监听键盘左右箭头键，在 about 区域可见时切换面板
     */
    bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            const rect = this.container.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            if (!isVisible) return;
            
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.snapToPanel(this.currentIndex + 1);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.snapToPanel(this.currentIndex - 1);
            }
        });
    }

    /**
     * @description 绑定圆点导航点击事件
     */
    bindDots() {
        this.dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.getAttribute('data-index'));
                this.snapToPanel(index);
            });
        });
    }

    /**
     * @param {number} index - 目标面板索引
     * @description 滚动到指定面板位置，使用平滑滚动
     */
    snapToPanel(index) {
        const clamped = Math.max(0, Math.min(this.panelCount - 1, index));
        this.currentIndex = clamped;
        
        const containerHeight = this.container.offsetHeight;
        const viewportHeight = window.innerHeight;
        const scrollRange = containerHeight - viewportHeight;
        const targetProgress = clamped / (this.panelCount - 1);
        const containerTop = this.container.getBoundingClientRect().top + window.scrollY;
        const targetScroll = containerTop + targetProgress * scrollRange;
        
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }

    /**
     * @description 更新当前激活面板的状态、圆点导航
     */
    updateActivePanel() {
        this.panels.forEach((panel, i) => {
            if (i === this.currentIndex) {
                panel.classList.add('active');
                // 触发故障打字效果
                this.triggerGlitchText(panel);
            } else {
                panel.classList.remove('active');
                // 重置故障打字效果
                this.resetGlitchText(panel);
            }
        });

        this.dots.forEach((dot, i) => {
            if (i === this.currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    /**
     * @description 触发面板上所有文字的故障打字效果
     * @param {HTMLElement} panel - 当前激活的面板
     */
    triggerGlitchText(panel) {
        const glitchTexts = panel.querySelectorAll('.about-glitch-text');
        glitchTexts.forEach((el, index) => {
            // 延迟触发，形成级联效果
            setTimeout(() => {
                this.animateGlitchText(el);
            }, index * 150);
        });
    }

    /**
     * @description 重置面板上所有文字的故障效果
     * @param {HTMLElement} panel - 非激活的面板
     */
    resetGlitchText(panel) {
        const glitchTexts = panel.querySelectorAll('.about-glitch-text');
        glitchTexts.forEach(el => {
            el.classList.remove('visible', 'decoded');
            el.style.opacity = '0';
            // 恢复原始文本
            const originalText = el.getAttribute('data-text');
            if (originalText) {
                this.restoreOriginalContent(el, originalText);
            }
        });
    }

    /**
     * @description 恢复元素的原始内容结构
     * @param {HTMLElement} el - 目标元素
     * @param {string} text - 原始文本
     */
    restoreOriginalContent(el, text) {
        // 保留内部的span.keyword等特殊元素
        const keywords = el.querySelectorAll('.keyword');
        if (keywords.length > 0) {
            // 如果有keyword标签，需要重建结构
            let html = '';
            const parts = text.split(/(技术|创意|跨界技术爱好者|创作者|代码开发|Linux|Linux 系统|计算机硬件|技术控|Blender三维建模|Blender 三维建模|视觉创作|AI|AI 应用|智能工具|游戏|Anime|二次元 Anime|视频剪辑|理性|感性|编程|系统运维|硬件折腾|三维创作|AI 探索|游戏休闲|番剧剪辑|个人技术展示站|好奇与热忱|持续学习|不断折腾|长期输出|兴趣|平衡成长|自在前行)/);
            parts.forEach(part => {
                if (part) {
                    if (part.match(/技术|创意|跨界技术爱好者|创作者|代码开发|Linux|Linux 系统|计算机硬件|技术控|Blender三维建模|Blender 三维建模|视觉创作|AI|AI 应用|智能工具|游戏|Anime|二次元 Anime|视频剪辑|理性|感性|编程|系统运维|硬件折腾|三维创作|AI 探索|游戏休闲|番剧剪辑|个人技术展示站|好奇与热忱|持续学习|不断折腾|长期输出|兴趣|平衡成长|自在前行/)) {
                        html += `<span class="keyword">${part}</span>`;
                    } else {
                        html += part;
                    }
                }
            });
            el.innerHTML = html;
        } else {
            el.innerHTML = text;
        }
    }

    /**
     * @description 执行故障打字动画
     * @param {HTMLElement} el - 目标文字元素
     */
    animateGlitchText(el) {
        const originalText = el.getAttribute('data-text');
        if (!originalText) return;

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
        const charArray = originalText.split('');
        const duration = 800; // 动画总时长
        const charDelay = 40; // 每个字符的延迟

        el.classList.add('visible');
        el.style.opacity = '1';

        // 为每个字符创建动画
        charArray.forEach((char, index) => {
            if (char === ' ' || char === '\n' || char === '\r') return;

            setTimeout(() => {
                let iterations = 0;
                const maxIterations = 5 + Math.random() * 5;

                const glitchInterval = setInterval(() => {
                    if (iterations >= maxIterations) {
                        clearInterval(glitchInterval);
                        // 恢复原始字符
                        this.updateCharAt(el, index, char);
                        return;
                    }

                    // 显示随机故障字符
                    const glitchChar = chars[Math.floor(Math.random() * chars.length)];
                    this.updateCharAt(el, index, glitchChar);
                    iterations++;
                }, 30);
            }, index * charDelay);
        });

        // 动画完成后标记为已解码
        setTimeout(() => {
            el.classList.add('decoded');
        }, duration + charArray.length * charDelay);
    }

    /**
     * @description 更新元素中指定位置的字符
     * @param {HTMLElement} el - 目标元素
     * @param {number} index - 字符索引
     * @param {string} char - 新字符
     */
    updateCharAt(el, index, char) {
        // 获取纯文本内容
        let textContent = '';
        const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walk.nextNode()) {
            textContent += node.textContent;
        }

        // 如果内容已经改变，需要重新构建
        const originalText = el.getAttribute('data-text');
        if (!originalText) return;

        // 创建新的文本内容
        let newText = '';
        for (let i = 0; i < originalText.length; i++) {
            if (i === index) {
                newText += char;
            } else if (i < textContent.length) {
                newText += textContent[i];
            } else {
                newText += originalText[i];
            }
        }

        // 重建HTML结构，保留keyword标签
        this.restoreOriginalContent(el, newText);
    }

    /**
     * @description 启动 requestAnimationFrame 渲染循环，使用缓动插值平滑移动
     * 视口固定模式下，直接根据 scrollProgress 更新位置
     */
    startRenderLoop() {
        // 使用 will-change 优化性能
        this.track.style.willChange = 'transform';

        // 持续更新位置以响应滚动
        const updatePosition = () => {
            const maxTranslate = -(this.panelCount - 1) * this.panelWidth;
            this.targetX = this.scrollProgress * maxTranslate;
            
            if (Math.abs(this.targetX - this.currentX) > 0.1) {
                // 使用 lerp 平滑插值
                this.currentX += (this.targetX - this.currentX) * 0.15;
                this.track.style.transform = `translate3d(${this.currentX}px, 0, 0)`;
            }
            
            this.rafId = requestAnimationFrame(updatePosition);
        };

        this.rafId = requestAnimationFrame(updatePosition);
    }

    /**
     * @description 使用 ResizeObserver 实时监听容器尺寸变化
     * 比 window.resize 更可靠：覆盖窗口缩放、CSS 变化、动态内容等所有场景
     */
    bindResizeObserver() {
        this._resizeRAF = null;
        this._resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === this.container || entry.target === this.viewport) {
                    // 用 rAF 合并多次回调，避免频繁重排
                    if (!this._resizeRAF) {
                        this._resizeRAF = requestAnimationFrame(() => {
                            this.handleResize();
                            this._resizeRAF = null;
                        });
                    }
                }
            }
        });
        this._resizeObserver.observe(this.container);
        this._resizeObserver.observe(this.viewport);
        // 同时监听 window resize 作为兜底（处理地址栏收起/展开等不触发 ResizeObserver 的情况）
        window.addEventListener('resize', () => this.handleResize(), { passive: true });
    }

    /**
     * @description 窗口尺寸变化时重新计算布局
     */
    handleResize() {
        const oldWidth = this.panelWidth;
        this.layoutPanels();
        // 重新计算当前位置
        if (oldWidth !== this.panelWidth) {
            const maxTranslate = -(this.panelCount - 1) * this.panelWidth;
            this.targetX = this.scrollProgress * maxTranslate;
            this.currentX = this.targetX;
            this.track.style.transform = `translate3d(${this.currentX}px, 0, 0)`;
        }
    }
}

// ============================================
// 打字机效果文字
// ============================================
class TypewriterText {
    constructor(element) {
        this.element = element;
        this.originalText = element.getAttribute('data-text') || element.textContent;
        this.isTyping = false;
        this.init();
    }

    init() {
        // 初始为空
        this.element.textContent = '';

        // 使用 Intersection Observer 检测元素是否进入视口
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isTyping) {
                    this.isTyping = true;
                    this.type();
                    observer.unobserve(this.element);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(this.element);
    }

    type() {
        const totalDuration = 2000; // 2秒完成
        const charCount = this.originalText.length;
        const delayPerChar = totalDuration / charCount;

        let currentIndex = 0;

        const typeNext = () => {
            if (currentIndex < charCount) {
                this.element.textContent = this.originalText.substring(0, currentIndex + 1);
                currentIndex++;
                setTimeout(typeNext, delayPerChar);
            } else {
                // 打字完成，移除光标
                this.element.classList.add('typing-complete');
            }
        };

        typeNext();
    }
}

// ============================================
// 三副本无限拼接横向滚动
// 左中右三副本绝对定位 | 实时位置调整 | 绝对无缝无跳动
// ============================================
class InfiniteMarquee {
    /**
     * 构造函数
     * @param {Object} options - 配置选项
     */
    constructor(options = {}) {
        // DOM元素
        this.row1 = document.getElementById('marqueeRow1');
        this.row2 = document.getElementById('marqueeRow2');

        if (!this.row1 || !this.row2) return;

        // 配置参数
        this.config = {
            // 基础滚动速度 (像素/帧)
            baseSpeed: options.baseSpeed || 0.5,
            // 最大滚动速度
            maxSpeed: options.maxSpeed || 3.0,
            // 滚动方向: -1=向左, 1=向右
            direction1: options.direction1 || -1,
            direction2: options.direction2 || 1,
            // 透明度
            opacity: options.opacity || 0.9,
            ...options
        };

        // 三副本元素
        this.row1Copies = {
            left: this.row1.querySelector('[data-position="left"]'),
            center: this.row1.querySelector('[data-position="center"]'),
            right: this.row1.querySelector('[data-position="right"]')
        };
        this.row2Copies = {
            left: this.row2.querySelector('[data-position="left"]'),
            center: this.row2.querySelector('[data-position="center"]'),
            right: this.row2.querySelector('[data-position="right"]')
        };

        // 核心状态
        this.contentWidth = 0;      // 单个副本宽度
        this.offset1 = 0;           // 第一行偏移量
        this.offset2 = 0;           // 第二行偏移量
        this.rafId = null;          // 动画帧ID
        this.isPaused = false;      // 暂停状态
        this.lastTime = performance.now();

        // 滚动变速相关
        this.currentSpeed = this.config.baseSpeed;
        this.targetSpeed = this.config.baseSpeed;
        this.scrollDirection = 1;
        this.lastScrollY = window.scrollY;
        this.speedTween = null;

        // 初始化
        this.init();
    }

    /**
     * 初始化
     * 使用 requestAnimationFrame 确保DOM完全渲染后再计算宽度
     */
    init() {
        this.bindEvents();
        
        // 延迟计算宽度，确保字体加载完成和DOM完全渲染
        if (document.readyState === 'complete') {
            this.initializeAfterLoad();
        } else {
            window.addEventListener('load', () => {
                this.initializeAfterLoad();
            }, { once: true });
        }
    }

    /**
     * 页面完全加载后的初始化
     */
    initializeAfterLoad() {
        // 使用 requestAnimationFrame 确保在下一帧渲染后计算
        requestAnimationFrame(() => {
            this.calculateWidth();
            this.setupStyles();
            this.startAnimation();
        });
    }

    /**
     * 计算内容宽度
     * 分别计算两行的宽度，因为文字内容不同
     * 注意：必须在DOM完全渲染后调用，确保宽度计算准确
     */
    calculateWidth() {
        // 计算单行内容的宽度
        const calculateRowWidth = (row) => {
            const content = row.querySelector('[data-position="center"]');
            if (!content) return 0;
            
            // 使用scrollWidth获取完整内容宽度（包含所有4个item）
            // 这是副本的总宽度，用于位置计算
            return content.scrollWidth;
        };
        
        // 分别计算两行的宽度
        this.contentWidth1 = calculateRowWidth(this.row1);
        this.contentWidth2 = calculateRowWidth(this.row2);
        
        // 调试日志：检查宽度计算
        console.log('Marquee widths calculated:', {
            row1Width: this.contentWidth1,
            row2Width: this.contentWidth2
        });
    }

    /**
     * 设置样式
     * 初始化三副本位置：左(-width)、中(0)、右(+width)
     * 第二行偏移半个div宽度，使两行拼接位置错开
     */
    setupStyles() {
        // 设置透明度
        this.row1.style.opacity = this.config.opacity;
        this.row2.style.opacity = this.config.opacity;

        // 计算半个div的宽度（一个marquee-item的宽度）
        const firstItem = this.row1.querySelector('.marquee-item');
        const halfItemWidth = firstItem ? firstItem.getBoundingClientRect().width / 2 : 0;

        // 初始化偏移量
        // 第一行从0开始
        this.offset1 = 0;
        // 第二行偏移半个div宽度，使拼接位置错开
        this.offset2 = halfItemWidth;

        // 初始化三副本位置，传入对应行的宽度
        this.updateCopyPositions(this.row1Copies, this.offset1, this.contentWidth1);
        this.updateCopyPositions(this.row2Copies, this.offset2, this.contentWidth2);
    }

    /**
     * 更新三个副本的位置
     * 三副本布局：左(-w)、中(0)、右(+w)
     * 整体向左移动时，右副本进入视野，左副本移出
     * 当左副本完全移出左侧边界时，将其移动到最右侧
     * @param {Object} copies - 包含left/center/right副本的对象
     * @param {number} offset - 当前偏移量
     * @param {number} width - 该行的内容宽度
     */
    updateCopyPositions(copies, offset, width) {
        const w = width;
        if (!w) return;

        // 将偏移量归一化到 [0, w) 范围
        // 使用正确的模运算处理正负数
        let normalizedOffset = offset % w;
        if (normalizedOffset < 0) {
            normalizedOffset += w;
        }

        // 计算三个副本的当前位置
        // 布局：左副本在 -w，中副本在 0，右副本在 +w
        // 加上 normalizedOffset 实现整体移动
        // 增加重叠量到35px，确保消除拼接间隙
        const overlap = 35; // 重叠像素数
        const leftPos = Math.round(normalizedOffset - w) + overlap;
        const centerPos = Math.round(normalizedOffset);
        const rightPos = Math.round(normalizedOffset + w) - overlap;

        if (copies.left) {
            copies.left.style.transform = `translate3d(${leftPos}px, 0, 0)`;
        }
        if (copies.center) {
            copies.center.style.transform = `translate3d(${centerPos}px, 0, 0)`;
        }
        if (copies.right) {
            copies.right.style.transform = `translate3d(${rightPos}px, 0, 0)`;
        }
    }

    /**
     * 启动动画循环 - 优化：使用 IntersectionObserver 控制运行
     */
    startAnimation() {
        this.lastTime = performance.now();
        // 默认暂停，等待可见性检测
        this.isPaused = true;
        this.animate();

        // 使用 IntersectionObserver 检测可见性
        this.setupVisibilityObserver();
    }

    /**
     * 设置可见性观察器 - 仅在视口内运行动画
     */
    setupVisibilityObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // 当元素进入视口时恢复动画，离开时暂停
                this.isPaused = !entry.isIntersecting;
            });
        }, {
            threshold: 0.1, // 10% 可见时触发
            rootMargin: '100px' // 提前100px开始加载
        });

        // 观察marquee容器
        const marqueeContainer = document.querySelector('.infinite-marquee');
        if (marqueeContainer) {
            observer.observe(marqueeContainer);
        }
    }

    /**
     * 动画循环 - 三副本实时位置调整（优化版）
     * 使用 will-change 提示浏览器优化
     */
    animate() {
        // 使用更高效的调度方式
        this.rafId = requestAnimationFrame(() => this.animate());

        if (this.isPaused) {
            return;
        }

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 16.67;
        this.lastTime = currentTime;

        // 根据页面滚动方向调整滚动方向
        const dir1 = this.scrollDirection === 1 ? this.config.direction1 : -this.config.direction1;
        const dir2 = this.scrollDirection === 1 ? this.config.direction2 : -this.config.direction2;

        // 更新偏移量
        this.offset1 += this.currentSpeed * dir1 * deltaTime;
        this.offset2 += this.currentSpeed * dir2 * deltaTime;

        // 更新三副本位置 - 使用 translate3d 触发GPU加速
        this.updateCopyPositions(this.row1Copies, this.offset1, this.contentWidth1);
        this.updateCopyPositions(this.row2Copies, this.offset2, this.contentWidth2);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 窗口大小变化时重新计算 - 使用防抖避免频繁计算
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.calculateWidth();
                // 重新设置位置以避免重叠
                this.setupStyles();
            }, 100);
        }, { passive: true });

        // 页面滚动事件
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }

    /**
     * 处理页面滚动事件
     */
    handleScroll() {
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - this.lastScrollY;
        this.lastScrollY = currentScrollY;

        if (Math.abs(delta) > 0.5) {
            this.scrollDirection = delta > 0 ? 1 : -1;
            const boost = Math.min(Math.abs(delta) * 0.1, this.config.maxSpeed / this.config.baseSpeed - 1);
            this.targetSpeed = this.config.baseSpeed * (1 + boost);
        } else {
            this.targetSpeed = this.config.baseSpeed;
            this.scrollDirection = 1;
        }

        if (this.speedTween) {
            this.speedTween.kill();
        }
        this.speedTween = gsap.to(this, {
            currentSpeed: this.targetSpeed,
            duration: 0.3,
            ease: 'power2.out'
        });
    }

    /**
     * 暂停动画
     */
    pause() {
        this.isPaused = true;
    }

    /**
     * 恢复动画
     */
    resume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.lastTime = performance.now();
    }

    /**
     * 设置基础速度
     * @param {number} speed - 新速度
     */
    setBaseSpeed(speed) {
        this.config.baseSpeed = speed;
        if (this.currentSpeed < speed) {
            this.currentSpeed = speed;
        }
    }

    /**
     * 设置方向
     * @param {number} dir1 - 第一行方向
     * @param {number} dir2 - 第二行方向
     */
    setDirection(dir1, dir2) {
        this.config.direction1 = dir1;
        this.config.direction2 = dir2;
    }

    /**
     * 设置透明度
     * @param {number} opacity - 透明度 0-1
     */
    setOpacity(opacity) {
        this.config.opacity = opacity;
        this.row1.style.opacity = opacity;
        this.row2.style.opacity = opacity;
    }

    /**
     * 调试方法：检查副本位置是否正确
     * 在控制台调用 marquee.debug() 查看当前状态
     */
    debug() {
        const checkPositions = (copies, name, width) => {
            const left = copies.left?.getBoundingClientRect();
            const center = copies.center?.getBoundingClientRect();
            const right = copies.right?.getBoundingClientRect();
            
            console.log(`${name} positions:`, {
                contentWidth: width,
                left: left ? { left: left.left, right: left.right, width: left.width } : null,
                center: center ? { left: center.left, right: center.right, width: center.width } : null,
                right: right ? { left: right.left, right: right.right, width: right.width } : null,
                // 检查间隙
                gapLeftCenter: center && left ? center.left - left.right : null,
                gapCenterRight: right && center ? right.left - center.right : null
            });
        };
        
        checkPositions(this.row1Copies, 'Row1', this.contentWidth1);
        checkPositions(this.row2Copies, 'Row2', this.contentWidth2);
    }

    /**
     * 销毁
     */
    destroy() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
}

// ============================================
// GSAP无限滚动社交图标 - 高性能版本
// 支持：鼠标拖拽、滚轮滑动、触屏滑动、惯性滚动
// ============================================
class SocialMarquee {
    /**
     * 构造函数
     * @param {HTMLElement} container - 容器元素
     */
    constructor(container) {
        this.container = container;
        this.track = container.querySelector('#socialTrack');
        this.cards = [];
        this.cardWidth = 0;
        this.gap = 24;
        this.totalWidth = 0;

        // 动画状态
        this.animation = null;
        this.isDragging = false;
        this.isPaused = false;
        this.direction = -1; // -1 = 向左, 1 = 向右
        this.baseSpeed = 0.8; // 基础速度 (px/frame)
        this.currentSpeed = this.baseSpeed;

        // 拖拽/滑动状态
        this.startX = 0;
        this.currentX = 0;
        this.lastX = 0;
        this.velocity = 0;
        this.lastTime = 0;

        // 惯性滚动
        this.inertiaAnimation = null;
        this.friction = 0.95; // 摩擦系数

        // 平台数据配置 - 方便增删
        this.platforms = [
            // 国内平台
            { name: '微信', icon: this.getWechatIcon() },
            { name: 'QQ', icon: this.getQQIcon() },
            { name: '抖音', icon: this.getDouyinIcon() },
            { name: '快手', icon: this.getKuaishouIcon() },
            { name: '微博', icon: this.getWeiboIcon() },
            { name: '小红书', icon: this.getXiaohongshuIcon() },
            { name: 'B站', icon: this.getBilibiliIcon() },
            { name: '知乎', icon: this.getZhihuIcon() },
            { name: '豆瓣', icon: this.getDoubanIcon() },
            { name: 'Soul', icon: this.getSoulIcon() },
            { name: '贴吧', icon: this.getTiebaIcon() },
            // 国外平台
            { name: 'YouTube', icon: this.getYoutubeIcon() },
            { name: 'Instagram', icon: this.getInstagramIcon() },
            { name: 'Facebook', icon: this.getFacebookIcon() },
            { name: 'WhatsApp', icon: this.getWhatsappIcon() },
            { name: 'Telegram', icon: this.getTelegramIcon() },
            { name: 'X', icon: this.getXIcon() },
            { name: 'Discord', icon: this.getDiscordIcon() },
            { name: 'Reddit', icon: this.getRedditIcon() },
            { name: 'Pinterest', icon: this.getPinterestIcon() },
            { name: 'Snapchat', icon: this.getSnapchatIcon() },
            { name: 'LinkedIn', icon: this.getLinkedinIcon() }
        ];

        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.renderCards();
        this.calculateDimensions();
        this.setupInfiniteLoop();
        this.bindEvents();
        this.startAutoScroll();
    }

    /**
     * 渲染图标卡片
     */
    renderCards() {
        // 生成卡片HTML - 复制3份确保无缝
        const cardsHTML = this.platforms.map(platform => `
            <div class="social-card" data-name="${platform.name}">
                ${platform.icon}
            </div>
        `).join('');

        // 复制3份实现无缝滚动
        this.track.innerHTML = cardsHTML + cardsHTML + cardsHTML;
        this.cards = Array.from(this.track.querySelectorAll('.social-card'));
    }

    /**
     * 计算尺寸
     */
    calculateDimensions() {
        if (this.cards.length === 0) return;
        const card = this.cards[0];
        this.cardWidth = card.offsetWidth;
        // 获取实际gap值
        const trackStyles = window.getComputedStyle(this.track);
        this.gap = parseInt(trackStyles.gap) || 24;
        // 单个完整循环的宽度 (一份平台数量 * (卡片宽 + 间距))
        this.cycleWidth = this.platforms.length * (this.cardWidth + this.gap);
    }

    /**
     * 设置无限循环初始位置
     */
    setupInfiniteLoop() {
        // 从第二份开始，这样可以左右滚动
        gsap.set(this.track, { x: -this.cycleWidth });
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 鼠标拖拽
        this.container.addEventListener('mousedown', this.onDragStart.bind(this));
        document.addEventListener('mousemove', this.onDragMove.bind(this));
        document.addEventListener('mouseup', this.onDragEnd.bind(this));

        // 触屏滑动
        this.container.addEventListener('touchstart', this.onDragStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.onDragMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.onDragEnd.bind(this));

        // 滚轮横向滑动
        this.container.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

        // 悬停暂停
        this.container.addEventListener('mouseenter', () => this.pause());
        this.container.addEventListener('mouseleave', () => {
            if (!this.isDragging) this.resume();
        });

        // 窗口大小变化
        window.addEventListener('resize', this.onResize.bind(this));

        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            document.hidden ? this.pause() : this.resume();
        });
    }

    /**
     * 开始自动滚动
     */
    startAutoScroll() {
        this.animate();
    }

    /**
     * 动画循环
     */
    animate() {
        if (!this.isPaused && !this.isDragging) {
            const currentX = gsap.getProperty(this.track, 'x');
            let newX = currentX + (this.currentSpeed * this.direction);

            // 无限循环逻辑
            newX = this.normalizePosition(newX);

            gsap.set(this.track, { x: newX });
        }

        this.animation = requestAnimationFrame(this.animate.bind(this));
    }

    /**
     * 归一化位置 - 实现无缝循环
     * @param {number} x - 当前位置
     * @returns {number} - 归一化后的位置
     */
    normalizePosition(x) {
        // 当滚动超过两份时，回到第一份
        if (x < -this.cycleWidth * 2) {
            return x + this.cycleWidth;
        }
        // 当滚动小于一份时，回到两份
        if (x > -this.cycleWidth) {
            return x - this.cycleWidth;
        }
        return x;
    }

    /**
     * 拖拽开始
     * @param {Event} e - 事件对象
     */
    onDragStart(e) {
        this.isDragging = true;
        this.isPaused = true;
        this.startX = this.getClientX(e);
        this.lastX = this.startX;
        this.lastTime = Date.now();
        this.velocity = 0;

        // 停止惯性动画
        if (this.inertiaAnimation) {
            cancelAnimationFrame(this.inertiaAnimation);
        }

        this.container.style.cursor = 'grabbing';
    }

    /**
     * 拖拽移动
     * @param {Event} e - 事件对象
     */
    onDragMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();

        const clientX = this.getClientX(e);
        const deltaX = clientX - this.lastX;
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastTime;

        // 计算速度 (px/ms)
        if (deltaTime > 0) {
            this.velocity = deltaX / deltaTime;
        }

        const currentX = gsap.getProperty(this.track, 'x');
        let newX = currentX + deltaX;

        // 归一化位置
        newX = this.normalizePosition(newX);

        gsap.set(this.track, { x: newX });

        this.lastX = clientX;
        this.lastTime = currentTime;
    }

    /**
     * 拖拽结束
     */
    onDragEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.container.style.cursor = 'grab';

        // 应用惯性滚动
        this.applyInertia();
    }

    /**
     * 应用惯性滚动
     */
    applyInertia() {
        const minVelocity = 0.01; // 最小速度阈值
        const deceleration = 0.95; // 减速系数

        const inertiaLoop = () => {
            if (Math.abs(this.velocity) < minVelocity) {
                this.isPaused = false;
                return;
            }

            const currentX = gsap.getProperty(this.track, 'x');
            const deltaX = this.velocity * 16; // 假设60fps
            let newX = currentX + deltaX;

            // 归一化位置
            newX = this.normalizePosition(newX);

            gsap.set(this.track, { x: newX });

            // 减速
            this.velocity *= deceleration;

            this.inertiaAnimation = requestAnimationFrame(inertiaLoop);
        };

        inertiaLoop();
    }

    /**
     * 滚轮事件处理
     * @param {WheelEvent} e - 滚轮事件
     */
    onWheel(e) {
        e.preventDefault();

        // 将垂直滚动转换为水平滚动
        const delta = e.deltaY || e.deltaX;
        const scrollSpeed = 2;

        const currentX = gsap.getProperty(this.track, 'x');
        let newX = currentX - delta * scrollSpeed;

        // 归一化位置
        newX = this.normalizePosition(newX);

        // 使用GSAP实现平滑滚动
        gsap.to(this.track, {
            x: newX,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: 'auto'
        });
    }

    /**
     * 窗口大小变化处理
     */
    onResize() {
        this.calculateDimensions();
        this.setupInfiniteLoop();
    }

    /**
     * 暂停滚动
     */
    pause() {
        this.isPaused = true;
    }

    /**
     * 恢复滚动
     */
    resume() {
        this.isPaused = false;
    }

    /**
     * 获取客户端X坐标
     * @param {Event} e - 事件对象
     * @returns {number} - X坐标
     */
    getClientX(e) {
        return e.touches ? e.touches[0].clientX : e.clientX;
    }

    // ============================================
    // 图标SVG - 矢量图形，高性能渲染
    // ============================================

    getWechatIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.269-.03-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/></svg>`;
    }

    getQQIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M12.003 2c-2.265 0-6.29 1.364-6.29 7.325v1.195S3.55 14.96 3.55 17.474c0 .665.17 1.025.281 1.025.114 0 .902-.484 1.748-2.072 0 0-.18 2.197 1.904 3.967 0 0-1.77.495-1.77 1.182 0 .686 4.078.43 6.29.43 2.21 0 6.287.257 6.287-.43 0-.687-1.768-1.182-1.768-1.182 2.085-1.77 1.905-3.967 1.905-3.967.845 1.588 1.634 2.072 1.746 2.072.111 0 .283-.36.283-1.025 0-2.514-2.166-6.954-2.166-6.954V9.325C18.29 3.364 14.268 2 12.003 2z"/></svg>`;
    }

    getDouyinIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`;
    }

    getKuaishouIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
    }

    getWeiboIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.737 5.439l-.002.004zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.18.573h.014zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.578-.18-.405-.649.381-1.025.421-1.905.003-2.535-.789-1.188-2.924-1.123-5.383-.034 0 0-.768.334-.571-.272.381-1.205.324-2.213-.27-2.8-1.344-1.326-4.918.047-7.985 3.068C1.403 10.806 0 13.124 0 15.134c0 3.844 4.93 6.183 9.754 6.183 6.316 0 10.527-3.676 10.527-6.59 0-1.76-1.48-2.759-2.222-3.064zm.637-5.907c-.921-.975-2.279-1.359-3.551-1.149-.418.065-.713.433-.646.851.066.419.433.713.851.647.804-.126 1.63.114 2.207.725.578.612.779 1.453.532 2.234-.114.355.078.735.433.849.355.114.735-.078.849-.433.387-1.202.084-2.566-.675-3.724zm2.526-2.826c-1.608-1.702-3.98-2.376-6.203-1.993-.459.076-.769.508-.693.967.076.459.508.769.967.693 1.652-.274 3.366.222 4.575 1.501 1.21 1.279 1.632 3.024 1.158 4.668-.12.403.109.825.512.945.403.12.825-.109.945-.512.612-2.09.068-4.449-1.261-6.269z"/></svg>`;
    }

    getXiaohongshuIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
    }

    getBilibiliIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906l-1.174 1.12zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773H5.333zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/></svg>`;
    }

    getZhihuIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M5.721 0C2.251 0 0 2.25 0 5.719V18.28C0 21.751 2.252 24 5.721 24h12.56C21.751 24 24 21.75 24 18.281V5.72C24 2.249 21.75 0 18.281 0zm1.964 4.078c-.271.73-.5 1.434-.68 2.11h4.587c.545-.006.445 1.168.445 1.168H6.987c.036 2.27.036 4.594.036 6.84h2.253c.127 0 .24-.045.24-.045.19-.063.17-.258.17-.258-.03-.598-.06-1.187-.06-1.773h4.538c.078.668.18 1.324.305 1.963 0 0 .046.21.203.27.14.053.334.03.334.03l1.928-.002c.17 0 .227-.1.227-.1.11-.155.024-.32.024-.32-.2-.563-.418-1.117-.653-1.66h1.465c.17 0 .227-.1.227-.1.11-.155.024-.32.024-.32-.2-.563-.418-1.117-.653-1.66h.5c.17 0 .227-.1.227-.1.11-.155.024-.32.024-.32-.2-.563-.418-1.117-.653-1.66h.5c.17 0 .227-.1.227-.1.11-.155.024-.32.024-.32-.2-.563-.418-1.117-.653-1.66h.5c.17 0 .227-.1.227-.1.11-.155.024-.32.024-.32-.2-.563-.418-1.117-.653-1.66h-3.6c-.127 0-.24.045-.24.045-.19.063-.17.258-.17.258.03.598.06 1.187.06 1.773H7.005c-.127 0-.24.045-.24.045-.19.063-.17.258-.17.258.03.598.06 1.187.06 1.773H5.721V4.078h1.964z"/></svg>`;
    }

    getDoubanIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M0 0v24h24V0H0zm18.6 5.93c.6 0 1.07.47 1.07 1.07 0 .6-.47 1.07-1.07 1.07-.6 0-1.07-.47-1.07-1.07 0-.6.47-1.07 1.07-1.07zM5.4 5.93c.6 0 1.07.47 1.07 1.07 0 .6-.47 1.07-1.07 1.07-.6 0-1.07-.47-1.07-1.07 0-.6.47-1.07 1.07-1.07zm13.2 2.14c.6 0 1.07.47 1.07 1.07 0 .6-.47 1.07-1.07 1.07-.6 0-1.07-.47-1.07-1.07 0-.6.47-1.07 1.07-1.07zM5.4 8.07c.6 0 1.07.47 1.07 1.07 0 .6-.47 1.07-1.07 1.07-.6 0-1.07-.47-1.07-1.07 0-.6.47-1.07 1.07-1.07zm13.2 2.13c.6 0 1.07.47 1.07 1.07 0 .6-.47 1.07-1.07 1.07-.6 0-1.07-.47-1.07-1.07 0-.6.47-1.07 1.07-1.07zM5.4 10.2c.6 0 1.07.47 1.07 1.07 0 .6-.47 1.07-1.07 1.07-.6 0-1.07-.47-1.07-1.07 0-.6.47-1.07 1.07-1.07zm13.2 2.14c.6 0 1.07.47 1.07 1.07 0 .6-.47 1.07-1.07 1.07-.6 0-1.07-.47-1.07-1.07 0-.6.47-1.07 1.07-1.07zM5.4 12.34c.6 0 1.07.47 1.07 1.07 0 .6-.47 1.07-1.07 1.07-.6 0-1.07-.47-1.07-1.07 0-.6.47-1.07 1.07-1.07zm13.2 2.13c.6 0 1.07.47 1.07 1.07 0 .6-.47 1.07-1.07 1.07-.6 0-1.07-.47-1.07-1.07 0-.6.47-1.07 1.07-1.07zM5.4 14.47c.6 0 1.07.47 1.07 1.07 0 .6-.47 1.07-1.07 1.07-.6 0-1.07-.47-1.07-1.07 0-.6.47-1.07 1.07-1.07z"/></svg>`;
    }

    getSoulIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
    }

    getTiebaIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>`;
    }

    getYoutubeIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
    }

    getInstagramIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`;
    }

    getFacebookIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
    }

    getWhatsappIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
    }

    getTelegramIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`;
    }

    getXIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
    }

    getDiscordIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`;
    }

    getRedditIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>`;
    }

    getPinterestIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>`;
    }

    getSnapchatIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301a.42.42 0 0 1 .17-.029c.113 0 .183.029.21.074.04.066.045.18.012.33-.113.473-.486 1.127-1.09 1.684-.386.36-.83.654-1.288.884-.343.177-.627.36-.84.54a.42.42 0 0 0-.097.088c-.028.037-.043.076-.043.117 0 .037.01.074.03.113.086.18.3.42.64.66.512.36 1.15.69 1.856.96.704.27 1.43.48 2.125.61.332.065.64.104.91.104.22 0 .39-.03.5-.09.075-.045.12-.09.135-.135.015-.045 0-.09-.045-.135-.165-.18-.48-.42-.93-.72-.45-.3-.99-.63-1.575-.99-.585-.36-1.11-.765-1.53-1.185-.42-.42-.72-.87-.9-1.35-.18-.48-.24-.99-.18-1.53.06-.54.24-1.05.54-1.53.3-.48.72-.9 1.26-1.26.54-.36 1.17-.63 1.89-.81.72-.18 1.47-.24 2.25-.18.78.06 1.53.24 2.25.54.72.3 1.35.72 1.89 1.26.54.54.96 1.17 1.26 1.89.3.72.45 1.47.45 2.25 0 .78-.15 1.53-.45 2.25-.3.72-.72 1.35-1.26 1.89-.54.54-1.17.96-1.89 1.26-.72.3-1.47.45-2.25.45-.78 0-1.53-.15-2.25-.45-.72-.3-1.35-.72-1.89-1.26-.54-.54-.96-1.17-1.26-1.89-.3-.72-.45-1.47-.45-2.25 0-.78.15-1.53.45-2.25.3-.72.72-1.35 1.26-1.89.54-.54 1.17-.96 1.89-1.26.72-.3 1.47-.45 2.25-.45z"/></svg>`;
    }

    getLinkedinIcon() {
        return `<svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;
    }
}

// ============================================
// 乱码解码文字效果
// ============================================
class GlitchTextDecoder {
    constructor(element) {
        this.element = element;
        this.originalText = element.getAttribute('data-text') || element.textContent;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.isDecoding = false;
        this.init();
    }

    init() {
        // 使用 Intersection Observer 检测元素是否进入视口
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isDecoding) {
                    this.isDecoding = true;
                    // 先显示元素
                    this.element.classList.add('visible');
                    // 清空文字，从乱码开始
                    this.element.textContent = this.generateRandomText(this.originalText.length);
                    // 延迟100ms后开始解码动画
                    setTimeout(() => this.decode(), 100);
                    observer.unobserve(this.element);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(this.element);
    }

    generateRandomText(length) {
        return Array(length).fill(0).map((_, i) => {
            if (this.originalText[i] === ' ') return ' ';
            return this.chars[Math.floor(Math.random() * this.chars.length)];
        }).join('');
    }

    decode() {
        const length = this.originalText.length;
        let iteration = 0;
        // 目标总时间约2秒：1900ms动画 + 100ms初始延迟
        // 每个字符约5次迭代，总迭代次数 = 字符数 × 5
        const maxIterations = length * 5;

        const interval = setInterval(() => {
            this.element.textContent = this.originalText
                .split('')
                .map((char, index) => {
                    // 如果字符是空格，保持空格
                    if (char === ' ') return ' ';
                    // 根据迭代进度决定是否显示正确字符
                    if (index < iteration / 5) {
                        return this.originalText[index];
                    }
                    // 否则显示随机乱码
                    return this.chars[Math.floor(Math.random() * this.chars.length)];
                })
                .join('');

            iteration++;

            if (iteration >= maxIterations) {
                clearInterval(interval);
                this.element.textContent = this.originalText;
                this.element.classList.add('decoded');
            }
        }, 38); // 约38ms间隔，总动画时间约1900ms
    }
}

// ============================================
// 电话线物理效果系统 - Matter.js绳索约束
// ============================================
class PhoneLinePhysics {
    constructor() {
        this.container = document.getElementById('phone-line-container');
        this.canvas = document.getElementById('phone-line-canvas');
        this.phoneIcon = document.getElementById('phone-icon');
        this.ctx = this.canvas?.getContext('2d');

        // Matter.js模块
        this.Engine = Matter.Engine;
        this.Bodies = Matter.Bodies;
        this.Composite = Matter.Composite;
        this.Constraint = Matter.Constraint;
        this.Events = Matter.Events;
        this.Mouse = Matter.Mouse;
        this.MouseConstraint = Matter.MouseConstraint;
        this.Vector = Matter.Vector;

        // 物理引擎
        this.engine = null;
        this.runner = null;

        // 绳索节点
        this.ropeBodies = [];
        this.constraints = [];
        this.anchorPoint = null;
        this.phoneBody = null;

        // 配置参数
        this.config = {
            segmentCount: 6,         // 绳索段数减半，绳子更短
            segmentLength: 18,       // 每段长度保持不变
            ropeThickness: 3,        // 绳索粗细
            stiffness: 0.85,         // 约束刚度（收紧绳索）
            damping: 0.005,          // 阻尼系数（减小，弹得更久）
            gravity: 0.3,            // 重力（降低，让弹起更持久）
            restitution: 0.9,        // 弹性恢复（更高弹性）
            friction: 0.0005,        // 摩擦力（更低摩擦）
            frictionAir: 0.002       // 空气阻力（更低，弹力更持久）
        };

        // 动画状态
        this.isDragging = false;
        this.isVisible = false;
        this.animationId = null;

        // 拖拽计数：记录用户未触发跳转的拖拽次数
        this.dragCount = 0;
        this.hasShownTip = false;

        // GSAP动画引用
        this.gsapAnimations = [];

        this.init();
    }

    /**
     * 初始化电话线物理系统
     */
    init() {
        // 重新获取DOM元素（确保在DOM加载完成后）
        this.container = document.getElementById('phone-line-container');
        this.canvas = document.getElementById('phone-line-canvas');
        this.phoneIcon = document.getElementById('phone-icon');
        this.ctx = this.canvas?.getContext('2d');
        
        console.log('Phone line elements:', {
            container: this.container,
            canvas: this.canvas,
            phoneIcon: this.phoneIcon,
            ctx: this.ctx
        });
        
        if (!this.container || !this.canvas || !this.ctx) {
            console.log('Phone line container or canvas not found');
            return;
        }
        
        if (!this.phoneIcon) {
            console.log('Phone icon not found!');
            return;
        }

        // 设置canvas尺寸
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // 创建物理引擎
        this.engine = this.Engine.create();
        this.engine.world.gravity.y = this.config.gravity;
        this.engine.constraintIterations = 4; // 增加约束迭代次数，使绳索更稳定

        // 创建绳索物理结构
        this.createRopeStructure();

        // 添加鼠标交互
        this.addMouseInteraction();

        // 监听滚动事件，控制可见性
        this.initScrollObserver();

        // 启动渲染循环
        this.startRenderLoop();

        console.log('Phone line physics initialized');
    }

    /**
     * 调整canvas尺寸
     */
    resize() {
        if (!this.container || !this.canvas) return;
        
        const rect = this.container.getBoundingClientRect();
        const containerWidth = Math.max(rect.width, 100); // 最小宽度100
        const containerHeight = Math.max(rect.height, 100); // 最小高度100
        
        // 保存容器尺寸供其他方法使用
        this.containerWidth = containerWidth;
        this.containerHeight = containerHeight;
        
        // Canvas 高度设置为 250px
        this.canvas.width = containerWidth;
        this.canvas.height = 250;
        
        // 重置 canvas 位置
        this.canvas.style.left = '0px';
        this.canvas.style.top = '0px';
        this.canvas.style.position = 'absolute';
        
        console.log('Canvas resized to:', containerWidth, 250);

        // 如果已经初始化且不在拖拽状态，重新创建绳索
        // 拖拽时不重置位置，避免"自动松手"
        if (this.engine && this.ropeBodies.length > 0 && !this.isDragging) {
            this.resetRopePosition();
        }
    }

    /**
     * 创建绳索物理结构
     */
    createRopeStructure() {
        // 使用容器尺寸
        const width = this.containerWidth || 400; // 默认宽度
        const height = this.containerHeight || 200; // 默认高度
        const startX = width / 2; // 容器中心
        const startY = 0;

        console.log('Creating rope structure, canvas size:', width, height);

        // 清除旧的物体
        if (this.engine && this.engine.world) {
            this.Composite.clear(this.engine.world);
        }
        this.ropeBodies = [];
        this.constraints = [];

        // 创建固定锚点（顶部中心）
        this.anchorPoint = this.Bodies.circle(startX, startY, 5, {
            isStatic: true,
            render: { visible: false },
            collisionFilter: { category: 0, mask: 0 } // 不参与碰撞
        });
        this.Composite.add(this.engine.world, this.anchorPoint);

        // 创建绳索段
        let prevBody = this.anchorPoint;
        for (let i = 0; i < this.config.segmentCount; i++) {
            const x = startX;
            const y = startY + (i + 1) * this.config.segmentLength;

            // 创建绳索节点（小圆球）- 禁用碰撞
            const body = this.Bodies.circle(x, y, this.config.ropeThickness, {
                restitution: this.config.restitution,
                friction: this.config.friction,
                frictionAir: this.config.frictionAir,
                density: 0.02,
                collisionFilter: { category: 0, mask: 0 } // 不参与碰撞
            });

            this.ropeBodies.push(body);
            this.Composite.add(this.engine.world, body);

            // 创建约束连接
            const constraint = this.Constraint.create({
                bodyA: prevBody,
                bodyB: body,
                length: this.config.segmentLength,
                stiffness: this.config.stiffness,
                damping: this.config.damping,
                render: { visible: false }
            });

            this.constraints.push(constraint);
            this.Composite.add(this.engine.world, constraint);

            prevBody = body;
        }

        // 创建电话图标物理体（末端重物）
        const lastBody = this.ropeBodies[this.ropeBodies.length - 1];
        // 电话初始位置与 DOM 一致：top: 80px
        const phoneY = 80;
        
        console.log('Phone body position:', startX, phoneY);
        
        this.phoneBody = this.Bodies.circle(startX, phoneY, 24, {
            restitution: 0.9, // 高弹性，弹得更久
            friction: 0.1,    // 低摩擦
            frictionAir: 0.01, // 低空气阻力
            density: 0.02,     // 较轻的重量
            collisionFilter: { category: 1, mask: 2 | 4 } // 与边界墙和鼠标碰撞
        });
        this.Composite.add(this.engine.world, this.phoneBody);

        // 连接绳索末端到电话图标 - 弹性连接
        // pointB 设置为用户指定的偏移量: x:-20, y:-20
        const phoneConstraint = this.Constraint.create({
            bodyA: lastBody,
            bodyB: this.phoneBody,
            pointB: { x: -20, y: -20 },  // 用户指定的偏移量
            length: 3,           // 较短长度，更紧绷
            stiffness: 0.8,      // 更高刚度，收紧绳索
            damping: 0.005,      // 更低阻尼，弹得更久
            render: { visible: false }
        });
        this.constraints.push(phoneConstraint);
        this.Composite.add(this.engine.world, phoneConstraint);
        
        // 创建边界墙，限制电话图标在容器内
        this.createBoundaries(width, height);
        
        // 立即更新一次电话图标位置
        this.updatePhoneIconPosition();
    }

    /**
     * 创建边界墙
     */
    createBoundaries(width, height) {
        const wallThickness = 30;
        
        // 底部边界 - 移到画布下方，防止电话被卡住
        const ground = this.Bodies.rectangle(width / 2, height + 300, width, wallThickness, {
            isStatic: true,
            render: { visible: false },
            collisionFilter: { category: 2, mask: 1 }
        });
        
        // 左边界 - 移到画布左侧外
        const leftWall = this.Bodies.rectangle(-100, height / 2, wallThickness, height * 4, {
            isStatic: true,
            render: { visible: false },
            collisionFilter: { category: 2, mask: 1 }
        });
        
        // 右边界 - 移到画布右侧外
        const rightWall = this.Bodies.rectangle(width + 100, height / 2, wallThickness, height * 4, {
            isStatic: true,
            render: { visible: false },
            collisionFilter: { category: 2, mask: 1 }
        });
        
        this.Composite.add(this.engine.world, [ground, leftWall, rightWall]);
    }

    /**
     * 重置绳索位置
     */
    resetRopePosition() {
        if (!this.canvas || !this.phoneBody) return;
        
        // 使用容器尺寸
        const width = this.containerWidth || 400;
        const height = this.containerHeight || 200;
        const startX = width / 2; // 容器中心
        const startY = 0;

        // 重置锚点位置
        if (this.anchorPoint) {
            Matter.Body.setPosition(this.anchorPoint, { x: startX, y: startY });
        }

        // 重置绳索段位置
        this.ropeBodies.forEach((body, i) => {
            const y = startY + (i + 1) * this.config.segmentLength;
            Matter.Body.setPosition(body, { x: startX, y: y });
            Matter.Body.setVelocity(body, { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(body, 0);
        });

        // 重置电话图标位置（与 DOM 初始位置一致）
        const phoneY = 80;
        Matter.Body.setPosition(this.phoneBody, { x: startX, y: phoneY });
        Matter.Body.setVelocity(this.phoneBody, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(this.phoneBody, 0);
        
        // 立即更新DOM位置
        this.updatePhoneIconPosition();
    }

    /**
     * 添加鼠标交互 - 使用纯手动拖拽实现
     */
    addMouseInteraction() {
        // 存储拖拽状态
        this.dragOffset = { x: 0, y: 0 };
        this.dragStartTime = 0;
        
        // 鼠标按下事件
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // 检查是否点击了电话图标（整个电话区域）
            const phonePos = this.phoneBody.position;
            // 电话尺寸约 48x48px（w-12 h-12）
            // 使用矩形检测而不是圆形检测，确保整个电话都能被点击
            const phoneHalfWidth = 30;  // 电话半宽
            const phoneHalfHeight = 30; // 电话半高
            
            // 矩形检测：检查鼠标是否在电话矩形区域内
            const isOverPhone = 
                mouseX >= phonePos.x - phoneHalfWidth &&
                mouseX <= phonePos.x + phoneHalfWidth &&
                mouseY >= phonePos.y - phoneHalfHeight &&
                mouseY <= phonePos.y + phoneHalfHeight;
            
            // 调试日志
            console.log('Mouse:', mouseX, mouseY, 'Phone:', phonePos.x, phonePos.y, 'isOverPhone:', isOverPhone);

            // 如果点击在电话图标区域内，开始拖拽
            if (isOverPhone) {
                this.isDragging = true;
                this.dragStartTime = Date.now();
                this.dragOffset.x = mouseX - phonePos.x;
                this.dragOffset.y = mouseY - phonePos.y;
                this.phoneIcon.style.cursor = 'grabbing';
                
                // 拖拽时保持绳子紧绷（但不要太紧，否则无法拉长）
                this.constraints.forEach(c => {
                    c.stiffness = 0.7; // 允许一定拉伸，松手后弹起
                });
                
                // 设置电话图标为非静态（允许移动）
                Matter.Body.setStatic(this.phoneBody, false);
                
                // 阻止事件冒泡，避免触发其他元素的事件
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        // 鼠标移动事件 - 使用document监听，即使移出canvas也能拖动
        const handleMouseMove = (e) => {
            if (!this.isDragging) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            this.canvas.style.cursor = 'grabbing';
            
            // 计算目标位置
            let targetX = mouseX - this.dragOffset.x;
            let targetY = mouseY - this.dragOffset.y;
            
            // 限制电话在 canvas 内
            const margin = 24; // 电话半径
            targetX = Math.max(margin, Math.min(this.canvas.width - margin, targetX));
            targetY = Math.max(margin, Math.min(this.canvas.height - margin, targetY));
            
            // 直接设置位置（覆盖物理模拟）
            Matter.Body.setPosition(this.phoneBody, { x: targetX, y: targetY });
            // 清零速度，防止释放后飞出去
            Matter.Body.setVelocity(this.phoneBody, { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(this.phoneBody, 0);
        };
        
        // 鼠标悬停检测（只在canvas上）
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                handleMouseMove(e);
            } else {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const phonePos = this.phoneBody.position;
                
                // 矩形检测：检查鼠标是否在电话矩形区域内
                const phoneHalfWidth = 30;
                const phoneHalfHeight = 30;
                const isOverPhone = 
                    mouseX >= phonePos.x - phoneHalfWidth &&
                    mouseX <= phonePos.x + phoneHalfWidth &&
                    mouseY >= phonePos.y - phoneHalfHeight &&
                    mouseY <= phonePos.y + phoneHalfHeight;
                
                // 整个电话区域都显示抓取光标
                this.canvas.style.cursor = isOverPhone ? 'grab' : 'default';
            }
        });
        
        // 全局鼠标移动监听（拖拽时使用）
        document.addEventListener('mousemove', handleMouseMove);
        
        // 鼠标释放事件 - 只在鼠标真正释放时才结束拖拽
        const endDrag = (e) => {
            // 检查是否真的是鼠标释放事件（不是mouseleave）
            if (this.isDragging && e.type === 'mouseup') {
                const dragDuration = Date.now() - this.dragStartTime;
                
                // 只有拖拽超过100ms才认为是真正的拖拽，避免点击时误判
                if (dragDuration > 100) {
                    this.isDragging = false;
                    this.phoneIcon.style.cursor = 'pointer';
                    
                    // 恢复原始刚度（保持紧绷，让弹起更明显）
                    this.constraints.forEach(c => {
                        c.stiffness = this.config.stiffness;
                    });
                    
                    // 检查电话是否在边界附近（拖拽到边界触发跳转）
                    if (this.checkBoundaryTrigger()) {
                        // 触发跳转，重置拖拽计数
                        this.dragCount = 0;
                        this.hasShownTip = false;
                        // 先执行回弹动画
                        this.playReleaseAnimation();
                        // 显示倒计时弹窗并开始倒计时
                        this.startCountdown(1.5);
                        return;
                    }
                    
                    // 未触发跳转，增加拖拽计数
                    this.dragCount++;
                    console.log('Drag count:', this.dragCount, '(未触发边界跳转)');
                    
                    // 拖拽超过3次且未触发跳转，显示提示
                    if (this.dragCount >= 3 && !this.hasShownTip) {
                        this.showPhoneTip();
                        this.hasShownTip = true;
                    }
                    
                    // 使用GSAP添加回弹动画效果
                    this.playReleaseAnimation();
                }
            }
        };
        
        // 在document上监听mouseup，确保即使鼠标移出canvas也能正确释放
        document.addEventListener('mouseup', endDrag);
        
        // 清理函数
        this.cleanup = () => {
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }

    /**
     * 播放释放动画
     */
    playReleaseAnimation() {
        if (!this.phoneBody || !this.phoneIcon) return;
        
        // 获取电话图标的当前速度
        const velocity = this.phoneBody.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

        // 如果速度足够大，添加GSAP弹性效果
        if (speed > 2) {
            // 使用GSAP创建弹性缩放效果
            gsap.fromTo(this.phoneIcon, 
                { scale: 1.2 },
                { 
                    scale: 1, 
                    duration: 0.6, 
                    ease: 'elastic.out(1, 0.5)'
                }
            );

            // 添加发光效果
            gsap.fromTo(this.phoneIcon,
                { filter: 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.8))' },
                { 
                    filter: 'drop-shadow(0 0 5px rgba(0, 212, 255, 0.3))',
                    duration: 1,
                    ease: 'power2.out'
                }
            );
        }
    }

    /**
     * 检查电话是否在边界附近（触发跳转条件）
     * 当电话被拖拽到canvas边界附近时返回true
     * @returns {boolean} 是否在边界触发区域
     */
    checkBoundaryTrigger() {
        if (!this.phoneBody || !this.canvas) return false;
        
        const pos = this.phoneBody.position;
        const canvasWidth = this.canvas.width || 250;
        const canvasHeight = this.canvas.height || 250;
        
        // 边界触发阈值（距离边界多少像素触发）
        const boundaryThreshold = 40;
        
        // 检查是否在左边界
        const isLeftBoundary = pos.x <= boundaryThreshold;
        // 检查是否在右边界
        const isRightBoundary = pos.x >= canvasWidth - boundaryThreshold;
        // 检查是否在上边界
        const isTopBoundary = pos.y <= boundaryThreshold;
        // 检查是否在下边界
        const isBottomBoundary = pos.y >= canvasHeight - boundaryThreshold;
        
        // 只要在任意边界附近就触发跳转
        const shouldTrigger = isLeftBoundary || isRightBoundary || isTopBoundary || isBottomBoundary;
        
        if (shouldTrigger) {
            console.log('Boundary triggered:', { 
                x: pos.x, y: pos.y, 
                isLeftBoundary, isRightBoundary, isTopBoundary, isBottomBoundary 
            });
        }
        
        return shouldTrigger;
    }

    /**
     * 启动倒计时弹窗
     * 显示赛博朋克风格的倒计时，倒计时结束后跳转
     * @param {number} seconds - 倒计时秒数
     */
    startCountdown(seconds) {
        const popup = document.getElementById('countdownPopup');
        const valueEl = document.getElementById('countdownValue');

        const targetUrl = 'load.html?target=contact%20call.html';
        const existingAnchor = document.getElementById('phone-nav-anchor');
        if (existingAnchor) existingAnchor.remove();

        const navAnchor = document.createElement('a');
        navAnchor.href = targetUrl;
        navAnchor.target = '_blank';
        navAnchor.rel = 'noopener noreferrer';
        navAnchor.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none;width:0;height:0;';
        navAnchor.id = 'phone-nav-anchor';
        document.body.appendChild(navAnchor);

        if (!popup || !valueEl) {
            setTimeout(() => {
                navAnchor.click();
            }, seconds * 1000);
            return;
        }
        
        popup.classList.add('show');
        
        void popup.offsetWidth;
        
        popup.classList.add('glitch-tear');
        
        this.triggerTearStripes();
        
        setTimeout(() => {
            popup.classList.remove('glitch-tear');
        }, 300);
        
        const startTime = Date.now();
        const duration = seconds * 1000;
        
        const updateCountdown = () => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, duration - elapsed);
            const remainingSeconds = (remaining / 1000).toFixed(2);
            
            valueEl.innerHTML = remainingSeconds + '<span class="unit">s</span>';
            
            if (remaining > 0) {
                requestAnimationFrame(updateCountdown);
            } else {
                navAnchor.click();
                popup.classList.remove('show');
            }
        };
        
        requestAnimationFrame(updateCountdown);
    }

    /**
     * 显示电话拖拽提示弹窗
     * 当用户拖拽电话3次以上未触发边界跳转时调用
     * 在右上角弹出提示，告知用户电话可放心拖拽
     */
    showPhoneTip() {
        const popup = document.getElementById('phoneTipPopup');
        if (!popup) return;
        
        // 绑定点击弹窗自身关闭（只绑定一次）
        if (!this._tipClickBound) {
            this._tipClickBound = true;
            popup.addEventListener('click', () => this.hidePhoneTip());
        }
        
        // 显示弹窗
        popup.classList.add('show');
        
        // 8秒后自动隐藏
        if (this._tipAutoHideTimer) clearTimeout(this._tipAutoHideTimer);
        this._tipAutoHideTimer = setTimeout(() => {
            this.hidePhoneTip();
        }, 8000);
    }

    /**
     * 隐藏电话拖拽提示弹窗
     */
    hidePhoneTip() {
        const popup = document.getElementById('phoneTipPopup');
        if (!popup) return;
        
        popup.classList.remove('show');
        if (this._tipAutoHideTimer) {
            clearTimeout(this._tipAutoHideTimer);
            this._tipAutoHideTimer = null;
        }
    }

    /**
     * 触发撕裂条纹效果
     * 在弹窗上生成多条彩色横向撕裂条纹
     */
    triggerTearStripes() {
        const stripesContainer = document.getElementById('tearStripes');
        if (!stripesContainer) return;
        
        // 清空旧条纹
        stripesContainer.innerHTML = '';
        
        // 生成6-12条撕裂条纹
        const stripeCount = 6 + Math.floor(Math.random() * 7);
        const colors = [
            'rgba(0, 255, 200, 0.9)',
            'rgba(0, 200, 255, 0.9)',
            'rgba(255, 0, 100, 0.8)',
            'rgba(255, 255, 0, 0.8)',
            'rgba(255, 255, 255, 0.9)',
            'rgba(0, 255, 100, 0.8)'
        ];
        
        for (let i = 0; i < stripeCount; i++) {
            const stripe = document.createElement('div');
            stripe.className = 'tear-stripe';
            
            // 随机位置（覆盖整个弹窗高度）
            const topPos = 5 + Math.random() * 90;
            stripe.style.top = `${topPos}%`;
            
            // 随机高度（2-6px）
            stripe.style.height = `${2 + Math.random() * 4}px`;
            
            // 随机颜色
            const color = colors[Math.floor(Math.random() * colors.length)];
            stripe.style.backgroundColor = color;
            stripe.style.boxShadow = `0 0 ${5 + Math.random() * 8}px ${color}`;
            
            stripesContainer.appendChild(stripe);
            
            // 依次触发动画
            setTimeout(() => {
                stripe.classList.add('active');
            }, i * 25);
        }
        
        // 清理条纹
        setTimeout(() => {
            stripesContainer.innerHTML = '';
        }, 400);
    }

    /**
     * 初始化滚动观察器
     */
    initScrollObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.isVisible = entry.isIntersecting;
                if (this.isVisible) {
                    // 进入视口时，给绳索一个轻微的摆动
                    this.giveInitialSwing();
                }
            });
        }, { threshold: 0.1 });

        observer.observe(this.container);
    }

    /**
     * 给绳索初始摆动
     */
    giveInitialSwing() {
        if (!this.phoneBody || this.isDragging) return;
        
        // 给电话图标一个非常小的推力，几乎不动
        // 拖拽时不施加力，避免干扰拖拽
        const randomForce = (Math.random() - 0.5) * 0.005;
        Matter.Body.applyForce(this.phoneBody, this.phoneBody.position, {
            x: randomForce,
            y: 0
        });
    }

    /**
     * 启动渲染循环
     */
    startRenderLoop() {
        // 风力参数
        this.windTime = 0;
        this.windForce = { x: 0, y: 0 };
        
        const render = () => {
            // 更新物理引擎
            // 拖拽时暂停对话筒的物理模拟，防止位置被覆盖
            if (this.isDragging && this.phoneBody) {
                // 临时将话筒设为静态，防止物理引擎更新其位置
                Matter.Body.setStatic(this.phoneBody, true);
                this.Engine.update(this.engine, 1000 / 60);
                // 更新后恢复为非静态，保持物理属性
                Matter.Body.setStatic(this.phoneBody, false);
            } else {
                // 闲置时添加风力效果
                if (this.phoneBody && !this.isDragging) {
                    this.windTime += 0.02;
                    // 使用正弦波模拟自然风
                    const windX = Math.sin(this.windTime) * 0.0003 + 
                                 Math.sin(this.windTime * 0.5) * 0.0002 +
                                 (Math.random() - 0.5) * 0.0001;
                    const windY = Math.cos(this.windTime * 0.7) * 0.0001;
                    
                    // 对电话施加风力
                    Matter.Body.applyForce(this.phoneBody, this.phoneBody.position, {
                        x: windX,
                        y: windY
                    });
                    
                    // 对绳索节点也施加风力
                    this.ropeBodies.forEach((body, i) => {
                        const factor = (i + 1) / this.ropeBodies.length; // 越靠下风力越大
                        Matter.Body.applyForce(body, body.position, {
                            x: windX * factor * 0.5,
                            y: windY * factor * 0.3
                        });
                    });
                }
                
                this.Engine.update(this.engine, 1000 / 60);
            }

            // 清空画布
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // 绘制绳索
            this.drawRope();

            // 更新电话图标位置
            this.updatePhoneIconPosition();

            // 继续下一帧
            this.animationId = requestAnimationFrame(render);
        };

        render();
    }

    /**
     * 绘制绳索
     */
    drawRope() {
        if (this.ropeBodies.length === 0 || !this.phoneBody) return;

        const ctx = this.ctx;
        const pos = this.phoneBody.position;
        const angle = this.phoneBody.angle;
        
        // 用户指定的偏移量: x:-20, y:-20
        // 根据旋转角度计算实际连接点位置
        const offsetX = -20;
        const offsetY = -20;
        // 旋转变换公式
        const connectX = pos.x + offsetX * Math.cos(angle) - offsetY * Math.sin(angle);
        const connectY = pos.y + offsetX * Math.sin(angle) + offsetY * Math.cos(angle);

        // 绘制绳索线条
        ctx.beginPath();

        // 从锚点开始
        if (this.anchorPoint) {
            ctx.moveTo(this.anchorPoint.position.x, this.anchorPoint.position.y);
        }

        // 连接所有绳索段
        this.ropeBodies.forEach(body => {
            ctx.lineTo(body.position.x, body.position.y);
        });

        // 连接到电话图标的指定偏移位置（而不是中心）
        ctx.lineTo(connectX, connectY);

        // 设置线条样式
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = this.config.ropeThickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 添加发光效果
        ctx.shadowColor = 'rgba(0, 212, 255, 0.8)';
        ctx.shadowBlur = 10;

        ctx.stroke();

        // 重置阴影
        ctx.shadowBlur = 0;

        // 绘制绳索节点（小圆点）
        this.ropeBodies.forEach((body, i) => {
            // 每隔几个节点绘制一个点
            if (i % 2 === 0) {
                ctx.beginPath();
                ctx.arc(body.position.x, body.position.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 212, 255, 0.6)';
                ctx.fill();
            }
        });

        // 绘制边界框（细框）- 显示 canvas 范围
        const canvasWidth = this.canvas?.width || 250;
        const canvasHeight = this.canvas?.height || 250;
        
        ctx.beginPath();
        ctx.rect(0, 0, canvasWidth, canvasHeight);
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]); // 虚线样式
        ctx.stroke();
        ctx.setLineDash([]); // 重置为实线
    }

    /**
     * 更新电话图标位置
     */
    updatePhoneIconPosition() {
        if (!this.phoneBody || !this.phoneIcon) {
            return;
        }

        const pos = this.phoneBody.position;
        const angle = this.phoneBody.angle;
        // 使用容器尺寸
        const width = this.containerWidth || 400;
        const height = this.containerHeight || 200;
        
        // 软边界限制 - 仅在非拖拽状态下生效
        // 限制电话在 canvas 范围内
        if (!this.isDragging) {
            // 使用 canvas 尺寸
            const canvasWidth = this.canvas?.width || 250;
            const canvasHeight = this.canvas?.height || 250;
            const margin = 24; // 电话半径
            
            // 计算实际边界
            const minX = margin;
            const maxX = canvasWidth - margin;
            const minY = margin;
            const maxY = canvasHeight - margin;
            
            // 限制在 canvas 内
            if (pos.y > maxY) {
                Matter.Body.setPosition(this.phoneBody, { x: pos.x, y: maxY });
                Matter.Body.setVelocity(this.phoneBody, { x: this.phoneBody.velocity.x * 0.5, y: 0 });
            }
            if (pos.y < minY) {
                Matter.Body.setPosition(this.phoneBody, { x: pos.x, y: minY });
                Matter.Body.setVelocity(this.phoneBody, { x: this.phoneBody.velocity.x * 0.5, y: 0 });
            }
            if (pos.x < minX) {
                Matter.Body.setPosition(this.phoneBody, { x: minX, y: pos.y });
                Matter.Body.setVelocity(this.phoneBody, { x: 0, y: this.phoneBody.velocity.y * 0.5 });
            }
            if (pos.x > maxX) {
                Matter.Body.setPosition(this.phoneBody, { x: maxX, y: pos.y });
                Matter.Body.setVelocity(this.phoneBody, { x: 0, y: this.phoneBody.velocity.y * 0.5 });
            }
        }
        
        // 边界检查 - 确保电话图标在 canvas 范围内
        if (!this.isDragging) {
            const canvasWidth = this.canvas?.width || 250;
            const canvasHeight = this.canvas?.height || 250;
            const margin = 50; // 允许稍微超出
            
            // 如果位置严重异常，重置位置
            if (pos.x < -margin || pos.x > canvasWidth + margin || 
                pos.y < -margin || pos.y > canvasHeight + margin || 
                isNaN(pos.x) || isNaN(pos.y)) {
                console.log('Phone position out of bounds, resetting:', pos.x, pos.y);
                this.resetRopePosition();
                return;
            }
        }

        // 确保电话图标可见
        this.phoneIcon.style.display = 'block';
        this.phoneIcon.style.visibility = 'visible';
        this.phoneIcon.style.opacity = '1';
        
        // 更新DOM元素位置
        // DOM 位置需要相对于容器，而不是 canvas
        this.phoneIcon.style.left = `${pos.x}px`;
        this.phoneIcon.style.top = `${pos.y}px`;
        this.phoneIcon.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
    }

    /**
     * 销毁物理系统
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.engine) {
            this.Engine.clear(this.engine);
        }
    }
}

// ============================================
// Project Showcase 扇形卡片动画系统
// ============================================
/**
 * 项目展示扇形卡片动画控制器
 * 实现类似扑克牌的扇形排列和点击轮换动画效果
 */
const projectShowcase = {
    /** @type {Array} 项目卡片DOM元素数组 */
    cards: [],

    /** @type {number} 当前数据索引 */
    dataIndex: 0,

    /** @type {boolean} 动画是否正在进行中，防止重复点击 */
    isAnimating: false,

    /** @type {Array} 卡片位置配置 [旋转角度, X位移, Y位移, z-index] */
    positions: [
        { rotate: -20, x: -180, y: 20, zIndex: 1 },   // 最左侧
        { rotate: -10, x: -90, y: 5, zIndex: 2 },     // 左侧
        { rotate: 0, x: 0, y: 0, zIndex: 3 },         // 中间
        { rotate: 10, x: 90, y: 5, zIndex: 4 },       // 右侧
        { rotate: 20, x: 180, y: 20, zIndex: 5 }      // 最右侧（可点击）
    ],

    /** @type {Array} 项目数据 */
    projectsData: [
        {
            title: '深度实践 AI IDE 全链路开发',
            desc: '具备成熟的 AI 辅助开发范式，高效完成需求拆解、代码实现与迭代优化，显著提升开发效率与质量',
            tags: ['AI IDE', '智能体', '开发'],
            gradient: 'from-violet-600 to-purple-600',
            icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
            image: 'asset/img/013/trae.png'
        },
        {
            title: '智能电商问答助手',
            desc: '基于 Dify 工作流编排的智能客服系统，集成 RAG 检索增强生成技术，实现意图识别、知识库检索、智能回复全流程自动化处理',
            tags: ['Dify', 'RAG', 'AI', '工作流'],
            gradient: 'from-blue-600 to-purple-600',
            icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
            image: 'asset/img/022/flow.png'
        },
        {
            title: '三维角色动画与服饰物理仿真开发',
            desc: 'BlenderMMD+MD全流程，完成角色动作导入、布料物理解算、材质卡通渲染及后期合成全链路制作',
            tags: ['Blender', 'MD', 'MMD'],
            gradient: 'from-green-600 to-teal-600',
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            image: 'asset/img/001/blender_banner.png'
        },
        {
            title: '自动成绩查询Agent',
            desc: '将自然语言问题转化为MySQL查询语句，执行后解析分析，生成可视化图表并返回结果',
            tags: ['Dify', 'ECharts', 'SQL'],
            gradient: 'from-orange-600 to-red-600',
            icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
            image: 'asset/img/019/EChart.png'
        },
        {
            title: 'QQ AI机器人',
            desc: '基于AstrBot+NapCat平台二次开发，自动聊天机器人',
            tags: ['Python', 'AstrBot', 'NapCat'],
            gradient: 'from-pink-600 to-rose-600',
            icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
            image: 'asset/img/010/astrbot.png'
        },
        {
            title: 'AI电商平台',
            desc: '微服务大型电商平台，前后端分离设计，整合 Spring AI 完成智能化改造',
            tags: ['Java', 'MySQL', 'Redis'],
            gradient: 'from-cyan-600 to-blue-600',
            icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            image: 'asset/img/023/image.png'
        },
        {
            title: 'ARM Linux 嵌入式',
            desc: '独立完成香橙派 Prime、RK3399 开发板 Armbian 系统镜像烧录、启动、引导配置、SSH 登录与环境调试，具备 ARM 架构系统部署与运维能力',
            tags: ['ARM', 'Linux', '嵌入式'],
            gradient: 'from-indigo-600 to-violet-600',
            icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
            image: 'asset/img/028/orangepi.jpg'
        },
        {
            title: '超市安防与环境监测物联网系统',
            desc: '基于 神龙派 + MQTT 协议，开发接入 ThingsCloud 的环境监测物联网系统，实现数据实时上报与云端控制',
            tags: ['嵌入式', 'STM32', 'MQTT', 'ThingsCloud'],
            gradient: 'from-emerald-600 to-cyan-600',
            icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
            image: 'asset/img/021/fin.jpg'
        },
        {
            title: 'DIY校卡 PCB',
            desc: '异形 PCB 设计、文创 PCB 开发、丝印排版、外形定制、超薄板设计、嘉立创 EDA、PCB 艺术化设计、硬件文创创作',
            tags: ['PCB', '文创', '硬件创作'],
            gradient: 'from-lime-600 to-green-600',
            icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
            image: 'asset/img/006/proj.png'
        }
    ],

    /**
     * 初始化项目展示系统
     * 动态创建卡片元素并设置初始状态
     */
    init() {
        const container = document.querySelector('.poker-container');
        const cardCount = 5;

        for (let i = 0; i < cardCount; i++) {
            const project = this.projectsData[i % this.projectsData.length];
            const card = this.createCard(project, i);
            container.insertBefore(card, container.querySelector('.poker-top'));
        }

        this.cards = [...document.querySelectorAll('.poker-card')];
        this.cards.forEach((card, index) => {
            card.dataset.position = index;
        });
        this.dataIndex = cardCount;

        if (typeof pointer !== 'undefined' && pointer.rebind) {
            pointer.rebind();
        }

        this.preloadImages();
    },

    /**
     * 预加载所有项目图片到浏览器缓存
     * 避免卡片轮换时因 img.src 变更触发新的网络请求
     */
    preloadImages() {
        this.projectsData.forEach(project => {
            if (!project.image) return;
            const img = new Image();
            img.src = project.image;
        });
    },

    /**
     * 创建卡片元素
     * @param {Object} project - 项目数据对象
     * @param {number} index - 卡片索引
     * @returns {HTMLElement} 卡片元素
     */
    createCard(project, index) {
        const card = document.createElement('div');
        card.className = `poker-card poker-card-${index + 1}`;
        card.dataset.index = index;

        // 构建图片区域的HTML
        let imageContent;
        if (project.image) {
            imageContent = `<img src="${project.image}" alt="${project.title}" class="w-full h-full object-cover">`;
        } else {
            imageContent = `
                <svg class="w-20 h-20 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="${project.icon}"/>
                </svg>
            `;
        }

        card.innerHTML = `
            <div class="poker-inner">
                <div class="poker-image bg-gradient-to-br ${project.gradient}">
                    ${imageContent}
                </div>
                <div class="poker-content">
                    <h3 class="poker-title">${project.title}</h3>
                    <p class="poker-desc">${project.desc}</p>
                    <div class="poker-tags">
                        ${project.tags.map(tag => `<span>${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;

        card.addEventListener('click', (e) => {
            const pos = parseInt(card.dataset.position);
            if (pos < 4) {
                e.stopPropagation();
                pageTransition.in('./slip.html');
            }
        });

        return card;
    },

    /**
     * 执行卡片轮换动画
     * 点击最右侧卡片时触发，所有卡片位置循环移动
     * 优化点：使用requestAnimationFrame批量处理样式更新，避免强制同步布局
     */
    move() {
        // 防止动画进行中重复点击
        if (this.isAnimating) return;
        this.isAnimating = true;

        // 先计算所有卡片的新位置，避免在循环中读取和写入样式交替进行
        const cardUpdates = this.cards.map((card) => {
            const currentPos = parseInt(card.dataset.position);
            let newPos = currentPos + 1;
            let needsContentUpdate = false;

            if (newPos >= this.cards.length) {
                newPos = 0;
                needsContentUpdate = true;
            }

            return { card, newPos, needsContentUpdate };
        });

        // 第一帧：处理需要移动到最左侧的卡片（先禁用过渡，瞬间移动）
        cardUpdates.forEach(({ card, newPos, needsContentUpdate }) => {
            const config = this.positions[newPos];

            if (needsContentUpdate) {
                // 禁用过渡，瞬间移动到最左侧
                card.style.transition = 'none';
                card.style.zIndex = config.zIndex;
                // 更新CSS变量，让hover效果能正确计算
                card.style.setProperty('--rotate', `${config.rotate}deg`);
                card.style.setProperty('--x', `${config.x}px`);
                card.style.setProperty('--y', `${config.y}px`);

                // 更新卡片内容（在动画前完成）
                const project = this.projectsData[this.dataIndex % this.projectsData.length];
                this.updateCardContent(card, project);
                this.dataIndex++;
            }

            card.dataset.position = newPos;
        });

        // 强制重排，确保无过渡的样式变更立即生效
        this.cards[0].offsetHeight; // 触发重排

        // 第二帧：启用过渡并执行动画
        requestAnimationFrame(() => {
            cardUpdates.forEach(({ card, newPos }) => {
                const config = this.positions[newPos];

                // 恢复过渡效果
                card.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                // 更新CSS变量，触发过渡动画
                card.style.setProperty('--rotate', `${config.rotate}deg`);
                card.style.setProperty('--x', `${config.x}px`);
                card.style.setProperty('--y', `${config.y}px`);
                // z-index立即生效，不参与过渡
                card.style.zIndex = config.zIndex;
            });

            // 更新点击触发层位置
            this.updateTopLayer();

            // 动画完成后解锁（过渡时间为400ms，稍微延迟确保完成）
            setTimeout(() => {
                this.isAnimating = false;
            }, 450);
        });
    },

    /**
     * 更新卡片内容
     * @param {HTMLElement} card - 卡片元素
     * @param {Object} project - 项目数据对象
     * 优化点：使用requestAnimationFrame延迟非关键更新，减少主线程阻塞
     */
    updateCardContent(card, project) {
        requestAnimationFrame(() => {
            const imageDiv = card.querySelector('.poker-image');
            const titleEl = card.querySelector('.poker-title');
            const descEl = card.querySelector('.poker-desc');
            const tagsEl = card.querySelector('.poker-tags');

            imageDiv.className = `poker-image bg-gradient-to-br ${project.gradient}`;

            if (project.image) {
                let imgEl = imageDiv.querySelector('img');
                if (!imgEl) {
                    imgEl = document.createElement('img');
                    imgEl.className = 'w-full h-full object-cover';
                    imageDiv.appendChild(imgEl);
                }
                if (imgEl.src !== location.origin + '/' + project.image && imgEl.getAttribute('src') !== project.image) {
                    imgEl.src = project.image;
                }
                imgEl.alt = project.title;
            } else {
                imageDiv.innerHTML = `
                    <svg class="w-20 h-20 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="${project.icon}"/>
                    </svg>
                `;
            }

            // 批量更新文本内容
            titleEl.textContent = project.title;
            descEl.textContent = project.desc;

            // 使用 DocumentFragment 批量更新标签，减少重排
            const fragment = document.createDocumentFragment();
            project.tags.forEach(tag => {
                const span = document.createElement('span');
                span.textContent = tag;
                fragment.appendChild(span);
            });
            tagsEl.innerHTML = '';
            tagsEl.appendChild(fragment);
        });
    },

    /**
     * 更新点击触发层的位置到最右侧卡片
     */
    updateTopLayer() {
        const topLayer = document.querySelector('.poker-top');
        if (topLayer) {
            const rightmost = this.positions[this.positions.length - 1];
            topLayer.style.transform = `rotate(${rightmost.rotate}deg) translateX(${rightmost.x}px) translateY(${rightmost.y}px)`;
        }
    }
};

// ============================================
// 页面跳转遮罩控制器
// ============================================
/**
 * 页面跳转转场动画控制器
 * 实现点击卡片后遮罩从底部滑入，延迟后跳转到目标页面
 */
const pageTransition = {
    /** @type {HTMLElement} 遮罩层DOM元素 */
    overlay: document.querySelector('.page-transition-overlay'),

    /**
     * 遮罩滑入 - 从底部滑入覆盖页面
     * @param {string} target - 跳转目标页面的路径
     */
    in(target) {
        this.overlay.classList.remove('closing');
        this.overlay.classList.add('active');

        const circle = this.overlay.querySelector('.transition-spinner circle');
        circle.style.animation = 'none';
        circle.offsetHeight;
        circle.style.animation = '';

        // 音乐缓出
        fadeVolume(0, 2000);

        setTimeout(() => {
            sessionStorage.setItem('transitionSpinEnd', Date.now().toString());
            window.location.href = target;
        }, 2100);
    },

    /**
     * 遮罩滑出 - 向底部滑出露出页面
     */
    out() {
        this.overlay.classList.add('closing');
        setTimeout(() => {
            this.overlay.classList.remove('active', 'closing');
        }, 1000);
    }
};

// ============================================
// 初始化 Lottie 动画
// ============================================
let globeAnimation = null;
let globeAnimationCompleted = false;

function initLottieGlobe() {
    const lottieContainer = document.getElementById('lottie-globe');
    if (!lottieContainer) return;

    globeAnimation = lottie.loadAnimation({
        container: lottieContainer,
        renderer: 'svg',
        loop: false,
        autoplay: true,
        path: 'js/wired-outline-27-globe-in-reveal.json'
    });

    // 设置动画颜色为霓虹蓝
    globeAnimation.addEventListener('DOMLoaded', () => {
        const svg = lottieContainer.querySelector('svg');
        if (svg) {
            svg.style.color = '#00d4ff';
            const paths = svg.querySelectorAll('path, circle, ellipse');
            paths.forEach(path => {
                path.style.stroke = '#00d4ff';
            });
        }
    });

    // 动画播放完成后标记完成
    globeAnimation.addEventListener('complete', () => {
        globeAnimationCompleted = true;
        globeAnimation.goToAndStop(globeAnimation.totalFrames - 1, true);
    });
}

// 检查动画是否完成
function isGlobeAnimationComplete() {
    return globeAnimationCompleted;
}

// ============================================
// 初始化
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    loadingStartTime = Date.now();
    document.body.classList.add('loading-active');

    /**
     * 始终等待3D模型加载完成
     * 无论用户当前在哪个区域，模型都必须加载完毕后才能跳过加载页面
     */
    isInHeroSection = true;

    initLottieGlobe();

    typeWriterEffect();

    initMusicPlayer();

    const starField = new StarField();
    const contentParticles = new ContentParticles();

    const scrollController = new SmoothScrollController();

    new ModelViewer(starField, contentParticles, scrollController);
    new ScrollReveal();
    new SkillAnimation();

    // 启动About横向滚动交互
    const aboutSection = document.querySelector('.about-horizontal');
    if (aboutSection) {
        new AboutHorizontalScroll(aboutSection);
        // ResizeObserver 和 window.resize 已在类内部绑定，无需外部重复注册
    }

    // 启动物理文字系统
    new PhysicsTextSystem();

    // 启动职业标签粒子系统
    new CareerTagParticleSystem();

    // 启动电话线物理效果
    new PhoneLinePhysics();

    // ========== 智能缓存检测 & 启动加载 ==========
    // 先进行缓存检测，然后根据结果决定加载方式
    await detectAndDecideLoading();
    
    // 启动加载（现在内部会根据 useSimulatedLoading 决定如何更新进度）
    simulateLoading();

    // 启动欢迎文字淡出效果
    initWelcomeTextFade();

    // 启动内容区域背景渐变效果
    initContentSectionFade();

    // 启动GSAP高性能无缝无限横向文字滚动
    // 配置选项：速度、方向、透明度等可自由调整
    new InfiniteMarquee({
        baseSpeed: 0.5,       // 基础滚动速度 (像素/帧)
        maxSpeed: 6.0,        // 最大滚动速度（页面快速滚动时）- 加速
        direction1: -1,       // 第一行方向: -1=向左
        direction2: 1,        // 第二行方向: 1=向右
        opacity: 0.95         // 透明度
    });

    // 启动GSAP社交图标无限滚动
    const socialMarquee = document.getElementById('socialMarquee');
    if (socialMarquee) {
        new SocialMarquee(socialMarquee);
    }

    // 启动乱码解码效果
    document.querySelectorAll('.glitch-text').forEach(el => {
        new GlitchTextDecoder(el);
    });

    // 启动打字机效果文字
    document.querySelectorAll('.typewriter-text').forEach(el => {
        new TypewriterText(el);
    });

    // 启动Project Showcase标题随机字母闪烁效果
    initProjectTitleFlicker();

    // 启动Hobby爱好列表交互
    initHobbyInteraction();

    // 初始化滚动状态检测 - 优化性能
    initScrollStateDetection();

    // 初始化Project Showcase扇形卡片系统
    projectShowcase.init();
});

// ============================================
// 滚动状态检测 - 优化性能
// 在滚动时禁用昂贵效果，停止滚动后恢复
// ============================================
function initScrollStateDetection() {
    let scrollTimeout;
    let isScrolling = false;

    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            isScrolling = true;
            document.body.classList.add('scrolling');
        }

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
            document.body.classList.remove('scrolling');
        }, 150); // 150ms 无滚动视为停止
    }, { passive: true });
}

// ============================================
// Project Showcase标题随机字母闪烁效果
// ============================================
function initProjectTitleFlicker() {
    const titleEl = document.getElementById('projectTitle');
    if (!titleEl) return;

    const textSpan = titleEl.querySelector('.gradient-text');
    if (!textSpan) return;

    const text = textSpan.textContent;
    // 将每个字符包裹在span中
    textSpan.innerHTML = text.split('').map(char => {
        if (char === ' ') {
            return '<span class="char">&nbsp;</span>';
        }
        return `<span class="char">${char}</span>`;
    }).join('');

    const chars = textSpan.querySelectorAll('.char');
    
    /**
     * 为单个字母启动独立随机闪烁
     * @param {HTMLElement} char - 字母元素
     */
    function startCharFlicker(char) {
        // 跳过空格
        if (char.textContent === '\u00A0') return;
        
        /**
         * 执行闪烁并安排下一次
         */
        function flicker() {
            char.classList.add('flicker');
            
            // 动画结束后移除类
            setTimeout(() => {
                char.classList.remove('flicker');
            }, 300);
            
            // 随机间隔后再次闪烁 (500ms - 4000ms)
            const nextDelay = Math.random() * 3500 + 500;
            setTimeout(flicker, nextDelay);
        }
        
        // 初始延迟随机 (0ms - 2000ms)
        const initialDelay = Math.random() * 2000;
        setTimeout(flicker, initialDelay);
    }

    // 为每个字母启动独立的闪烁循环
    chars.forEach(char => startCharFlicker(char));
}

// ============================================
// Hobby爱好列表交互 - 鼠标跟随图片效果
// ============================================
function initHobbyInteraction() {
    const hobbyItems = document.querySelectorAll('.hobby-item');
    let currentImage = null;
    let mouseX = 0;
    let mouseY = 0;
    let imageX = 0;
    let imageY = 0;
    let rafId = null;
    let isHovering = false;
    let hideTimeout = null;

    /**
     * 获取响应式最大尺寸限制（根据屏幕宽度自动调整）
     * @returns {{ maxWidth: number, maxHeight: number }} 最大宽度和高度
     */
    function getResponsiveMaxSize() {
        const isMobile = window.innerWidth <= 768;
        return {
            maxWidth: isMobile ? 220 : 280,
            maxHeight: isMobile ? 320 : 400
        };
    }

    /**
     * 更新跟随图片位置 - 使用requestAnimationFrame实现平滑跟随
     */
    function updateImagePosition() {
        if (!currentImage || !isHovering) return;

        // 使用缓动算法让图片平滑跟随鼠标
        const ease = 0.12;
        imageX += (mouseX - imageX) * ease;
        imageY += (mouseY - imageY) * ease;

        currentImage.style.left = imageX + 'px';
        currentImage.style.top = imageY + 'px';

        rafId = requestAnimationFrame(updateImagePosition);
    }

    hobbyItems.forEach(item => {
        const imageFollow = item.querySelector('.hobby-image-follow');
        const isMovieItem = item.dataset.hobby === 'movie';
        const isGameItem = item.dataset.hobby === 'game';
        const hasMultipleImages = isMovieItem || isGameItem;  // 支持多图切换的类型
        let multiImages = [];  // 统一存储图片列表（电影或游戏）
        let currentIndex = 0;

        /**
         * 初始化多图片数据（movie或game类型的item）
         */
        if (hasMultipleImages && imageFollow) {
            try {
                // 根据类型选择不同的data属性
                if (isMovieItem) {
                    multiImages = JSON.parse(imageFollow.dataset.filmImages || '[]');
                } else if (isGameItem) {
                    multiImages = JSON.parse(imageFollow.dataset.gameImages || '[]');
                }
                currentIndex = parseInt(imageFollow.dataset.currentIndex || '0');
            } catch (e) {
                console.error(`解析${isMovieItem ? '电影' : '游戏'}图片列表失败:`, e);
                multiImages = [];
            }
        }

        /**
         * 获取图片元素的选择器类名
         * @returns {string} CSS类名
         */
        function getPosterClassName() {
            return isMovieItem ? '.film-poster' : '.game-poster';
        }

        /**
         * 切换到指定索引的电影海报
         * @param {number} targetIndex - 目标图片索引
         */
        function switchFilmPoster(targetIndex) {
            if (!imageFollow || multiImages.length === 0) return;

            const img = imageFollow.querySelector(getPosterClassName());
            const counter = imageFollow.querySelector('.film-counter');

            if (!img) return;

            // 确保索引在有效范围内
            currentIndex = ((targetIndex % multiImages.length) + multiImages.length) % multiImages.length;

            // 添加切换动画类
            imageFollow.classList.add('switching');

            // 短暂延迟后切换图片（等待淡出动画完成）
            setTimeout(() => {
                // 创建临时Image对象预加载获取实际尺寸
                const tempImg = new Image();
                tempImg.onload = function() {
                    // 计算适应容器的尺寸（保持原始比例）
                    const { maxWidth, maxHeight } = getResponsiveMaxSize();

                    let width = tempImg.naturalWidth;
                    let height = tempImg.naturalHeight;

                    // 按比例缩放（取较小值确保不超限）
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    
                    // 使用Math.round确保整数像素，避免亚像素渲染导致白边
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);

                    // 微调：确保至少达到最小尺寸
                    width = Math.max(width, isMovieItem ? 180 : 180);
                    height = Math.max(height, isMovieItem ? 250 : 250);

                    // 应用新尺寸到容器
                    imageFollow.style.width = `${width}px`;
                    imageFollow.style.height = `${height}px`;

                    // 强制重排确保尺寸生效
                    void imageFollow.offsetWidth;

                    // 设置图片源
                    img.src = multiImages[currentIndex];
                    img.alt = `${isMovieItem ? 'Cinema - Film' : 'Gaming'} ${currentIndex + 1}`;

                    // 更新计数器
                    if (counter) {
                        counter.textContent = `${currentIndex + 1} / ${multiImages.length}`;
                    }

                    // 更新data属性
                    imageFollow.dataset.currentIndex = currentIndex;

                    // 移除切换动画类（触发淡入）
                    requestAnimationFrame(() => {
                        imageFollow.classList.remove('switching');
                    });
                };

                // 开始加载图片
                tempImg.src = multiImages[currentIndex];
            }, 150);
        }

        /**
         * 随机选择一张图片（不同于当前显示的）
         */
        function showRandomImage() {
            if (multiImages.length <= 1) return;

            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * multiImages.length);
            } while (randomIndex === currentIndex && multiImages.length > 1);

            switchFilmPoster(randomIndex);
        }

        /**
         * 鼠标进入事件 - 显示跟随图片（电影类型会随机显示不同海报）
         * @param {MouseEvent} e - 鼠标事件对象
         */
        item.addEventListener('mouseenter', (e) => {
            if (imageFollow) {
                // 清除之前的隐藏定时器
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }

                // 如果之前有其他图片在显示，先隐藏
                if (currentImage && currentImage !== imageFollow) {
                    currentImage.classList.remove('active');
                }

                isHovering = true;
                currentImage = imageFollow;
                mouseX = e.clientX;
                mouseY = e.clientY;
                imageX = mouseX;
                imageY = mouseY;

                // 设置初始位置
                imageFollow.style.left = mouseX + 'px';
                imageFollow.style.top = mouseY + 'px';

                // 如果是多图类型（movie或game），初始化或随机显示图片并自适应尺寸
                if (hasMultipleImages && multiImages.length > 0) {
                    // 获取当前要显示的图片索引（多张时随机，单张时使用当前索引）
                    const displayIndex = multiImages.length > 1 ? (
                        Math.floor(Math.random() * multiImages.length)
                    ) : currentIndex;

                    // 预加载图片获取实际尺寸
                    const initTempImg = new Image();
                    initTempImg.onload = function() {
                        // 计算适应容器的尺寸（保持原始比例）
                        const { maxWidth, maxHeight } = getResponsiveMaxSize();

                        let width = initTempImg.naturalWidth;
                        let height = initTempImg.naturalHeight;

                        // 按比例缩放（取较小值确保不超限）
                        const ratio = Math.min(maxWidth / width, maxHeight / height);

                        // 使用Math.round确保整数像素，避免亚像素渲染导致白边
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);

                        // 微调：确保至少达到最小尺寸
                        width = Math.max(width, isMovieItem ? 180 : 180);
                        height = Math.max(height, isMovieItem ? 250 : 250);

                        // 应用尺寸到容器
                        imageFollow.style.width = `${width}px`;
                        imageFollow.style.height = `${height}px`;

                        // 强制重排确保尺寸生效
                        void imageFollow.offsetWidth;

                        // 更新图片源
                        const img = imageFollow.querySelector(getPosterClassName());
                        if (img) {
                            img.src = multiImages[displayIndex];
                            img.alt = `${isMovieItem ? 'Cinema - Film' : 'Gaming'} ${displayIndex + 1}`;
                        }

                        // 更新计数器
                        const counter = imageFollow.querySelector('.film-counter');
                        if (counter) {
                            counter.textContent = `${displayIndex + 1} / ${multiImages.length}`;
                        }

                        // 更新状态
                        currentIndex = displayIndex;
                        imageFollow.dataset.currentIndex = currentIndex;
                    };

                    // 开始预加载
                    initTempImg.src = multiImages[displayIndex];
                } else if (hasMultipleImages && multiImages.length === 1) {
                    // 只有一张图片时也初始化尺寸
                    const singleTempImg = new Image();
                    singleTempImg.onload = function() {
                        const { maxWidth, maxHeight } = getResponsiveMaxSize();
                        let width = singleTempImg.naturalWidth;
                        let height = singleTempImg.naturalHeight;

                        // 按比例缩放（取较小值确保不超限）
                        const ratio = Math.min(maxWidth / width, maxHeight / height);

                        // 使用Math.round确保整数像素
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);

                        // 确保最小尺寸
                        width = Math.max(width, 180);
                        height = Math.max(height, 250);

                        imageFollow.style.width = `${width}px`;
                        imageFollow.style.height = `${height}px`;

                        // 强制重排
                        void imageFollow.offsetWidth;
                    };
                    singleTempImg.src = multiImages[0];
                }

                // 添加active类显示图片
                requestAnimationFrame(() => {
                    imageFollow.classList.add('active');
                });

                // 启动动画循环
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(updateImagePosition);
            }
        });

        /**
         * 鼠标移动事件 - 更新目标位置
         * @param {MouseEvent} e - 鼠标事件对象
         */
        item.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        /**
         * 点击事件 - 切换到下一张图片（movie或game类型）
         * 绑定在item上而不是imageFollow上，避免pointer-events干扰
         */
        if (hasMultipleImages) {
            item.addEventListener('click', (e) => {
                // 只有在hovering状态下才响应点击
                if (!isHovering || !imageFollow) return;

                // 切换到下一张（循环）
                const nextIndex = (currentIndex + 1) % multiImages.length;
                switchFilmPoster(nextIndex);

                // 添加点击反馈动画
                imageFollow.style.transform = 'translate(-50%, -50%) scale(0.95)';
                setTimeout(() => {
                    imageFollow.style.transform = '';
                }, 100);
            });

            // 添加cursor样式提示可点击
            item.style.cursor = 'pointer';
        }

        /**
         * 鼠标离开事件 - 隐藏跟随图片
         * 使用双重检查确保可靠隐藏
         */
        item.addEventListener('mouseleave', () => {
            // 立即标记为非hover状态
            isHovering = false;

            if (imageFollow) {
                // 立即移除active类（快速隐藏）
                imageFollow.classList.remove('active');

                // 清除之前的定时器（如果有）
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }

                // 延迟清理资源，但使用较短的时间
                hideTimeout = setTimeout(() => {
                    // 双重检查：确认仍然不在hovering状态
                    if (!isHovering) {
                        currentImage = null;
                        if (rafId) {
                            cancelAnimationFrame(rafId);
                            rafId = null;
                        }
                    }
                }, 100);  // 从200ms减少到100ms，更快响应
            }
        });

        /**
         * 额外安全网：监听window级别的mouseleave
         * 处理鼠标突然离开窗口的情况
         */
        item.addEventListener('mouseout', (e) => {
            // 检查鼠标是否真的离开了item（而不是进入子元素）
            if (!item.contains(e.relatedTarget)) {
                isHovering = false;
                if (imageFollow) {
                    imageFollow.classList.remove('active');
                }
            }
        });
    });
}

// 准星功能
const pointer = {
    container: document.querySelector(".pointer"),
    actualDot: document.getElementById("actualDot"),
    current_target: null,
    mouseX: window.innerWidth / 2,
    mouseY: window.innerHeight / 2,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    dotX: window.innerWidth / 2,
    dotY: window.innerHeight / 2,
    rotation: 0,
    targetRotation: 0,
    _raf: null,
    moveTimer: null,

    /**
     * 初始化鼠标指针效果
     * @description 绑定鼠标移动事件和目标元素事件
     */
    init() {
        // 先设置准星初始位置
        this.container.style.transform = `translate(${this.targetX}px, ${this.targetY}px) rotate(${this.rotation}deg)`;
        this.actualDot.style.left = this.dotX + 'px';
        this.actualDot.style.top = this.dotY + 'px';
        
        window.addEventListener("mousemove", this.move.bind(this));
        this.bind_targets_events();
        this.animate();
    },

    /**
     * 处理鼠标移动事件（只更新状态，不直接操作DOM）
     * @param {MouseEvent} e - 鼠标事件对象
     * @description 更新鼠标实际位置并计算吸附效果
     */
    move(e) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;

        this.container.classList.add('moving');
        clearTimeout(this.moveTimer);
        this.moveTimer = setTimeout(() => {
            this.container.classList.remove('moving');
        }, 100);

        if (this.current_target) {
            const rect = this.current_target.getBoundingClientRect();
            const center_x = rect.left + rect.width / 2;
            const center_y = rect.top + rect.height / 2;
            this.targetX = center_x + (this.mouseX - center_x) * 0.1;
            this.targetY = center_y + (this.mouseY - center_y) * 0.1;
        } else {
            this.targetX = this.mouseX;
            this.targetY = this.mouseY;
        }
    },

    /**
     * 使用 requestAnimationFrame 的动画循环（DOM更新统一在此）
     * @description 持续更新指针位置和小十字位置
     */
    animate() {
        // 没有吸附物体时，让指针旋转
        if (!this.current_target) {
            this.rotation += 0.5; // 旋转速度
        } else {
            // 吸附到物体时，平滑旋转回默认位置（走最短路径）
            let diff = this.targetRotation - this.rotation;
            // 找到与目标角度相差最近的等效角度（处理超过360度的情况）
            diff = diff - Math.round(diff / 360) * 360;
            // 现在 diff 是最短路径的差值，加快吸附时的旋转速度
            this.rotation = this.rotation + diff * 0.35;
        }
        
        // 应用 transform（包含旋转）
        this.container.style.transform = `translate(${this.targetX}px, ${this.targetY}px) rotate(${this.rotation}deg)`;
        
        // 小十字准星的平滑跟随效果（缓动系数 0.55）
        this.dotX = this.dotX + (this.mouseX - this.dotX) * 0.55;
        this.dotY = this.dotY + (this.mouseY - this.dotY) * 0.55;
        this.actualDot.style.left = this.dotX + 'px';
        this.actualDot.style.top = this.dotY + 'px';

        this._raf = requestAnimationFrame(this.animate.bind(this));
    },

    /**
     * 绑定目标元素事件
     * @description 为所有目标元素绑定鼠标进入和离开事件，支持动态添加的元素
     */
    bind_targets_events() {
        // 给项目卡片和其他交互元素添加 ._target 类，让准星可以吸附
        const selectors = [
            '.project-card',
            '.hover-card',
            '.hobby-item',
            '.about-tag',
            '.poker-card',
            '.poker-top',
            '.social-card',
            '.career-tag',
            '#physics-container',
            '.music-item'
        ];
        
        const targets = [];
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (!el.classList.contains('_target')) {
                    el.classList.add('_target');
                }
                // 避免重复绑定
                if (!el._pointerBound) {
                    targets.push(el);
                    el._pointerBound = true;
                }
            });
        });
        
        targets.forEach(ele => {
            ele.onmouseenter = () => {
                this.current_target = ele;
                const rect = ele.getBoundingClientRect();
                this.container.style.setProperty('--width', rect.width + window.innerWidth / 50 + 'px');
                this.container.style.setProperty('--height', rect.height + window.innerWidth / 50 + 'px');
                // 切换为X型准星（荧光效果）
                this.actualDot.classList.add('locked');
            };
            ele.onmouseleave = () => {
                this.current_target = null;
                this.container.style.removeProperty('--width');
                this.container.style.removeProperty('--height');
                // 恢复为普通十字准星
                this.actualDot.classList.remove('locked');
            };
        });
    },

    /**
     * 重新绑定目标元素事件
     * @description 用于动态添加元素后重新绑定
     */
    rebind() {
        this.bind_targets_events();
    }
};



// 立即初始化准星，不等待 DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        pointer.init();
    });
} else {
    pointer.init();
}

/**
 * 圆形遮罩控制器 - Slow Scroll
 * 跟随鼠标，滚动时放大并淡出
 */
const CircleMask = {
    mask: null,
    textElement: null,
    mouseX: window.innerWidth / 2,
    mouseY: window.innerHeight / 2,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    opacity: 1,
    textOpacity: 1,
    textScale: 1,
    maskSize: 200,
    targetSize: 200,
    isFadingOut: false,
    textVisible: false,
    loadingComplete: false,

    init() {
        this.mask = document.getElementById('circle-mask');
        this.textElement = document.getElementById('slow-scroll-text');
        if (!this.mask) return;

        this.setupEventListeners();
        this.animate();
    },

    /**
     * 设置Slow Scroll文字为可见状态（仅在预加载完成后生效）
     */
    showText() {
        if (!this.loadingComplete || this.textVisible) return;
        this.textVisible = true;
        if (this.textElement) {
            this.textElement.classList.add('visible');
        }
    },

    setupEventListeners() {
        // 鼠标移动
        window.addEventListener('mousemove', (e) => {
            this.targetX = e.clientX;
            this.targetY = e.clientY;
            this.showText();
        }, { passive: true });

        // 触摸移动（移动端）
        window.addEventListener('touchmove', (e) => {
            if (e.touches[0]) {
                this.targetX = e.touches[0].clientX;
                this.targetY = e.touches[0].clientY;
                this.showText();
            }
        }, { passive: true });

        // 滚动监听
        window.addEventListener('scroll', () => {
            this.handleScroll();
        }, { passive: true });
    },

    handleScroll() {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const heroHeight = 170 * windowHeight / 100; // hero区域是170vh

        // 从滚动一开始就开始放大和淡出
        const startPoint = 0;
        const endPoint = heroHeight * 0.7; // 70%位置就完成变化

        if (scrollY >= endPoint) {
            // 完全淡出
            this.opacity = 0;
            this.textOpacity = 0;
            this.textScale = 0.5;
            this.targetSize = Math.max(window.innerWidth, window.innerHeight) * 2; // 放大到2倍屏幕大小
            this.isFadingOut = true;
        } else if (scrollY >= startPoint) {
            // 渐变放大并淡出 / 反向缩小并恢复
            const progress = (scrollY - startPoint) / (endPoint - startPoint);
            this.opacity = 1 - progress;
            this.textOpacity = 1 - progress;
            this.textScale = 1 - progress * 0.5;
            this.targetSize = 200 + progress * (Math.max(window.innerWidth, window.innerHeight) * 1.8);
            this.isFadingOut = progress > 0;
        } else {
            // 完全复原
            this.opacity = 1;
            this.textOpacity = 1;
            this.textScale = 1;
            this.targetSize = 200;
            this.isFadingOut = false;
        }
    },

    animate() {
        // 平滑跟随鼠标
        this.mouseX += (this.targetX - this.mouseX) * 0.15;
        this.mouseY += (this.targetY - this.mouseY) * 0.15;

        // 更快的放大
        this.maskSize += (this.targetSize - this.maskSize) * 0.25;

        // 更新CSS变量 - 遮罩
        this.mask.style.setProperty('--mouse-x', `${this.mouseX}px`);
        this.mask.style.setProperty('--mouse-y', `${this.mouseY}px`);
        this.mask.style.setProperty('--mask-opacity', this.opacity);
        this.mask.style.setProperty('--mask-size', `${this.maskSize}px`);

        // 更新文字元素位置和样式
        if (this.textElement && this.textVisible) {
            this.textElement.style.left = `${this.mouseX}px`;
            this.textElement.style.top = `${this.mouseY}px`;
            this.textElement.style.setProperty('--text-opacity', this.textOpacity);
            this.textElement.style.setProperty('--text-scale', this.textScale);

            if (this.isFadingOut) {
                this.textElement.classList.add('fade-out');
            } else {
                this.textElement.classList.remove('fade-out');
            }
        }

        // 添加或移除fade-out类 - 遮罩
        if (this.isFadingOut) {
            this.mask.classList.add('fade-out');
        } else {
            this.mask.classList.remove('fade-out');
        }

        requestAnimationFrame(() => this.animate());
    }
};

// 初始化圆形遮罩
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        CircleMask.init();
    });
} else {
    CircleMask.init();
}

/**
 * 为 .poker-top 元素绑定点击事件监听器
 * @description 替代内联 onclick 属性，实现结构/行为分离
 * @param {Event} event - 点击事件对象
 * @returns {void}
 * @throws 当 .poker-top 元素不存在时不会抛出异常，仅跳过绑定
 * @note 使用事件委托模式，确保 DOM 加载完成后绑定
 */
document.querySelector('.poker-top').addEventListener('click', function() {
    projectShowcase.move();
});
