import React from "react";
import dayjs from "dayjs";

export interface ProjectInfoProps {
    startDateTime: string;
    endDateTime?: string | null;
}

export const ProjectInfo = React.forwardRef<HTMLDivElement, ProjectInfoProps>(
    ({startDateTime, endDateTime}, ref) => {
        return (
            <div
                ref={ref}
                style={{
                    position: "absolute",
                    bottom: "8px",
                    right: "8px",
                    fontSize: "12px",
                    color: "rgba(0, 0, 0, 0.45)",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    pointerEvents: "none"
                }}
            >
                项目时间：{dayjs(startDateTime).format("YYYY-MM-DD")}
                {endDateTime && ` ~ ${dayjs(endDateTime).format("YYYY-MM-DD")}`}
            </div>
        );
    }
);

ProjectInfo.displayName = "ProjectInfo";

