import "@Webapp/App.css"
import {useEffect} from "react";
import {BrowserRouter} from "react-router-dom"
import {AppRoutes} from "@Webapp/AppRoutes.tsx";
import {App as AntdApp, ConfigProvider} from "antd";
import {useLanguage} from "@Webapp/components";
import {errorBus} from "@Webapp/http";

/**
 * 在 AntdApp 内部注册全局错误通知处理器
 * 必须是独立组件，才能合法调用 AntdApp.useApp()
 */
function AppContent() {
    const {message} = AntdApp.useApp();

    useEffect(() => {
        errorBus.register((msg) => message.error(msg));
        return () => errorBus.register(null);
    }, [message]);

    return (
        <BrowserRouter>
            <AppRoutes/>
        </BrowserRouter>
    );
}

function App() {
    const {getAntdLocale} = useLanguage();

    return (
        <ConfigProvider
            locale={getAntdLocale()}
            theme={{
                token: {
                    colorPrimary: "#91003c",
                    borderRadius: 2,
                },
                components: {
                    Layout: {
                        headerBg: "#91003c",
                        headerHeight: 50,
                        headerPadding: 0,
                    },
                    Menu: {
                        darkItemBg: "#91003c",
                        darkItemSelectedBg: "rgba(255, 255, 255, 0.2)",
                        darkItemHoverBg: "rgba(255, 255, 255, 0.1)",
                    },
                    Button: {
                        primaryShadow: "none",
                        defaultShadow: "none",
                    },
                },
            }}
        >
            <AntdApp>
                <AppContent/>
            </AntdApp>
        </ConfigProvider>
    )
}

export default App
