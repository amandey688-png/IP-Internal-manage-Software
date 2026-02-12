import { useState, useEffect } from "react"
import { Form, Input, Button, Card, Typography, message } from "antd"
import { UserOutlined, MailOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import { authApi } from "../../api/auth"
import { PasswordInput } from "../../components/forms/PasswordInput"
import { validateEmail } from "../../utils/validation"
import { ROUTES } from "../../utils/constants"
import type { RegisterRequest } from "../../types/auth"

const { Title, Text } = Typography

export const Register = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState("")
  const [resendLoading, setResendLoading] = useState(false)
  const navigate = useNavigate()

  // Redirect after success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate(ROUTES.LOGIN)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, navigate])

  // ✅ FORM SUBMIT
  const onFinish = async (values: RegisterRequest) => {
    console.log("🔥 Register form submit triggered")
    console.log("📝 Form values:", values)

    // Validate form values are present
    if (!values.email || !values.password || !values.full_name) {
      console.error("❌ Missing form values")
      message.error("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      console.log("📤 Sending registration request to backend...")
      const response = await authApi.register(values)
      console.log("📥 Received response:", response)

      // Check for error response
      if (response?.error) {
        const errorMsg = response.error.message || "Registration failed"
        const code = response.error.code
        console.error("❌ Registration error:", { message: errorMsg, code })
        // Show error - include code for 500 to help debug
        const displayMsg = code === '500' ? `${errorMsg} (Backend error - check backend terminal)` : errorMsg
        message.error(displayMsg, 10)
        setLoading(false)
        return
      }

      // Check if we have data
      if (response?.data) {
        console.log("✅ Registration successful:", response.data)
        setRegisteredEmail(response.data.email || values.email)
        message.success(
          response.data.message || "Registration successful! Please check your email."
        )
        setSuccess(true)
        form.resetFields()
      } else {
        // Unexpected response format
        console.warn("⚠️ Unexpected response format:", response)
        message.error("Unexpected response from server. Please try again.")
      }
    } catch (err: any) {
      console.error("❌ Register exception:", err)
      const detail = err.response?.data?.detail
      const msg = typeof detail === 'string' ? detail : err.message || "Something went wrong"
      message.error(msg, 8)
    } finally {
      setLoading(false)
    }
  }

  const onFinishFailed = (errorInfo: any) => {
    console.error("❌ Form validation failed:", errorInfo)
    message.error("Please fix the form errors before submitting")
  }

  // ✅ SUCCESS SCREEN
  if (success) {
    return (
      <div style={pageStyle}>
        <Card style={{ width: 420, textAlign: "center" }}>
          <Title level={3}>Registration Successful 🎉</Title>
          <Text type="success" style={{ display: "block" }}>
            Check your email for a confirmation link.
          </Text>
          <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
            Click the link to activate your account, then log in.
          </Text>
          <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
            Redirecting to login in 5 seconds…
          </Text>
          {registeredEmail && (
            <Button
              type="link"
              loading={resendLoading}
              style={{ marginTop: 16 }}
              onClick={async () => {
                setResendLoading(true)
                try {
                  const res = await authApi.resendConfirmation(registeredEmail)
                  message.success(res?.message || "Email resent. Check inbox and spam.")
                } catch (e: any) {
                  message.error(e.response?.data?.detail || "Failed to resend.")
                } finally {
                  setResendLoading(false)
                }
              }}
            >
              Didn't receive the email? Resend
            </Button>
          )}
        </Card>
      </div>
    )
  }

  // ✅ REGISTER FORM UI
  return (
    <div style={pageStyle}>
      <Card style={{ width: 420 }}>
        <Title level={2} style={{ textAlign: "center", marginBottom: 32 }}>
          Register
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item
            name="full_name"
            label="Full Name"
            rules={[
              { required: true, message: "Please enter your full name" },
              { min: 2, message: "Minimum 2 characters required" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Your full name"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter your email" },
              {
                validator: (_, value) =>
                  !value || validateEmail(value)
                    ? Promise.resolve()
                    : Promise.reject(new Error("Enter a valid email")),
              },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Email address"
              size="large"
            />
          </Form.Item>

          <PasswordInput
            name="password"
            label="Password"
            showValidationRules
          />

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
            >
              Register
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Text>
            Already have an account?{" "}
            <span
              style={{ color: "#1677ff", cursor: "pointer" }}
              onClick={() => navigate(ROUTES.LOGIN)}
            >
              Log in
            </span>
          </Text>
        </div>
      </Card>
    </div>
  )
}

const pageStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  background: "#f0f2f5",
}
