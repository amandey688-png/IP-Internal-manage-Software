import { useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { ConfigProvider } from "antd"
import { AuthProvider } from "./contexts/AuthProvider"
import { AppLayout } from "./components/layout/AppLayout"
import { ProtectedRoute } from "./components/layout/ProtectedRoute"

import { Register } from "./pages/auth/Register"
import { Login } from "./pages/auth/Login"
import { OTPVerification } from "./pages/auth/OTPVerification"
import { ConfirmationSuccess } from "./pages/auth/ConfirmationSuccess"

import { Dashboard } from "./pages/Dashboard"
import { ErrorBoundary } from "./components/common/ErrorBoundary"
import { TicketList } from "./pages/Tickets/TicketList"
import { TicketDetail } from "./pages/Tickets/TicketDetail"
import { SolutionList } from "./pages/Solutions/SolutionList"
import { StagingList } from "./pages/Staging/StagingList"
import { UserList } from "./pages/Users/UserList"
import { SettingsPage } from "./pages/Settings/SettingsPage"
import { ApprovalConfirmPage } from "./pages/Approval/ApprovalConfirmPage"

import { ROUTES, ROLES, APP_NAME } from "./utils/constants"

function AppTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    const titles: Record<string, string> = {
      [ROUTES.LOGIN]: "Login",
      [ROUTES.REGISTER]: "Register",
      [ROUTES.DASHBOARD]: "Dashboard",
      [ROUTES.TICKETS]: "Tickets",
      [ROUTES.STAGING]: "Staging",
      [ROUTES.USERS]: "Users",
      [ROUTES.SETTINGS]: "Settings",
    }
    const page = titles[pathname] || (pathname.startsWith("/tickets") ? "Ticket" : APP_NAME)
    document.title = `${APP_NAME} - ${page}`
  }, [pathname])
  return null
}

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#2c3e50",
          borderRadius: 8,
          colorBgContainer: "#ffffff",
        },
        components: {
          Card: {
            borderRadiusLG: 12,
          },
        },
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <AppTitle />
          <Routes>
            {/* ================= PUBLIC ROUTES ================= */}
            <Route path={ROUTES.REGISTER} element={<Register />} />
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path={ROUTES.OTP} element={<OTPVerification />} />
            <Route
              path={ROUTES.CONFIRMATION_SUCCESS}
              element={<ConfirmationSuccess />}
            />
            {/* Email confirmation callback route */}
            <Route
              path="/auth/confirm"
              element={<ConfirmationSuccess />}
            />
            {/* Email approval link (public, token in query) */}
            <Route path="/approval/confirm" element={<ApprovalConfirmPage />} />

            {/* ================= PROTECTED ROUTES ================= */}
            <Route
              path={ROUTES.DASHBOARD}
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ErrorBoundary>
                      <Dashboard />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.TICKETS}
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ErrorBoundary>
                      <TicketList />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={`${ROUTES.TICKETS}/:id`}
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TicketDetail />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.SOLUTIONS.replace(":ticketId", ":ticketId")}
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SolutionList />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.STAGING}
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <StagingList />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.USERS}
              element={
                <ProtectedRoute requiredRole={ROLES.ADMIN}>
                  <AppLayout>
                    <UserList />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.SETTINGS}
              element={
                <ProtectedRoute requiredRole={ROLES.ADMIN}>
                  <AppLayout>
                    <SettingsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* ================= DEFAULT ROUTES ================= */}

            {/* App root → login */}
            <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />

            {/* Unknown routes */}
            <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  )
}

export default App
