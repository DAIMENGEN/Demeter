import React, { useState, useRef, useEffect, useCallback } from "react";

/**
 * 自定义 Hook: 动态计算 Schedulant 高度
 * 根据浏览器窗口大小和页面元素动态调整 Schedulant 组件的高度，避免出现滚动条
 */
export const useSchedulantHeight = (
    cardHeaderRef: React.RefObject<HTMLDivElement | null>,
    legendRef: React.RefObject<HTMLDivElement | null>
) => {
    const [height, setHeight] = useState(800);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const calculateHeight = useCallback(() => {
        // 获取浏览器窗口高度
        const windowHeight = window.innerHeight;

        // 获取容器到页面顶部的距离
        const containerTop = containerRef.current?.getBoundingClientRect().top || 0;

        // 底部预留空间 (避免紧贴浏览器底部)
        const bottomMargin = 16;

        // Card 的内边距和边框
        const cardOverhead = 2; // border

        // Card header 高度
        const headerHeight = cardHeaderRef.current?.offsetHeight || 64;

        // 图例高度
        const legendHeight = legendRef.current?.offsetHeight || 60;

        // Card body padding (上下)
        const cardBodyPadding = 48;

        // 计算 Schedulant 可用高度
        // = 窗口高度 - 容器顶部距离 - Card header - 图例高度 - Card padding - 底部间距 - Card 边框
        const availableHeight = windowHeight - containerTop - headerHeight - legendHeight - cardBodyPadding - bottomMargin - cardOverhead;

        // 设置最小高度为 400px
        const newHeight = Math.max(400, availableHeight);

        setHeight(newHeight);
    }, [cardHeaderRef, legendRef]);

    useEffect(() => {
        // 延迟执行，确保 DOM 已完全渲染
        const timer = setTimeout(() => {
            calculateHeight();
        }, 100);

        // 监听窗口大小变化
        const handleResize = () => calculateHeight();
        window.addEventListener("resize", handleResize);

        // 使用 ResizeObserver 监听元素大小变化
        const resizeObserver = new ResizeObserver(calculateHeight);

        const elements = [
            cardHeaderRef.current,
            legendRef.current,
        ].filter((el): el is HTMLDivElement => el !== null);

        elements.forEach(el => resizeObserver.observe(el));

        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", handleResize);
            resizeObserver.disconnect();
        };
    }, [calculateHeight, cardHeaderRef, legendRef]);

    return { height, containerRef };
};

