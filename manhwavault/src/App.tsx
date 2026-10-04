import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { ToastProvider } from "./contexts/ToastContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { AppLayout } from "./layouts/AppLayout"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { ForgotPassword } from "./pages/ForgotPassword"
import { Dashboard } from "./pages/Dashboard"
import { Library } from "./pages/Library"
import { QuickUpdate } from "./pages/QuickUpdate"
import { History } from "./pages/History"
import { Statistics } from "./pages/Statistics"
import { Settings } from "./pages/Settings"
import { CustomCursor } from "./components/CustomCursor"

import { ManhwaAdd } from "./pages/ManhwaAdd"
import { ManhwaEdit } from "./pages/ManhwaEdit"
import { ManhwaDetails } from "./pages/ManhwaDetails"

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CustomCursor />
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="library" element={<Library />} />
              
              <Route path="manhwa/new" element={<ManhwaAdd />} />
              <Route path="manhwa/:id" element={<ManhwaDetails />} />
              <Route path="manhwa/:id/edit" element={<ManhwaEdit />} />

              <Route path="quick-update" element={<QuickUpdate />} />
              <Route path="history" element={<History />} />
              <Route path="statistics" element={<Statistics />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
