import {Button, Result, Space} from "antd";
import {useNavigate, useSearchParams} from "react-router-dom";
import {CloseCircleOutlined, WarningOutlined, InfoCircleOutlined} from "@ant-design/icons";
import "./result-page.scss";

type ResultStatus = "error" | "warning" | "info";

const statusIcons = {
    error: <CloseCircleOutlined style={{fontSize: 72}}/>,
    warning: <WarningOutlined style={{fontSize: 72}}/>,
    info: <InfoCircleOutlined style={{fontSize: 72}}/>,
};

export const ResultPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Get parameters from URL
    const type = (searchParams.get("type") as ResultStatus) || "error";
    const title = searchParams.get("title") || "操作失败";
    const subtitle = searchParams.get("subtitle") || "";
    const showHome = searchParams.get("showHome") !== "false";
    const showBack = searchParams.get("showBack") !== "false";

    const handleGoHome = () => {
        navigate("/home");
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <div className="result-page">
            <div className="result-container">
                <Result
                    status={type}
                    icon={statusIcons[type]}
                    title={<span className="result-title">{title}</span>}
                    subTitle={subtitle && <span className="result-subtitle">{subtitle}</span>}
                    extra={
                        <Space size="middle" className="result-actions">
                            {showBack && (
                                <Button
                                    size="large"
                                    onClick={handleGoBack}
                                    className="action-button"
                                >
                                    返回上一页
                                </Button>
                            )}
                            {showHome && (
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={handleGoHome}
                                    className="action-button"
                                >
                                    返回首页
                                </Button>
                            )}
                        </Space>
                    }
                />
            </div>
        </div>
    );
};

