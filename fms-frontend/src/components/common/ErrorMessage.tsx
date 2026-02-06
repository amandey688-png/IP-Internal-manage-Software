import { Alert } from 'antd'
import { AlertProps } from 'antd/es/alert'

interface ErrorMessageProps extends Omit<AlertProps, 'type' | 'message'> {
  message: string
  description?: string
}

export const ErrorMessage = ({ message, description, ...props }: ErrorMessageProps) => {
  return (
    <Alert
      type="error"
      message={message}
      description={description}
      showIcon
      closable
      {...props}
    />
  )
}
