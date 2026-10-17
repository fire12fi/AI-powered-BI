// src/models/chartData.ts
export default {
  // ① namespace：model 的唯一标识，后续调用必须和这个名字一致
  namespace: 'chartData',

  // ② state：全局状态的初始值（和组件的 useState 初始值对应）
  state: {
    chartJson: '', // 存储生成图表的 JSON 数据
    conclusion: '', // 存储 AI 分析结论
    fileName: '', // 可选：扩展存储上传的文件名，按需加
  },

  // ③ reducers：修改全局状态的纯函数（只能通过 reducer 修改 state，不能直接改）
  reducers: {
    // 保存图表/结论数据（payload 是传入的参数，比如 { chartJson: 'xxx', conclusion: 'xxx' }）
    saveChartData(state, { payload }) {
      // 必须返回新对象，不能修改原 state（React 不可变数据原则）
      return { ...state, ...payload };
    },

    // 清空数据（比如重置按钮触发）
    clearChartData(state) {
      return { ...state, chartJson: '', conclusion: '', fileName: '' };
    },

    // 可选：单独更新结论（按需扩展）
    updateConclusion(state, { payload }) {
      return { ...state, conclusion: payload };
    },
  },
};
