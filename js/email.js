/**
 * 星际通讯表单控制器
 * 管理飞船指针动画、输入验证和勾选动画
 */
const table = {
    hand: document.querySelector(".spaceship"),
    timeline: gsap.timeline(),
    offset_distance: 0,

    /**
     * 根据勾选框位置重新计算飞船指针尺寸和位置
     */
    resize() {
        let refer_rect = document.querySelector(".row_selectbox").getBoundingClientRect();
        this.offset_distance = refer_rect.height / 3;
        this.hand.style.height = `${refer_rect.height * 5}px`;
        this.hand.style.left = `${refer_rect.left}px`;
        this.hand.style.top = `${refer_rect.top - this.hand.offsetHeight / 2 + this.offset_distance + scrollY}px`;
    },

    /**
     * 输入框获得焦点时飞船飞向该行
     * @param {HTMLElement} ele - 获得焦点的输入框
     */
    focus(ele) {
        let axis_y = ele.getBoundingClientRect().top;
        this.timeline.add(
            gsap.to(this.hand, {
                top: `${axis_y - this.hand.offsetHeight / 2 + this.offset_distance + scrollY}px`,
                duration: 0.4,
                ease: "linear",
            })
        );
    },

    /**
     * 输入框失去焦点时判断是否填写完成
     * 有内容则触发完成动画，清空则触发取消动画
     * @param {HTMLElement} ele - 失去焦点的输入框
     */
    blur(ele) {
        let if_finish = parseInt(ele.getAttribute("if_finish"));
        if (ele.value != '' && !if_finish) {
            ele.setAttribute("if_finish", 1);
            this.input_finish_animate(ele);
        };
        if (ele.value == '' && if_finish) {
            ele.setAttribute("if_finish", 0);
            this.input_unfinish_animate(ele);
        };
    },

    /**
     * 输入完成动画 - 飞船抖动确认并勾选
     * @param {HTMLElement} ele - 完成输入的元素
     */
    input_finish_animate(ele) {
        let svg = ele.nextElementSibling;
        let checkPath = svg.querySelector('path:nth-child(2)');
        gsap.killTweensOf([svg, checkPath]);
        svg.style.opacity = '';
        checkPath.style.strokeDashoffset = '';
        this.timeline.add(
            gsap.timeline()
                .to(this.hand, {
                    rotate: '5deg',
                    x: "3%",
                    y: "7%",
                    duration: 0.2,
                    ease: "linear",
                    onStart: () => {
                        svg.classList.add("row_selectbox_finish");
                    }
                })
                .to(this.hand, {
                    rotate: '-2deg',
                    x: "9%",
                    y: "-6%",
                    duration: 0.2,
                    ease: "linear",
                })
                .to(this.hand, {
                    rotate: 0,
                    x: 0,
                    y: 0,
                    duration: 0.3,
                    ease: "linear",
                })
        );
    },

    /**
     * 取消完成动画 - 飞船回退并取消勾选（带淡出效果）
     * @param {HTMLElement} ele - 取消输入的元素
     */
    input_unfinish_animate(ele) {
        let svg = ele.nextElementSibling;
        this.timeline.add(
            gsap.timeline()
                .to(this.hand, {
                    x: "-25%",
                    y: "10%",
                    duration: 0.3,
                    ease: "linear",
                })
                .to(svg, {
                    opacity: 0.3,
                    duration: 0.25,
                    ease: "power2.in",
                }, "-=0.1")
                .to(svg.querySelector('path:nth-child(2)'), {
                    strokeDashoffset: 150,
                    duration: 0.35,
                    ease: "power2.inOut",
                }, "-=0.2")
                .to(this.hand, {
                    x: 0,
                    y: 0,
                    duration: 0.2,
                    ease: "linear",
                })
                .to(svg, {
                    opacity: 1,
                    duration: 0.2,
                    ease: "power2.out",
                    onStart: () => {
                        svg.classList.remove("row_selectbox_finish");
                    }
                }, "-=0.1")
        );
    },
}

/**
 * textarea自动扩容
 * 根据内容动态调整高度
 */
const textarea = document.querySelector('.ctr_textarea');
textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

/**
 * 表单提交验证 + 成功后自动跳转
 * 验证通过后：设置标记 → fetch发送表单 → 成功才跳转blackhole.html
 */
document.getElementById('mailForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const inputs = document.querySelectorAll('.row_input');
    let allFinished = true;
    inputs.forEach(input => {
        if (input.value === '') {
            allFinished = false;
            input.style.borderColor = 'rgba(255, 100, 100, 0.6)';
            setTimeout(() => {
                input.style.borderColor = '';
            }, 1500);
        }
    });

    if (!allFinished) return;

    const btn = document.querySelector('.send-btn');
    btn.textContent = '⚡ TRANSMITTING...';
    btn.style.letterSpacing = '0.15rem';
    btn.style.background = 'rgba(0, 255, 200, 0.2)';
    btn.style.boxShadow = '0 0 30px rgba(0, 255, 200, 0.4)';
    btn.disabled = true;

    sessionStorage.setItem('fromEmailSubmit', 'true');

    const formData = new FormData(this);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    fetch('https://formsubmit.co/ajax/3040791779@qq.com', {
        method: 'POST',
        body: formData,
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        if (response.ok || response.type === 'opaque') {
            window.location.href = 'blackhole.html';
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    })
    .catch(error => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.warn('请求超时，已自动取消');
            btn.textContent = '⏳ TIMEOUT - RETRY';
        } else {
            console.error('发送异常:', error);
            btn.textContent = '❌ FAILED - RETRY';
        }
        btn.style.letterSpacing = '0.2rem';
        btn.style.background = 'rgba(255, 80, 80, 0.15)';
        btn.style.borderColor = 'rgba(255, 100, 100, 0.5)';
        btn.disabled = false;
        setTimeout(() => {
            btn.textContent = 'Transmit';
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.style.boxShadow = '';
            btn.style.letterSpacing = '';
        }, 2500);
    });
});

