import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AppLayout } from "./layouts/AppLayout"
import { Dashboard } from "./pages/Dashboard"
import { Library } from "./pages/Library"
import { QuickUpdate } from "./pages/QuickUpdate"
import { History } from "./pages/History"
import { Statistics } from "./pages/Statistics"
import { Settings } from "./pages/Settings"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="library" element={<Library />} />
          <Route path="quick-update" element={<QuickUpdate />} />
          <Route path="history" element={<History />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
