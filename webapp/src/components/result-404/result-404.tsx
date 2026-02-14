import {Button, Result} from "antd";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";

interface Result404Props {
    returnPath?: string;
    returnPageName?: string;
}

export const Result404 = ({returnPath = "/home", returnPageName}: Result404Props) => {
    const {t} = useTranslation();
    const navigate = useNavigate();

    const handleBack = () => {
        navigate(returnPath);
    };

    const buttonText = returnPageName 
        ? t("notFound.backTo", {page: returnPageName})
        : t("notFound.backHome");

    return (
        <Result
            status="404"
            title={t("notFound.title")}
            subTitle={t("notFound.subTitle")}
            extra={
                <Button type="primary" onClick={handleBack}>
                    {buttonText}
                </Button>
            }
        />
    );
};