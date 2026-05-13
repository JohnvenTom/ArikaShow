/**
 * 星际通讯控制器
 * 负责管理通讯连接动画、信号显示和页面跳转
 */
class InterstellarComm {
    constructor() {
        // 目标页面URL
        this.targetUrl = this.getTargetUrl();

        // 进度状态
        this.progress = 0;
        this.isComplete = false;

        // DOM元素
        this.progressBar = document.getElementById('progressBar');
        this.freqValue = document.getElementById('freqValue');
        this.statusInfo = document.getElementById('statusInfo');
        this.signalIndicator = document.getElementById('signalIndicator');
        this.connectSuccess = document.getElementById('connectSuccess');

        // 状态消息列表
        this.statusMessages = [
            { progress: 0, message: '建立连接...' },
            { progress: 15, message: '扫描频率...' },
            { progress: 30, message: '信号同步中...' },
            { progress: 45, message: '验证通讯协议...' },
            { progress: 60, message: '加密通道建立...' },
            { progress: 75, message: '信号增强中...' },
            { progress: 90, message: '通讯就绪...' },
            { progress: 100, message: '连接成功' }
        ];

        // 频率值
        this.baseFreq = 1010;

        // 初始化
        this.init();
    }

    /**
     * 从URL参数获取目标页面
     * @returns {string} 目标页面URL
     */
    getTargetUrl() {
        const params = new URLSearchParams(window.location.search);
        const target = params.get('target');
        return target || 'contact call.html';
    }

    /**
     * 初始化系统
     */
    init() {
        this.generateStars();
        this.startSignalAnimation();
        this.startProgress();
        this.startFreqAnimation();
        // 启动随机撕裂效果
        this.startRandomGlitch();
    }

    /**
     * 启动随机撕裂效果
     * 随机触发多种画面横向撕裂效果
     */
    startRandomGlitch() {
        const triggerGlitch = () => {
            // 随机决定是否触发（40%概率）
            if (Math.random() > 0.6) {
                this.triggerGlitchEffect();
            }
            // 随机间隔下次触发（0.5-2秒）
            const nextGlitch = 500 + Math.random() * 1500;
            setTimeout(triggerGlitch, nextGlitch);
        };
        // 首次延迟后启动
        setTimeout(triggerGlitch, 1000);
    }

    /**
     * 触发画面撕裂效果
     * 包含整体抖动、终端撕裂和随机条纹
     */
    triggerGlitchEffect() {
        const terminal = document.querySelector('.comm-terminal');
        const body = document.body;
        const overlay = document.getElementById('glitchOverlay');

        // 1. 整体画面抖动
        body.classList.add('screen-shake');
        setTimeout(() => body.classList.remove('screen-shake'), 150);

        // 2. 通讯终端撕裂效果
        if (terminal) {
            terminal.classList.add('glitch-tear');
            setTimeout(() => terminal.classList.remove('glitch-tear'), 200);
        }

        // 3. 生成随机撕裂条纹
        this.createTearStripes();

        // 4. 经常连续触发多次（50%概率）
        if (Math.random() > 0.5) {
            setTimeout(() => this.triggerGlitchEffect(), 200);
        }
    }

    /**
     * 创建随机撕裂条纹
     */
    createTearStripes() {
        const overlay = document.getElementById('glitchOverlay');
        if (!overlay) return;

        // 清除旧条纹
        overlay.innerHTML = '';
        overlay.classList.add('active');

        // 随机生成2-5条撕裂条纹
        const stripeCount = 2 + Math.floor(Math.random() * 4);
        const colors = [
            'rgba(0, 255, 200, 0.3)',
            'rgba(0, 200, 255, 0.3)',
            'rgba(255, 0, 100, 0.2)',
            'rgba(255, 255, 0, 0.2)',
            'rgba(255, 255, 255, 0.4)'
        ];

        for (let i = 0; i < stripeCount; i++) {
            const stripe = document.createElement('div');
            stripe.className = 'tear-stripe';

            // 随机位置（屏幕高度的10%-90%）
            const topPos = 10 + Math.random() * 80;
            stripe.style.top = `${topPos}%`;

            // 随机高度
            stripe.style.height = `${2 + Math.random() * 4}px`;

            // 随机颜色
            const color = colors[Math.floor(Math.random() * colors.length)];
            stripe.style.backgroundColor = color;
            stripe.style.boxShadow = `0 0 ${3 + Math.random() * 5}px ${color}`;

            // 随机宽度偏移（模拟撕裂错位）
            const offset = -20 + Math.random() * 40;
            stripe.style.transform = `translateX(${offset}px)`;

            overlay.appendChild(stripe);

            // 触发动画
            setTimeout(() => {
                stripe.classList.add('active');
            }, i * 30);
        }

        // 清理
        setTimeout(() => {
            overlay.classList.remove('active');
            overlay.innerHTML = '';
        }, 200);
    }

