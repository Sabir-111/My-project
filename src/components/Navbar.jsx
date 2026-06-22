import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Bell,
  Heart,
  Home,
  Inbox,
  LogIn,
  LogOut,
  Menu,
  PlusCircle,
  Shield,
  User,
  X,
  LayoutGrid,
} from 'lucide-react'
import { supabase } from '../services/supabase'

function Navbar({ session }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [user, setUser] = useState(session?.user || null)
  const [notificationCount, setNotificationCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setUser(session?.user || null)
  }, [session])

  useEffect(() => {
    const syncUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      setUser(currentUser || null)
    }

    syncUser()

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
    let active = true
    let notificationChannel = null

    const loadNotifications = async (userId) => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (!active) return

      if (error) {
        console.error('Notification count error:', error.message)
        setNotificationCount(0)
        return
      }

      setNotificationCount(count || 0)
    }

    const setupNotifications = async () => {
      if (!user?.id) {
        setNotificationCount(0)
        return
      }

      await loadNotifications(user.id)

      notificationChannel = supabase
        .channel(`notifications-count-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          async () => {
            await loadNotifications(user.id)
          }
        )
        .subscribe()
    }

    setupNotifications()

    return () => {
      active = false
      if (notificationChannel) {
        supabase.removeChannel(notificationChannel)
      }
    }
  }, [user?.id])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setNotificationCount(0)
    setIsOpen(false)
    navigate('/')
  }

  const closeMenu = () => setIsOpen(false)

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const desktopLinkClass = (path) =>
    `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
      isActive(path)
        ? 'bg-red-50 text-red-600'
        : 'text-gray-700 hover:bg-gray-100'
    }`

  const mobileLinkClass = (path) =>
    `inline-flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
      isActive(path)
        ? 'bg-red-50 text-red-600'
        : 'text-gray-700 hover:bg-gray-100'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto max-w-7xl px-4">
        <nav className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link to="/" onClick={closeMenu} className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
                <LayoutGrid size={20} />
              </div>

              <div className="leading-tight">
                <div className="text-lg font-extrabold tracking-tight text-gray-950">
                  Elan.az
                </div>
                <div className="text-xs text-gray-500">
                  Al, sat, elan ver
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <Link to="/" className={desktopLinkClass('/')}>
              <Home size={18} />
              Ana səhifə
            </Link>

            {user ? (
              <>
                <Link to="/favorites" className={desktopLinkClass('/favorites')}>
                  <Heart size={18} />
                  Favorilər
                </Link>

                <Link to="/inbox" className={desktopLinkClass('/inbox')}>
                  <Inbox size={18} />
                  Inbox
                </Link>

                <Link
                  to="/notifications"
                  className={desktopLinkClass('/notifications')}
                >
                  <Bell size={18} />
                  Bildirişlər
                  {notificationCount > 0 && (
                    <span className="ml-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                      {notificationCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/my-listings"
                  className={desktopLinkClass('/my-listings')}
                >
                  Mənim elanlarım
                </Link>

                <Link to="/profile" className={desktopLinkClass('/profile')}>
                  <User size={18} />
                  Profil
                </Link>

                <Link to="/admin" className={desktopLinkClass('/admin')}>
                  <Shield size={18} />
                  Admin
                </Link>

                <Link
                  to="/add-listing"
                  className="ml-2 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                >
                  <PlusCircle size={18} />
                  Elan yerləşdir
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  <LogOut size={18} />
                  Çıxış
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={desktopLinkClass('/login')}>
                  <LogIn size={18} />
                  Daxil ol
                </Link>

                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                >
                  Qeydiyyat
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 p-2 text-gray-700 transition hover:bg-gray-100 lg:hidden"
            aria-label="Menyunu aç"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {/* Mobile menu */}
        {isOpen && (
          <div className="border-t border-gray-200 py-3 lg:hidden">
            <div className="flex flex-col gap-1">
              <Link to="/" onClick={closeMenu} className={mobileLinkClass('/')}>
                <Home size={18} />
                Ana səhifə
              </Link>

              {user ? (
                <>
                  <Link
                    to="/add-listing"
                    onClick={closeMenu}
                    className="inline-flex items-center gap-3 rounded-xl bg-red-600 px-3 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    <PlusCircle size={18} />
                    Elan yerləşdir
                  </Link>

                  <Link
                    to="/favorites"
                    onClick={closeMenu}
                    className={mobileLinkClass('/favorites')}
                  >
                    <Heart size={18} />
                    Favorilər
                  </Link>

                  <Link
                    to="/inbox"
                    onClick={closeMenu}
                    className={mobileLinkClass('/inbox')}
                  >
                    <Inbox size={18} />
                    Inbox
                  </Link>

                  <Link
                    to="/notifications"
                    onClick={closeMenu}
                    className={mobileLinkClass('/notifications')}
                  >
                    <Bell size={18} />
                    Bildirişlər
                    {notificationCount > 0 && (
                      <span className="ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                        {notificationCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/my-listings"
                    onClick={closeMenu}
                    className={mobileLinkClass('/my-listings')}
                  >
                    Mənim elanlarım
                  </Link>

                  <Link
                    to="/profile"
                    onClick={closeMenu}
                    className={mobileLinkClass('/profile')}
                  >
                    <User size={18} />
                    Profil
                  </Link>

                  <Link
                    to="/admin"
                    onClick={closeMenu}
                    className={mobileLinkClass('/admin')}
                  >
                    <Shield size={18} />
                    Admin
                  </Link>

                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    <LogOut size={18} />
                    Çıxış
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className={mobileLinkClass('/login')}
                  >
                    <LogIn size={18} />
                    Daxil ol
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="inline-flex items-center gap-3 rounded-xl bg-red-600 px-3 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Qeydiyyat
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar