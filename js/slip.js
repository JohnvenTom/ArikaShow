/**
 * 自定义 Lottie 鼠标控制器
 * @description 使用 Lottie 动画作为自定义鼠标，实现软跟随效果，拖拽时切换动画，视频悬停时切换播放动画
 */
const customCursor = {
    cursor: document.getElementById('customCursor'),
    lottieInstance: null,
    animationCache: {},
    mouseX: window.innerWidth / 2,
    mouseY: window.innerHeight / 2,
    cursorX: window.innerWidth / 2,
    cursorY: window.innerHeight / 2,
    speed: 0.15,
    isActive: true,
    isDragging: false,
    isOverVideo: false,
    videoState: 'none',
    currentAnimation: 'normal',
    normalAnimationPath: 'asset/json/system-regular-715-spinner-horizontal-dashed-circle-loop-jab.json',
    dragAnimationPath: 'asset/json/system-regular-715-spinner-horizontal-dashed-circle-loop-transparency.json',
    playAnimationPath: 'asset/json/system-regular-26-play-morph-play-pause.json',

    /**
     * 预加载所有 Lottie 动画 JSON 到内存缓存
     * 后续切换动画时直接使用缓存数据，不再发起网络请求
     */
    preloadAnimations() {
        const paths = [
            this.normalAnimationPath,
            this.dragAnimationPath,
            this.playAnimationPath
        ];
        paths.forEach(path => {
            fetch(path)
                .then(res => res.json())
                .then(data => {
                    this.animationCache[path] = data;
                })
                .catch(() => {});
        });
    },

    init() {
        if (window.matchMedia('(pointer: coarse)').matches) {
            this.cursor.style.display = 'none';
            document.body.style.cursor = 'auto';
            return;
        }

        this.preloadAnimations();
        this.loadAnimation(this.normalAnimationPath);

        // 绑定鼠标移动事件 - 使用捕获阶段确保优先处理
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        }, true);

        // 全局捕获鼠标位置，确保拖拽时也能更新
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        }, { capture: true, passive: true });

        // 监听拖拽状态变化
        this.setupDragListeners();

        // 开始动画循环
        this.animate();

        // 鼠标离开窗口时隐藏
        document.addEventListener('mouseleave', () => {
            this.cursor.style.opacity = '0';
        });

        // 鼠标进入窗口时显示
        document.addEventListener('mouseenter', () => {
            this.cursor.style.opacity = '1';
        });
    },

    /**
     * 加载 Lottie 动画
     * @param {string} path - 动画文件路径
     */
    loadAnimation(path) {
        this.cursor.classList.add('switching');

        setTimeout(() => {
            if (this.lottieInstance) {
                this.lottieInstance.destroy();
            }

            this.cursor.innerHTML = '';

            const isPlayAnimation = path === this.playAnimationPath;
            const cachedData = this.animationCache[path];

            const config = {
                container: this.cursor,
                renderer: 'svg',
                loop: !isPlayAnimation,
                autoplay: true
            };

            if (cachedData) {
                config.animationData = cachedData;
            } else {
                config.path = path;
            }

            this.lottieInstance = lottie.loadAnimation(config);

            if (isPlayAnimation) {
                this.setupPlayAnimation();
            }

            this.cursor.classList.remove('switching');
        }, 150);
    },

    /**
     * 设置播放动画的帧控制
     * @description 根据视频状态控制播放动画的播放方向和帧范围
     */
    setupPlayAnimation() {
        if (!this.lottieInstance) return;

        // 获取动画总帧数
        const totalFrames = this.lottieInstance.totalFrames;

        if (this.videoState === 'playing') {
            // 播放状态：从前往后播放（播放图标 -> 暂停图标）
            this.lottieInstance.setDirection(1);
            this.lottieInstance.goToAndPlay(0, true);
        } else if (this.videoState === 'paused') {
            // 暂停状态：从后往前播放（暂停图标 -> 播放图标）
            this.lottieInstance.setDirection(-1);
            this.lottieInstance.goToAndPlay(totalFrames - 1, true);
        } else {
            // 悬停状态：停在第一帧（显示播放图标）
            this.lottieInstance.goToAndStop(0, true);
        }
    },

    /**
     * 设置拖拽状态监听
     * @description 监听拖拽开始和结束事件，切换鼠标动画
     */
    setupDragListeners() {
        const photosContainer = document.querySelector('.photos');
        if (!photosContainer) return;

        // 拖拽开始
        photosContainer.addEventListener('mousedown', () => {
            if (!this.isDragging) {
                this.isDragging = true;
                this.loadAnimation(this.dragAnimationPath);
            }
        });

        // 拖拽结束
        const endDrag = () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.loadAnimation(this.normalAnimationPath);
            }
        };

        document.addEventListener('mouseup', endDrag);
        document.addEventListener('mouseleave', endDrag);

        // 触摸设备支持
        photosContainer.addEventListener('touchstart', () => {
            if (!this.isDragging) {
                this.isDragging = true;
                this.loadAnimation(this.dragAnimationPath);
            }
        }, { passive: true });

        document.addEventListener('touchend', endDrag);
    },

    /**
     * 设置视频悬停监听
     * @description 监听视频悬停、播放、暂停事件，切换鼠标动画
     * @param {HTMLVideoElement} video - 视频元素
     * @param {HTMLElement} videoContainer - 视频容器元素
     */
    setupVideoCursor(video, videoContainer) {
        if (!video || !videoContainer) return;

        // 鼠标进入视频区域
        videoContainer.addEventListener('mouseenter', () => {
            if (this.isDragging) return; // 拖拽时不切换
            this.isOverVideo = true;

            if (video.paused) {
                // 视频暂停时，显示播放图标（悬停状态）
                this.videoState = 'none';
                this.currentAnimation = 'play';
                this.loadAnimation(this.playAnimationPath);
            } else {
                // 视频播放中，保持当前状态
                this.videoState = 'playing';
            }
        });

        // 鼠标离开视频区域
        videoContainer.addEventListener('mouseleave', () => {
            this.isOverVideo = false;
            this.videoState = 'none';

            if (this.currentAnimation === 'play') {
                this.currentAnimation = 'normal';
                this.loadAnimation(this.normalAnimationPath);
            }
        });

        // 视频播放事件
        video.addEventListener('play', () => {
            if (this.isOverVideo && !this.isDragging) {
                this.videoState = 'playing';
                this.currentAnimation = 'play';
                this.loadAnimation(this.playAnimationPath);
            }
        });

        // 视频暂停事件
        video.addEventListener('pause', () => {
            if (this.isOverVideo && !this.isDragging) {
                this.videoState = 'paused';
                this.currentAnimation = 'play';
                this.loadAnimation(this.playAnimationPath);
            }
        });
    },

    /**
     * 动画循环
     * @description 使用线性插值实现软跟随效果
     */
    animate() {
        if (!this.isActive) return;

        // 线性插值计算当前位置
        this.cursorX += (this.mouseX - this.cursorX) * this.speed;
        this.cursorY += (this.mouseY - this.cursorY) * this.speed;

        // 应用位置
        this.cursor.style.left = this.cursorX + 'px';
        this.cursor.style.top = this.cursorY + 'px';

        // 继续下一帧
        requestAnimationFrame(() => this.animate());
    },

    /**
     * 销毁自定义鼠标
     */
    destroy() {
        this.isActive = false;
        if (this.lottieInstance) {
            this.lottieInstance.destroy();
        }
    }
};

