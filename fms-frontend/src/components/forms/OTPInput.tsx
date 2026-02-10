import { Input, Space } from 'antd'
import { useRef, useState, KeyboardEvent, ChangeEvent } from 'react'

interface OTPInputProps {
  value?: string
  onChange?: (value: string) => void
  length?: number
  disabled?: boolean
}

export const OTPInput = ({ onChange, length = 4, disabled = false }: OTPInputProps) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, inputValue: string) => {
    // Only allow digits
    if (inputValue && !/^\d$/.test(inputValue)) {
      return
    }

    const newOtp = [...otp]
    newOtp[index] = inputValue
    setOtp(newOtp)

    const otpString = newOtp.join('')
    onChange?.(otpString)

    // Auto-focus next input
    if (inputValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, length)
    const pastedArray = pastedData.split('').filter((char) => /^\d$/.test(char))

    if (pastedArray.length === length) {
      setOtp(pastedArray)
      onChange?.(pastedArray.join(''))
      inputRefs.current[length - 1]?.focus()
    }
  }

  return (
    <Space size="middle" onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => (
        <Input
          key={index}
          ref={(el) => {
            const native = (el as { input?: HTMLInputElement | null } | null)?.input ?? null
            inputRefs.current[index] = native
          }}
          value={otp[index]}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
          maxLength={1}
          disabled={disabled}
          style={{
            width: 50,
            height: 50,
            textAlign: 'center',
            fontSize: 20,
            fontWeight: 'bold',
          }}
        />
      ))}
    </Space>
  )
}
