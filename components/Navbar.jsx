import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Heart, Home, Inbox, LogIn, LogOut, Menu, PlusCircle, Shield, User, X } from 'lucide-react'
import { supabase } from '../services/supabase'

function Navbar({ session }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(session?.user || null)
  const [notificationCount, setNotificationCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setUser(session?.user || null)
  }, [session])

  useEffect(() => {
    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setUser(nextSession?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setNotificationCount(0)
      return
    }

    loadNotifications(user.id)

    const channel = supabase
      .channel(`notifications-count-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => loadNotifications(user.id)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const checkUser = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    setUser(currentUser || null)
  }

  const loadNotifications = async (userId) => {
    const { count } = await supabase
      .from('notifications')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('user_id', userId)
      .eq('is_read', false)

    setNotificationCount(count || 0)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsOpen(false)
    navigate('/')
  }

  const closeMenu = () => setIsOpen(false)

  const linkClass = 'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-red-700'

  const navLinks = (
    <>
      <Link to="/" onClick={closeMenu} className={linkClass}>
        <Home size={18} />
        Ana səhifə
      </Link>

      {user && (
        <>
          <Link to="/add-listing" onClick={closeMenu} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
            <PlusCircle size={18} />
            Elan yerləşdir
          </Link>

          <Link to="/inbox" onClick={closeMenu} className={linkClass}>
            <Inbox size={18} />
            Inbox
          </Link>

          <Link to="/profile" onClick={closeMenu} className={linkClass}>
            <User size={18} />
            Profil
          </Link>

          <Link to="/my-listings" onClick={closeMenu} className={linkClass}>
            Mənim elanlarım
          </Link>

          <Link to="/favorites" onClick={closeMenu} className={linkClass}>
            <Heart size={18} />
            Favorilər
          </Link>

          <Link to="/notifications" onClick={closeMenu} className={linkClass}>
            <Bell size={18} />
            Bildirişlər
            {notificationCount > 0 && (
              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-red-600">{notificationCount}</span>
            )}
          </Link>

          <Link to="/admin" onClick={closeMenu} className={linkClass}>
            <Shield size={18} />
            Admin
          </Link>

          <button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-red-700">
            <LogOut size={18} />
            Çıxış
          </button>
        </>
      )}

      {!user && (
        <>
          <Link to="/login" onClick={closeMenu} className={linkClass}>
            <LogIn size={18} />
            Daxil ol
          </Link>

          <Link to="/register" onClick={closeMenu} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
            Qeydiyyat
          </Link>
        </>
      )}
    </>
  )

  return (
    <header className="sticky top-0 z-40 bg-red-600 text-white shadow">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="text-2xl font-bold" onClick={closeMenu}>
          Elan.az
        </Link>

        <div className="hidden items-center gap-1 lg:flex">{navLinks}</div>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex rounded-lg p-2 hover:bg-red-700 lg:hidden"
          aria-label="Menyunu aç"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {isOpen && (
        <div className="border-t border-red-500 px-4 pb-4 lg:hidden">
          <div className="flex flex-col gap-1">{navLinks}</div>
        </div>
      )}
    </header>
  )
}

export default Navbar