// 初始化自定义鼠标
customCursor.init();

/**
 * 赛博展示柜 - 无限滑动控制器
 * @description 基于GSAP实现的无限滑动展示柜，支持鼠标拖拽浏览，赛博朋克风格UI
 * 核心原理：每张卡片记录初始位置(x,y)和累积偏移量(mov_x,mov_y)，
 * 通过transform:translate实现位移；超出容器边界时瞬间回绕到对面，形成无限循环效果
 * @param {HTMLElement} container - 展示柜容器元素
 * @param {Array} img_data - 图片数据数组，存储每张图片的位置、偏移量和动画引用
 * @param {number} container_width - 容器宽度(px)
 * @param {number} container_height - 容器高度(px)
 * @param {number} photo_width - 单张卡片宽度(px)
 * @param {number} photo_height - 单张卡片高度(px)
 * @param {boolean} if_movable - 用户是否正在拖动标记
 * @param {number} mouse_x - 拖动起始/上一帧鼠标X坐标
 * @param {number} mouse_y - 拖动起始/上一帧鼠标Y坐标
 * @param {number} standard_width - 设计基准宽度(1440px)，用于响应式缩放计算
 * @param {number} scale_nums - 当前视口相对基准宽度的缩放比例
 * @param {boolean} is_animating - GSAP惯性动画是否正在执行标记
 * @param {number} animation_end_time - 预计动画结束的时间戳
 */
