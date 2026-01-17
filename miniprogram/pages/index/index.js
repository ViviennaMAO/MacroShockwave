Page({
    data: {
        // 这里的 URL 应该是你部署后的前端地址
        // 开发时可以设置为 http://localhost:5173 (Vite 默认端口)
        url: 'http://localhost:5173'
    },

    onLoad(options) {
        if (options.url) {
            this.setData({
                url: decodeURIComponent(options.url)
            });
        }
    },

    onShareAppMessage() {
        return {
            title: 'MacroShockwave - 宏观经济数据预测市场',
            path: '/pages/index/index'
        };
    }
});
