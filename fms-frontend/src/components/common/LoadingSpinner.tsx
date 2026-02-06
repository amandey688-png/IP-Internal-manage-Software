import { Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

interface LoadingSpinnerProps {
  fullPage?: boolean
  size?: 'small' | 'default' | 'large'
  tip?: string
}

export const LoadingSpinner = ({ fullPage = false, size = 'default', tip }: LoadingSpinnerProps) => {
  const spinner = (
    <Spin
      indicator={<LoadingOutlined style={{ fontSize: size === 'large' ? 48 : 24 }} spin />}
      size={size}
      tip={tip}
    />
  )

  if (fullPage) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        {spinner}
      </div>
    )
  }

  return spinner
}
