import { Alert } from 'antd'
import { AlertProps } from 'antd/es/alert'

interface SuccessMessageProps extends Omit<AlertProps, 'type' | 'message'> {
  message: string
  description?: string
}

export const SuccessMessage = ({ message, description, ...props }: SuccessMessageProps) => {
  return (
    <Alert
      type="success"
      message={message}
      description={description}
      showIcon
      closable
      {...props}
    />
  )
}
