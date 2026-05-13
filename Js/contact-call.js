/**
 * 星际通讯终端核心控制器
 * 负责管理通讯状态、频率拨号、全息音效和能量动画
 */
class InterstellarTerminal {
    constructor() {
        // DOM元素引用
        this.headset = document.getElementById('headset');
        this.dialPlate = document.getElementById('dialPlate');
        this.display = document.getElementById('display');
        this.statusLight = document.getElementById('statusLight');
        this.signalBars = document.getElementById('signalBars');
        
        // 通讯状态
        this.isActive = false;       // 是否激活
        this.isDialing = false;      // 是否正在拨号
        this.isInCall = false;       // 是否在通话中
        this.dialedNumbers = [];     // 已拨号码数组
        this.currentRotation = 0;    // 当前旋转角度
        this.targetRotation = 0;     // 目标旋转角度
        
        // 物理参数
        this.rotationVelocity = 0;   // 旋转速度
        this.damping = 0.96;         // 阻尼系数
        this.springStrength = 0.08;  // 回弹强度
        this.maxRotation = 270;      // 最大旋转角度
        this.minRotation = 0;        // 最小旋转角度
        
        // 拨号盘配置
        this.numberPositions = [];   // 数字位置配置
        this.holeRadius = 100;       // 节点到中心的距离
        
        // 音频上下文
        this.audioContext = null;
        this.commToneOscillator = null;
        this.commToneGain = null;
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化通讯终端
     * 生成触控节点、绑定事件、初始化音频
     */
    init() {
        this.generateTouchNodes();
        this.bindEvents();
        this.initAudio();
        this.animateSignalBars();
        this.startGlitchEffect();
    }
    
    /**
     * 启动CRT信号撕裂效果
     * 随机触发模拟信号不好的情况
     */
    startGlitchEffect() {
        const glitchElement = document.getElementById('signalGlitch');
        const noiseElement = document.getElementById('noiseOverlay');
        const container = document.querySelector('.terminal-container');
        
        // 创建随机撕裂条纹
        const createRandomStripes = () => {
            // 清除旧条纹
            glitchElement.innerHTML = '';
            
            // 随机生成2-5条撕裂条纹
            const stripeCount = 2 + Math.floor(Math.random() * 4);
            const colors = [
                'rgba(0, 255, 200, 0.2)',
                'rgba(0, 200, 255, 0.2)',
                'rgba(255, 0, 100, 0.15)',
                'rgba(255, 255, 0, 0.15)'
            ];
            
            for (let i = 0; i < stripeCount; i++) {
                const stripe = document.createElement('div');
                stripe.className = 'glitch-stripe';
                
                // 随机位置（屏幕高度的10%-90%）
                const topPos = 10 + Math.random() * 80;
                stripe.style.top = `${topPos}%`;
                
                // 随机高度
                stripe.style.height = `${2 + Math.random() * 4}px`;
                
                // 随机颜色
                const color = colors[Math.floor(Math.random() * colors.length)];
                stripe.style.backgroundColor = color;
                
                // 随机宽度偏移（模拟撕裂错位）
                const offset = -20 + Math.random() * 40;
                stripe.style.transform = `translateX(${offset}px)`;
                
                // 随机阴影
                stripe.style.boxShadow = `0 0 ${3 + Math.random() * 5}px ${color}`;
                
                glitchElement.appendChild(stripe);
                
                // 触发动画
                setTimeout(() => {
                    stripe.classList.add('active');
                }, i * 20);
            }
        };
        
        const triggerGlitch = () => {
            // 随机决定是否触发（70%概率）
            if (Math.random() > 0.3) {
                // 生成随机位置的撕裂条纹
                createRandomStripes();
                
                // 触发撕裂效果
                glitchElement.classList.add('active');
                
                // 触发左右抖动
                container.classList.add('shaking');
                
                // 80%概率同时触发噪点
                if (Math.random() > 0.2) {
                    setTimeout(() => {
                        noiseElement.classList.add('active');
                    }, 50);
                }
                
                // 移除效果
                setTimeout(() => {
                    glitchElement.classList.remove('active');
                    noiseElement.classList.remove('active');
                    container.classList.remove('shaking');
                    glitchElement.innerHTML = '';
                }, 200);
                
                // 经常连续触发多次（60%概率）
                if (Math.random() > 0.4) {
                    setTimeout(() => {
                        createRandomStripes();
                        glitchElement.classList.add('active');
                        container.classList.add('shaking');
                        setTimeout(() => {
                            glitchElement.classList.remove('active');
                            container.classList.remove('shaking');
                            glitchElement.innerHTML = '';
                        }, 150);
                    }, 300);
                }
            }
            
            // 随机间隔下次触发（1-4秒，更频繁）
            const nextGlitch = 1000 + Math.random() * 3000;
            setTimeout(triggerGlitch, nextGlitch);
        };
        
        // 开始循环
        setTimeout(triggerGlitch, 1500);
    }
    
    /**
     * 初始化Web Audio API
     * 创建音频上下文用于生成科幻音效
     */
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    /**
     * 信号强度条动画
     * 模拟星际通讯信号波动
     */
    animateSignalBars() {
        const bars = this.signalBars.querySelectorAll('.signal-bar');
        setInterval(() => {
            if (this.isActive) {
                bars.forEach((bar, index) => {
                    setTimeout(() => {
                        bar.classList.toggle('active', Math.random() > 0.3);
                    }, index * 100);
                });
            } else {
                bars.forEach(bar => bar.classList.remove('active'));
            }
        }, 2000);
    }
    
    /**
     * 生成触控拨号盘上的节点
     * 按照环形布局排列数字1-9和0
     */
    generateTouchNodes() {
        const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
        // 数字逆时针排序
        const startAngle = -30;
        const angleStep = -30;

        numbers.forEach((num, index) => {
            const angle = startAngle + (index * angleStep);
            const radian = (angle * Math.PI) / 180;
            const x = Math.cos(radian) * this.holeRadius;
            const y = Math.sin(radian) * this.holeRadius;

            const node = document.createElement('div');
            node.className = 'touch-node';
            node.dataset.number = num;
            node.style.left = `calc(50% + ${x}px - 24px)`;
            node.style.top = `calc(50% + ${y}px - 24px)`;
            node.style.setProperty('--node-index', index);
            node.dataset.angle = angle;
            node.dataset.index = index;
            
            // 30%概率添加故障类
            if (Math.random() > 0.7) {
                node.classList.add('glitchy');
            }

            this.dialPlate.appendChild(node);
            this.numberPositions.push({
                number: num,
                angle: angle,
                element: node
            });
        });
    }
    
    /**
     * 绑定所有交互事件
     * 包括耳机点击、拨号盘拖拽等
     */
    bindEvents() {
        // 耳机点击事件
        this.headset.addEventListener('click', () => this.toggleHeadset());
        
        // 拨号盘拖拽事件
        let isDragging = false;
        let startAngle = 0;
        let startRotation = 0;
        let dragStartTime = 0;
        let lastAngle = 0;
        let lastTime = 0;
        
        // 获取鼠标相对于拨盘中心的角度
        const getAngleFromEvent = (e) => {
            const rect = this.dialPlate.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            let angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
            if (angle < 0) angle += 360;
            return angle;
        };

        let selectedTarget = null;
        let cumulativeRotation = 0;

        const startDrag = (e) => {
            if (!this.isActive || this.isDialing) return;

            const target = e.target;
            if (!target.classList.contains('touch-node')) return;

            e.preventDefault();
            isDragging = true;
            this.isDialing = true;
            dragStartTime = Date.now();

            startAngle = getAngleFromEvent(e);
            lastAngle = startAngle;
            cumulativeRotation = this.currentRotation;
            lastTime = dragStartTime;

            selectedTarget = target;

            this.dialPlate.classList.add('dragging');
            this.selectedNumber = target.dataset.number;

            // 播放能量音效
            this.playEnergySound();
        };

        const doDrag = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const currentAngle = getAngleFromEvent(e);
            const currentTime = Date.now();

            let angleDiff = currentAngle - lastAngle;

            if (angleDiff > 180) {
                angleDiff = angleDiff - 360;
            } else if (angleDiff < -180) {
                angleDiff = angleDiff + 360;
            }

            cumulativeRotation += angleDiff;

            const number = selectedTarget.dataset.number;
            let maxRotationForNumber;
            switch(number) {
                case '1': maxRotationForNumber = 75; break;
                case '2': maxRotationForNumber = 105; break;
                case '3': maxRotationForNumber = 135; break;
                case '4': maxRotationForNumber = 165; break;
                case '5': maxRotationForNumber = 195; break;
                case '6': maxRotationForNumber = 225; break;
                case '7': maxRotationForNumber = 255; break;
                case '8': maxRotationForNumber = 285; break;
                case '9': maxRotationForNumber = 315; break;
                case '0': maxRotationForNumber = 350; break;
                default: maxRotationForNumber = 270;
            }

            if (cumulativeRotation > maxRotationForNumber) {
                cumulativeRotation = maxRotationForNumber;
            }
            if (cumulativeRotation < 0) {
                cumulativeRotation = 0;
            }

            this.currentRotation = cumulativeRotation;
            this.dialPlate.style.transform = `rotate(${this.currentRotation}deg)`;

            const timeDelta = currentTime - lastTime;
            if (timeDelta > 0) {
                this.rotationVelocity = angleDiff / timeDelta;
            }

            lastAngle = currentAngle;
            lastTime = currentTime;
        };
        
        const endDrag = (e) => {
            if (!isDragging) return;
            isDragging = false;
            this.dialPlate.classList.remove('dragging');

            this.startSpringBack(true);

            selectedTarget = null;
        };
        
        // 鼠标事件
        this.dialPlate.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', endDrag);
        
        // 触摸事件
        this.dialPlate.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('touchmove', doDrag, { passive: false });
        document.addEventListener('touchend', endDrag);
        
        // 便签拖拽事件
        this.initNoteDrag();
    }
    