const photobox = {
    container: document.querySelector(".photos"),
    img_data: [],
    container_width: 0,
    container_height: 0,
    photo_width: 0,
    photo_height: 0,
    if_movable: false,
    mouse_x: 0,
    mouse_y: 0,
    standard_width: 1440,
    scale_nums: 1,
    is_animating: false,
    animation_end_time: 0,
    expanded_card: null,
    is_expanded: false,
    drag_start_x: 0,
    drag_start_y: 0,
    has_dragged: false,
    drag_threshold: 5,
    overlay: null,
    slider_has_dragged: false, // 用于滑动器的拖动标记

    /**
     * 初始化展示柜系统
     * @description 绑定窗口resize事件重新计算布局，绑定鼠标/触摸事件处理拖拽交互，
     * 启动自动漂移循环营造赛博空间动态感。所有事件绑定均遵循参考文件原始逻辑。
     */
    init() {
        this.resize();
        window.addEventListener("resize", () => {
            this.resize();
        });
        this.container.addEventListener("mousedown", (e) => {
            this.if_movable = true;
            this.has_dragged = false;
            this.mouse_x = e.clientX;
            this.mouse_y = e.clientY;
            this.drag_start_x = e.clientX;
            this.drag_start_y = e.clientY;
        });
        this.container.addEventListener("mouseup", () => {
            this.if_movable = false;
        });
        this.container.addEventListener("mouseleave", () => {
            this.if_movable = false;
        });
        this.container.addEventListener("mousemove", (e) => {
            // 检测是否发生了拖拽（移动距离超过阈值）
            if (this.if_movable && !this.has_dragged) {
                const dx = e.clientX - this.drag_start_x;
                const dy = e.clientY - this.drag_start_y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > this.drag_threshold) {
                    this.has_dragged = true;
                }
            }
            this.move(e.clientX, e.clientY);
        });
        this.container.addEventListener("touchstart", (e) => {
            this.if_movable = true;
            this.has_dragged = false;
            this.mouse_x = e.touches[0].clientX;
            this.mouse_y = e.touches[0].clientY;
            this.drag_start_x = e.touches[0].clientX;
            this.drag_start_y = e.touches[0].clientY;
        }, { passive: true });
        this.container.addEventListener("touchend", () => {
            this.if_movable = false;
        });
        this.container.addEventListener("touchmove", (e) => {
            // 检测是否发生了拖拽
            if (this.if_movable && !this.has_dragged) {
                const dx = e.touches[0].clientX - this.drag_start_x;
                const dy = e.touches[0].clientY - this.drag_start_y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > this.drag_threshold) {
                    this.has_dragged = true;
                }
            }
            this.move(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });

        // 绑定卡片点击事件
        this.bindCardClickEvents();
    },

    /**
     * 绑定卡片点击事件
     * @description 为所有卡片添加点击事件，glitch-card触发Glitch动画，
     * 其他卡片放大显示。拖拽后不触发打开
     */
    bindCardClickEvents() {
        const cards = document.querySelectorAll('.photos_line_photo');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.stopPropagation();

                // 如果发生了拖拽，不打开图片
                if (this.has_dragged) {
                    return;
                }

                // 如果已经在放大模式，点击卡片关闭
                if (this.is_expanded) {
                    this.closeExpandedCard();
                    return;
                }

                // 检查是否是Glitch卡片
                if (card.classList.contains('glitch-card')) {
                    this.triggerGlitchEffect(card);
                } else {
                    this.expandCard(card);
                }
            });
        });

        // 点击背景关闭放大模式
        document.addEventListener('click', (e) => {
            if (this.is_expanded && !e.target.closest('.photos_line_photo')) {
                this.closeExpandedCard();
            }
        });

        // ESC键关闭放大模式
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.is_expanded) {
                this.closeExpandedCard();
            }
        });
    },

    /**
     * 触发Glitch故障动画效果
     * @param {HTMLElement} card - 触发效果的卡片元素
     * @description 调用GlitchEffect通用组件触发NO SIGNAL文字的故障动画，
     * 包含随机抖动、裁剪闪烁和RGB色彩分离效果，持续1秒后自动恢复。
     * 此方法作为photobox与GlitchEffect组件之间的桥梁。
     */
    triggerGlitchEffect(card) {
        // 委托给GlitchEffect组件处理
        GlitchEffect.triggerAnimation(card);
    },

    /**
     * 统一项目配置中心
     * @description 集中管理所有项目的媒体资源、描述信息，消除重复代码，提高可维护性
     * 每个项目包含：images(图片列表)、media(混合媒体列表)、title(标题)、content(详细描述)
     */
    projectConfig: {
        '001': {
            images: [
                './asset/img/001/blender_banner.png',
                './asset/img/001/MD.png',
                './asset/img/001/blender_cloth.png',
                './asset/img/001/blender_cloth2.png'
            ],
            title: '三维角色动画<br>与服饰物理仿真',
            content: '使用 Blender + Marvelous Designer 完成角色建模、布料模拟与动画渲染。通过 MMD 动作数据导入，实现角色动画；运用 MD 进行服装设计与物理仿真，模拟真实布料褶皱与飘动效果；最终在 Blender 中完成材质调整、灯光布置与后期合成。'
        },
        '006': {
            images: [
                './asset/img/006/proj.png',
                './asset/img/006/proj_01.png',
                './asset/img/006/proj_02.png',
                './asset/img/006/real_01.jpg',
                './asset/img/006/real_02.jpg'
            ],
            title: 'DIY校卡<br>PCB 设计',
            content: '异形 PCB 设计、文创 PCB 开发、丝印排版、外形定制、超薄板设计、嘉立创 EDA、PCB 艺术化设计、硬件文创创作。打造个性化校卡，从原理图设计到 PCB 布局，再到实物打样，完整的硬件创作流程。'
        },
        '010': {
            media: [
                { type: 'image', src: './asset/img/010/astrbot.png' },
                { type: 'image', src: './asset/img/010/napcat.png' },
                { type: 'video', src: './asset/img/010/2026-05-03 19-19-30.mp4' }
            ],
            title: 'QQ AI 机器人<br>AstrBot + NapCat',
            content: '基于 AstrBot 框架与 NapCat 平台二次开发的智能聊天机器人。支持多种 AI 模型接入，实现群聊管理、自动回复、插件扩展等功能。通过 Python 编写自定义插件，对接各大 LLM API，打造个性化的 QQ 群助手体验。'
        },
        '014': {
            images: [
                './asset/img/014/AE.png',
                './asset/img/014/PR.png'
            ],
            title: 'PR+AE<br>视频制作工作流',
            content: '熟练使用 PR 完成剪辑、精剪、调色与成片整合，精通 AE 动态特效、片头包装，掌握双软件协同全流程制作。能够高效完成视频项目从素材处理到最终输出的全流程工作。'
        },
        '017': {
            images: [
                'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=MintHive%20interest%20social%20platform%20app%20interface%2C%20modern%20UI%20design%20with%20honeycomb%20pattern%2C%20neon%20green%20accent%2C%20dark%20theme%2C%20community%20circles%20network%2C%20AI-powered%20social%20app%20dashboard%2C%20clean%20minimal%20design&image_size=landscape_4_3'
            ],
            title: 'MintHive<br>兴趣社交圈子',
            content: 'MintHive 是一个融合 AI 智能能力的垂直兴趣社交平台，名字取自 Mint（新鲜志趣）+ Hive（蜂巢聚合），寓意同兴趣爱好者相聚成团。支持兴趣圈子社群、实时评论互动、AI 全链路辅助、双重内容审核等核心能力，打造轻量化、高粘性、垂直化的兴趣交流社区。'
        },
        '019': {
            images: [
                './asset/img/019/EChart.png',
                './asset/img/019/fin.png',
                './asset/img/019/flow1.png'
            ],
            title: '自动成绩查询Agent',
            content: '将自然语言问题转化为 MySQL 查询语句，执行后解析分析，生成可视化图表并返回结果。基于 Dify 工作流编排，结合 ECharts 图表渲染，实现智能数据查询与可视化展示。'
        },
        '021': {
            images: [
                './asset/img/021/fin.jpg',
                './asset/img/021/mqttx.png',
                './asset/img/021/thingcloud.png',
                './asset/img/021/stm32cubeide.jpg'
            ],
            title: '超市安防<br>与环境监测物联网系统',
            content: '基于神龙派开发板 + MQTT 协议，使用 STM32CubeIDE 进行开发,接入 ThingsCloud 的环境监测物联网系统。实现温湿度、CO2、光照度等传感器数据实时上报，支持云端远程控制设备开关，使用 MQTTX 进行消息调试，打造完整的物联网解决方案。'
        },
        '022': {
            images: [
                './asset/img/022/flow.png',
                './asset/img/022/ask01.png',
                './asset/img/022/ask02.png',
                './asset/img/022/ask03.png'
            ],
            title: '智能电商<br>问答助手',
            content: '基于 Dify 工作流编排的智能客服系统，集成 RAG 检索增强生成技术，实现意图识别、知识库检索、智能回复全流程自动化处理。支持多种问答场景，提供精准的电商咨询服务。'
        },
        '023': {
            images: [
                './asset/img/023/image.png',
                './asset/img/023/image01.png',
                './asset/img/023/image02.png'
            ],
            title: '线上交易中台系统',
            content: '基于微服务架构的 B2C 交易平台，采用前后端分离设计，涵盖商品管理、用户服务、购物车、订单交易、秒杀系统等核心业务模块，并且涵盖AI助手,实现了完整的线上交易流程，能够承受1k+的高并发请求服务。'
        },
        '028': {
            images: [
                './asset/img/028/orangepi.jpg',
                './asset/img/028/napcat.jpg',
                './asset/img/028/rk3399.jpg'
            ],
            title: 'ARM Linux<br>嵌入式开发',
            content: '独立完成香橙派 Prime、RK3399 开发板 Armbian 系统镜像烧录、TF 卡启动、引导配置、SSH 远程登录与网络环境调试，具备 ARM 架构单板机系统部署与基础运维能力。在开发板上部署 NapCat QQ 机器人，实现 ARM 平台的应用开发。'
        }
    },

    /**
     * 检测卡片对应的项目ID
     * @param {HTMLElement} targetCard - 目标卡片元素
     * @param {HTMLImageElement} img - 卡片中的图片元素
     * @returns {string|null} 项目ID（如 '001', '010' 等），未找到返回 null
     * @description 统一的项目ID检测逻辑，优先检查 data-project 属性，其次从图片路径中提取。
     * 避免在每个项目中重复编写判断逻辑，提高代码复用性。
     */
    detectProjectId(targetCard, img) {
        // 1. 优先从 data-project 属性获取
        const dataProject = targetCard.dataset.project;
        if (dataProject && this.projectConfig[dataProject]) {
            return dataProject;
        }

        // 2. 从图片路径中提取项目编号（匹配 /img/XXX/ 格式）
        if (img && img.src) {
            const match = img.src.match(/\/img\/(\d{3})\//);
            if (match && this.projectConfig[match[1]]) {
                return match[1];
            }
        }

        // 3. 未找到配置
        return null;
    },

    /**
     * 放大指定卡片
     * @param {HTMLElement} targetCard - 要放大的卡片元素
     * @description 创建覆盖层显示放大的卡片，支持多图滑动浏览（配置驱动）
     */
    expandCard(targetCard) {
        if (this.is_expanded) return;

        this.is_expanded = true;
        this.expanded_card = targetCard;
        this.if_movable = false; // 禁用拖动

        // 添加容器状态
        this.container.classList.add('expanded-mode');

        // 获取原卡片的图片和标签信息
        const img = targetCard.querySelector('img');
        const label = targetCard.querySelector('.card-label');
        const index = targetCard.querySelector('.card-index');

        // 通过配置查找项目ID（统一逻辑，消除重复判断）
        const projectId = this.detectProjectId(targetCard, img);
        const config = this.projectConfig[projectId];

        // 创建覆盖层
        this.overlay = document.createElement('div');
        this.overlay.className = 'card-overlay';

        // 创建卡片容器
        const expandedCard = document.createElement('div');
        expandedCard.className = 'expanded-card';

        // 添加装饰角
        ['tl', 'tr', 'bl', 'br'].forEach(pos => {
            const corner = document.createElement('span');
            corner.className = `corner-decor corner-decor--${pos}`;
            expandedCard.appendChild(corner);
        });

        // 根据配置创建对应的展示器（统一使用createSlider）
        if (config) {
            const mediaList = config.media || config.images;
            if (mediaList && mediaList.length > 0) {
                this.createSlider(expandedCard, mediaList, label, index, projectId, { customCursor });
            }
        } else {
            // 未配置的项目：单图显示
            const expandedImg = document.createElement('img');
            expandedImg.src = img ? img.src : '';
            expandedImg.alt = '';
            expandedCard.appendChild(expandedImg);

            // 添加标签
            const expandedLabel = document.createElement('span');
            expandedLabel.className = 'card-label';
            expandedLabel.textContent = label ? label.textContent : '';
            expandedCard.appendChild(expandedLabel);

            // 添加索引
            const expandedIndex = document.createElement('span');
            expandedIndex.className = 'card-index';
            expandedIndex.textContent = index ? index.textContent : '';
            expandedCard.appendChild(expandedIndex);
        }

        this.overlay.appendChild(expandedCard);
        document.body.appendChild(this.overlay);

        // 获取所有原卡片并淡出
        const allCards = document.querySelectorAll('.photos_line_photo');
        allCards.forEach(card => {
            const fadeDelay = Math.random() * 400 + 200;
            setTimeout(() => {
                card.classList.add('fading-out');
            }, fadeDelay);
        });

        // 延迟显示覆盖层
        setTimeout(() => {
            this.overlay.classList.add('active');
        }, 100);

        // 点击背景关闭（点击箭头、指示器、图片、介绍文字时不关闭）
        this.overlay.addEventListener('click', (e) => {
            // 检查是否点击了内部元素
            if (e.target.closest('.slider-arrow') ||
                e.target.closest('.slider-indicator') ||
                e.target.closest('.image-slide') ||
                e.target.closest('.image-description')) {
                return;
            }

            // 点击背景时关闭
            if (e.target === this.overlay) {
                this.closeExpandedCard();
            }
        });
    },

    /**
     * 媒体渲染策略接口
     * @description 定义媒体渲染器的标准接口，支持图片、视频等不同媒体类型
     */
    mediaRenderers: {
        image: (media) => {
            const img = document.createElement('img');
            img.alt = `图片`;
            img.src = media.src;
            return img;
        },
        
        video: (media, options = {}) => {
            const { slideIndex, customCursor } = options;
            
            const videoContainer = document.createElement('div');
            videoContainer.className = 'video-container';
            
            const video = document.createElement('video');
            video.src = media.src;
            video.controls = false;
            video.autoplay = false;
            video.loop = false;
            video.dataset.slideIndex = slideIndex;
            videoContainer.appendChild(video);
            
            const playBtn = document.createElement('div');
            playBtn.className = 'custom-play-btn';
            playBtn.innerHTML = '▶';
            videoContainer.appendChild(playBtn);
            
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (video.paused) {
                    video.play();
                    playBtn.style.opacity = '0';
                    playBtn.style.pointerEvents = 'none';
                }
            });
            
            video.addEventListener('click', (e) => {
                e.stopPropagation();
                if (video.paused) {
                    video.play();
                    playBtn.style.opacity = '0';
                    playBtn.style.pointerEvents = 'none';
                } else {
                    video.pause();
                    playBtn.style.opacity = '1';
                    playBtn.style.pointerEvents = 'auto';
                }
            });
            
            video.addEventListener('ended', () => {
                playBtn.style.opacity = '1';
                playBtn.style.pointerEvents = 'auto';
            });
            
            playBtn.addEventListener('mouseenter', () => {
                playBtn.style.background = 'rgba(0, 240, 255, 0.4)';
                playBtn.style.boxShadow = '0 0 30px rgba(0, 240, 255, 0.6)';
                playBtn.style.transform = 'scale(1.1)';
            });
            playBtn.addEventListener('mouseleave', () => {
                playBtn.style.background = 'rgba(0, 240, 255, 0.2)';
                playBtn.style.boxShadow = '0 0 20px rgba(0, 240, 255, 0.4)';
                playBtn.style.transform = 'scale(1)';
            });
            
            if (customCursor && customCursor.setupVideoCursor) {
                customCursor.setupVideoCursor(video, videoContainer);
            }
            
            return videoContainer;
        }
    },

    /**
     * 统一的滑动器创建函数
     * @param {HTMLElement} container - 容器元素
     * @param {Array} mediaList - 媒体列表（可以是图片路径数组或媒体对象数组）
     * @param {HTMLElement} labelEl - 标签元素
     * @param {HTMLElement} indexEl - 索引元素
     * @param {string} projectId - 项目ID
     * @param {Object} options - 额外选项 { customCursor: object }
     */
    createSlider(container, mediaList, labelEl, indexEl, projectId = '001', options = {}) {
        const { customCursor } = options;
        
        const normalizedMediaList = mediaList.map(media => {
            if (typeof media === 'string') {
                return { type: 'image', src: media };
            }
            return media;
        });
        
        const slider = document.createElement('div');
        slider.className = 'image-slider';
        
        const viewport = document.createElement('div');
        viewport.className = 'image-slider-viewport';
        
        const slides = [];
        
        normalizedMediaList.forEach((media, i) => {
            const slide = document.createElement('div');
            slide.className = 'image-slide';
            if (i === 0) slide.classList.add('active');
            
            const renderer = this.mediaRenderers[media.type] || this.mediaRenderers.image;
            const mediaElement = renderer(media, { slideIndex: i, customCursor });
            
            slide.appendChild(mediaElement);
            viewport.appendChild(slide);
            slides.push(slide);
        });
        
        slider.appendChild(viewport);
        container.appendChild(slider);
        
        const description = document.createElement('div');
        description.className = 'image-description';
        
        const projectDesc = this.projectConfig[projectId] || { title: '项目展示', content: '' };
        description.innerHTML = `
            <div class="description-content">
                <h3>${projectDesc.title}</h3>
                <p>${projectDesc.content}</p>
            </div>
        `;
        container.appendChild(description);
        
        const prevArrow = document.createElement('div');
        prevArrow.className = 'slider-arrow prev';
        prevArrow.innerHTML = '◄';
        container.appendChild(prevArrow);
        
        const nextArrow = document.createElement('div');
        nextArrow.className = 'slider-arrow next';
        nextArrow.innerHTML = '►';
        container.appendChild(nextArrow);
        
        const indicators = document.createElement('div');
        indicators.className = 'slider-indicators';
        normalizedMediaList.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'slider-indicator';
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(i));
            indicators.appendChild(dot);
        });
        container.appendChild(indicators);
        
        const expandedLabel = document.createElement('span');
        expandedLabel.className = 'card-label';
        expandedLabel.textContent = labelEl ? labelEl.textContent : '';
        container.appendChild(expandedLabel);
        
        const expandedIndex = document.createElement('span');
        expandedIndex.className = 'card-index';
        expandedIndex.textContent = `1 / ${normalizedMediaList.length}`;
        container.appendChild(expandedIndex);
        
        let currentIndex = 0;
        
        const pauseAllVideos = () => {
            slides.forEach(slide => {
                const videoContainer = slide.querySelector('.video-container');
                if (videoContainer) {
                    const video = videoContainer.querySelector('video');
                    const playBtn = videoContainer.querySelector('.custom-play-btn');
                    if (video) {
                        video.pause();
                        video.currentTime = 0;
                    }
                    if (playBtn) {
                        playBtn.style.opacity = '1';
                        playBtn.style.pointerEvents = 'auto';
                    }
                }
            });
        };
        
        const updateSlider = () => {
            pauseAllVideos();
            
            slides.forEach((slide, i) => {
                slide.classList.remove('active', 'prev');
                if (i === currentIndex) {
                    slide.classList.add('active');
                } else if (i < currentIndex) {
                    slide.classList.add('prev');
                }
            });
            
            indicators.querySelectorAll('.slider-indicator').forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });
            expandedIndex.textContent = `${currentIndex + 1} / ${normalizedMediaList.length}`;
        };
        
        const goToSlide = (index) => {
            currentIndex = Math.max(0, Math.min(index, normalizedMediaList.length - 1));
            updateSlider();
        };
        
        const nextSlide = () => {
            currentIndex = (currentIndex + 1) % normalizedMediaList.length;
            updateSlider();
        };
        
        const prevSlide = () => {
            currentIndex = (currentIndex - 1 + normalizedMediaList.length) % normalizedMediaList.length;
            updateSlider();
        };
        
        nextArrow.addEventListener('click', (e) => {
            e.stopPropagation();
            nextSlide();
        });
        prevArrow.addEventListener('click', (e) => {
            e.stopPropagation();
            prevSlide();
        });
        
        const keyHandler = (e) => {
            if (e.key === 'ArrowLeft') {
                prevSlide();
            } else if (e.key === 'ArrowRight') {
                nextSlide();
            }
        };
        document.addEventListener('keydown', keyHandler);
        
        this.sliderCleanup = () => {
            document.removeEventListener('keydown', keyHandler);
            pauseAllVideos();
        };
    },

    /**

     * 关闭放大模式
     * @description 恢复所有卡片显示状态，带有平滑的关闭动画和故障效果
     */
    closeExpandedCard() {
        if (!this.is_expanded) return;

        const allCards = document.querySelectorAll('.photos_line_photo');
        const targetCard = this.expanded_card;

        // 先隐藏覆盖层
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }

        // 让原卡片开始淡入
        allCards.forEach(card => {
            card.classList.remove('fading-out');
            card.classList.add('fading-in');
        });

        // 对目标卡片触发故障效果
        if (targetCard) {
            this.triggerCardImageGlitch(targetCard);
        }

        // 延迟清理状态，等待动画完成
        setTimeout(() => {
            // 清理滑动器事件
            if (this.sliderCleanup) {
                this.sliderCleanup();
                this.sliderCleanup = null;
            }

            // 移除覆盖层
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }

            allCards.forEach(card => {
                card.classList.remove('fading-out', 'fading-in', 'hidden-card');
            });

            this.is_expanded = false;
            this.expanded_card = null;
            this.overlay = null;
            this.slider_has_dragged = false; // 重置滑动标记
            this.container.classList.remove('expanded-mode');
        }, 500);
    },

    /**
     * 触发卡片图片的故障效果
     * @param {HTMLElement} card - 目标卡片元素
     */
    triggerCardImageGlitch(card) {
        const img = card.querySelector('img');
        if (!img) return;

        const imgSrc = img.src;
        let glitchInterval;
        let glitchImages = [];
        let verticalBlocks = [];

        // 创建故障覆盖层
        const glitchOverlay = document.createElement('div');
        glitchOverlay.className = 'glitch-overlay';
        glitchOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
            overflow: hidden;
        `;
        card.style.position = 'relative';
        card.appendChild(glitchOverlay);

        // 隐藏原图
        img.style.opacity = '0';

        // ============================================
        // 效果1：模仿 faulttext.html 的效果：多个重叠的图片，随机 clip-path 和偏移
        // ============================================
        const imageCount = 5;
        
        for (let i = 0; i < imageCount; i++) {
            const glitchImg = document.createElement('img');
            glitchImg.src = imgSrc;
            glitchImg.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                user-select: none;
                pointer-events: none;
            `;
            glitchOverlay.appendChild(glitchImg);
            glitchImages.push(glitchImg);
        }

        // ============================================
        // 效果2：竖向切割随机偏移
        // ============================================
        const verticalCount = 10;
        const verticalWidth = 100 / verticalCount;
        
        for (let v = 0; v < verticalCount; v++) {
            const blockWrapper = document.createElement('div');
            blockWrapper.style.cssText = `
                position: absolute;
                top: 0;
                left: -100%;
                width: 300%;
                height: 100%;
                overflow: hidden;
            `;
            
            const blockImg = document.createElement('img');
            blockImg.src = imgSrc;
            blockImg.style.cssText = `
                position: absolute;
                top: 0;
                left: 33.333%;
                width: 33.333%;
                height: 100%;
                object-fit: cover;
                clip-path: inset(0 ${(verticalCount - v - 1) * verticalWidth}% 0 ${v * verticalWidth}%);
            `;
            
            blockWrapper.appendChild(blockImg);
            glitchOverlay.appendChild(blockWrapper);
            verticalBlocks.push(blockWrapper);
        }

        // ============================================
        // 添加红蓝色散层（像 faulttext.html 的伪元素效果）
        // ============================================
        const redLayer = document.createElement('img');
        redLayer.src = imgSrc;
        redLayer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            user-select: none;
            pointer-events: none;
            mix-blend-mode: screen;
            filter: hue-rotate(0deg) saturate(3) brightness(1.2);
        `;
        glitchOverlay.appendChild(redLayer);
        
        const blueLayer = document.createElement('img');
        blueLayer.src = imgSrc;
        blueLayer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            user-select: none;
            pointer-events: none;
            mix-blend-mode: screen;
            filter: hue-rotate(240deg) saturate(3) brightness(1.2);
        `;
        glitchOverlay.appendChild(blueLayer);

        // 动画
        glitchInterval = setInterval(() => {
            // 效果1：faulttext 风格的随机切割偏移
            glitchImages.forEach((glitchImg, index) => {
                glitchImg.style.transform = `translate(${Math.random() * 60 - 30}%, ${Math.random() * 60 - 30}%)`;
                
                let x = Math.random() * 100;
                let y = Math.random() * 100;
                let h = Math.random() * 50 + 50;
                let w = Math.random() * 40 + 10;
                glitchImg.style.clipPath = `polygon(${x}% ${y}%, ${x + w}% ${y}%, ${x + w}% ${y + h}%, ${x}% ${y + h}%)`;
            });
            
            // 效果2：竖向切割随机向左偏移
            verticalBlocks.forEach((block, index) => {
                const random = Math.random();
                const offsetX = -Math.pow(random, 2) * 100;
                block.style.transform = `translateX(${offsetX}px)`;
            });
            
            // 红蓝层也一起抖动
            redLayer.style.transform = `translate(${Math.random() * 8 - 4}%, 0)`;
            blueLayer.style.transform = `translate(-${Math.random() * 8 - 4}%, 0)`;
        }, 30);

        // 1秒后清除故障效果
        setTimeout(() => {
            clearInterval(glitchInterval);
            if (glitchOverlay.parentNode) {
                glitchOverlay.parentNode.removeChild(glitchOverlay);
            }
            img.style.opacity = '1';
        }, 1000);
    },

    /**
     * 窗口尺寸变化时重新计算布局参数
     * @description 获取容器和卡片的实际像素尺寸，计算缩放比例使展示柜适配不同屏幕；
     * 重置所有卡片偏移量为0并清除正在执行的GSAP动画，重建img_data位置索引数组。
     * 注意：此函数在init()和window resize时调用，是布局自适应的核心。
     */
    resize() {
        let imgs = [...document.querySelectorAll(".photos_line_photo")];
        this.container_width = this.container.offsetWidth;
        this.container_height = this.container.offsetHeight;
        this.photo_width = imgs[0].offsetWidth;
        this.photo_height = imgs[0].offsetHeight;
        this.scale_nums = document.body.offsetWidth / this.standard_width;
        this.container.style.transform = `scale(${this.scale_nums})`;
        gsap.to(imgs, {
            transform: `translate(0,0)`,
            duration: 0,
            ease: 'power4.out'
        });
        this.img_data = [];
        imgs.forEach(img => {
            this.img_data.push({
                node: img,
                x: img.offsetLeft,
                y: img.offsetTop,
                mov_x: 0,
                mov_y: 0,
                ani: null
            });
        });
    },

    /**
     * 处理单帧鼠标/触摸拖动位移
     * @param {number} x - 当前鼠标/触摸点的屏幕X坐标
     * @param {number} y - 当前鼠标/触摸点的屏幕Y坐标
     * @description 计算本帧相对于上一帧的位移量(经缩放补偿)，累加到每张卡片的mov_x/mov_y；
     * 当卡片当前位置超出容器边界时，瞬间调整偏移量使其从对面边界出现(回绕)，
     * 回绕时设置duration=0让GSAP立即跳转而非平滑过渡，这是无限滑动的核心机制。
     * 边界判定规则（提前回绕，消除跳变）：
     *   - X轴右溢出：x + mov_x > container_width - photo_width/2 → mov_x -= container_width (跳到左边)
     *   - X轴左溢出：x + mov_x < -photo_width/2 → mov_x += container_width (跳到右边)
     *   - Y轴下溢出：y + mov_y > container_height - photo_height/2 → mov_y -= container_height (跳到上边)
     *   - Y轴上溢出：y + mov_y < -photo_height/2 → mov_y += container_height (跳到下边)
     */
    move(x, y) {
        if (!this.if_movable || this.is_expanded) return;
        let distance_x = (x - this.mouse_x) / this.scale_nums;
        let distance_y = (y - this.mouse_y) / this.scale_nums;
        // 标记动画开始，记录预计结束时间(1秒duration + 100ms缓冲)
        this.is_animating = true;
        this.animation_end_time = Date.now() + 1100;
        // 计算提前回绕的边界阈值（提前半个卡片尺寸）
        const xRightThreshold = this.container_width - this.photo_width / 2;
        const xLeftThreshold = -this.photo_width / 2;
        const yBottomThreshold = this.container_height - this.photo_height / 2;
        const yTopThreshold = -this.photo_height / 2;
        this.img_data.forEach((img) => {
            let duration = 1;
            img.mov_x += distance_x;
            if (img.x + img.mov_x > xRightThreshold) {
                img.mov_x -= this.container_width;
                duration = 0;
            }
            if (img.x + img.mov_x < xLeftThreshold) {
                img.mov_x += this.container_width;
                duration = 0;
            }
            img.mov_y += distance_y;
            if (img.y + img.mov_y > yBottomThreshold) {
                img.mov_y -= this.container_height;
                duration = 0;
            }
            if (img.y + img.mov_y < yTopThreshold) {
                img.mov_y += this.container_height;
                duration = 0;
            }
            if (img.ani) img.ani.kill();
            img.ani = gsap.to(img.node, {
                transform: `translate(${img.mov_x}px,${img.mov_y}px)`,
                duration: duration,
                ease: 'power4.out',
                onComplete: () => {
                    // 单个卡片动画完成不意味着整体完成，由autoDrift统一判断
                }
            });
        });
        this.mouse_x = x;
        this.mouse_y = y;
    }
};