window.addEventListener("load", () => {
    table.resize();
    initCustomCursor();
    initStarfield();
});
window.addEventListener("resize", () => {
    table.resize();
});

/**
 * 星空背景控制器
 * 动态生成闪烁星星和随机流星
 */
function initStarfield() {
    const container = document.getElementById('starfield');
    const blinkStyles = ['starBlinkA', 'starBlinkB', 'starBlinkC'];
    const starColors = [
        '#ffffff', 'rgba(0,255,200,0.9)', 'rgba(100,200,255,0.85)',
        'rgba(150,100,255,0.8)', 'rgba(255,255,255,0.7)'
    ];

    /**
     * 生成随机位置的闪烁星星
     * @param {number} count - 星星数量
     */
    function createStars(count) {
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            const size = Math.random() * 2 + 0.5;
            star.style.width = size + 'px';
            star.style.height = size + 'px';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.background = starColors[Math.floor(Math.random() * starColors.length)];
            const animStyle = blinkStyles[Math.floor(Math.random() * blinkStyles.length)];
            star.style.animation = `${animStyle} ${2 + Math.random() * 4}s ease-in-out infinite`;
            star.style.animationDelay = (Math.random() * 5) + 's';
            container.appendChild(star);
        }
    }

    /**
     * 创建单颗流星并播放动画后自动销毁
     * 大小、存活时间、飞行距离均随机化
     */
    function spawnMeteor() {
        const meteor = document.createElement('div');
        meteor.className = 'meteor';
        const size = 60 + Math.random() * 140;
        const headSize = 1.5 + size * 0.015;
        const dist = 250 + size * 2.5;
        meteor.style.width = size + 'px';
        meteor.style.height = (1 + Math.random() * 1.5) + 'px';
        meteor.style.left = (20 + Math.random() * 75) + '%';
        meteor.style.top = (-10 + Math.random() * 45) + '%';
        meteor.style.setProperty('--head-size', headSize + 'px');
        meteor.style.setProperty('--dist', -dist + 'px');
        meteor.style.setProperty('--dist-y', dist * 0.7 + 'px');
        const duration = 1.2 + Math.random() * 2.8;
        meteor.style.setProperty('--dur', duration + 's');
        meteor.style.animation = `meteorFall ${duration}s linear forwards`;
        container.appendChild(meteor);
        meteor.addEventListener('animationend', () => meteor.remove());
    }

    createStars(60);

    setInterval(() => {
        if (Math.random() > 0.3) spawnMeteor();
    }, 2500);

    setTimeout(spawnMeteor, 800);
    setTimeout(spawnMeteor, 1800);
}

/**
 * 自定义光标控制器
 * 管理Lottie动画光标、出场动画和点击交互
 */
function initCustomCursor() {
    const cursorContainer = document.getElementById('customCursor');
    let introAnim, clickAnim;
    let isIntroComplete = false;

    /**
     * 初始化出场动画 - in-dynamic.json
     * 页面加载时播放一次，结束后暂停在最后一帧
     */
    introAnim = lottie.loadAnimation({
        container: cursorContainer,
        renderer: 'svg',
        loop: false,
        autoplay: true,
        path: 'asset/json/wired-outline-35-edit-in-dynamic.json'
    });

    /**
     * 出场动画完成事件
     * 动画结束后销毁实例并清空容器，再加载点击动画
     */
    introAnim.addEventListener('complete', () => {
        isIntroComplete = true;
        introAnim.destroy();
        cursorContainer.innerHTML = '';

        /**
         * 初始化点击动画 - hover-line.json
         * 初始状态为暂停，等待用户点击触发
         */
        clickAnim = lottie.loadAnimation({
            container: cursorContainer,
            renderer: 'svg',
            loop: false,
            autoplay: false,
            path: 'asset/json/wired-outline-35-edit-hover-line.json'
        });
        clickAnim.goToAndStop(0, true);
    });

    /**
     * 鼠标移动事件
     * 记录目标位置，由requestAnimationFrame驱动平滑插值跟随
     */
    let cursorTargetX = 0, cursorTargetY = 0;
    let cursorCurrentX = 0, cursorCurrentY = 0;
    document.addEventListener('mousemove', (e) => {
        cursorTargetX = e.clientX;
        cursorTargetY = e.clientY;
    });
    function smoothCursorFollow() {
        cursorCurrentX += (cursorTargetX - cursorCurrentX) * 0.12;
        cursorCurrentY += (cursorTargetY - cursorCurrentY) * 0.12;
        cursorContainer.style.left = cursorCurrentX + 'px';
        cursorContainer.style.top = cursorCurrentY + 'px';
        requestAnimationFrame(smoothCursorFollow);
    }
    requestAnimationFrame(smoothCursorFollow);

    /**
     * 点击事件处理
     * 播放hover-line点击动画，每次点击从头开始播放
     */
    document.addEventListener('click', () => {
        if (isIntroComplete && clickAnim) {
            clickAnim.goToAndStop(0, true);
            clickAnim.play();
        }
    });
}

document.querySelectorAll('.row_input').forEach(input => {
    input.addEventListener('focus', function() {
        table.focus(this);
    });
    input.addEventListener('blur', function() {
        table.blur(this);
    });
});
