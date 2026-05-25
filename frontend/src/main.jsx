import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import Navbar from './components/layout/Navbar.jsx'
import StudentSidebar from './components/layout/StudentSidebar.jsx'
import StatusBanner from './components/common/StatusBanner.jsx'
import { useAuth } from './context/AuthContext.jsx'

const RootShell = () => {
  const { status, setStatus, user } = useAuth()
  const isStudent = user?.role === 'student'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const containerClass = isStudent ? 'max-w-7xl' : 'max-w-6xl'

  useEffect(() => {
    if (isStudent) {
      setIsSidebarOpen(true)
    }
  }, [isStudent])

  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <div className="fixed inset-x-0 top-0 z-50">
        <div className={`mx-auto w-full px-4 pt-4 sm:px-6 lg:px-8 ${containerClass}`}>
          <Navbar
            onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
            isMenuOpen={isSidebarOpen}
          />
        </div>
      </div>

      <div className={`mx-auto w-full px-4 pb-20 pt-28 sm:px-6 sm:pt-32 lg:px-8 ${containerClass}`}>
        <StatusBanner text={status} onClear={() => setStatus('')} />

        {isStudent ? (
          <div className={`relative min-h-[70vh] items-start gap-6 lg:grid ${
            isSidebarOpen ? 'lg:grid-cols-[260px_1fr]' : 'lg:grid-cols-[0_1fr]'
          }`}>
            <StudentSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="min-w-0">
              <App />
            </div>
          </div>
        ) : (
          <App />
        )}
      </div>
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <RootShell />
    </AuthProvider>
  </BrowserRouter>,
)