    /**
     * 初始化便签拖拽功能
     */
    initNoteDrag() {
        const note = document.getElementById('cyberNote');
        let isDragging = false;
        let startX, startY, initialRight, initialTop;
        
        const startDrag = (e) => {
            isDragging = true;
            note.classList.add('dragging');
            
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            
            startX = clientX;
            startY = clientY;
            
            const rect = note.getBoundingClientRect();
            initialRight = window.innerWidth - rect.right;
            initialTop = rect.top;
            
            e.preventDefault();
        };
        
        const doDrag = (e) => {
            if (!isDragging) return;
            
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
            
            const newRight = initialRight - deltaX;
            const newTop = initialTop + deltaY;
            
            // 限制范围
            note.style.right = Math.max(-120, Math.min(window.innerWidth - 180, newRight)) + 'px';
            note.style.top = Math.max(0, Math.min(window.innerHeight - 200, newTop)) + 'px';
            note.style.transform = 'none';
            
            e.preventDefault();
        };
        
        const endDrag = () => {
            isDragging = false;
            note.classList.remove('dragging');
        };
        
        note.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', endDrag);
        
        note.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('touchmove', doDrag, { passive: false });
        document.addEventListener('touchend', endDrag);
    }
    
    /**
     * 切换耳机状态（激活/休眠）
     * 控制通讯频率音的播放和拨号盘的锁定状态
     */
    toggleHeadset() {
        // 如果在通话中，点击耳机是挂电话
        if (this.isInCall) {
            this.hangUp();
            return;
        }
        
        this.isActive = !this.isActive;
        
        if (this.isActive) {
            // 激活通讯
            this.headset.classList.add('active');
            this.dialPlate.classList.remove('locked');
            this.statusLight.classList.add('active');
            this.playCommTone();
            this.playBootSound();
        } else {
            // 休眠通讯
            this.headset.classList.remove('active');
            this.dialPlate.classList.add('locked');
            this.statusLight.classList.remove('active');
            this.stopCommTone();
            this.playShutdownSound();
            
            // 清空频率
            this.dialedNumbers = [];
            this.updateDisplay();
        }
    }
    
