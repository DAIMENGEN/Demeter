import React from "react";
import "./schedulant-legend.scss";

export interface LegendItem {
    color: string;
    label: string;
}

export interface SchedulantLegendProps {
    items: LegendItem[];
}

export const SchedulantLegend = React.forwardRef<HTMLDivElement, SchedulantLegendProps>(({items}, ref) => {
    return (
        <div ref={ref} className="schedulant-legend">
            {items.map((item) => (
                <div key={item.color} className="schedulant-legend__item">
                    <div
                        className="schedulant-legend__color-box"
                        style={{ backgroundColor: item.color }}
                    />
                    <span className="schedulant-legend__label">
                        {item.label}
                    </span>
                </div>
            ))}
        </div>
    );
});