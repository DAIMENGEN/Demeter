import {useCallback, useEffect, useRef, useState} from "react";
import {useDomRef} from "@Webapp/hooks";
import type {DomRef} from "@Webapp/types";

export const useSchedulantHeight = (
    cardHeaderRef: DomRef<HTMLDivElement>,
    legendRef: DomRef<HTMLDivElement>
) => {
    const rafRef = useRef<number>(0);
    const [height, setHeight] = useState(800);
    const containerRef = useDomRef<HTMLDivElement>();
    const calculateHeight = useCallback(() => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }
        rafRef.current = requestAnimationFrame(() => {
            const windowHeight = window.innerHeight;
            const containerTop = containerRef.current?.getBoundingClientRect().top ?? 0;
            const headerHeight = cardHeaderRef.current?.offsetHeight ?? 64;
            const legendHeight = legendRef.current?.offsetHeight ?? 60;
            const overhead = {
                bottomMargin: 16,
                cardOverhead: 2,
                cardBodyPadding: 48,
            };
            const totalOverhead = overhead.bottomMargin + overhead.cardOverhead + overhead.cardBodyPadding;
            const availableHeight = windowHeight - containerTop - headerHeight - legendHeight - totalOverhead;
            setHeight(prev => {
                const newHeight = Math.max(400, availableHeight);
                return prev === newHeight ? prev : newHeight;
            });
        });
    }, [cardHeaderRef, legendRef]);

    useEffect(() => {
        calculateHeight();

        const resizeObserver = new ResizeObserver(calculateHeight);
        resizeObserver.observe(document.body);

        [containerRef.current, cardHeaderRef.current, legendRef.current]
            .filter((el): el is HTMLDivElement => el !== null)
            .forEach(el => resizeObserver.observe(el));

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            resizeObserver.disconnect();
        };
    }, [calculateHeight, cardHeaderRef, legendRef]);

    return { height, containerRef };
};
