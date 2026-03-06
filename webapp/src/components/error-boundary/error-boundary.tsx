import {Component, type ErrorInfo, type ReactNode} from "react";
import {Button, Result} from "antd";
import {log} from "@Webapp/logging";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

/**
 * React 错误边界
 *
 * 捕获子组件树中未被处理的运行时异常，防止整个页面白屏。
 * 展示友好的错误页，并提供"重试"和"回到首页"两个操作。
 *
 * 注意：ErrorBoundary 必须是类组件（React 的限制）。
 */
export class ErrorBoundary extends Component<Props, State> {
    state: State = {hasError: false};

    static getDerivedStateFromError(): State {
        return {hasError: true};
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        log.error("ErrorBoundary caught an error:", error, info.componentStack);
    }

    private handleRetry = () => {
        this.setState({hasError: false});
    };

    private handleGoHome = () => {
        window.location.replace("/home");
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh"}}>
                    <Result
                        status="error"
                        title="页面出现了一些问题"
                        subTitle="发生了意外错误，请尝试刷新或返回首页。"
                        extra={[
                            <Button key="retry" type="primary" onClick={this.handleRetry}>
                                重试
                            </Button>,
                            <Button key="home" onClick={this.handleGoHome}>
                                回到首页
                            </Button>,
                        ]}
                    />
                </div>
            );
        }

        return this.props.children;
    }
}
