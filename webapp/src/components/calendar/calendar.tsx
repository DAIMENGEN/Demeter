import "./calendar.scss";
import {Typography} from "antd";

const {Title, Paragraph} = Typography;

export const Calendar = () => {
    return (
        <div className="calendar-component">
            <div className="calendar-header">
                <Title level={2}>公司日历</Title>
                <Paragraph type="secondary">
                    查看公司假期和国家法定假期
                </Paragraph>
            </div>
            <div className="calendar-content">
                <Paragraph>日历功能正在开发中...</Paragraph>
            </div>
        </div>
    );
};

