import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabase } from './services/supabase'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import PrivateRoute from './components/PrivateRoute'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import AddListing from './pages/AddListing'
import EditListing from './pages/EditListing'
import ListingDetails from './pages/ListingDetails'
import Favorites from './pages/Favorites'
import Inbox from './pages/Inbox'
import Chat from './pages/Chat'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import UserProfile from './pages/UserProfile'
import MyListings from './pages/MyListings'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'

function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(session ?? null)
      } catch (err) {
        console.error('Failed to get supabase session', err)
        if (mounted) setSession(null)
      } finally {
        if (mounted) setAuthLoading(false)
      }
    }

    init()

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession ?? null)
    })

    return () => {
      mounted = false
      try {
        // unsubscribe if available
        if (data?.subscription?.unsubscribe) {
          data.subscription.unsubscribe()
        }
      } catch (e) {
        // ignore
      }
    }
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-page py-16">
          <div className="card p-10 text-center text-gray-500">
            Yüklənir...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <ScrollToTop />
      <Navbar session={session} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:slug" element={<Home />} />
        <Route path="/listing/:id" element={<ListingDetails />} />
        <Route path="/add-listing" element={<PrivateRoute session={session}><AddListing /></PrivateRoute>} />
        <Route path="/edit/:id" element={<PrivateRoute session={session}><EditListing /></PrivateRoute>} />
        <Route path="/edit-listing/:id" element={<PrivateRoute session={session}><EditListing /></PrivateRoute>} />
        <Route path="/favorites" element={<PrivateRoute session={session}><Favorites /></PrivateRoute>} />
        <Route path="/inbox" element={<PrivateRoute session={session}><Inbox /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute session={session}><Chat /></PrivateRoute>} />
        <Route path="/chat/:receiverId" element={<PrivateRoute session={session}><Chat /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute session={session}><Notifications /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute session={session}><Profile /></PrivateRoute>} />
        <Route path="/user/:id" element={<UserProfile />} />
        <Route path="/my-listings" element={<PrivateRoute session={session}><MyListings /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute session={session}><Admin /></PrivateRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />
    </div>
  )
}

export default App