/**
 * Glitch故障效果通用组件
 * @description 可复用的Glitch动画效果组件，支持动态初始化、配置化参数、
 * 自动为标记的卡片生成NO SIGNAL文字并绑定点击事件。
 * 核心特性：RGB色彩分离、随机抖动、裁剪闪烁、1秒自动恢复
 */
const GlitchEffect = {
    /** @type {Object} 默认配置参数 */
    defaultConfig: {
        text: 'NO SIGNAL',           // 显示的文字
        duration: 1000,              // 动画持续时间(ms)
        interval: 30,                // 更新间隔(ms)
        translateRange: 30,          // 位移范围(±%)
        colorAfter: '#ff0000',       // ::after伪元素颜色（纯红）
        colorBefore: '#0000ff',      // ::before伪元素颜色（纯蓝）
        offsetX: 2,                  // X轴偏移量(%)
        blendMode: 'screen'          // 混合模式
    },

    /**
     * 初始化Glitch效果系统
     * @param {Object} customConfig - 自定义配置（可选，会与默认配置合并）
     * @description 扫描页面中所有.glitch-card元素，动态生成Glitch文字容器，
     * 并自动绑定点击事件触发故障动画。只需在HTML中添加glitch-card类名即可使用。
     */
    init(customConfig = {}) {
        // 合并配置
        this.config = { ...this.defaultConfig, ...customConfig };

        // 获取所有需要Glitch效果的卡片
        const glitchCards = document.querySelectorAll('.glitch-card');

        // 为每个卡片生成Glitch内容
        glitchCards.forEach(card => {
            this.createGlitchContent(card);
        });

        console.log(`[GlitchEffect] 已初始化 ${glitchCards.length} 个Glitch卡片`);
    },

    /**
     * 为单个卡片创建Glitch内容
     * @param {HTMLElement} card - 目标卡片元素
     * @description 动态创建Glitch容器和4层文字元素，插入到卡片内部。
     * 如果已存在则不重复创建，支持重复调用。
     */
    createGlitchContent(card) {
        // 检查是否已存在Glitch容器
        if (card.querySelector('.glitch-container')) return;

        // 创建Glitch容器
        const container = document.createElement('div');
        container.className = 'glitch-container';

        // 创建4层Glitch文字
        for (let i = 0; i < 4; i++) {
            const text = document.createElement('span');
            text.className = 'glitch-text';
            text.textContent = this.config.text;
            container.appendChild(text);
        }

        // 将容器插入到装饰角之后、标签之前
        const cornerDecor = card.querySelector('.corner-decor--br');
        if (cornerDecor && cornerDecor.nextSibling) {
            card.insertBefore(container, cornerDecor.nextSibling);
        } else {
            card.appendChild(container);
        }
    },

    /**
     * 触发指定卡片的Glitch动画
     * @param {HTMLElement} card - 要触发效果的卡片元素
     * @param {Object} options - 可选的临时配置覆盖
     * @description 启动故障动画循环：每interval毫秒更新一次位移和裁剪路径，
     * 持续duration毫秒后自动停止并恢复初始状态。支持多次点击叠加效果。
     * 4层文字各自独立抖动，增加视觉冲击力。
     */
    triggerAnimation(card, options = {}) {
        const config = { ...this.config, ...options };
        const glitchTexts = card.querySelectorAll('.glitch-text');

        if (!glitchTexts || glitchTexts.length === 0) {
            console.warn('[GlitchEffect] 未找到.glitch-text元素');
            return;
        }

        // 清除可能存在的旧定时器
        if (card._glitchInterval) {
            clearInterval(card._glitchInterval);
        }

        // 为所有文字添加故障样式类（激活RGB分离效果）
        glitchTexts.forEach((text) => {
            text.classList.add('glitching');
        });

        // 启动故障动画循环
        card._glitchInterval = setInterval(() => {
            glitchTexts.forEach((text) => {
                // 随机位移（±translateRange范围）
                const translateX = Math.random() * config.translateRange * 2 - config.translateRange;
                const translateY = Math.random() * config.translateRange * 2 - config.translateRange;
                text.style.transform = `translate(${translateX}%, ${translateY}%)`;

                // 随机多边形裁剪区域（模拟信号干扰）
                const x = Math.random() * 100;
                const y = Math.random() * 100;
                const h = Math.random() * 50 + 50;  // 高度50-100%
                const w = Math.random() * 40 + 10;   // 宽度10-50%
                text.style.clipPath = `polygon(${x}% ${y}%, ${x + w}% ${y}%, ${x + w}% ${y + h}%, ${x}% ${y + h}%)`;
            });
        }, config.interval);

        // 定时器到期后恢复状态
        setTimeout(() => {
            // 停止动画循环
            if (card._glitchInterval) {
                clearInterval(card._glitchInterval);
                card._glitchInterval = null;
            }

            // 移除故障效果
            glitchTexts.forEach((text) => {
                text.classList.remove('glitching');
                text.style.transform = '';
                text.style.clipPath = '';
            });
        }, config.duration);
    },

    /**
     * 批量为多个卡片触发Glitch效果
     * @param {Array<HTMLElement>|NodeList} cards - 卡片元素数组
     * @param {number} delay - 每个卡片之间的延迟(ms)
     * @description 支持级联触发多个卡片的Glitch效果，
     * 可用于实现波浪式或随机触发的视觉效果。
     */
    triggerBatch(cards, delay = 100) {
        cards.forEach((card, index) => {
            setTimeout(() => {
                this.triggerAnimation(card);
            }, index * delay);
        });
    }
};

