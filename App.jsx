import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './services/supabase'


import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import AddListing from './pages/AddListing'
import MyListings from './pages/MyListings'
import Navbar from './components/Navbar'
import ListingDetails from './pages/ListingDetails'
import Chat from './pages/Chat'
import Inbox from './pages/Inbox'
import Profile from './pages/Profile'
import EditListing from './pages/EditListing'
import Favorites from './pages/Favorites'
import Admin from './pages/Admin'
import UserProfile from './pages/UserProfile'
import Notifications from './pages/Notifications'

function NotFound() {
  return (
    <main className="max-w-xl mx-auto px-4 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-red-600">404</p>
      <h1 className="mt-2 text-3xl font-bold text-gray-950">Səhifə tapılmadı</h1>
      <p className="mt-3 text-gray-500">Axtardığınız səhifə mövcud deyil və ya köçürülüb.</p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
      >
        Ana səhifəyə qayıt
      </Link>
    </main>
  )
}

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Navbar session={session} />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/admin"
          element={<Admin />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/user/:id"
          element={<UserProfile />}
        />

        <Route
          path="/add-listing"
          element={<AddListing />}
        />

        <Route 
          path="/my-listings"
          element={<MyListings />}
        />

        <Route
          path="/edit-listing/:id"
          element={<EditListing />}
        />

        <Route 
          path="/profile" 
          element={<Profile />} 
        />

        <Route
          path="/chat/:receiverId"
          element={<Chat />}
        />

        <Route
          path="/favorites"
          element={<Favorites />}
        />

        <Route 
          path="/chat" 
          element={<Chat />} 
        />

        <Route 
          path="/inbox" 
          element={<Inbox />} 
        />

        <Route
          path="/listing/:id"
          element={<ListingDetails />}
        />

        <Route
          path="/edit/:id"
          element={<EditListing />}
        />

        <Route
          path="/notifications"
          element={<Notifications />}
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App