import React from "react";
import dayjs from "dayjs";
import {useTranslation} from "react-i18next";
import "./schedulant-caption.scss";

export interface SchedulantCaptionProps {
    startDateTime: dayjs.Dayjs;
    endDateTime?: dayjs.Dayjs | null;
}

export const SchedulantCaption = React.forwardRef<HTMLDivElement, SchedulantCaptionProps>(
    ({startDateTime, endDateTime}, ref) => {
        const {t} = useTranslation();
        return (
            <div ref={ref} className="schedulant-caption">
                {t("schedulant.projectTime")}{startDateTime.format("YYYY-MM-DD")}
                {endDateTime && ` ~ ${endDateTime.format("YYYY-MM-DD")}`}
            </div>
        );
    }
);