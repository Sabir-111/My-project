import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { supabase } from '../services/supabase'
import { formatDateTime } from '../utils/format'

function Inbox() {
  const [messages, setMessages] = useState([])
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

      setMessages(data || [])

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
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Mesaj qutusu</p>
        <h1 className="text-3xl font-bold text-gray-950">Inbox</h1>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
          Yeni mesaj yoxdur.
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <article key={msg.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-red-600">Göndərən: {msg.sender_id}</p>
                  <p className="mt-2 text-gray-800">{msg.text || 'Fayl göndərildi'}</p>
                  <small className="mt-2 block text-gray-500">{formatDateTime(msg.created_at)}</small>
                </div>

                <Link
                  to={`/chat/${msg.sender_id}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <MessageCircle size={18} />
                  Cavab yaz
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}

export default Inbox
