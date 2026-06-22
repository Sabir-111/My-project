import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabase } from './services/supabase'

import Navbar from './components/Navbar'
import ScrollToTop from './components/ScrollToTop'

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
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return
      setSession(session ?? null)
      setAuthLoading(false)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
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
        <Route path="/add-listing" element={<AddListing />} />
        <Route path="/edit/:id" element={<EditListing />} />
        <Route path="/edit-listing/:id" element={<EditListing />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:receiverId" element={<Chat />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/user/:id" element={<UserProfile />} />
        <Route path="/my-listings" element={<MyListings />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App
