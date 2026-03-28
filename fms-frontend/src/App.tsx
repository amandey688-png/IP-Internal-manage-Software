import { useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { ConfigProvider } from "antd"
import { AuthProvider } from "./contexts/AuthProvider"
import { AppLayout } from "./components/layout/AppLayout"
import { ProtectedRoute } from "./components/layout/ProtectedRoute"

import { Register } from "./pages/auth/Register"
import { Login } from "./pages/auth/Login"
import { ResetPassword } from "./pages/auth/ResetPassword"
import { OTPVerification } from "./pages/auth/OTPVerification"
import { ConfirmationSuccess } from "./pages/auth/ConfirmationSuccess"

import { Dashboard } from "./pages/Dashboard"
import { DashboardKPIPage } from "./pages/Dashboard/DashboardKPIPage"
import { ErrorBoundary } from "./components/common/ErrorBoundary"
import { TicketList } from "./pages/Tickets/TicketList"
import { TicketDetail } from "./pages/Tickets/TicketDetail"
import { SolutionList } from "./pages/Solutions/SolutionList"
import { StagingList } from "./pages/Staging/StagingList"
import { ChecklistPage } from "./pages/Task/ChecklistPage"
import { DelegationPage } from "./pages/Task/DelegationPage"
import { PerformanceMonitoringPage } from "./pages/Success/PerformanceMonitoringPage"
import { CompPerformPage } from "./pages/Success/CompPerformPage"
import { DashboardPage as SuccessDashboardPage } from "./pages/Success/DashboardPage"
import { UserList } from "./pages/Users/UserList"
import { SettingsPage } from "./pages/Settings/SettingsPage"
import { ApprovalConfirmPage } from "./pages/Approval/ApprovalConfirmPage"
import { SupportDashboard } from "./pages/Support/SupportDashboard"
import { LeadListPage } from "./pages/Leads/LeadListPage"
import { LeadDetailPage } from "./pages/Leads/LeadDetailPage"
import { LeadImportPage } from "./pages/Leads/LeadImportPage"
import { PaymentStatusPage } from "./pages/Onboarding/PaymentStatusPage"
import { ClientPaymentPage } from "./pages/Onboarding/ClientPaymentPage"
import { PaymentAgeingReportPage } from "./pages/Onboarding/PaymentAgeingReportPage"
import { ClientTrainingPage } from "./pages/Training/ClientTrainingPage"
import { AccessDeniedPage } from "./pages/AccessDeniedPage"

import { ROUTES, ROLES, APP_NAME, TICKET_ROUTE_SECTION_KEYS } from "./utils/constants"

function AppTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    const titles: Record<string, string> = {
      [ROUTES.LOGIN]: "Login",
      [ROUTES.RESET_PASSWORD]: "Reset password",
      [ROUTES.REGISTER]: "Register",
      [ROUTES.DASHBOARD]: "Dashboard",
      [ROUTES.DASHBOARD_KPI]: "Dashboard - KPI",
      [ROUTES.SUCCESS_DASHBOARD]: "Success Dashboard",
      [ROUTES.SUPPORT_DASHBOARD]: "Support Dashboard",
      [ROUTES.SU_DASH]: "Su -Dash",
      [ROUTES.TICKETS]: "Tickets",
      [ROUTES.STAGING]: "Staging",
      [ROUTES.CHECKLIST]: "Checklist",
      [ROUTES.DELEGATION]: "Delegation",
      [ROUTES.SUCCESS_PERFORMANCE]: "Performance Monitoring",
      [ROUTES.SUCCESS_COMP_PERFORM]: "Comp- Perform",
      [ROUTES.CLIENT_TO_LEAD]: "Client to Lead",
      [ROUTES.LEADS]: "Lead",
      [ROUTES.LEADS_IMPORT]: "Import from sheet",
      [ROUTES.ONBOARDING_PAYMENT_STATUS]: "Onboarding – Payment Status",
      [ROUTES.CLIENT_PAYMENT]: "Client Payment – Payment Management",
      [ROUTES.CLIENT_PAYMENT_Q_COMP]: "Client Payment – Q-Comp",
      [ROUTES.CLIENT_PAYMENT_M_COMP]: "Client Payment – M-Comp",
      [ROUTES.CLIENT_PAYMENT_HF_COMP]: "Client Payment – HF-Comp",
      [ROUTES.CLIENT_PAYMENT_PAYMENT_AGEING]: "Client Payment – Payment Ageing Report",
      [ROUTES.TRAINING_CLIENT]: "Client Training",
      [ROUTES.DB_CLIENT_CLIENTS]: "DB Client – Clients",
      [ROUTES.USERS]: "Users",
      [ROUTES.SETTINGS]: "Settings",
      [ROUTES.ACCESS_DENIED]: "Access denied",
    }
    const page = titles[pathname] || (pathname.startsWith("/tickets") ? "Ticket" : pathname.startsWith("/client-to-lead/leads/") ? "Lead Detail" : pathname.startsWith("/onboarding") ? "Onboarding" : APP_NAME)
    document.title = `${APP_NAME} - ${page}`
  }, [pathname])
  return null
}

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#4A6BFF",
          colorBgLayout: "#F5F7FB",
          colorBgContainer: "#FFFFFF",
          colorText: "#343A40",
          colorTextSecondary: "#6C757D",
          borderRadius: 8,
        },
        components: {
          Card: {
            borderRadiusLG: 8,
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
            <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
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
              path={ROUTES.ACCESS_DENIED}
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AccessDeniedPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.DASHBOARD}
              element={
                <ProtectedRoute sectionKeys={["dashboard"]}>
                  <AppLayout>
                    <ErrorBoundary>
                      <Dashboard />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.DASHBOARD_KPI}
              element={
                <ProtectedRoute sectionKeys={["dashboard"]}>
                  <AppLayout>
                    <ErrorBoundary>
                      <DashboardKPIPage />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.SUPPORT_DASHBOARD}
              element={
                <ProtectedRoute sectionKeys={["support_dashboard"]}>
                  <AppLayout>
                    <ErrorBoundary>
                      <SupportDashboard />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.SU_DASH}
              element={
                <ProtectedRoute sectionKeys={["support_dashboard"]}>
                  <AppLayout>
                    <ErrorBoundary>
                      <SuccessDashboardPage />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.TICKETS}
              element={
                <ProtectedRoute sectionKeys={[...TICKET_ROUTE_SECTION_KEYS]}>
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
                <ProtectedRoute sectionKeys={[...TICKET_ROUTE_SECTION_KEYS]}>
                  <AppLayout>
                    <TicketDetail />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.SOLUTIONS.replace(":ticketId", ":ticketId")}
              element={
                <ProtectedRoute sectionKeys={["solution"]}>
                  <AppLayout>
                    <SolutionList />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.STAGING}
              element={
                <ProtectedRoute sectionKeys={["staging"]}>
                  <AppLayout>
                    <StagingList />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.CHECKLIST}
              element={
                <ProtectedRoute sectionKeys={["task"]}>
                  <AppLayout>
                    <ChecklistPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.DELEGATION}
              element={
                <ProtectedRoute sectionKeys={["task"]}>
                  <AppLayout>
                    <DelegationPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.SUCCESS_DASHBOARD}
              element={
                <ProtectedRoute sectionKeys={["success_performance"]}>
                  <AppLayout>
                    <ErrorBoundary>
                      <DashboardKPIPage forceOpen defaultPerson="Shreyasi" />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.SUCCESS_PERFORMANCE}
              element={
                <ProtectedRoute sectionKeys={["success_performance"]}>
                  <AppLayout>
                    <ErrorBoundary>
                      <PerformanceMonitoringPage />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.SUCCESS_COMP_PERFORM}
              element={
                <ProtectedRoute sectionKeys={["success_comp_perform"]}>
                  <AppLayout>
                    <ErrorBoundary>
                      <CompPerformPage />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.LEADS}
              element={
                <ProtectedRoute sectionKeys={["leads", "client_to_lead"]}>
                  <AppLayout>
                    <ErrorBoundary>
                      <LeadListPage />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.LEAD_DETAIL}
              element={
                <ProtectedRoute sectionKeys={["leads", "client_to_lead"]}>
                  <AppLayout>
                    <ErrorBoundary>
                      <LeadDetailPage />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.LEADS_IMPORT}
              element={
                <ProtectedRoute sectionKeys={["leads", "client_to_lead"]}>
                  <AppLayout>
                    <ErrorBoundary>
                      <LeadImportPage />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.ONBOARDING_PAYMENT_STATUS}
              element={
                <ProtectedRoute sectionKeys={["onboarding_payment_status", "onboarding"]}>
                  <AppLayout>
                    <ErrorBoundary>
                      <PaymentStatusPage />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.CLIENT_PAYMENT}
              element={
                <ProtectedRoute sectionKeys={["client_payment"]}>
                  <AppLayout>
                    <ErrorBoundary>
                      <ClientPaymentPage />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.CLIENT_PAYMENT_Q_COMP} element={<ProtectedRoute sectionKeys={["client_payment"]}><AppLayout><ErrorBoundary><ClientPaymentPage /></ErrorBoundary></AppLayout></ProtectedRoute>} />
            <Route path={ROUTES.CLIENT_PAYMENT_M_COMP} element={<ProtectedRoute sectionKeys={["client_payment"]}><AppLayout><ErrorBoundary><ClientPaymentPage /></ErrorBoundary></AppLayout></ProtectedRoute>} />
            <Route path={ROUTES.CLIENT_PAYMENT_HF_COMP} element={<ProtectedRoute sectionKeys={["client_payment"]}><AppLayout><ErrorBoundary><ClientPaymentPage /></ErrorBoundary></AppLayout></ProtectedRoute>} />
            <Route
              path={ROUTES.CLIENT_PAYMENT_PAYMENT_AGEING}
              element={
                <ProtectedRoute sectionKeys={["client_payment"]}>
                  <AppLayout>
                    <ErrorBoundary>
                      <PaymentAgeingReportPage />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.TRAINING_CLIENT}
              element={
                <ProtectedRoute sectionKeys={["training"]}>
                  <AppLayout>
                    <ErrorBoundary>
                      <ClientTrainingPage />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.DB_CLIENT_CLIENTS}
              element={
                <ProtectedRoute sectionKeys={["db_client"]}>
                  <AppLayout>
                    <ErrorBoundary>
                      <ClientTrainingPage />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.USERS}
              element={
                <ProtectedRoute requiredRole={ROLES.ADMIN} sectionKeys={["users"]}>
                  <AppLayout>
                    <UserList />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.SETTINGS}
              element={
                <ProtectedRoute requiredRole={ROLES.ADMIN} sectionKeys={["settings"]}>
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
