import React, {useEffect} from "react";
import {Button, Drawer, Form, Space} from "antd";
import type {Dayjs} from "dayjs";
import dayjs from "dayjs";
import {useUpdateProject} from "@Webapp/api/modules/project";
import type {Project, UpdateProjectParams} from "@Webapp/api/modules/project/types.ts";
import "./edit-project-drawer.scss";
import {ProjectDrawerFormFields} from "../project-drawer-form-fields.tsx";
import {parseOptionalNonNegativeInteger, toNaiveDateTimeString} from "../project-drawer-utils.ts";

export interface EditProjectDrawerProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditProjectDrawer: React.FC<EditProjectDrawerProps> = ({
  open,
  project,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const { updateProject, loading } = useUpdateProject();

  // 当项目数据变化时，更新表单
  useEffect(() => {
    if (open && project) {
      form.setFieldsValue({
        projectName: project.projectName,
        description: project.description,
        dateRange: [
          project.startDateTime ? dayjs(project.startDateTime) : null,
          project.endDateTime ? dayjs(project.endDateTime) : null
        ],
        projectStatus: project.projectStatus,
        order: project.order
      });
    }
  }, [open, project, form]);

  // 当抽屉关闭时，重置表单
  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async () => {
    if (!project) return;

    try {
      const values = await form.validateFields();
      const [startDate, endDate] = (values.dateRange ?? []) as [Dayjs | null | undefined, Dayjs | null | undefined];

      const params: UpdateProjectParams = {
        projectName: values.projectName,
        description: values.description,
        startDateTime: startDate ? toNaiveDateTimeString(startDate) : undefined,
        endDateTime: endDate ? toNaiveDateTimeString(endDate) : undefined,
        projectStatus: values.projectStatus,
        order: parseOptionalNonNegativeInteger(values.order)
      };

      await updateProject(project.id, params);
      onClose();
      onSuccess?.();
    } catch (error) {
      // 表单验证失败或更新失败，错误已在 hook 中处理
      console.error("更新项目失败:", error);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Drawer
      title="编辑项目"
      placement="right"
      onClose={handleCancel}
      open={open}
      forceRender
      size={500}
      resizable
      loading={loading}
      classNames={{
        body: "edit-project-drawer-body"
      }}
      footer={
        <div className="drawer-footer">
          <Space>
            <Button onClick={handleCancel} disabled={loading}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              保存
            </Button>
          </Space>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
      >
        <ProjectDrawerFormFields />
      </Form>
    </Drawer>
  );
};
