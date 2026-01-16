import React from "react";
import { Drawer, Form, Input, DatePicker, Select, Button, Space } from "antd";
import dayjs from "dayjs";
import { useCreateProject } from "@Webapp/api/modules/project";
import { ProjectStatus, ProjectStatusLabels } from "@Webapp/api/modules/project/types.ts";
import type { CreateProjectParams } from "@Webapp/api/modules/project/types.ts";
import "./create-project-drawer.scss";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

export interface CreateProjectDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateProjectDrawer: React.FC<CreateProjectDrawerProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const { createProject, loading } = useCreateProject();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const [startDate, endDate] = values.dateRange || [];

      const params: CreateProjectParams = {
        projectName: values.projectName,
        description: values.description,
        startDateTime: startDate ? startDate.format("YYYY-MM-DDTHH:mm:ss") : dayjs().format("YYYY-MM-DDTHH:mm:ss"),
        endDateTime: endDate ? endDate.format("YYYY-MM-DDTHH:mm:ss") : undefined,
        projectStatus: values.projectStatus || ProjectStatus.PLANNING,
        order: values.order
      };

      await createProject(params);
      form.resetFields();
      onClose();
      onSuccess?.();
    } catch (error) {
      // 表单验证失败或创建失败，错误已在 hook 中处理
      console.error("创建项目失败:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  // 状态选项
  const statusOptions = Object.entries(ProjectStatusLabels).map(([value, label]) => ({
    label,
    value: Number(value)
  }));

  return (
    <Drawer
      title="创建项目"
      placement="right"
      onClose={handleCancel}
      open={open}
      resizable
      size={500}
      classNames={{
        body: "create-project-drawer-body"
      }}
      footer={
        <div className="drawer-footer">
          <Space>
            <Button onClick={handleCancel}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              创建
            </Button>
          </Space>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          projectStatus: ProjectStatus.PLANNING
        }}
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
