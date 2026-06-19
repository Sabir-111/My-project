import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
      
      </Routes>
    </BrowserRouter>
  )
}

export default App