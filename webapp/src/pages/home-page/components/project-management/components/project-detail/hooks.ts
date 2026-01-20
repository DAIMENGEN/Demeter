import React, {useCallback, useEffect, useRef, useState} from "react";

export const useSchedulantHeight = (
    cardHeaderRef: React.RefObject<HTMLDivElement | null>,
    legendRef: React.RefObject<HTMLDivElement | null>
) => {
    const [height, setHeight] = useState(800);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const calculateHeight = useCallback(() => {
        const windowHeight = window.innerHeight;
        const containerTop = containerRef.current?.getBoundingClientRect().top || 0;
        const bottomMargin = 16;
        const cardOverhead = 2;
        const headerHeight = cardHeaderRef.current?.offsetHeight || 64;
        const legendHeight = legendRef.current?.offsetHeight || 60;
        const cardBodyPadding = 48;
        const availableHeight = windowHeight - containerTop - headerHeight - legendHeight - cardBodyPadding - bottomMargin - cardOverhead;
        const newHeight = Math.max(400, availableHeight);
        setHeight(newHeight);
    }, [cardHeaderRef, legendRef]);
    useEffect(() => {
        const timer = setTimeout(() => {
            calculateHeight();
        }, 100);
        const handleResize = () => calculateHeight();
        window.addEventListener("resize", handleResize);
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
    return {height, containerRef};
};
