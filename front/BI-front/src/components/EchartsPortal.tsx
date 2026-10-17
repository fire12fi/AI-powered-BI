// 替换内联的 EchartsPortal 组件为：
import {useEffect} from "react";
import {createPortal} from "react-dom";

const EchartsPortal: React.FC<{ containerRef: React.RefObject<HTMLDivElement>; children: React.ReactNode }> = ({ containerRef, children }) => {
  useEffect(() => {
    // 不再挂载到 document.body，而是挂载到右侧卡片内的容器
    if (!containerRef.current) return;
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    containerRef.current.appendChild(container);

    return () => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, [containerRef]);

  // 找到右侧卡片内的容器，将图表挂载进去
  if (!containerRef.current) return null;
  const targetContainer = containerRef.current.querySelector('div[data-echarts-target]');
  return targetContainer ? createPortal(children, targetContainer) : null;
};