photobox.init();

/**
 * 页面加载完成后初始化Glitch效果
 * @description 确保DOM完全加载后再初始化Glitch组件，
 * 避免找不到元素的问题。可与photobox并行工作。
 */
window.addEventListener('DOMContentLoaded', () => {
    GlitchEffect.init();
});

/**
 * 赛博朋克霓虹闪烁效果
 * @description 每3秒随机选取一张卡片，短暂施加强青色发光阴影模拟故障灯管闪烁；
 * 150ms后恢复原始样式。仅作用于CSS box-shadow和border-color，不影响布局或位置。
 */
function cyberFlicker() {
    const cards = document.querySelectorAll('.photos_line_photo');
    setInterval(() => {
        const randomCard = cards[Math.floor(Math.random() * cards.length)];
        if (randomCard) {
            randomCard.style.boxShadow = `
                0 0 25px rgba(0, 240, 255, 0.6),
                0 0 50px rgba(0, 240, 255, 0.3),
                inset 0 0 25px rgba(0, 240, 255, 0.1)
            `;
            randomCard.style.borderColor = '#00f0ff';
            setTimeout(() => {
                randomCard.style.boxShadow = '';
                randomCard.style.borderColor = '';
            }, 150);
        }
    }, 3000);
}

cyberFlicker();

