import {Card, Col, Row, Typography} from "antd";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import "./feature-navigation.scss";
import projectManagementImage from "@Webapp/assets/nv/project-management-nv.gif";
import calendarImage from "@Webapp/assets/nv/calendar-nv.gif";

const {Title, Paragraph} = Typography;

interface FeatureItem {
    key: string;
    titleKey: string;
    descriptionKey: string;
    path: string;
    image: string;
}

const features: FeatureItem[] = [
    {
        key: "project-management",
        titleKey: "featureNav.projectManagement",
        descriptionKey: "featureNav.projectManagementDesc",
        path: "/home/project-management",
        image: projectManagementImage,
    },
    {
        key: "calendar",
        titleKey: "featureNav.calendar",
        descriptionKey: "featureNav.calendarDesc",
        path: "/home/calendar",
        image: calendarImage,
    },
    {
        key: "holiday",
        titleKey: "featureNav.holiday",
        descriptionKey: "featureNav.holidayDesc",
        path: "/home/holiday",
        image: calendarImage,
    }
];

export const FeatureNavigation = () => {
    const navigate = useNavigate();
    const {t} = useTranslation();

    const handleCardClick = (path: string) => {
        navigate(path);
    };

    return (
        <div className="feature-navigation">
            <div className="feature-header">
                <Title level={2}>{t("featureNav.title")}</Title>
                <Paragraph type="secondary">
                    {t("featureNav.subtitle")}
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
                                         alt={t(feature.titleKey)}/>
                                </div>
                            }>
                            <Card.Meta
                                title={<span>{t(feature.titleKey)}</span>}
                                description={<span>{t(feature.descriptionKey)}</span>}/>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