    /**
     * 挂电话
     */
    hangUp() {
        this.isInCall = false;
        this.headset.classList.remove('active');
        this.dialPlate.classList.add('locked');
        this.statusLight.classList.remove('active');
        this.stopCommTone();
        this.playShutdownSound();
        this.resetDisplay();
    }
    
    /**
     * 开始回弹动画
     * 使用纯阻尼回滚
     * @param {boolean} playSound - 是否播放声音
     */
    startSpringBack(playSound = false) {
        let maxRotationForNumber;
        switch(this.selectedNumber) {
            case '1': maxRotationForNumber = 75; break;
            case '2': maxRotationForNumber = 105; break;
            case '3': maxRotationForNumber = 135; break;
            case '4': maxRotationForNumber = 165; break;
            case '5': maxRotationForNumber = 195; break;
            case '6': maxRotationForNumber = 225; break;
            case '7': maxRotationForNumber = 255; break;
            case '8': maxRotationForNumber = 285; break;
            case '9': maxRotationForNumber = 315; break;
            case '0': maxRotationForNumber = 350; break;
            default: maxRotationForNumber = 270;
        }

        const hasReachedMaxRotation = this.currentRotation >= (maxRotationForNumber - 5);

        if (playSound && hasReachedMaxRotation) {
            this.playDataTransmitSound();
        }

        let returnVelocity = Math.max(3, this.currentRotation * 0.06);
        const friction = 0.96;

        const animate = () => {
            returnVelocity *= friction;

            if (returnVelocity < 0.8) {
                returnVelocity = 0.5;
            }

            this.currentRotation -= returnVelocity;

            if (this.currentRotation <= 0) {
                this.currentRotation = 0;
                this.dialPlate.style.transform = `rotate(0deg)`;
                this.isDialing = false;
                this.hasTriggeredReturn = false;

                if (this.selectedNumber && hasReachedMaxRotation) {
                    this.recordNumber(this.selectedNumber);
                }
                this.selectedNumber = null;

                if (playSound && hasReachedMaxRotation) {
                    this.playConfirmSound();
                }
                return;
            }

            this.dialPlate.style.transform = `rotate(${this.currentRotation}deg)`;
            requestAnimationFrame(animate);
        };

        animate();
    }
    