/**
 * 页面跳转遮罩控制器
 * @description 管理遮罩层的滑入滑出动画
 * 遮罩默认显示（从 index.html 跳转过来时覆盖页面），页面加载完毕后自动滑出
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
        this.overlay.style.transform = 'translateY(0)';
        setTimeout(() => {
            window.location.href = target;
        }, 1000);
    },

    /**
     * 遮罩滑出 - 向底部滑出露出页面
     */
    out() {
        this.overlay.classList.add('closing');
        setTimeout(() => {
            this.overlay.style.display = 'none';
        }, 1000);
    }
};

/**
 * 检测所有图片是否加载完成
 * @param {number} timeout - 超时时间(ms)，默认 10 秒
 * @returns {Promise<void>}
 */
function waitForAllImages(timeout = 10000) {
    const images = document.querySelectorAll('.photos_line_photo img');
    const total = images.length;
    if (total === 0) return Promise.resolve();

    let loaded = 0;
    let resolved = false;

    const timeoutId = setTimeout(() => {
        if (!resolved) {
            resolved = true;
            console.warn(`图片加载超时，已加载 ${loaded}/${total}`);
        }
    }, timeout);

    return new Promise((resolve) => {
        images.forEach((img) => {
            if (img.complete) {
                loaded++;
                if (loaded === total && !resolved) {
                    resolved = true;
                    clearTimeout(timeoutId);
                    resolve();
                }
            } else {
                img.addEventListener('load', () => {
                    loaded++;
                    if (loaded === total && !resolved) {
                        resolved = true;
                        clearTimeout(timeoutId);
                        resolve();
                    }
                });
                img.addEventListener('error', () => {
                    loaded++;
                    console.warn(`图片加载失败: ${img.src}`);
                    if (loaded === total && !resolved) {
                        resolved = true;
                        clearTimeout(timeoutId);
                        resolve();
                    }
                });
            }
        });
    });
}

