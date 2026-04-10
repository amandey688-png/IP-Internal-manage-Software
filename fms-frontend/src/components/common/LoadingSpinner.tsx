import { Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { PageSkeleton } from './skeletons'

interface LoadingSpinnerProps {
  fullPage?: boolean
  size?: 'small' | 'default' | 'large'
  tip?: string
}

export const LoadingSpinner = ({ fullPage = false, size = 'default', tip }: LoadingSpinnerProps) => {
  if (fullPage) {
    return <PageSkeleton />
  }

  return (
    <Spin
      indicator={<LoadingOutlined style={{ fontSize: size === 'large' ? 48 : 24 }} spin />}
      size={size}
      tip={tip}
    />
  )
}
