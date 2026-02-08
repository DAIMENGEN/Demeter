import "@Webapp/index.css";
import "@Webapp/config/dayjs";
import "@Webapp/i18n";
import {StrictMode} from "react"
import {createRoot} from "react-dom/client"
import {Provider} from 'react-redux'
import {PersistGate} from 'redux-persist/integration/react'
import App from '@Webapp/App.tsx'
import {persistor, store} from '@Webapp/store'

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <App/>
            </PersistGate>
        </Provider>
    </StrictMode>,
)