    /**
     * 生成星空背景
     */
    generateStars() {
        const starsContainer = document.getElementById('stars');
        // 更多星星：从100增加到250
        const starCount = 250;

        // 星星类型分布
        const starTypes = [
            { class: 'dim', weight: 30 },
            { class: 'normal', weight: 35 },
            { class: 'bright', weight: 20 },
            { class: 'super-bright', weight: 8 },
            { class: 'blue', weight: 4 },
            { class: 'cyan', weight: 3 }
        ];

        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');

            // 根据权重随机选择星星类型
            const random = Math.random() * 100;
            let cumulativeWeight = 0;
            let starClass = 'normal';
            for (const type of starTypes) {
                cumulativeWeight += type.weight;
                if (random <= cumulativeWeight) {
                    starClass = type.class;
                    break;
                }
            }
            star.className = `star ${starClass}`;

            // 随机位置
            const x = Math.random() * 100;
            const y = Math.random() * 100;

            // 根据类型设置大小
            let size;
            switch (starClass) {
                case 'dim': size = 1 + Math.random() * 1.5; break;
                case 'normal': size = 1.5 + Math.random() * 2; break;
                case 'bright': size = 2 + Math.random() * 2; break;
                case 'super-bright': size = 2.5 + Math.random() * 2.5; break;
                case 'blue':
                case 'cyan': size = 2 + Math.random() * 2; break;
                default: size = 1.5 + Math.random() * 2;
            }

            // 更随机的闪烁参数
            // 持续时间：0.3-2.5秒（更快更随机）
            const duration = 0.3 + Math.random() * 2.2;
            // 延迟：0-8秒（更分散）
            const delay = Math.random() * 8;
            // 最小/最大透明度（更随机）
            const minOpacity = 0.2 + Math.random() * 0.4;
            const maxOpacity = 0.7 + Math.random() * 0.3;
            // 最小/最大缩放（更随机）
            const minScale = 0.8 + Math.random() * 0.4;
            const maxScale = 1.2 + Math.random() * 0.8;

            star.style.left = `${x}%`;
            star.style.top = `${y}%`;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.setProperty('--duration', `${duration}s`);
            star.style.setProperty('--delay', `${delay}s`);
            star.style.setProperty('--min-opacity', minOpacity);
            star.style.setProperty('--max-opacity', maxOpacity);
            star.style.setProperty('--min-scale', minScale);
            star.style.setProperty('--max-scale', maxScale);

            starsContainer.appendChild(star);
        }
    }

    /**
     * 启动信号条动画
     */
    startSignalAnimation() {
        const bars = this.signalIndicator.querySelectorAll('.signal-bar');
        let activeIndex = 0;

        setInterval(() => {
            bars.forEach((bar, index) => {
                bar.classList.toggle('active', index <= activeIndex);
            });
            activeIndex = (activeIndex + 1) % bars.length;
        }, 300);
    }

    /**
     * 启动频率动画
     */
    startFreqAnimation() {
        setInterval(() => {
            if (this.isComplete) return;
            const randomOffset = Math.floor(Math.random() * 20) - 10;
            const freq = this.baseFreq + randomOffset;
            this.freqValue.textContent = freq.toString().padStart(4, '0');
        }, 100);
    }

    /**
     * 开始进度动画
     */
    startProgress() {
        const duration = 2500;
        const startTime = Date.now();

        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const rawProgress = Math.min((elapsed / duration) * 100, 100);

            this.progress = this.easeOutCubic(rawProgress / 100) * 100;

            this.updateUI();
            this.updateStatusMessage();

            if (this.progress < 100) {
                requestAnimationFrame(updateProgress);
            } else {
                this.onComplete();
            }
        };

        requestAnimationFrame(updateProgress);
    }

    /**
     * 缓动函数 - easeOutCubic
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    /**
     * 更新UI显示
     */
    updateUI() {
        this.progressBar.style.width = `${this.progress}%`;
    }

    /**
     * 更新状态消息
     */
    updateStatusMessage() {
        const message = this.statusMessages
            .slice()
            .reverse()
            .find(m => this.progress >= m.progress);

        if (message && this.statusInfo.textContent !== message.message) {
            this.statusInfo.innerHTML = message.message + '<span class="cursor"></span>';
        }
    }

    /**
     * 进度完成回调
     */
    onComplete() {
        if (this.isComplete) return;
        this.isComplete = true;

        // 显示连接成功效果
        this.triggerSuccessEffect();

        // 延迟后跳转
        setTimeout(() => {
            window.location.href = this.targetUrl;
        }, 1000);
    }

    /**
     * 触发连接成功效果
     */
    triggerSuccessEffect() {
        this.connectSuccess.classList.add('active');
        this.freqValue.textContent = 'CONNECTED';
        this.freqValue.style.color = '#00ff88';

        // 播放音效（如果支持）
        this.playConnectSound();
    }

    /**
     * 播放连接成功音效
     */
    playConnectSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();

            osc.frequency.setValueAtTime(440, audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);

            osc.type = 'sine';

            gain.gain.setValueAtTime(0.1, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.start();
            osc.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.warn('Audio not supported');
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new InterstellarComm();
});
