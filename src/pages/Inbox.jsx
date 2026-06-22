import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { supabase } from '../services/supabase'
import { formatDateTime } from '../utils/format'

function Inbox() {
  const [messages, setMessages] = useState([])
  const [profiles, setProfiles] = useState({})
  const [currentUserId, setCurrentUserId] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let channel

    const initializeInbox = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      setCurrentUserId(user.id)

      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', user.id)
        .order('id', {
          ascending: false,
        })

      const messageList = data || []
      setMessages(messageList)
      await loadProfiles(messageList.map((message) => message.sender_id))

      channel = supabase
        .channel(`messages-inbox-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`,
          },
          (payload) => {
            setMessages((current) => {
              if (current.some((message) => message.id === payload.new.id)) return current
              return [payload.new, ...current]
            })
            loadProfiles([payload.new.sender_id])
          }
        )
        .subscribe()

      setIsLoading(false)
    }

    initializeInbox()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const loadProfiles = async (senderIds) => {
    const uniqueIds = [...new Set(senderIds.filter(Boolean))]

    setProfiles((current) => {
      const missing = uniqueIds.filter((id) => !current[id])
      if (missing.length === 0) return current

      supabase
        .from('profiles')
        .select('id, username, avatar')
        .in('id', missing)
        .then(({ data }) => {
          if (!data || data.length === 0) return
          setProfiles((latest) => {
            const next = { ...latest }
            data.forEach((profile) => {
              next[profile.id] = profile
            })
            return next
          })
        })

      return current
    })
  }

  const getSenderName = (senderId) => profiles[senderId]?.username || 'İstifadəçi'

  const unreadCount = useMemo(
    () => messages.filter((msg) => !msg.is_read).length,
    [messages]
  )

  if (isLoading) {
    return <div className="p-10 text-center text-gray-600">Inbox yüklənir...</div>
  }

  if (!currentUserId) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-950">Inbox üçün daxil olun</h1>
          <Link to="/login" className="mt-4 inline-flex rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700">
            Daxil ol
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Mesaj qutusu</p>
          <h1 className="text-3xl font-bold text-gray-950">Inbox</h1>
        </div>
        {unreadCount > 0 && (
          <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white">
            {unreadCount} oxunmamış
          </span>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
          Yeni mesaj yoxdur.
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => {
            const sender = profiles[msg.sender_id]

            return (
              <article
                key={msg.id}
                className={`rounded-lg border bg-white p-5 shadow-sm ${
                  msg.is_read ? 'border-gray-200' : 'border-red-200 bg-red-50/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    {sender?.avatar ? (
                      <img
                        src={sender.avatar}
                        alt={getSenderName(msg.sender_id)}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 font-bold text-white">
                        {getSenderName(msg.sender_id).slice(0, 1).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="font-bold text-gray-950">{getSenderName(msg.sender_id)}</p>
                      <p className="mt-1 break-words text-gray-800">{msg.text || 'Fayl göndərildi'}</p>
                      <small className="mt-2 block text-gray-500">{formatDateTime(msg.created_at)}</small>
                    </div>
                  </div>

                  <Link
                    to={`/chat/${msg.sender_id}`}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <MessageCircle size={18} />
                    Cavab yaz
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}

export default Inbox
