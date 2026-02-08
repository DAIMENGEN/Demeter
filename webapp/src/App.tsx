import "@Webapp/App.css"
import {BrowserRouter} from "react-router-dom"
import {AppRoutes} from "@Webapp/AppRoutes.tsx";
import {App as AntdApp, ConfigProvider} from "antd";
import {useLanguage} from "@Webapp/components";

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
                <BrowserRouter>
                    <AppRoutes/>
                </BrowserRouter>
            </AntdApp>
        </ConfigProvider>
    )
}

export default App
