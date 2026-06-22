import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Paperclip, Send, Trash2 } from 'lucide-react'
import { supabase } from '../services/supabase'
import { formatTime } from '../utils/format'
import { uploadPublicFile } from '../utils/storage'

function Chat() {
  const { receiverId } = useParams()
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [message, setMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [file, setFile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    let isActive = true
    let channel

    const initializeChat = async () => {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!isActive) return

      if (!user) {
        setIsLoading(false)
        return
      }

      setCurrentUserId(user.id)

      const [{ data: profiles }, { data: messageData }] = await Promise.all([
        supabase.from('profiles').select('*').neq('id', user.id),
        supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('id', { ascending: true }),
      ])

      if (!isActive) return

      const profileList = profiles || []
      setUsers(profileList)
      setMessages(messageData || [])

      if (receiverId) {
        const receiver = profileList.find((profile) => profile.id === receiverId)
        if (receiver) setSelectedUser(receiver)
      }

      channel = supabase
        .channel(`chat-room-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const nextMessage = payload.new
            const isRelevant =
              nextMessage.sender_id === user.id || nextMessage.receiver_id === user.id

            if (!isRelevant) return

            setMessages((current) => {
              if (current.some((item) => item.id === nextMessage.id)) return current
              return [...current, nextMessage]
            })
          }
        )
        .subscribe()

      setIsLoading(false)
    }

    initializeChat()

    return () => {
      isActive = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [receiverId])

  const filteredMessages = useMemo(() => {
    if (!selectedUser || !currentUserId) return []

    return messages.filter(
      (msg) =>
        (msg.sender_id === currentUserId && msg.receiver_id === selectedUser.id) ||
        (msg.sender_id === selectedUser.id && msg.receiver_id === currentUserId)
    )
  }, [currentUserId, messages, selectedUser])

  const sortedUsers = useMemo(() => {
    const lastMessageId = (userId) => {
      let latest = 0
      for (const msg of messages) {
        const isConversation =
          (msg.sender_id === currentUserId && msg.receiver_id === userId) ||
          (msg.sender_id === userId && msg.receiver_id === currentUserId)
        if (isConversation && msg.id > latest) latest = msg.id
      }
      return latest
    }

    return [...users].sort((first, second) => lastMessageId(second.id) - lastMessageId(first.id))
  }, [users, messages, currentUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })

    markMessagesAsRead()
  }, [filteredMessages.length, selectedUser?.id])

  const markMessagesAsRead = async () => {
    if (!selectedUser || !currentUserId) return

    await supabase
      .from('messages')
      .update({
        is_read: true,
      })
      .eq('sender_id', selectedUser.id)
      .eq('receiver_id', currentUserId)

    setMessages((current) =>
      current.map((msg) =>
        msg.sender_id === selectedUser.id && msg.receiver_id === currentUserId
          ? {
              ...msg,
              is_read: true,
            }
          : msg
      )
    )
  }

  const deleteMessage = async (id) => {
    const ok = window.confirm('Mesaj silinsin?')

    if (!ok) return

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)
      .eq('sender_id', currentUserId)

    if (error) {
      alert(error.message)
      return
    }

    setMessages((current) => current.filter((msg) => msg.id !== id))
  }

  const sendMessage = async () => {
    const text = message.trim()

    if (!currentUserId || !selectedUser) return

    if (!text && !file) {
      alert('Mesaj və ya fayl əlavə edin')
      return
    }

    setIsSending(true)

    let fileUrl = null
    let fileType = null

    try {
      if (file) {
        fileUrl = await uploadPublicFile('chat-files', file, `messages/${currentUserId}`)
        fileType = file.type
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: currentUserId,
            receiver_id: selectedUser.id,
            text,
            file_url: fileUrl,
            file_type: fileType,
          },
        ])
        .select()
        .single()

      if (error) {
        alert(error.message)
        return
      }

      await supabase.from('notifications').insert([
        {
          user_id: selectedUser.id,
          title: 'Sizə yeni mesaj gəldi',
        },
      ])

      if (data) {
        setMessages((current) => {
          if (current.some((item) => item.id === data.id)) return current
          return [...current, data]
        })
      }

      setMessage('')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      alert(error.message)
    } finally {
      setIsSending(false)
    }
  }

  const getConversationMessages = (userId) =>
    messages.filter(
      (msg) =>
        (msg.sender_id === currentUserId && msg.receiver_id === userId) ||
        (msg.sender_id === userId && msg.receiver_id === currentUserId)
    )

  const getLastMessage = (userId) => {
    const conversation = getConversationMessages(userId)
    return conversation[conversation.length - 1]
  }

  const getUnreadCount = (userId) =>
    messages.filter(
      (msg) => msg.sender_id === userId && msg.receiver_id === currentUserId && !msg.is_read
    ).length

  if (isLoading) {
    return <div className="p-10 text-center text-gray-600">Söhbətlər yüklənir...</div>
  }

  if (!currentUserId) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-950">Mesajlara baxmaq üçün daxil olun</h1>
          <Link to="/login" className="mt-4 inline-flex rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700">
            Daxil ol
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid min-h-[calc(100vh-120px)] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm lg:grid-cols-[340px_1fr]">
        <aside className="border-b border-gray-200 bg-gray-950 text-white lg:border-b-0 lg:border-r">
          <div className="border-b border-gray-800 p-4">
            <h1 className="text-xl font-bold">Mesajlar</h1>
          </div>

          <div className="max-h-[320px] overflow-y-auto lg:max-h-[calc(100vh-180px)]">
            {users.length === 0 ? (
              <p className="p-4 text-sm text-gray-400">Söhbət üçün istifadəçi tapılmadı.</p>
            ) : (
              sortedUsers.map((profile) => {
                const lastMessage = getLastMessage(profile.id)
                const unreadCount = getUnreadCount(profile.id)

                return (
                  <button
                    type="button"
                    key={profile.id}
                    onClick={() => setSelectedUser(profile)}
                    className={`flex w-full items-center gap-3 border-b border-gray-800 p-4 text-left hover:bg-gray-900 ${
                      selectedUser?.id === profile.id ? 'bg-gray-900' : ''
                    }`}
                  >
                    {profile.avatar ? (
                      <img src={profile.avatar} alt={profile.username || 'İstifadəçi'} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 font-bold">
                        {(profile.username || 'İ').slice(0, 1).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold">{profile.username || 'İstifadəçi'}</p>
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold">{unreadCount}</span>
                        )}
                      </div>
                      <p className="truncate text-sm text-gray-400">
                        {lastMessage?.text || (lastMessage?.file_url ? 'Fayl göndərildi' : 'Mesaj yoxdur')}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        <section className="flex min-h-[560px] flex-col bg-gray-50">
          <div className="border-b border-gray-200 bg-white p-4">
            <h2 className="text-xl font-bold text-gray-950">
              {selectedUser ? selectedUser.username || 'İstifadəçi' : 'Söhbət seçin'}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!selectedUser ? (
              <div className="flex h-full items-center justify-center text-gray-500">Mesajlaşmaq üçün soldan istifadəçi seçin.</div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-500">Bu söhbətdə hələ mesaj yoxdur.</div>
            ) : (
              <div className="space-y-3">
                {filteredMessages.map((msg) => {
                  const isMine = msg.sender_id === currentUserId

                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] rounded-lg px-4 py-3 shadow-sm ${isMine ? 'bg-red-600 text-white' : 'bg-white text-gray-900'}`}>
                        {msg.text && <p className="whitespace-pre-line">{msg.text}</p>}

                        {msg.file_url && (
                          <div className="mt-2">
                            {msg.file_type?.startsWith('image') ? (
                              <img src={msg.file_url} alt="Mesaj faylı" className="max-h-64 rounded-lg object-cover" />
                            ) : (
                              <a
                                href={msg.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className={`inline-flex items-center gap-2 underline ${isMine ? 'text-white' : 'text-red-600'}`}
                              >
                                <Paperclip size={16} />
                                Faylı aç
                              </a>
                            )}
                          </div>
                        )}

                        <div className="mt-2 flex items-center justify-end gap-2 text-xs opacity-75">
                          <span>{formatTime(msg.created_at)}</span>
                          {isMine && (
                            <button
                              type="button"
                              onClick={() => deleteMessage(msg.id)}
                              className="rounded p-1 hover:bg-black/10"
                              aria-label="Mesajı sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {selectedUser && (
            <div className="border-t border-gray-200 bg-white p-4">
              {file && (
                <div className="mb-3 flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">
                  <span className="truncate">{file.name}</span>
                  <button type="button" onClick={() => setFile(null)} className="font-semibold text-red-600">
                    Sil
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 text-gray-700 hover:bg-gray-50"
                  aria-label="Fayl əlavə et"
                >
                  <Paperclip size={20} />
                </button>

                <input
                  type="text"
                  placeholder="Mesaj yazın..."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      if (!isSending && (message.trim() || file)) {
                        sendMessage()
                      }
                    }
                  }}
                  className="flex-1 rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                />

                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={isSending || (!message.trim() && !file)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:bg-red-300"
                >
                  <Send size={18} />
                  Göndər
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Chat
