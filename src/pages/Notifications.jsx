import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { supabase } from '../services/supabase'
import { formatDateTime } from '../utils/format'

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let channel

    const initializeNotifications = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      setCurrentUserId(user.id)
      await loadNotifications(user.id)

      channel = supabase
        .channel(`notifications-page-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            setNotifications((current) => {
              if (current.some((item) => item.id === payload.new.id)) return current
              return [{ ...payload.new, is_read: true }, ...current]
            })

            await supabase
              .from('notifications')
              .update({
                is_read: true,
              })
              .eq('id', payload.new.id)
          }
        )
        .subscribe()

      setIsLoading(false)
    }

    initializeNotifications()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const loadNotifications = async (userId) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('id', {
        ascending: false,
      })

    if (!error) {
      setNotifications(data || [])
    }

    await supabase
      .from('notifications')
      .update({
        is_read: true,
      })
      .eq('user_id', userId)
      .eq('is_read', false)
  }

  const markAllAsRead = async () => {
    if (!currentUserId) return

    await supabase
      .from('notifications')
      .update({
        is_read: true,
      })
      .eq('user_id', currentUserId)

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    )
  }

  if (isLoading) {
    return <div className="p-10 text-center text-gray-600">Bildirişlər yüklənir...</div>
  }

  if (!currentUserId) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-950">Bildirişlər üçün daxil olun</h1>
          <Link to="/login" className="mt-4 inline-flex rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700">
            Daxil ol
          </Link>
        </div>
      </main>
    )
  }

  const unreadCount = notifications.filter((item) => !item.is_read).length

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Hesab</p>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-950">
            <Bell size={28} />
            Bildirişlər
          </h1>
          <p className="mt-1 text-gray-500">{notifications.length} bildiriş, {unreadCount} oxunmamış</p>
        </div>

        <button
          type="button"
          onClick={markAllAsRead}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
        >
          <CheckCheck size={18} />
          Hamısını oxunmuş et
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
          Bildiriş yoxdur.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <article
              key={item.id}
              className={`rounded-lg border p-4 shadow-sm ${
                item.is_read ? 'border-gray-200 bg-white' : 'border-red-200 bg-red-50'
              }`}
            >
              <p className="font-semibold text-gray-950">{item.title}</p>
              <small className="mt-2 block text-gray-500">{formatDateTime(item.created_at)}</small>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}

export default Notifications
