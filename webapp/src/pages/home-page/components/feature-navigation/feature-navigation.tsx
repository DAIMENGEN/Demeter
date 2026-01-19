import {Card, Col, Row, Typography} from "antd";
import {useNavigate} from "react-router-dom";
import "./feature-navigation.scss";
import projectManagementImage from "@Webapp/assets/nv/project-management-nv.gif";
import calendarImage from "@Webapp/assets/nv/calendar-nv.gif";

const {Title, Paragraph} = Typography;

interface FeatureItem {
    key: string;
    title: string;
    description: string;
    path: string;
    image: string;
}

const features: FeatureItem[] = [
    {
        key: "project-management",
        title: "项目管理",
        description: "例如：创建和跟踪项目进度，管理项目资源和任务分配。",
        path: "/home/project-management",
        image: projectManagementImage,
    },
    {
        key: "calendar",
        title: "公司日历",
        description: "例如：查看公司假期和国家法定假期。",
        path: "/home/calendar",
        image: calendarImage,
    },
    {
        key: "holiday",
        title: "假期管理",
        description: "例如：管理法定假期和调休工作日，支持批量操作。",
        path: "/home/holiday",
        image: calendarImage,
    }
];

export const FeatureNavigation = () => {
    const navigate = useNavigate();

    const handleCardClick = (path: string) => {
        navigate(path);
    };

    return (
        <div className="feature-navigation">
            <div className="feature-header">
                <Title level={2}>功能导航</Title>
                <Paragraph type="secondary">
                    选择下方功能模块，快速访问系统各项功能
                </Paragraph>
            </div>
            <Row gutter={[24, 24]}>
                {features.map((feature) => (
                    <Col
                        key={feature.key}
                        xs={24}
                        sm={12}
                        md={8}
                        lg={8}
                        xl={6}
                        xxl={6}
                    >
                        <Card
                            hoverable={false}
                            className="feature-card"
                            onClick={() => handleCardClick(feature.path)}
                            cover={
                                <div className="feature-card-cover">
                                    <img className="feature-card-image"
                                         src={feature.image}
                                         alt={feature.title}/>
                                </div>
                            }>
                            <Card.Meta
                                title={<span>{feature.title}</span>}
                                description={<span>{feature.description}</span>}/>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