    /**
     * 记录拨号数字
     * @param {string} number - 拨号的数字
     */
    recordNumber(number) {
        if (this.dialedNumbers.length < 3) {
            this.dialedNumbers.push(number);
            this.updateDisplay();
            
            // 每次拨号后随机重置数字故障状态
            this.randomizeGlitchyNumbers();
            
            // 如果拨满3位，自动拨打电话
            if (this.dialedNumbers.length === 3) {
                setTimeout(() => this.autoDial(), 500);
            }
        }
    }
    
    /**
     * 自动拨打电话
     * 播放拨号音后根据号码跳转网页
     */
    autoDial() {
        const number = this.dialedNumbers.join('');
        
        // 停止通讯频率音
        this.stopCommTone();
        
        // 播放拨号音
        this.playDialingTone();
        
        // 显示拨号中状态
        this.display.textContent = 'CALLING';
        this.display.classList.add('calling');
        
        // 2秒后跳转
        setTimeout(() => {
            this.redirectByNumber(number);
        }, 2000);
    }
    
    /**
     * 根据号码跳转网页
     * 先跳转到load.html过渡页面，再由过渡页面跳转到目标
     * @param {string} number - 3位号码
     */
    redirectByNumber(number) {
        const redirects = {
            '101': 'https://github.com/JohnvenTom/',
            '031': 'https://space.bilibili.com/305602111',
            '995': 'tencent://AddContact/?fromId=45&fromSubId=1&subcmd=all&uin=3040791779',
            '404': null,
            '591': 'blackhole.html',
            '173': 'Email.html'
        };
        
        const url = redirects[number];
        
        if (url) {
            // 先跳转到太空赛博朋克风格的过渡页面
            // 将目标URL作为参数传递给load.html
            const loadPageUrl = 'load.html?target=' + encodeURIComponent(url);
            window.location.href = loadPageUrl;
        } else {
            // 未知号码或404，显示错误
            this.display.textContent = 'ERROR';
            this.display.style.color = '#ff6464';
            
            setTimeout(() => {
                this.resetDisplay();
            }, 1500);
        }
    }
    
