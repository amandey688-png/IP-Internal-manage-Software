import { Input, Form, Typography, Space } from 'antd'
import { useState } from 'react'
import { validatePassword } from '../../utils/validation'
import type { FormItemProps } from 'antd'

const { Text } = Typography

interface PasswordInputProps extends Omit<FormItemProps, 'children'> {
  showValidationRules?: boolean
}

export const PasswordInput = ({ showValidationRules = true, ...formItemProps }: PasswordInputProps) => {
  const [touched, setTouched] = useState(false)

  return (
    <>
      <Form.Item
        {...formItemProps}
        rules={[
          ...(formItemProps.rules || []),
          {
            validator: (_, value) => {
              if (!value) {
                return Promise.reject(new Error('Please enter your password'))
              }
              const result = validatePassword(value)
              if (!result.isValid) {
                return Promise.reject(new Error(result.errors[0]))
              }
              return Promise.resolve()
            },
          },
        ]}
      >
        <Input.Password
          placeholder="Enter password"
          size="large"
          onBlur={() => setTouched(true)}
          onFocus={() => setTouched(true)}
        />
      </Form.Item>
      
      {showValidationRules && (
        <Form.Item noStyle dependencies={[formItemProps.name]}>
          {({ getFieldValue }) => {
            const password = getFieldValue(formItemProps.name as string) || ''
            const showRules = touched && password.length > 0

            if (!showRules) return null

            return (
              <Space direction="vertical" size={0} style={{ marginTop: -16, marginBottom: 16 }}>
                <Text type={password.length >= 8 ? 'success' : 'secondary'} style={{ fontSize: 12 }}>
                  {password.length >= 8 ? '✓' : '○'} At least 8 characters
                </Text>
                <Text type={/[a-z]/.test(password) ? 'success' : 'secondary'} style={{ fontSize: 12 }}>
                  {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter
                </Text>
                <Text type={/[A-Z]/.test(password) ? 'success' : 'secondary'} style={{ fontSize: 12 }}>
                  {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
                </Text>
                <Text type={/\d/.test(password) ? 'success' : 'secondary'} style={{ fontSize: 12 }}>
                  {/\d/.test(password) ? '✓' : '○'} One number
                </Text>
                <Text type={/[@$!%*?&]/.test(password) ? 'success' : 'secondary'} style={{ fontSize: 12 }}>
                  {/[@$!%*?&]/.test(password) ? '✓' : '○'} One special character (@$!%*?&)
                </Text>
              </Space>
            )
          }}
        </Form.Item>
      )}
    </>
  )
}
