Page({
    data: {
        // 使用用户提供的正式 Vercel 部署地址
        url: 'https://macro-shockwave.vercel.app/'
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