    /**
     * 重置显示
     */
    resetDisplay() {
        this.dialedNumbers = [];
        this.display.textContent = '---';
        this.display.setAttribute('data-text', '---');
        this.display.classList.add('empty');
        this.display.classList.remove('calling');
        this.display.style.color = '';
        this.isInCall = false;
        this.updateDisplay();
    }
    
    /**
     * 随机重置数字故障状态
     * 每次拨号后随机选择哪些数字显示故障效果
     */
    randomizeGlitchyNumbers() {
        const nodes = this.dialPlate.querySelectorAll('.touch-node');
        nodes.forEach(node => {
            // 移除旧的故障类
            node.classList.remove('glitchy');
            // 30%概率添加故障类
            if (Math.random() > 0.7) {
                node.classList.add('glitchy');
            }
        });
    }
    
    /**
     * 更新显示屏内容
     */
    updateDisplay() {
        if (this.dialedNumbers.length === 0) {
            this.display.textContent = '---';
            this.display.setAttribute('data-text', '---');
            this.display.classList.add('empty');
        } else {
            const text = this.dialedNumbers.join('');
            this.display.textContent = text;
            this.display.setAttribute('data-text', text);
            this.display.classList.remove('empty');
        }
    }
    
    /* ========== 科幻音效生成方法 ========== */
    
    /**
     * 播放通讯频率音
     * 模拟星际通讯的待机频率声
     */
    playCommTone() {
        if (!this.audioContext) return;
        
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc1.frequency.value = 440;
        osc2.frequency.value = 660;
        osc1.type = 'sine';
        osc2.type = 'sine';
        
        gain.gain.value = 0.08;
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc1.start();
        osc2.start();
        
        this.commToneOscillator = { osc1, osc2 };
        this.commToneGain = gain;
    }
    
    /**
     * 停止通讯频率音
     */
    stopCommTone() {
        if (this.commToneOscillator) {
            this.commToneOscillator.osc1.stop();
            this.commToneOscillator.osc2.stop();
            this.commToneOscillator = null;
        }
    }
    
    /**
     * 播放启动音效
     * 系统激活时的科幻启动声
     */
    playBootSound() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.3);
        osc.type = 'sawtooth';
        
        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.5);
    }
    
    /**
     * 播放能量音效
     * 模拟触控时的能量反馈声
     */
    playEnergySound() {
        if (!this.audioContext) return;
        
        const bufferSize = this.audioContext.sampleRate * 0.15;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.1 * Math.exp(-i / bufferSize * 3);
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 5;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.08;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        noise.start();
    }
    
    /**
     * 播放数据传输音效
     * 模拟频率拨号确认时的数据声
     */
    playDataTransmitSound() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.frequency.value = 1200;
        osc.type = 'square';
        
        gain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 800;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }
    
    /**
     * 播放确认音效
     * 回弹到位的确认声
     */
    playConfirmSound() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.frequency.value = 880;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.06, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.15);
    }
    
    /**
     * 播放关闭音效
     * 系统休眠时的科幻关闭声
     */
    playShutdownSound() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.4);
        osc.type = 'sawtooth';
        
        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.4);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.4);
    }
    
    /**
     * 播放拨号音
     * 模拟电话拨号的嘟嘟声
     */
    playDialingTone() {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        
        // 播放3声拨号音
        for (let i = 0; i < 3; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.frequency.value = 440 + i * 50; // 递增音调
            osc.type = 'sine';
            
            const startTime = now + i * 0.4;
            
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
            gain.gain.linearRampToValueAtTime(0.1, startTime + 0.25);
            gain.gain.linearRampToValueAtTime(0, startTime + 0.3);
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.start(startTime);
            osc.stop(startTime + 0.35);
        }
    }
}

// 页面加载完成后初始化通讯终端
document.addEventListener('DOMContentLoaded', () => {
    new InterstellarTerminal();
});