// 音量淡入淡出
let volumeFadeInterval = null;
function fadeVolume(targetVolume, duration = 1000) {
    const bgMusic = document.getElementById('bgMusic');
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

// 初始化音乐播放器
function initMusicPlayer() {
    const bgMusic = document.getElementById('bgMusic');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeBars = document.querySelectorAll('.volume-bar');
    const volumeWaves = document.querySelector('.volume-waves');

    if (!bgMusic || !volumeSlider) return;

    // 从 localStorage 读取音量
    const savedVolume = localStorage.getItem('slipVolume');
    const initialVolume = savedVolume ? parseFloat(savedVolume) : 0.5;
    const initialLevel = Math.round(initialVolume * 8); // 转换为0-8级
    bgMusic.volume = 0; // 初始设为0，等下缓入
    volumeSlider.value = initialLevel;
    updateVolumeDisplay(initialLevel);
    updateVolumeWaves(initialVolume);

    // 直接自动播放音乐
    bgMusic.play().catch(e => console.log('自动播放被阻止:', e));

    // 音量条事件
    volumeSlider.addEventListener('input', (e) => {
        const newLevel = parseInt(e.target.value);
        const newVolume = newLevel / 8;
        bgMusic.volume = newVolume;
        localStorage.setItem('slipVolume', newVolume.toString());
        updateVolumeDisplay(newLevel);
        updateVolumeWaves(newVolume);
    });

    function updateVolumeDisplay(level) {
        volumeBars.forEach((bar, index) => {
            if (index < level) {
                bar.classList.add('active');
            } else {
                bar.classList.remove('active');
            }
        });
    }

    function updateVolumeWaves(volume) {
        if (volumeWaves) {
            const offset = 24 * (1 - volume);
            volumeWaves.style.strokeDashoffset = offset;
        }
    }
}

/**
 * 音乐播放控制器
 * @description 管理多首背景音乐的切换、播放、暂停功能，
 * 支持从localStorage读取用户选择的音乐，实现无缝切换体验
 */
const musicController = {
    /** @type {Array} 音乐列表配置 */
    playlist: [
        {
            id: 0,
            name: 'TECHNO',
            src: 'asset/BGM/loading/comastudio-the-modern-technology-downtempo_brewing-121493.mp3'
        },
        {
            id: 1,
            name: 'AMBIENT',
            src: 'asset/BGM/loading/comastudio-soft-inspiring-ambient-vlog_classic-165052.mp3'
        }
    ],

    /** @type {number} 当前播放的音乐索引 */
    currentTrackIndex: 0,

    /** @type {HTMLAudioElement} 音频元素 */
    audioElement: null,

    /** @type {NodeList} 音乐列表项 */
    musicItems: null,

    /**
     * 初始化音乐控制器
     * @description 绑定DOM元素、加载用户上次选择的音乐、设置事件监听
     */
    init() {
        this.audioElement = document.getElementById('bgMusic');
        this.musicItems = document.querySelectorAll('.music-item');

        if (!this.audioElement || !this.musicItems.length) return;

        // 从localStorage读取用户选择
        const savedMusicId = localStorage.getItem('selectedMusicId');
        if (savedMusicId !== null) {
            const index = parseInt(savedMusicId);
            if (index >= 0 && index < this.playlist.length) {
                this.currentTrackIndex = index;
                // 强制加载用户选择的音乐（不管当前src是什么）
                // 设置autoPlay=false，让initMusicPlayer统一控制播放时机
                this.forceLoadTrack(index);
                console.log(`[MusicController] 从localStorage恢复: ${this.playlist[index].name}`);
            }
        }

        // 更新UI显示
        this.updateUI();

        // 绑定音乐项点击事件
        this.musicItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const musicId = parseInt(item.dataset.music);
                this.switchTo(musicId);
            });
        });

        console.log(`[MusicController] 初始化完成，当前音轨: ${this.playlist[this.currentTrackIndex].name}`);
    },

    /**
     * 切换到指定音乐
     * @param {number} musicId - 目标音乐的ID（0或1）
     * @description 停止当前音乐，加载并播放新音乐，更新UI状态，保存用户选择
     */
    switchTo(musicId) {
        if (musicId === this.currentTrackIndex) return;
        if (musicId < 0 || musicId >= this.playlist.length) return;

        const wasPlaying = !this.audioElement.paused;
        const currentTime = this.audioElement.currentTime;

        // 切换音轨
        this.loadTrack(musicId, wasPlaying);

        // 保存用户选择
        localStorage.setItem('selectedMusicId', musicId.toString());

        console.log(`[MusicController] 切换到: ${this.playlist[musicId].name}`);
    },

    /**
     * 加载指定音轨
     * @param {number} index - 音轨索引
     * @param {boolean} autoPlay - 是否自动播放
     * @description 更新音频源、刷新UI状态、根据参数决定是否自动播放
     */
    loadTrack(index, autoPlay = true) {
        this.currentTrackIndex = index;
        const track = this.playlist[index];

        // 更新音频源
        this.audioElement.src = track.src;
        this.audioElement.load();

        // 播放或暂停
        if (autoPlay) {
            this.audioElement.play().catch(e => console.log('自动播放被阻止:', e));
        }

        // 更新UI
        this.updateUI();
    },

    /**
     * 强制加载指定音轨（不触发播放）
     * @param {number} index - 音轨索引
     * @description 仅更新音频源和内部状态，不调用play()，
     * 用于初始化时从localStorage恢复用户选择，让initMusicPlayer统一控制播放时机
     */
    forceLoadTrack(index) {
        this.currentTrackIndex = index;
        const track = this.playlist[index];

        // 更新音频源
        this.audioElement.src = track.src;
        this.audioElement.load();

        // 不调用play()，让initMusicPlayer统一控制

        // 更新UI
        this.updateUI();
    },

    /**
     * 更新界面显示状态
     * @description 同步当前音乐名称、高亮选中的音乐项、更新active类名
     */
    updateUI() {
        // 更新音乐列表项的激活状态
        this.musicItems.forEach(item => {
            const itemId = parseInt(item.dataset.music);
            if (itemId === this.currentTrackIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    /**
     * 获取当前播放的音乐信息
     * @returns {Object} 当前音乐对象，包含id、name、src属性
     */
    getCurrentTrack() {
        return this.playlist[this.currentTrackIndex];
    }
};

window.addEventListener('load', async () => {
    const spinner = document.querySelector('.transition-spinner circle');
    const spinEnd = sessionStorage.getItem('transitionSpinEnd');
    if (spinEnd && spinner) {
        const elapsed = Date.now() - parseInt(spinEnd);
        const duration = 1200;
        spinner.style.animationDelay = `-${elapsed % duration}ms`;
        sessionStorage.removeItem('transitionSpinEnd');
    }
    await waitForAllImages();

    // 先初始化音乐控制器（会根据用户选择加载音轨）
    musicController.init();

    // 再初始化音量控制（设置音量条、开始播放）
    initMusicPlayer();

    pageTransition.out();

    // 遮罩滑出后音乐缓入
    const savedVolume = localStorage.getItem('slipVolume');
    const initialVolume = savedVolume ? parseFloat(savedVolume) : 0.5;

    // 确保音乐正在播放后再淡入音量
    setTimeout(() => {
        const bgMusic = document.getElementById('bgMusic');
        if (bgMusic && bgMusic.paused) {
            bgMusic.play().catch(e => console.log('自动播放被阻止:', e));
        }
        fadeVolume(initialVolume, 1000);
    }, 500);
});
