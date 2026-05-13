class AnimatedFavicon {
    constructor(options = {}) {
        this.framePath = options.framePath || 'asset/favicon/ezgif-split';
        this.framePrefix = options.framePrefix || 'frame_';
        this.startFrame = options.startFrame || 4;
        this.endFrame = options.endFrame || 26;
        this.defaultDelay = options.defaultDelay || 125;
        this.loop = options.loop !== undefined ? options.loop : true;

        this.frames = [];
        this.currentFrameIndex = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.timerId = null;
        this.faviconLink = null;

        this.init();
    }

    init() {
        this.buildFrameList();
        this.createFaviconLink();
        this.preloadFramesAsDataURL();
        this.bindVisibilityEvents();
    }

    buildFrameList() {
        this.frames = [];
        for (let i = this.startFrame; i <= this.endFrame; i++) {
            const frameNum = String(i).padStart(2, '0');
            const delay = i % 2 === 0 ? 0.13 : 0.12;
            const filename = `${this.framePrefix}${frameNum}_delay-${delay}s.png`;
            this.frames.push({
                index: i,
                src: `${this.framePath}/${filename}`,
                delay: Math.round(delay * 1000),
                dataURL: null
            });
        }
    }

    createFaviconLink() {
        let link = document.querySelector('link[rel="icon"]');
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        this.faviconLink = link;
    }

    imageToDataURL(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL('image/png');
    }

    preloadFramesAsDataURL() {
        let loadedCount = 0;
        const totalFrames = this.frames.length;

        this.frames.forEach((frame, index) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                frame.dataURL = this.imageToDataURL(img);
                frame.image = img;
                loadedCount++;
                if (loadedCount === totalFrames) {
                    this.onAllFramesLoaded();
                }
            };
            img.onerror = () => {
                console.warn(`[AnimatedFavicon] 帧加载失败: ${frame.src}`);
                loadedCount++;
                if (loadedCount === totalFrames) {
                    this.onAllFramesLoaded();
                }
            };
            img.src = frame.src;
        });
    }

    onAllFramesLoaded() {
        console.log(`[AnimatedFavicon] 所有 ${this.frames.length} 帧已预加载并转为 dataURL`);
    }

    bindVisibilityEvents() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else if (this.isPlaying && this.isPaused) {
                this.resume();
            }
        });
    }

    play() {
        if (this.frames.length === 0) return;
        this.isPlaying = true;
        this.isPaused = false;
        this.currentFrameIndex = 0;
        this.showFrame();
    }

    pause() {
        if (!this.isPlaying) return;
        this.isPaused = true;
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }

    resume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.showFrame();
    }

    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentFrameIndex = 0;
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }

    showFrame() {
        if (!this.isPlaying || this.isPaused) return;

        const frame = this.frames[this.currentFrameIndex];
        if (frame && frame.dataURL) {
            this.faviconLink.href = frame.dataURL;
        } else if (frame && frame.image) {
            this.faviconLink.href = this.imageToDataURL(frame.image);
        }

        const delay = frame ? frame.delay : this.defaultDelay;

        this.timerId = setTimeout(() => {
            this.currentFrameIndex++;
            if (this.currentFrameIndex >= this.frames.length) {
                if (this.loop) {
                    this.currentFrameIndex = 0;
                } else {
                    this.stop();
                    return;
                }
            }
            this.showFrame();
        }, delay);
    }

    getFrameCount() {
        return this.frames.length;
    }

    getCurrentFrameInfo() {
        const frame = this.frames[this.currentFrameIndex];
        return frame ? { index: frame.index, src: frame.src, delay: frame.delay } : null;
    }
}

const animatedFavicon = new AnimatedFavicon({
    framePath: 'asset/favicon/ezgif-split',
    startFrame: 4,
    endFrame: 26,
    loop: true
});

document.addEventListener('DOMContentLoaded', () => {
    animatedFavicon.play();
});
