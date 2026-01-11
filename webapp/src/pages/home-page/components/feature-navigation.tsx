import {Card, Col, Row, Typography} from "antd";
import {useNavigate} from "react-router-dom";
import "./feature-navigation.scss";
import projectImage from "../../../assets/nv/schedule-nv.jpg";

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
        key: "users",
        title: "用户管理",
        description: "管理系统用户，包括用户创建、编辑、权限分配等功能。",
        path: "/users",
        image: projectImage, // TODO: 替换为对应的图片
    },
    {
        key: "departments",
        title: "部门管理",
        description: "组织架构管理，创建和维护公司部门结构。",
        path: "/departments",
        image: projectImage, // TODO: 替换为对应的图片
    },
    {
        key: "teams",
        title: "团队管理",
        description: "管理团队信息，维护团队成员关系和协作。",
        path: "/teams",
        image: projectImage, // TODO: 替换为对应的图片
    },
    {
        key: "projects",
        title: "项目管理",
        description: "创建和跟踪项目进度，管理项目资源和任务分配。",
        path: "/projects",
        image: projectImage,
    },
    {
        key: "holidays",
        title: "假期管理",
        description: "管理员工假期申请、审批和假期日历查看。",
        path: "/holidays",
        image: projectImage, // TODO: 替换为对应的图片
    },
    {
        key: "settings",
        title: "系统设置",
        description: "配置系统参数、权限设置和其他系统级功能。",
        path: "/settings",
        image: projectImage, // TODO: 替换为对应的图片
    },
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

