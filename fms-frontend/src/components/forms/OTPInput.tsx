import { Input, Space } from 'antd'
import type { InputRef } from 'antd/es/input'
import { useRef, useState, useEffect, KeyboardEvent, ChangeEvent } from 'react'

interface OTPInputProps {
  value?: string
  onChange?: (value: string) => void
  length?: number
  disabled?: boolean
}

function valueToDigits(value: string, length: number): string[] {
  const digits = (value || '').split('').filter((c) => /^\d$/.test(c)).slice(0, length)
  return Array.from({ length }, (_, i) => digits[i] ?? '')
}

export const OTPInput = ({ value = '', onChange, length = 4, disabled = false }: OTPInputProps) => {
  const [otp, setOtp] = useState<string[]>(() => valueToDigits(value, length))
  const inputRefs = useRef<(InputRef | null)[]>([])

  // Sync internal state when parent passes a new value (controlled behavior / reset)
  useEffect(() => {
    setOtp(valueToDigits(value, length))
  }, [value, length])

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
    const raw = e.clipboardData.getData('text')
    const digits = raw.split('').filter((char) => /^\d$/.test(char)).slice(0, length)
    if (digits.length === 0) return

    const newOtp = [...otp]
    digits.forEach((d, i) => { newOtp[i] = d })
    setOtp(newOtp)
    onChange?.(newOtp.join(''))
    const nextIndex = Math.min(digits.length, length) - 1
    setTimeout(() => inputRefs.current[nextIndex]?.focus(), 0)
  }

  return (
    <Space size="middle" onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => (
        <Input
          key={index}
          ref={(el) => { inputRefs.current[index] = el as InputRef | null }}
          value={otp[index]}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
          maxLength={1}
          disabled={disabled}
          aria-label={`OTP digit ${index + 1}`}
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
