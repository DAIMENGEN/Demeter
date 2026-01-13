import React from "react";

export interface LegendItem {
    color: string;
    label: string;
}

export interface GanttLegendProps {
    items: LegendItem[];
}

export const GanttLegend = React.forwardRef<HTMLDivElement, GanttLegendProps>(({items}, ref) => {
    return (
        <div
            ref={ref}
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "10px 0 8px 0",
                gap: "24px",
                flexWrap: "wrap"
            }}
        >
            {items.map((item) => (
                <div
                    key={item.color}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                >
                    <div style={{
                        width: "16px",
                        height: "16px",
                        backgroundColor: item.color,
                        borderRadius: "2px"
                    }}/>
                    <span style={{
                        fontSize: "13px",
                        color: "rgba(0, 0, 0, 0.65)"
                    }}>
                        {item.label}
                    </span>
                </div>
            ))}
        </div>
    );
});

GanttLegend.displayName = "GanttLegend";

