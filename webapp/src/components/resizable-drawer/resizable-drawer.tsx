import React from "react";
import {Drawer} from "antd";
import type {DrawerProps} from "antd";

const DEFAULT_WIDTH = 736;

export type ResizableDrawerProps = Omit<DrawerProps, "placement" | "resizable" | "size">;

/**
 * A pre-configured resizable Drawer that opens from the right
 * with a unified default width.
 *
 * - Always `placement="right"` and `resizable`
 * - Uses `defaultSize` for the initial width (defaults to 500)
 * - Accepts all other standard Drawer props
 */
export const ResizableDrawer: React.FC<ResizableDrawerProps> = ({
    defaultSize = DEFAULT_WIDTH,
    children,
    ...rest
}) => (
    <Drawer
        placement="right"
        resizable
        defaultSize={defaultSize}
        {...rest}
    >
        {children}
    </Drawer>
);
