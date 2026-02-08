import {useTranslation} from "react-i18next";
import {Dropdown, type MenuProps} from "antd";
import {GlobalOutlined} from "@ant-design/icons";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import jaJP from "antd/locale/ja_JP";
import {log} from "@Webapp/logging.ts";
import type {CSSProperties, FC} from "react";

export const useLanguage = () => {
    const {i18n} = useTranslation();

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang).catch(log.error);
        localStorage.setItem('i18nextLng', lang);
    };

    const getAntdLocale = () => {
        const currentLang = i18n.language;
        switch (currentLang) {
            case 'zh-CN':
                return zhCN;
            case 'en-US':
                return enUS;
            case 'ja-JP':
                return jaJP;
            default:
                return zhCN;
        }
    };

    return {
        currentLanguage: i18n.language,
        changeLanguage,
        getAntdLocale,
    };
};

interface LanguageSwitcherProps {
    style?: CSSProperties;
    iconStyle?: CSSProperties;
}

export const LanguageSwitcher: FC<LanguageSwitcherProps> = ({style, iconStyle}) => {
    const {t} = useTranslation();
    const {currentLanguage, changeLanguage} = useLanguage();

    const items: MenuProps['items'] = [
        {
            key: 'zh-CN',
            label: t('settings.chinese'),
            onClick: () => changeLanguage('zh-CN'),
        },
        {
            key: 'en-US',
            label: t('settings.english'),
            onClick: () => changeLanguage('en-US'),
        },
        {
            key: 'ja-JP',
            label: t('settings.japanese'),
            onClick: () => changeLanguage('ja-JP'),
        },
    ];

    const getCurrentLanguageLabel = () => {
        switch (currentLanguage) {
            case 'zh-CN':
                return '中文';
            case 'en-US':
                return 'English';
            case 'ja-JP':
                return '日本語';
            default:
                return '中文';
        }
    };

    return (
        <Dropdown menu={{items, selectedKeys: [currentLanguage]}} placement="bottomRight">
            <div style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', ...style}}>
                <GlobalOutlined style={{fontSize: '18px', ...iconStyle}}/>
                <span>{getCurrentLanguageLabel()}</span>
            </div>
        </Dropdown>
    );
};

