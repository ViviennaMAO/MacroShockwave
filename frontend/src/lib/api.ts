import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // TODO: 添加 JWT token
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // 模拟数据回退 - 方便在没有后端开发时调试 UI
    if (error.code === 'ERR_NETWORK' || error.message.includes('网络错误')) {
      const url = error.config.url;
      console.warn(`[Mock API] Backend unreachable at ${url}, using mock data.`);

      if (url.includes('/events')) {
        return {
          success: true,
          data: [
            {
              id: 'cpi-demo',
              name: 'CPI SHOCKWAVE',
              type: 'CPI',
              releaseTime: new Date(Date.now() + 86400000).toISOString(),
              consensusValue: 3.1,
              status: 'BETTING',
              canBet: true,
              pools: [
                {
                  gameMode: 'DATA_SNIPER', totalAmount: 12500, options: [
                    { id: '1', name: 'DOVISH', totalAmount: 4000 },
                    { id: '2', name: 'NEUTRAL', totalAmount: 4500 },
                    { id: '3', name: 'HAWKISH', totalAmount: 4000 }
                  ]
                }
              ]
            }
          ]
        };
      }
    }

    if (error.response) {
      throw new Error(error.response.data.error || '请求失败');
    } else if (error.request) {
      throw new Error('网络错误，请检查链接');
    } else {
      throw new Error(error.message);
    }
  }
);

// API 方法
export const eventsApi = {
  // 获取事件列表
  getEvents: () => api.get('/events'),

  // 获取事件详情
  getEventDetail: (id: string) => api.get(`/events/${id}`),

  // 创建事件（管理员）
  createEvent: (data: any) => api.post('/events', data),
};

export const betsApi = {
  // 创建下注订单
  placeBet: (data: { eventId: string; optionId: string; amount: number }) =>
    api.post('/bets', data),

  // 确认订单
  confirmBet: (orderId: string, txHash: string) =>
    api.post(`/bets/${orderId}/confirm`, { txHash }),

  // 获取订单详情
  getOrderDetail: (orderId: string) => api.get(`/bets/${orderId}`),

  // 获取用户订单列表
  getUserOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/bets/user/orders', { params }),

  // 取消订单
  cancelOrder: (orderId: string) => api.delete(`/bets/${orderId}`),
};

export const usersApi = {
  // 获取当前用户信息
  getProfile: () => api.get('/users/me'),

  // 更新用户信息
  updateProfile: (data: { username?: string; avatar?: string }) =>
    api.put('/users/me', data),

  // 获取用户统计
  getStats: () => api.get('/users/me/stats'),

  // 获取投资组合
  getPortfolio: () => api.get('/users/me/portfolio'),

  // 获取用户排名
  getRanking: () => api.get('/users/me/ranking'),

  // 获取排行榜
  getLeaderboard: (params?: { type?: 'winnings' | 'winRate'; limit?: number }) =>
    api.get('/users/leaderboard', { params }),
};
