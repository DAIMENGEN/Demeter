import "@Webapp/App.css"
import {BrowserRouter} from "react-router-dom"
import {AppRoutes} from "@Webapp/AppRoutes.tsx";
import {ConfigProvider} from "antd";

function App() {
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: "#91003c",
                    borderRadius: 2,
                },
            }}
        >
            <BrowserRouter>
                <AppRoutes/>
            </BrowserRouter>
        </ConfigProvider>
    )
}

export default App
