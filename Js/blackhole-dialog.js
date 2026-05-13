/**
 * Windows风格对话框控制器
 * 最小化：滑到左下角消失 | 关闭：压扁成线消失 | 支持拖拽
 */
(function() {
    const dialog = document.getElementById('successDialog');
    const btnMinimize = document.getElementById('btnMinimize');
    const btnClose = document.getElementById('btnClose');
    const titlebar = document.querySelector('.win-titlebar');
    let isDragging = false;
    let dragOffsetX, dragOffsetY;

    /**
 * 检测是否从Email.html提交后跳转过来
 * 只有携带有效标记才显示成功弹窗
 */
const fromEmailSubmit = sessionStorage.getItem('fromEmailSubmit');
if (fromEmailSubmit === 'true') {
    setTimeout(() => {
        dialog.classList.add('show');
    }, 300);
    /**
     * 清除标记，防止刷新页面重复显示弹窗
     */
    sessionStorage.removeItem('fromEmailSubmit');
}

    /**
     * 最小化关闭 - 滑到左下角移出视口
     */
    function minimizeDialog() {
        dialog.style.left = '';
        dialog.style.top = '';
        dialog.style.transform = '';
        dialog.classList.remove('show');
        dialog.classList.add('minimizing');
        setTimeout(() => {
            dialog.style.display = 'none';
        }, 400);
    }

    /**
     * 关闭 - 上下压扁成一条线后消失
     */
    function closeDialog() {
        dialog.style.left = '';
        dialog.style.top = '';
        dialog.style.transform = '';
        dialog.classList.remove('show');
        dialog.classList.add('closing');
        setTimeout(() => {
            dialog.style.display = 'none';
        }, 350);
    }

    /**
     * 标题栏按下 - 开始拖拽
     */
    titlebar.addEventListener('mousedown', (e) => {
        if (e.target.closest('.win-controls')) return;
        isDragging = true;
        const rect = dialog.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        dialog.style.transition = 'opacity 0.5s ease';
        titlebar.style.cursor = 'grabbing';
    });

    /**
     * 鼠标移动 - 拖动窗口跟随
     */
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const x = e.clientX - dragOffsetX;
        const y = e.clientY - dragOffsetY;
        dialog.style.left = x + 'px';
        dialog.style.top = y + 'px';
        dialog.style.transform = 'none';
    });

    /**
     * 鼠标松开 - 停止拖拽
     */
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            dialog.style.transition = '';
            titlebar.style.cursor = 'grab';
        }
    });

    btnMinimize.addEventListener('click', minimizeDialog);
    btnClose.addEventListener('click', closeDialog);
})();
