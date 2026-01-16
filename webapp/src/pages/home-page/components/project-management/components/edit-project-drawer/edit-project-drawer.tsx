import React, {useEffect} from "react";
import {Button, DatePicker, Drawer, Form, Input, Select, Space} from "antd";
import dayjs from "dayjs";
import {useUpdateProject} from "@Webapp/api/modules/project";
import type {Project, UpdateProjectParams} from "@Webapp/api/modules/project/types.ts";
import {ProjectStatusLabels} from "@Webapp/api/modules/project/types.ts";
import "./edit-project-drawer.scss";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

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
      const [startDate, endDate] = values.dateRange || [];

      const params: UpdateProjectParams = {
        projectName: values.projectName,
        description: values.description,
        startDateTime: startDate ? startDate.format("YYYY-MM-DDTHH:mm:ss") : undefined,
        endDateTime: endDate ? endDate.format("YYYY-MM-DDTHH:mm:ss") : undefined,
        projectStatus: values.projectStatus,
        order: values.order
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

  // 状态选项
  const statusOptions = Object.entries(ProjectStatusLabels).map(([value, label]) => ({
    label,
    value: Number(value)
  }));

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
        <Form.Item
          name="projectName"
          label="项目名称"
          rules={[
            { required: true, message: "请输入项目名称" },
            { max: 100, message: "项目名称不能超过100个字符" }
          ]}
        >
          <Input placeholder="请输入项目名称" />
        </Form.Item>

        <Form.Item
          name="description"
          label="项目描述"
          rules={[
            { max: 500, message: "项目描述不能超过500个字符" }
          ]}
        >
          <TextArea
            rows={4}
            placeholder="请输入项目描述（可选）"
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          name="dateRange"
          label="项目时间"
          rules={[
            { required: true, message: "请选择项目开始时间" }
          ]}
        >
          <RangePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            style={{ width: "100%" }}
            placeholder={["开始时间", "结束时间（可选）"]}
          />
        </Form.Item>

        <Form.Item
          name="projectStatus"
          label="项目状态"
          rules={[{ required: true, message: "请选择项目状态" }]}
        >
          <Select
            placeholder="请选择项目状态"
            options={statusOptions}
          />
        </Form.Item>

        <Form.Item
          name="order"
          label="排序序号"
          tooltip="数字越小，排序越靠前"
        >
          <Input
            type="number"
            placeholder="请输入排序序号（可选）"
            min={0}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

