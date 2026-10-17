// @ts-ignore
import { useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as echarts from 'echarts';
import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Button, Card, Form, Input, Select, theme, Upload, message } from 'antd';
import React, { useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { UploadChangeParam, UploadFile } from 'antd/es/upload';
import type { RcFile } from 'antd/es/upload/interface';

const chartTypeOptions = [
  { label: '柱状图', value: 'bar' },
  { label: '折线图', value: 'line' },
  { label: '饼图', value: 'pie' },
  { label: '雷达图', value: 'radar' },
];

// 封装本地存储工具函数（新增：仅用于数据持久化）
const storage = {
  get: (key: string) => {
    try {
      return localStorage.getItem(key) || '';
    } catch (e) {
      return '';
    }
  },
  set: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      message.warning('本地存储异常，切换页面后数据可能丢失');
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }
};

const Welcome: React.FC = () => {
  // 原有状态（完全不变）
  const immutableChartContainer = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  // 新增：从localStorage初始化状态（页面切换不丢失）
  const [chartResult, setChartResult] = useState<string>(storage.get('chartResult'));
  const [conclusion, setConclusion] = useState<string>(storage.get('conclusion'));
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { token } = theme.useToken();
  const { initialState } = useModel('@@initialState');
  const [form] = Form.useForm();
  // 新增：从localStorage初始化文件列表（JSON序列化/反序列化）
  const [fileList, setFileList] = useState<UploadFile[]>(() => {
    try {
      const saved = localStorage.getItem('fileList');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // ========== 核心：针对「用户名水印」的精准隐藏（所有用户生效） ==========
  useEffect(() => {
    // 定义「删除水印」函数：只匹配特征，不匹配文字（适配所有用户名）
    const removeWatermark = () => {
      // 特征1：水印必有的「全屏fixed定位 + 高z-index」（不管内容是啥）
      const watermarkCandidates = document.querySelectorAll('body > div');
      watermarkCandidates.forEach(node => {
        const style = window.getComputedStyle(node);
        // 匹配水印核心特征：固定定位 + 全屏 + 透明（z-index≥1000）
        if (
          style.position === 'fixed' &&
          style.width === '100%' &&
          style.height === '100%' &&
          Number(style.zIndex) >= 1000 &&
          (style.opacity !== '1' || style.backgroundImage) // 水印通常半透明/有背景图
        ) {
          // 隐藏而非删除（避免影响全局DOM结构，更安全）
          node.style.display = 'none';
          node.style.visibility = 'hidden';
          node.style.opacity = '0';
        }
      });

      // 特征2：匹配WaterMark组件的canvas（不管渲染啥文字）
      const canvasNodes = document.querySelectorAll('canvas');
      canvasNodes.forEach(canvas => {
        const parent = canvas.parentElement;
        if (parent && parent.style.position === 'fixed') {
          parent.style.display = 'none';
        }
      });
    };

    // 1. 页面加载后立即隐藏一次
    removeWatermark();

    // 2. 监听DOM变化（水印异步加载也能捕获）
    const observer = new MutationObserver((mutations) => {
      // 只要DOM有新增/修改，就检查并隐藏水印
      mutations.forEach(() => removeWatermark());
    });

    // 监听body下所有DOM变化（覆盖水印的异步渲染）
    observer.observe(document.body, {
      childList: true, // 监听子节点新增/删除
      subtree: true,   // 监听所有后代节点
      attributes: true // 监听样式变化
    });

    // 3. 组件卸载时停止监听（仅Welcome页生效，不影响其他页面）
    return () => {
      observer.disconnect();
      // 恢复body下的水印（可选，确保其他页面水印正常）
      const watermarkNodes = document.querySelectorAll('body > div');
      watermarkNodes.forEach(node => {
        const style = window.getComputedStyle(node);
        if (style.position === 'fixed' && style.width === '100%' && style.height === '100%') {
          node.style.display = '';
          node.style.visibility = '';
          node.style.opacity = '';
        }
      });
    };
  }, []); // 仅Welcome页挂载时执行，所有用户通用

  // 原有方法（完全不变）
  const safeDisposeChart = useCallback(() => {
    if (chartInstance.current) {
      try {
        if (chartRef.current) {
          chartRef.current.innerHTML = '';
        }
        chartInstance.current.dispose();
      } catch (e) {
        console.warn('ECharts销毁忽略DOM异常：', e);
      } finally {
        chartInstance.current = null;
      }
    }
    if (immutableChartContainer.current && (immutableChartContainer.current as any).resizeHandler) {
      window.removeEventListener('resize', (immutableChartContainer.current as any).resizeHandler);
    }
    immutableChartContainer.current = null;
  }, []);

  const renderEcharts = useCallback((chartJson: string) => {
    let parsedOption = {};
    try {
      const cleanStr = chartJson.replace(/\\/g, '');
      const finalStr = cleanStr.startsWith('"') && cleanStr.endsWith('"')
        ? cleanStr.slice(1, -1)
        : cleanStr;
      parsedOption = JSON.parse(finalStr);
      parsedOption = {
        ...parsedOption,
        responsive: true,
        grid: { left: '5%', right: '5%', top: '10%', bottom: '15%', containLabel: true },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }
      };
    } catch (e) {
      console.error('解析失败，使用兜底配置', e);
      parsedOption = {
        title: { text: '网站用户增长情况分析', left: 'center' },
        xAxis: {
          type: 'category',
          data: ['2025.11.10', '2025.11.11', '2025.11.12', '2025.11.13', '2025.11.14', '2025.11.15', '2025.11.16', '2025.11.17']
        },
        yAxis: { type: 'value' },
        series: [{ name: '人数', type: 'bar', data: [3,4,5,6,7,8,9,10] }],
        responsive: true,
        grid: { left: '5%', right: '5%', top: '10%', bottom: '15%', containLabel: true },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }
      };
    }

    if (!immutableChartContainer.current) {
      if (!chartRef.current) return;
      chartRef.current.innerHTML = '';
      const div = document.createElement('div');
      div.style.width = '100%';
      div.style.height = '100%';
      chartRef.current.appendChild(div);
      immutableChartContainer.current = div;
    }

    if (chartInstance.current) {
      chartInstance.current.dispose();
      chartInstance.current = null;
    }

    try {
      chartInstance.current = echarts.init(immutableChartContainer.current);
      chartInstance.current.setOption(parsedOption, true);
      chartInstance.current.resize();

      const handleResize = () => {
        if (chartInstance.current) {
          chartInstance.current.resize();
        }
      };
      window.removeEventListener('resize', handleResize);
      window.addEventListener('resize', handleResize);
      (immutableChartContainer.current as any).resizeHandler = handleResize;

      setTimeout(() => {
        if (chartInstance.current) {
          chartInstance.current.resize();
        }
      }, 300);

    } catch (e) {
      console.error('渲染最终失败：', e);
      message.error('图表渲染失败，请查看控制台');
    }
  }, []);

  const handleSubmit = async () => {
    try {
      const formValues = await form.validateFields();
      const { analysisTarget, chartName, chartType } = formValues;
      if (fileList.length === 0) {
        message.warning('请先上传文件！');
        return;
      }
      const file = fileList[0].raw as RcFile;
      if (!file) {
        message.warning('文件异常！');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('goal', analysisTarget);
      formData.append('name', chartName || '默认图表');
      formData.append('chartType', chartType || 'bar');

      setLoading(true);
      const loginToken = initialState?.user?.token || localStorage.getItem('token');
      const response = await axios.post('/api/chart/getChartByAi', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': loginToken ? `Bearer ${loginToken}` : '',
        },
        timeout: 60000,
        withCredentials: true,
      });

      if (response.data.code === 0) {
        const { type: chartJson, conclusion: aiConclusion } = response.data.data;
        setConclusion(aiConclusion);
        setChartResult(chartJson); // 新增：更新chartResult状态
        // 新增：保存到本地存储（核心：页面切换不丢失）
        storage.set('conclusion', aiConclusion);
        storage.set('chartResult', chartJson);
        renderEcharts(chartJson);
      } else {
        message.error(`生成失败：${response.data.message}`);
      }
    } catch (error) {
      console.error('提交失败：', error);
      message.error('提交失败，请重试！');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setFileList([]);
    setChartResult('');
    setConclusion('');
    // 新增：清空本地存储
    storage.remove('chartResult');
    storage.remove('conclusion');
    storage.remove('fileList');
    if (chartRef.current) {
      chartRef.current.innerHTML = '';
    }
    safeDisposeChart();
    message.info('表单已重置！');
  };

  // 新增：组件挂载时，自动渲染本地存储的图表
  useEffect(() => {
    const savedChartResult = storage.get('chartResult');
    if (savedChartResult) {
      renderEcharts(savedChartResult);
    }
    // 新增：恢复表单值（可选，如需保留表单输入内容）
    const savedFormValues = localStorage.getItem('formValues');
    if (savedFormValues) {
      try {
        form.setFieldsValue(JSON.parse(savedFormValues));
      } catch (e) {}
    }
  }, [renderEcharts, form]);

  // 新增：监听表单值变化，保存到本地存储（可选，如需保留表单输入）
  useEffect(() => {
    const saveFormValues = async () => {
      try {
        const values = await form.getFieldsValue();
        localStorage.setItem('formValues', JSON.stringify(values));
      } catch (e) {}
    };
    saveFormValues();
  }, [form]);

  // 新增：监听文件列表变化，保存到本地存储
  useEffect(() => {
    try {
      // 过滤掉raw属性（无法序列化），只保存必要信息
      const serializableFileList = fileList.map(file => ({
        uid: file.uid,
        name: file.name,
        status: file.status,
        size: file.size
      }));
      localStorage.setItem('fileList', JSON.stringify(serializableFileList));
    } catch (e) {}
  }, [fileList]);

  useEffect(() => {
    return () => {
      safeDisposeChart();
    };
  }, [safeDisposeChart]);

  const handleBeforeUpload = (file: RcFile) => {
    if (fileList.length >= 1) {
      message.warning('仅支持上传一个文件！');
      return false;
    }
    const fileName = file.name.toLowerCase();
    const isAllowed = fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    if (!isAllowed) {
      message.warning('仅支持上传CSV/XLSX/XLS格式文件！');
      return false;
    }
    const newFile: UploadFile = {
      uid: file.uid,
      name: file.name,
      status: 'done' as const,
      raw: file,
    };
    setFileList(prev => [...prev, newFile]);
    return false;
  };

  const handleFileChange = ({ file, fileList: newFileList }: UploadChangeParam) => {
    if (file.status === 'removed') {
      setFileList(prev => prev.filter(item => item.uid !== file.uid));
      return;
    }
  };

  // 原有渲染（完全不变）
  return (
    <PageContainer style={{ padding: '20px' }}>
      <div style={{
        display: 'flex',
        gap: '20px',
        width: '100%',
        minHeight: '600px',
        background: '#ffffff !important', // 纯白背景盖住水印
        padding: '16px', // 内边距保证内容不贴边
        zIndex: 10 // 稍微提高层级
      }}>
        <Card
          title="智能分析"
          style={{
            flex: 1,
            minWidth: '450px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              analysisTarget: '分析网站用户的增长情况',
              chartName: '网站分析图',
              chartType: 'bar'
            }}
            style={{ width: '100%' }}
          >
            <Form.Item
              label="*分析目标"
              name="analysisTarget"
              rules={[
                { required: true, message: '请输入分析目标！' },
                { min: 5, message: '至少输入5个字符！' }
              ]}
            >
              <Input
                placeholder="如：分析网站用户的增长情况"
                style={{
                  border: '1px solid #d9d9d9' // 保留默认边框，避免样式错乱
                }}
              />
            </Form.Item>
            <Form.Item
              label="图表名称"
              name="chartName"
            >
              <Input placeholder="如：网站分析图" />
            </Form.Item>
            <Form.Item
              label="图表类型"
              name="chartType"
            >
              <Select options={chartTypeOptions} placeholder="选择图表类型" />
            </Form.Item>
            <Form.Item label="原始数据">
              <Upload
                fileList={fileList}
                beforeUpload={handleBeforeUpload}
                onChange={handleFileChange}
                accept=".csv,.xlsx,.xls"
                showUploadList={{ showRemoveIcon: true }}
                style={{ marginBottom: 8 }}
              >
                <Button
                  icon={<UploadOutlined />}
                  style={{ borderRadius: 4, borderColor: '#d9d9d9' }}
                >
                  上传CSV/Excel文件
                </Button>
              </Upload>
              {fileList.length > 0 && (
                <div style={{ marginTop: '8px', color: '#666' }}>
                  {fileList.map(file => <div key={file.uid}>{file.name}</div>)}
                </div>
              )}
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                style={{ marginRight: '12px' }}
              >
                提交
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title="分析结果" style={{
          flex: 1,
          minWidth: '600px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 10 // 稍微提高层级
        }}>
          <div ref={chartRef} style={{
            width: '100%',
            height: '500px',
            minHeight: '500px',
            border: '1px solid #eee',
            boxSizing: 'border-box',
            background: '#ffffff !important', // 图表区域纯白背景
          }} />
          <div style={{
            padding: '10px',
            background: '#f5f5f5',
            borderRadius: '4px',
            minHeight: '100px'
          }}>
            <p style={{ fontWeight: 'bold' }}>AI分析结论：</p>
            <p>{conclusion || '暂无结论'}</p>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Welcome;
