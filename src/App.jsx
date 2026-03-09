import React from 'react'
import logo from './assets/logo.png'
import searchImg from './assets/search.png'
import { initializeApp } from "firebase/app"
import {
  getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc,
  deleteField, collection, getDocs, deleteDoc,
  query, orderBy, limit, addDoc, serverTimestamp, startAfter, arrayUnion, arrayRemove
} from "firebase/firestore"
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth"
import { getDatabase, ref, onValue, onDisconnect, set } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyAuoY__cctnuVBUHvldAxLhp7kVbJSFk-U",
  authDomain: "chick-phobia.firebaseapp.com",
  databaseURL: "https://chick-phobia-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "chick-phobia",
  storageBucket: "chick-phobia.firebasestorage.app",
  messagingSenderId: "465447309915",
  appId: "1:465447309915:web:1cd775260fc5a56abf657e",
  measurementId: "G-F3L4QDTKSN"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const rtdb = getDatabase(app)
const auth = getAuth(app)
const provider = new GoogleAuthProvider()

const translations = {
  ar: {
    welcome: "اهلا",
    chooseNick: "اختار اسم",
    start: "ابدأ",
    taken: "الاسم ده متاخد",
    updated: "اتحدث",
    error: "حصل خطأ!",
    changeName: "تغيير الاسم:",
    save: "حفظ",
    language: "اللغة:",
    logout: "تسجيل الخروج",
    selectFriend: "اختار صاحب",
    online: "نشط",
    offline: "غير متصل",
    type: "اكتب رسالة...",
    reply: "رد",
    edit: "تعديل",
    delete: "حذف",
    cancel: "إلغاء",
    editing: "تعديل",
    replyingTo: "الرد على",
    noFriends: "لا يوجد أصدقاء",
    noRequests: "لا توجد طلبات",
    searchUser: "ابحث عن شخص...",
    sent: "تم!",
    deletedMsg: "تم حذف الرسالة",
    edited: "(متعدلة)"
  },
  en: {
    welcome: "Welcome",
    chooseNick: "Choose Nickname",
    start: "Start",
    taken: "Taken!",
    updated: "Updated!",
    error: "Error!",
    changeName: "Change Name:",
    save: "Save",
    language: "Language:",
    logout: "Logout",
    selectFriend: "Select a friend",
    online: "Online",
    offline: "Offline",
    type: "Type...",
    reply: "Reply",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    editing: "Editing message",
    replyingTo: "Replying to",
    noFriends: "No friends yet",
    noRequests: "No requests",
    searchUser: "Search user...",
    sent: "Sent!",
    deletedMsg: "This message was deleted",
    edited: "(edited)"
  }
}

function App() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

  const [user, setUser] = React.useState(undefined)
  const [nickname, setNickname] = React.useState('')
  const [isRegistered, setIsRegistered] = React.useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const [isFriendsOpen, setIsFriendsOpen] = React.useState(false)
  const [language, setLanguage] = React.useState(localStorage.getItem('appLang') || 'ar')
  const [newNickname, setNewNickname] = React.useState('')
  const [friends, setFriends] = React.useState([])
  const [requests, setRequests] = React.useState([])
  const [sentRequests, setSentRequests] = React.useState([])
  const [activeTab, setActiveTab] = React.useState('friends')
  const [searchUser, setSearchUser] = React.useState('')
  const [searchError, setSearchError] = React.useState('')
  const [suggestions, setSuggestions] = React.useState([])
  const [allUsers, setAllUsers] = React.useState([])
  const [usersData, setUsersData] = React.useState({})
  const [selectedFriend, setSelectedFriend] = React.useState(null)
  const [messages, setMessages] = React.useState([])
  const [msgInput, setMsgInput] = React.useState('')
  const [firstDoc, setFirstDoc] = React.useState(null)
  const [replyingTo, setReplyingTo] = React.useState(null)
  const [editingMsg, setEditingMsg] = React.useState(null)
  const [activeMenu, setActiveMenu] = React.useState(null)
  const [mobileSheet, setMobileSheet] = React.useState(null)
  const [swipeState, setSwipeState] = React.useState({})
  const [isClosingChat, setIsClosingChat] = React.useState(false)

  const [groups, setGroups] = React.useState([])
  const [selectedGroup, setSelectedGroup] = React.useState(null)
  const [groupMessages, setGroupMessages] = React.useState([])
  const [groupMsgInput, setGroupMsgInput] = React.useState('')
  const [isGroupChatOpen, setIsGroupChatOpen] = React.useState(false)
  const [isClosingGroupChat, setIsClosingGroupChat] = React.useState(false)
  const [addGroupExpanded, setAddGroupExpanded] = React.useState(false)
  const [selectedMembersForGroup, setSelectedMembersForGroup] = React.useState([])
  const [newGroupName, setNewGroupName] = React.useState('')
  const [groupCreationStep, setGroupCreationStep] = React.useState('select')
  const [groupSettingsOpen, setGroupSettingsOpen] = React.useState(false)
  const [groupSettingName, setGroupSettingName] = React.useState('')
  const [groupSettingPassword, setGroupSettingPassword] = React.useState('')
  const [replyingToGroup, setReplyingToGroup] = React.useState(null)
  const [editingGroupMsg, setEditingGroupMsg] = React.useState(null)
  const [activeGroupMenu, setActiveGroupMenu] = React.useState(null)
  const [mobileGroupSheet, setMobileGroupSheet] = React.useState(null)
  const [groupSwipeState, setGroupSwipeState] = React.useState({})

  const scrollRef = React.useRef()
  const groupScrollRef = React.useRef()
  const listRef = React.useRef()
  const groupListRef = React.useRef()
  const inputRef = React.useRef()
  const groupInputRef = React.useRef()
  const longPressTimer = React.useRef(null)
  const touchStartX = React.useRef(null)
  const touchStartY = React.useRef(null)
  const groupLongPressTimer = React.useRef(null)
  const groupTouchStartX = React.useRef(null)
  const groupTouchStartY = React.useRef(null)

  const CLOUD_NAME = "dbgqro4d3"
  const UPLOAD_PRESET = "chick phobia"

  const t = translations[language]

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u)
        const snap = await getDocs(collection(db, "users"))
        const found = snap.docs.find(d => d.data().uid === u.uid)
        if (found) {
          if (!found.data().photo || found.data().photo !== u.photoURL) {
            await updateDoc(doc(db, "users", found.id), { photo: u.photoURL })
          }
          setNickname(found.id)
          setNewNickname(found.id)
          setIsRegistered(true)
          listenToData(found.id)
        } else {
          setIsRegistered(false)
        }
      } else {
        setUser(null)
        setIsRegistered(false)
        setNickname('')
      }
    })
    return () => unsub()
  }, [])

  React.useEffect(() => {
    if (!user || !isRegistered) return

    const usersUnsub = onSnapshot(collection(db, "users"), (snap) => {
      const names = []
      const baseData = {}
      snap.docs.forEach(d => {
        names.push(d.id)
        baseData[d.id] = {
          photo: d.data().photo || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
          userNumber: d.data().userNumber || null,
          online: false
        }
      })
      setAllUsers(names)
      setUsersData(prev => ({ ...prev, ...baseData }))
    })

    const statusRef = ref(rtdb, 'status')
    const statusUnsub = onValue(statusRef, (snapshot) => {
      const statuses = snapshot.val() || {}
      setUsersData(prev => {
        const newData = { ...prev }
        Object.keys(statuses).forEach(id => {
          if (newData[id]) {
            newData[id].online = statuses[id].state === 'online'
          }
        })
        return newData
      })
    })

    return () => {
      usersUnsub()
      statusUnsub()
    }
  }, [isRegistered, user])

  React.useEffect(() => {
    if (!user || !isRegistered || !nickname) return
    const groupsUnsub = onSnapshot(collection(db, "groups"), (snap) => {
      const myGroups = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(g => g.members && g.members.includes(nickname))
      setGroups(myGroups)
    })
    return () => groupsUnsub()
  }, [isRegistered, user, nickname])

  React.useEffect(() => {
    if (isRegistered && nickname) {
      const userStatusDatabaseRef = ref(rtdb, `/status/${nickname}`)
      const connectedRef = ref(rtdb, ".info/connected")

      const unsub = onValue(connectedRef, (snapshot) => {
        if (snapshot.val() === false) return
        onDisconnect(userStatusDatabaseRef).set({ state: 'offline' }).then(() => {
          set(userStatusDatabaseRef, { state: 'online' })
        })
      })

      return () => unsub()
    }
  }, [isRegistered, nickname])

  React.useEffect(() => {
    if (!selectedFriend || !nickname) return
    const chatId = [nickname, selectedFriend].sort().join('_')
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "desc"),
      limit(50)
    )
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse()
      setMessages(fetched)
      setFirstDoc(snap.docs[snap.docs.length - 1])
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    })
    return () => unsub()
  }, [selectedFriend, nickname])

  React.useEffect(() => {
    if (!selectedGroup || !nickname) return
    const q = query(
      collection(db, "groups", selectedGroup.id, "messages"),
      orderBy("createdAt", "desc"),
      limit(50)
    )
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse()
      setGroupMessages(fetched)
      setTimeout(() => groupScrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    })
    return () => unsub()
  }, [selectedGroup, nickname])

  React.useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenu(null)
      setActiveGroupMenu(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleScroll = () => {
    if (!listRef.current) return
    const { scrollTop } = listRef.current
    if (scrollTop === 0 && firstDoc) loadOlder()
  }

  const loadOlder = async () => {
    const chatId = [nickname, selectedFriend].sort().join('_')
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "desc"),
      startAfter(firstDoc),
      limit(50)
    )
    const snap = await getDocs(q)
    if (!snap.empty) {
      const older = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse()
      setMessages(prev => [...older, ...prev])
      setFirstDoc(snap.docs[snap.docs.length - 1])
    }
  }

  const listenToData = (id) => {
    onSnapshot(doc(db, "users", id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        setFriends(data.friends ? Object.keys(data.friends) : [])
        setRequests(data.requests ? Object.keys(data.requests) : [])
        setSentRequests(data.sentRequests ? Object.keys(data.sentRequests) : [])
      }
    })
  }

  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar'
    setLanguage(newLang)
    localStorage.setItem('appLang', newLang)
  }

  const handleUpdateNickname = async () => {
    if (!newNickname || newNickname === nickname) return
    const cleanId = newNickname.toLowerCase().trim().replace(/\s/g, '')
    const oldRef = doc(db, "users", nickname)
    const newRef = doc(db, "users", cleanId)
    try {
      const check = await getDoc(newRef)
      if (check.exists()) return alert(t.taken)
      const oldSnap = await getDoc(oldRef)
      await setDoc(newRef, oldSnap.data())
      await deleteDoc(oldRef)
      setNickname(cleanId)
      alert(t.updated)
    } catch (e) { alert(t.error) }
  }

  const handleSetNickname = async (e) => {
    e.preventDefault()
    if (!nickname || !user) return
    const cleanNick = nickname.toLowerCase().trim().replace(/\s/g, '')
    const userRef = doc(db, "users", cleanNick)
    try {
      const docSnap = await getDoc(userRef)
      if (docSnap.exists()) {
        alert(t.taken)
      } else {
        const allSnap = await getDocs(collection(db, "users"))
        const nextNumber = allSnap.size + 1
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          photo: user.photoURL,
          friends: {},
          requests: {},
          sentRequests: {},
          createdAt: serverTimestamp(),
          userNumber: nextNumber
        })
        setNickname(cleanNick)
        setIsRegistered(true)
        listenToData(cleanNick)
      }
    } catch (err) { alert(t.error) }
  }

  const handleSearch = (val) => {
    setSearchUser(val)
    if (val.length > 0) {
      const filtered = allUsers.filter(u =>
        u.includes(val.toLowerCase()) &&
        u !== nickname &&
        !friends.includes(u) &&
        !sentRequests.includes(u)
      )
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }

  const sendRequest = async (target) => {
    const t_val = target || searchUser
    if (!t_val || t_val === nickname) return
    const tRef = doc(db, "users", t_val)
    const myRef = doc(db, "users", nickname)
    try {
      await updateDoc(tRef, { [`requests.${nickname}`]: true })
      await updateDoc(myRef, { [`sentRequests.${t_val}`]: true })
      setSearchUser('')
      setSuggestions([])
      setSearchError(t.sent)
      setTimeout(() => setSearchError(''), 2000)
    } catch (e) { setSearchError(t.error) }
  }

  const acceptFriend = async (sender) => {
    const myRef = doc(db, "users", nickname)
    const sRef = doc(db, "users", sender)
    await updateDoc(myRef, { [`friends.${sender}`]: true, [`requests.${sender}`]: deleteField() })
    await updateDoc(sRef, { [`friends.${nickname}`]: true, [`sentRequests.${nickname}`]: deleteField() })
  }

  const handleMediaUpload = async (file) => {
    if (!file || !selectedFriend) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)
    const resourceType = file.type.startsWith('video') ? 'video' : 'image'
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
        { method: 'POST', body: formData }
      )
      const data = await res.json()
      if (data.secure_url) {
        const chatId = [nickname, selectedFriend].sort().join('_')
        await addDoc(collection(db, "chats", chatId, "messages"), {
          [resourceType]: data.secure_url,
          type: resourceType,
          sender: nickname,
          createdAt: serverTimestamp()
        })
      }
    } catch (e) { console.error("Upload error:", e) }
  }

  const handleGroupMediaUpload = async (file) => {
    if (!file || !selectedGroup) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)
    const resourceType = file.type.startsWith('video') ? 'video' : 'image'
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
        { method: 'POST', body: formData }
      )
      const data = await res.json()
      if (data.secure_url) {
        await addDoc(collection(db, "groups", selectedGroup.id, "messages"), {
          [resourceType]: data.secure_url,
          type: resourceType,
          sender: nickname,
          senderPhoto: user?.photoURL || '',
          createdAt: serverTimestamp()
        })
      }
    } catch (e) { console.error("Group upload error:", e) }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!msgInput.trim() || !selectedFriend) return
    const chatId = [nickname, selectedFriend].sort().join('_')
    const text = msgInput

    if (editingMsg) {
      const msgRef = doc(db, "chats", chatId, "messages", editingMsg.id)
      await updateDoc(msgRef, { text, isEdited: true })
      setEditingMsg(null)
      setMsgInput('')
      return
    }

    setMsgInput('')
    const msgData = { text, sender: nickname, createdAt: serverTimestamp() }

    if (replyingTo) {
      msgData.replyTo = {
        id: replyingTo.id,
        text: replyingTo.text || '',
        sender: replyingTo.sender
      }
      setReplyingTo(null)
    }

    await addDoc(collection(db, "chats", chatId, "messages"), msgData)
  }

  const sendGroupMessage = async (e) => {
    e.preventDefault()
    if (!groupMsgInput.trim() || !selectedGroup) return
    const text = groupMsgInput

    if (editingGroupMsg) {
      const msgRef = doc(db, "groups", selectedGroup.id, "messages", editingGroupMsg.id)
      await updateDoc(msgRef, { text, isEdited: true })
      setEditingGroupMsg(null)
      setGroupMsgInput('')
      return
    }

    setGroupMsgInput('')
    const msgData = {
      text,
      sender: nickname,
      senderPhoto: user?.photoURL || '',
      createdAt: serverTimestamp()
    }

    if (replyingToGroup) {
      msgData.replyTo = {
        id: replyingToGroup.id,
        text: replyingToGroup.text || '',
        sender: replyingToGroup.sender
      }
      setReplyingToGroup(null)
    }

    await addDoc(collection(db, "groups", selectedGroup.id, "messages"), msgData)
  }

  const handleReply = (msg) => {
    setReplyingTo(msg)
    setEditingMsg(null)
    setActiveMenu(null)
    setMobileSheet(null)
    inputRef.current?.focus()
  }

  const handleEdit = (msg) => {
    setEditingMsg(msg)
    setMsgInput(msg.text || '')
    setReplyingTo(null)
    setActiveMenu(null)
    setMobileSheet(null)
    inputRef.current?.focus()
  }

  const handleDelete = async (msg) => {
    if (!selectedFriend) return
    const chatId = [nickname, selectedFriend].sort().join('_')
    const msgsRef = collection(db, "chats", chatId, "messages")

    await updateDoc(doc(msgsRef, msg.id), {
      text: t.deletedMsg,
      image: deleteField(),
      video: deleteField(),
      isDeleted: true
    })

    const allSnap = await getDocs(msgsRef)
    const linked = allSnap.docs.filter(d => d.data().replyTo?.id === msg.id)
    await Promise.all(
      linked.map(d =>
        updateDoc(doc(msgsRef, d.id), {
          'replyTo.text': t.deletedMsg,
          'replyTo.deleted': true
        })
      )
    )

    setActiveMenu(null)
    setMobileSheet(null)

    if (editingMsg?.id === msg.id) {
      setEditingMsg(null)
      setMsgInput('')
    }
    if (replyingTo?.id === msg.id) {
      setReplyingTo(null)
    }
  }

  const handleGroupReply = (msg) => {
    setReplyingToGroup(msg)
    setEditingGroupMsg(null)
    setActiveGroupMenu(null)
    setMobileGroupSheet(null)
    groupInputRef.current?.focus()
  }

  const handleGroupEdit = (msg) => {
    setEditingGroupMsg(msg)
    setGroupMsgInput(msg.text || '')
    setReplyingToGroup(null)
    setActiveGroupMenu(null)
    setMobileGroupSheet(null)
    groupInputRef.current?.focus()
  }

  const handleGroupDelete = async (msg) => {
    if (!selectedGroup) return
    const msgsRef = collection(db, "groups", selectedGroup.id, "messages")

    await updateDoc(doc(msgsRef, msg.id), {
      text: t.deletedMsg,
      image: deleteField(),
      video: deleteField(),
      isDeleted: true
    })

    const allSnap = await getDocs(msgsRef)
    const linked = allSnap.docs.filter(d => d.data().replyTo?.id === msg.id)
    await Promise.all(
      linked.map(d =>
        updateDoc(doc(msgsRef, d.id), {
          'replyTo.text': t.deletedMsg,
          'replyTo.deleted': true
        })
      )
    )

    setActiveGroupMenu(null)
    setMobileGroupSheet(null)

    if (editingGroupMsg?.id === msg.id) {
      setEditingGroupMsg(null)
      setGroupMsgInput('')
    }
    if (replyingToGroup?.id === msg.id) {
      setReplyingToGroup(null)
    }
  }

  const cancelReplyEdit = () => {
    setReplyingTo(null)
    setEditingMsg(null)
    setMsgInput('')
  }

  const cancelGroupReplyEdit = () => {
    setReplyingToGroup(null)
    setEditingGroupMsg(null)
    setGroupMsgInput('')
  }

  const handleMenuToggle = (e, msgId) => {
    e.stopPropagation()
    setActiveMenu(prev => prev === msgId ? null : msgId)
  }

  const handleGroupMenuToggle = (e, msgId) => {
    e.stopPropagation()
    setActiveGroupMenu(prev => prev === msgId ? null : msgId)
  }

  const handleTouchStart = (e, msg) => {
    const touch = e.touches[0]
    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null
      setMobileSheet(msg)
    }, 500)
  }

  const handleTouchMove = (e, msg) => {
    if (!touchStartX.current) return
    const touch = e.touches[0]
    const dx = touch.clientX - touchStartX.current
    const dy = touch.clientY - touchStartY.current
    if (Math.abs(dy) > Math.abs(dx)) {
      clearTimeout(longPressTimer.current)
      return
    }
    if (dx > 8 && longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (dx > 0 && dx < 80) {
      setSwipeState(prev => ({ ...prev, [msg.id]: dx }))
    }
  }

  const handleTouchEnd = (e, msg) => {
    clearTimeout(longPressTimer.current)
    longPressTimer.current = null
    const dx = swipeState[msg.id] || 0
    if (dx >= 60) handleReply(msg)
    setSwipeState(prev => ({ ...prev, [msg.id]: 0 }))
    touchStartX.current = null
    touchStartY.current = null
  }

  const handleGroupTouchStart = (e, msg) => {
    const touch = e.touches[0]
    groupTouchStartX.current = touch.clientX
    groupTouchStartY.current = touch.clientY
    groupLongPressTimer.current = setTimeout(() => {
      groupLongPressTimer.current = null
      setMobileGroupSheet(msg)
    }, 500)
  }

  const handleGroupTouchMove = (e, msg) => {
    if (!groupTouchStartX.current) return
    const touch = e.touches[0]
    const dx = touch.clientX - groupTouchStartX.current
    const dy = touch.clientY - groupTouchStartY.current
    if (Math.abs(dy) > Math.abs(dx)) {
      clearTimeout(groupLongPressTimer.current)
      return
    }
    if (dx > 8 && groupLongPressTimer.current) {
      clearTimeout(groupLongPressTimer.current)
      groupLongPressTimer.current = null
    }
    if (dx > 0 && dx < 80) {
      setGroupSwipeState(prev => ({ ...prev, [msg.id]: dx }))
    }
  }

  const handleGroupTouchEnd = (e, msg) => {
    clearTimeout(groupLongPressTimer.current)
    groupLongPressTimer.current = null
    const dx = groupSwipeState[msg.id] || 0
    if (dx >= 60) handleGroupReply(msg)
    setGroupSwipeState(prev => ({ ...prev, [msg.id]: 0 }))
    groupTouchStartX.current = null
    groupTouchStartY.current = null
  }

  const isGoldenUser = (username) => {
    const data = usersData[username]
    return data && data.userNumber !== null && data.userNumber <= 100
  }

  const highlightMatch = (name, q) => {
    const parts = name.split(new RegExp(`(${q})`, 'giu'))
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase()
        ? <span key={i} className="highlight">{part}</span>
        : part
    )
  }

  const openChat = (f) => {
    setSelectedFriend(f)
    setSelectedGroup(null)
    setIsGroupChatOpen(false)
    setIsFriendsOpen(false)
    setReplyingTo(null)
    setEditingMsg(null)
    setMsgInput('')
  }

  const openGroupChat = async (group) => {
    let resolvedGroup = group
    if (!group.memberUids || group.memberUids.length === 0) {
      const allUsersSnap = await getDocs(collection(db, "users"))
      const memberUids = allUsersSnap.docs
        .filter(d => group.members && group.members.includes(d.id))
        .map(d => d.data().uid)
        .filter(Boolean)
      if (memberUids.length > 0) {
        await updateDoc(doc(db, "groups", group.id), { memberUids })
        resolvedGroup = { ...group, memberUids }
      }
    }
    setSelectedGroup(resolvedGroup)
    setGroupSettingName(resolvedGroup.name)
    setSelectedFriend(null)
    setIsGroupChatOpen(true)
    setIsFriendsOpen(false)
    setReplyingToGroup(null)
    setEditingGroupMsg(null)
    setGroupMsgInput('')
    setGroupSettingsOpen(false)
  }

  const handleBackFromChat = () => {
    if (window.innerWidth >= 1024) {
      setSelectedFriend(null)
      setReplyingTo(null)
      setEditingMsg(null)
      setMsgInput('')
      return
    }
    setIsClosingChat(true)
  }

  const handleBackFromGroupChat = () => {
    if (window.innerWidth >= 1024) {
      setSelectedGroup(null)
      setIsGroupChatOpen(false)
      setReplyingToGroup(null)
      setEditingGroupMsg(null)
      setGroupMsgInput('')
      setGroupSettingsOpen(false)
      return
    }
    setIsClosingGroupChat(true)
  }

  const handleChatAnimationEnd = () => {
    if (isClosingChat) {
      setIsClosingChat(false)
      setSelectedFriend(null)
      setReplyingTo(null)
      setEditingMsg(null)
      setMsgInput('')
    }
  }

  const handleGroupChatAnimationEnd = () => {
    if (isClosingGroupChat) {
      setIsClosingGroupChat(false)
      setSelectedGroup(null)
      setIsGroupChatOpen(false)
      setReplyingToGroup(null)
      setEditingGroupMsg(null)
      setGroupMsgInput('')
      setGroupSettingsOpen(false)
    }
  }

  const toggleMemberSelection = (memberName) => {
    setSelectedMembersForGroup(prev =>
      prev.includes(memberName)
        ? prev.filter(m => m !== memberName)
        : [...prev, memberName]
    )
  }

  const handleCreateGroupProceed = () => {
    if (selectedMembersForGroup.length === 0) return
    setGroupCreationStep('name')
  }

  const handleCreateGroupFinalize = async () => {
    if (!newGroupName.trim()) return
    const members = [nickname, ...selectedMembersForGroup]
    const allUsersSnap = await getDocs(collection(db, "users"))
    const memberUids = allUsersSnap.docs
      .filter(d => members.includes(d.id))
      .map(d => d.data().uid)
    try {
      await addDoc(collection(db, "groups"), {
        name: newGroupName.trim(),
        members,
        memberUids,
        createdBy: nickname,
        createdAt: serverTimestamp(),
        password: ''
      })
      setAddGroupExpanded(false)
      setSelectedMembersForGroup([])
      setNewGroupName('')
      setGroupCreationStep('select')
    } catch (e) { alert(t.error) }
  }

  const handleSaveGroupSettings = async () => {
    if (!selectedGroup) return
    const updates = {}
    if (groupSettingName.trim()) updates.name = groupSettingName.trim()
    if (groupSettingPassword !== undefined) updates.password = groupSettingPassword
    try {
      await updateDoc(doc(db, "groups", selectedGroup.id), updates)
      setSelectedGroup(prev => ({ ...prev, ...updates }))
      setGroupSettingsOpen(false)
    } catch (e) { alert(t.error) }
  }

  const resetAddGroup = () => {
    setAddGroupExpanded(false)
    setSelectedMembersForGroup([])
    setNewGroupName('')
    setGroupCreationStep('select')
  }

  if (user === undefined) {
    return (
      <div className="all">
        <img src={logo} className="login-logo pulse" alt="Loading" />
      </div>
    )
  }

  if (user === null) {
    return (
      <div className="all">
        <div className="login-card">
          <img src={logo} className="login-logo" alt="Logo" />
          <h1>Chick Phobia</h1>
          <button
            onClick={() => signInWithPopup(auth, provider)}
            className="mybutton"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            <img src={searchImg} className="btn-icon-beat" alt="" />
            Continue with Google
          </button>
        </div>
      </div>
    )
  }

  if (!isRegistered) {
    return (
      <div className="all">
        <div className="login-card">
          <h2>{t.chooseNick}</h2>
          <form onSubmit={handleSetNickname}>
            <input type="text" className="myinput" value={nickname} onChange={e => setNickname(e.target.value)} />
            <button type="submit" className="mybutton">{t.start}</button>
          </form>
        </div>
      </div>
    )
  }

  const activeChatVisible = selectedFriend || isGroupChatOpen

  return (
    <div className={`app-container ${language === 'ar' ? 'rtl-mode' : ''} ${isSettingsOpen ? 'settings-active' : ''} ${isIOS ? 'ios-fix' : ''}`}>
      {isSettingsOpen && <div className="overlay overlay-settings" onClick={() => setIsSettingsOpen(false)}></div>}
      {isFriendsOpen && <div className="overlay overlay-friends" style={{ zIndex: 2500 }} onClick={() => setIsFriendsOpen(false)}></div>}

      {mobileSheet && (
        <div className="mobile-sheet-overlay" onClick={() => setMobileSheet(null)}>
          <div className="mobile-sheet" onClick={e => e.stopPropagation()}>
            <div className="mobile-sheet-handle"></div>
            <button className="sheet-action-btn" onClick={() => handleReply(mobileSheet)}>
              <span className="material-symbols-outlined">reply</span>
              {t.reply}
            </button>
            {mobileSheet.sender === nickname && !mobileSheet.isDeleted && (
              <>
                {mobileSheet.text && (
                  <button className="sheet-action-btn" onClick={() => handleEdit(mobileSheet)}>
                    <span className="material-symbols-outlined">edit</span>
                    {t.edit}
                  </button>
                )}
                <button className="sheet-action-btn sheet-action-delete" onClick={() => handleDelete(mobileSheet)}>
                  <span className="material-symbols-outlined">delete</span>
                  {t.delete}
                </button>
              </>
            )}
            <button className="sheet-action-btn sheet-action-cancel" onClick={() => setMobileSheet(null)}>
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {mobileGroupSheet && (
        <div className="mobile-sheet-overlay" onClick={() => setMobileGroupSheet(null)}>
          <div className="mobile-sheet" onClick={e => e.stopPropagation()}>
            <div className="mobile-sheet-handle"></div>
            <button className="sheet-action-btn" onClick={() => handleGroupReply(mobileGroupSheet)}>
              <span className="material-symbols-outlined">reply</span>
              {t.reply}
            </button>
            {mobileGroupSheet.sender === nickname && !mobileGroupSheet.isDeleted && (
              <>
                {mobileGroupSheet.text && (
                  <button className="sheet-action-btn" onClick={() => handleGroupEdit(mobileGroupSheet)}>
                    <span className="material-symbols-outlined">edit</span>
                    {t.edit}
                  </button>
                )}
                <button className="sheet-action-btn sheet-action-delete" onClick={() => handleGroupDelete(mobileGroupSheet)}>
                  <span className="material-symbols-outlined">delete</span>
                  {t.delete}
                </button>
              </>
            )}
            <button className="sheet-action-btn sheet-action-cancel" onClick={() => setMobileGroupSheet(null)}>
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      <div className={`sidebar ${isSettingsOpen ? 'open' : ''}`}>
        <button className="close-btn sidebar-close-btn" onClick={() => setIsSettingsOpen(false)}>
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="sidebar-header">
          {user?.photoURL && <img src={user.photoURL} className="avatar-large" alt="User" referrerPolicy="no-referrer" />}
          <h2 className="nickname-large">{nickname}</h2>
        </div>
        <div className="setting-box">
          <label>{t.changeName}</label>
          <input className="myinput" value={newNickname} onChange={e => setNewNickname(e.target.value)} />
          <button onClick={handleUpdateNickname} className="acc-btn-full">{t.save}</button>
        </div>
        <div className="setting-box">
          <label>{t.language}</label>
          <div className="lang-switch" onClick={toggleLanguage}>
            <div className={`switch-knob ${language === 'en' ? 'move-to-en' : 'move-to-ar'}`}></div>
            <span className="lang-text">AR</span>
            <span className="lang-text">EN</span>
          </div>
        </div>
        <button
          className="logout-btn-sidebar"
          onClick={() => { set(ref(rtdb, `/status/${nickname}`), { state: 'offline' }); signOut(auth) }}
        >
          {t.logout}
        </button>
      </div>

      <div className="top-bar">
        <button className="menu-btn" onClick={() => setIsFriendsOpen(true)}>
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="user-info-top" onClick={() => setIsSettingsOpen(prev => !prev)}>
          <div style={{ position: 'relative' }}>
            <img src={user?.photoURL} className="user-avatar" alt="User" referrerPolicy="no-referrer" />
            <span className="status-dot online"></span>
          </div>
          <span className="user-nickname-top">
            {nickname}
            {isGoldenUser(nickname) && (
              <span className="material-symbols-outlined golden-badge" title="Early Member">military_tech</span>
            )}
          </span>
        </div>
        <h2 className="welcome-msg">{t.welcome}, {nickname}</h2>
        <div className="top-bar-spacer"></div>
      </div>

      <div className="main-layout">
        <div className="chat-section">
          {selectedFriend ? (
            <div
              className={`chat-container${isClosingChat ? ' chat-closing' : ''}`}
              onAnimationEnd={handleChatAnimationEnd}
            >
              <div className="chat-top-bar">
                <button className="chat-back-btn" onClick={handleBackFromChat}>
                  <span className="material-symbols-outlined">arrow_back_ios</span>
                </button>
                <div className="chat-top-friend-info">
                  <div className="chat-top-avatar-wrap">
                    <img
                      src={usersData[selectedFriend]?.photo || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                      className="user-avatar-chat"
                      referrerPolicy="no-referrer"
                      alt={selectedFriend}
                    />
                    <span className={`status-dot ${usersData[selectedFriend]?.online ? 'online' : 'offline'}`}></span>
                  </div>
                  <div className="chat-top-text">
                    <span className="chat-top-name">
                      {selectedFriend}
                      {isGoldenUser(selectedFriend) && (
                        <span className="material-symbols-outlined golden-badge" title="Early Member">military_tech</span>
                      )}
                    </span>
                    <span className={`chat-top-status ${usersData[selectedFriend]?.online ? 'status-online-text' : ''}`}>
                      {usersData[selectedFriend]?.online ? t.online : t.offline}
                    </span>
                  </div>
                </div>
              </div>

              <div className="messages-list" ref={listRef} onScroll={handleScroll}>
                {messages.map((m) => {
                  const isMe = m.sender === nickname
                  const swipeDx = swipeState[m.id] || 0

                  return (
                    <div
                      key={m.id}
                      className={`msg-wrapper ${isMe ? 'sent' : 'received'}`}
                      style={{ marginTop: '6px' }}
                    >
                      <div className="msg-content-wrapper">
                        <div
                          className="msg-with-menu"
                          style={{
                            transform: `translateX(${swipeDx}px)`,
                            transition: swipeDx === 0 ? 'transform 0.3s ease' : 'none'
                          }}
                          onTouchStart={e => handleTouchStart(e, m)}
                          onTouchMove={e => handleTouchMove(e, m)}
                          onTouchEnd={e => handleTouchEnd(e, m)}
                        >
                          {swipeDx > 10 && (
                            <div className="swipe-reply-icon" style={{ opacity: Math.min(swipeDx / 60, 1) }}>
                              <span className="material-symbols-outlined">reply</span>
                            </div>
                          )}

                          <div className={`msg-hover-wrapper ${isMe ? 'hover-sent' : 'hover-received'}`}>
                            <button
                              className="msg-menu-btn"
                              onClick={e => handleMenuToggle(e, m.id)}
                            >
                              <span className="material-symbols-outlined">more_vert</span>
                            </button>

                            {activeMenu === m.id && (
                              <div
                                className={`msg-context-menu ${isMe ? 'menu-sent' : 'menu-received'}`}
                                onClick={e => e.stopPropagation()}
                              >
                                <button onClick={() => handleReply(m)}>
                                  <span className="material-symbols-outlined">reply</span>
                                  {t.reply}
                                </button>
                                {isMe && !m.isDeleted && m.text && (
                                  <button onClick={() => handleEdit(m)}>
                                    <span className="material-symbols-outlined">edit</span>
                                    {t.edit}
                                  </button>
                                )}
                                {isMe && !m.isDeleted && (
                                  <button className="menu-delete-btn" onClick={() => handleDelete(m)}>
                                    <span className="material-symbols-outlined">delete</span>
                                    {t.delete}
                                  </button>
                                )}
                              </div>
                            )}

                            <div className={`message ${m.isDeleted ? 'message-deleted' : ''}${m.replyTo ? ' message-has-reply' : ''}`}>
                              {m.replyTo && (
                                <div className={`reply-header ${isMe ? 'reply-header-sent' : 'reply-header-received'}`}>
                                  <div className="reply-header-bar"></div>
                                  <div className="reply-header-body">
                                    <span className="reply-header-sender">{m.replyTo.sender}</span>
                                    <span className="reply-header-text">
                                      {m.replyTo.deleted ? t.deletedMsg : (m.replyTo.text || '[media]')}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {m.isDeleted ? (
                                <span className="deleted-msg-text">{t.deletedMsg}</span>
                              ) : (
                                <div className="msg-body">
                                  {m.image && <img src={m.image} alt="sent" className="msg-media" />}
                                  {m.video && (
                                    <video controls className="msg-media">
                                      <source src={m.video} type="video/mp4" />
                                    </video>
                                  )}
                                  {m.text && (
                                    <span>
                                      {m.text}
                                      {m.isEdited && <span className="edited-label"> {t.edited}</span>}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={scrollRef}></div>
              </div>

              {(replyingTo || editingMsg) && (
                <div className="input-context-bar">
                  <div className="input-context-info">
                    <span className="material-symbols-outlined input-context-icon">
                      {editingMsg ? 'edit' : 'reply'}
                    </span>
                    <div className="input-context-text">
                      <span className="input-context-label">
                        {editingMsg ? t.editing : `${t.replyingTo} ${replyingTo.sender}`}
                      </span>
                      <span className="input-context-preview">
                        {editingMsg ? (editingMsg.text || '[media]') : (replyingTo.text || '[media]')}
                      </span>
                    </div>
                  </div>
                  <button className="input-context-cancel" onClick={cancelReplyEdit}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              )}

              <form className="chat-input-area" onSubmit={sendMessage}>
                <input type="file" id="img-upload" style={{ display: 'none' }} accept="image/*" onChange={e => handleMediaUpload(e.target.files[0])} />
                <label htmlFor="img-upload" className="media-label">
                  <span className="material-symbols-outlined">image</span>
                </label>
                <input type="file" id="vid-upload" style={{ display: 'none' }} accept="video/*" onChange={e => handleMediaUpload(e.target.files[0])} />
                <label htmlFor="vid-upload" className="media-label">
                  <span className="material-symbols-outlined">videocam</span>
                </label>
                <input
                  ref={inputRef}
                  className="myinput"
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  placeholder={t.type}
                />
                <button type="submit" className="acc-btn">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
                </button>
              </form>
            </div>
          ) : isGroupChatOpen && selectedGroup ? (
            <div
              className={`chat-container${isClosingGroupChat ? ' chat-closing' : ''}`}
              onAnimationEnd={handleGroupChatAnimationEnd}
            >
              {groupSettingsOpen ? (
                <div className="group-settings-overlay">
                  <div className="group-settings-card">
                    <div className="group-settings-header">
                      <button className="group-settings-back-btn" onClick={() => setGroupSettingsOpen(false)}>
                        <span className="material-symbols-outlined">arrow_back_ios</span>
                      </button>
                      <span className="group-settings-title">Group Settings</span>
                    </div>
                    <div className="group-settings-body">
                      <div className="group-settings-field">
                        <label>Group Name</label>
                        <input
                          className="myinput"
                          value={groupSettingName}
                          onChange={e => setGroupSettingName(e.target.value)}
                          placeholder="Enter group name..."
                        />
                      </div>
                      <div className="group-settings-field">
                        <label>Group Password</label>
                        <input
                          className="myinput"
                          value={groupSettingPassword}
                          onChange={e => setGroupSettingPassword(e.target.value)}
                          placeholder="Set a password (optional)..."
                          type="text"
                        />
                      </div>
                      <button className="acc-btn-full" onClick={handleSaveGroupSettings}>
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="chat-top-bar">
                <button className="chat-back-btn" onClick={handleBackFromGroupChat}>
                  <span className="material-symbols-outlined">arrow_back_ios</span>
                </button>
                <div className="chat-top-friend-info">
                  <div className="chat-top-avatar-wrap">
                    <div className="group-avatar-icon">
                      <span className="material-symbols-outlined">group</span>
                    </div>
                  </div>
                  <div className="chat-top-text">
                    <span className="chat-top-name">{selectedGroup.name}</span>
                    <span className="chat-top-status">{selectedGroup.members?.length || 0} members</span>
                  </div>
                </div>
                <button className="group-dots-btn" onClick={e => { e.stopPropagation(); setGroupSettingsOpen(true) }}>
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>

              <div className="messages-list" ref={groupListRef}>
                {groupMessages.map((m) => {
                  const isMe = m.sender === nickname
                  const swipeDx = groupSwipeState[m.id] || 0

                  return (
                    <div
                      key={m.id}
                      className={`msg-wrapper ${isMe ? 'sent' : 'received'}`}
                      style={{ marginTop: '6px' }}
                    >
                      {!isMe && (
                        <img
                          src={m.senderPhoto || usersData[m.sender]?.photo || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                          className="group-msg-avatar"
                          referrerPolicy="no-referrer"
                          alt={m.sender}
                        />
                      )}
                      <div className="msg-content-wrapper">
                        {!isMe && <span className="group-msg-sender-name">{m.sender}</span>}
                        <div
                          className="msg-with-menu"
                          style={{
                            transform: `translateX(${swipeDx}px)`,
                            transition: swipeDx === 0 ? 'transform 0.3s ease' : 'none'
                          }}
                          onTouchStart={e => handleGroupTouchStart(e, m)}
                          onTouchMove={e => handleGroupTouchMove(e, m)}
                          onTouchEnd={e => handleGroupTouchEnd(e, m)}
                        >
                          {swipeDx > 10 && (
                            <div className="swipe-reply-icon" style={{ opacity: Math.min(swipeDx / 60, 1) }}>
                              <span className="material-symbols-outlined">reply</span>
                            </div>
                          )}

                          <div className={`msg-hover-wrapper ${isMe ? 'hover-sent' : 'hover-received'}`}>
                            <button
                              className="msg-menu-btn"
                              onClick={e => handleGroupMenuToggle(e, m.id)}
                            >
                              <span className="material-symbols-outlined">more_vert</span>
                            </button>

                            {activeGroupMenu === m.id && (
                              <div
                                className={`msg-context-menu ${isMe ? 'menu-sent' : 'menu-received'}`}
                                onClick={e => e.stopPropagation()}
                              >
                                <button onClick={() => handleGroupReply(m)}>
                                  <span className="material-symbols-outlined">reply</span>
                                  {t.reply}
                                </button>
                                {isMe && !m.isDeleted && m.text && (
                                  <button onClick={() => handleGroupEdit(m)}>
                                    <span className="material-symbols-outlined">edit</span>
                                    {t.edit}
                                  </button>
                                )}
                                {isMe && !m.isDeleted && (
                                  <button className="menu-delete-btn" onClick={() => handleGroupDelete(m)}>
                                    <span className="material-symbols-outlined">delete</span>
                                    {t.delete}
                                  </button>
                                )}
                              </div>
                            )}

                            <div className={`message ${m.isDeleted ? 'message-deleted' : ''}${m.replyTo ? ' message-has-reply' : ''}`}>
                              {m.replyTo && (
                                <div className={`reply-header ${isMe ? 'reply-header-sent' : 'reply-header-received'}`}>
                                  <div className="reply-header-bar"></div>
                                  <div className="reply-header-body">
                                    <span className="reply-header-sender">{m.replyTo.sender}</span>
                                    <span className="reply-header-text">
                                      {m.replyTo.deleted ? t.deletedMsg : (m.replyTo.text || '[media]')}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {m.isDeleted ? (
                                <span className="deleted-msg-text">{t.deletedMsg}</span>
                              ) : (
                                <div className="msg-body">
                                  {m.image && <img src={m.image} alt="sent" className="msg-media" />}
                                  {m.video && (
                                    <video controls className="msg-media">
                                      <source src={m.video} type="video/mp4" />
                                    </video>
                                  )}
                                  {m.text && (
                                    <span>
                                      {m.text}
                                      {m.isEdited && <span className="edited-label"> {t.edited}</span>}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {isMe && (
                        <img
                          src={user?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                          className="group-msg-avatar"
                          referrerPolicy="no-referrer"
                          alt={nickname}
                        />
                      )}
                    </div>
                  )
                })}
                <div ref={groupScrollRef}></div>
              </div>

              {(replyingToGroup || editingGroupMsg) && (
                <div className="input-context-bar">
                  <div className="input-context-info">
                    <span className="material-symbols-outlined input-context-icon">
                      {editingGroupMsg ? 'edit' : 'reply'}
                    </span>
                    <div className="input-context-text">
                      <span className="input-context-label">
                        {editingGroupMsg ? t.editing : `${t.replyingTo} ${replyingToGroup.sender}`}
                      </span>
                      <span className="input-context-preview">
                        {editingGroupMsg ? (editingGroupMsg.text || '[media]') : (replyingToGroup.text || '[media]')}
                      </span>
                    </div>
                  </div>
                  <button className="input-context-cancel" onClick={cancelGroupReplyEdit}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              )}

              <form className="chat-input-area" onSubmit={sendGroupMessage}>
                <input type="file" id="grp-img-upload" style={{ display: 'none' }} accept="image/*" onChange={e => handleGroupMediaUpload(e.target.files[0])} />
                <label htmlFor="grp-img-upload" className="media-label">
                  <span className="material-symbols-outlined">image</span>
                </label>
                <input type="file" id="grp-vid-upload" style={{ display: 'none' }} accept="video/*" onChange={e => handleGroupMediaUpload(e.target.files[0])} />
                <label htmlFor="grp-vid-upload" className="media-label">
                  <span className="material-symbols-outlined">videocam</span>
                </label>
                <input
                  ref={groupInputRef}
                  className="myinput"
                  value={groupMsgInput}
                  onChange={e => setGroupMsgInput(e.target.value)}
                  placeholder={t.type}
                />
                <button type="submit" className="acc-btn">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="chat-placeholder">{t.selectFriend}</div>
          )}
        </div>

        <div className={`friends-section ${isFriendsOpen ? 'drawer-open' : ''}`}>
          <button className="close-btn" onClick={() => setIsFriendsOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>

          {activeTab !== 'groups' && (
            <div className="list-container">
              {activeTab === 'friends' && (
                friends.length > 0
                  ? friends.map(f => (
                    <div key={f} className="item" onClick={() => openChat(f)}>
                      <div className="item-info">
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <img src={usersData[f]?.photo} className="user-avatar" referrerPolicy="no-referrer" alt="" />
                          <span className={`status-dot ${usersData[f]?.online ? 'online' : 'offline'}`}></span>
                        </div>
                        <span dir="ltr" style={{ unicodeBidi: 'embed' }}>
                          {f}
                          {isGoldenUser(f) && (
                            <span className="material-symbols-outlined golden-badge" title="Early Member">military_tech</span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                  : <p className="empty-txt">{t.noFriends}</p>
              )}

              {activeTab === 'requests' && (
                requests.length > 0
                  ? requests.map(r => (
                    <div key={r} className="item">
                      <div className="item-info">
                        <img src={usersData[r]?.photo} className="user-avatar" referrerPolicy="no-referrer" alt="" />
                        <span dir="ltr" style={{ unicodeBidi: 'embed' }}>{r}</span>
                      </div>
                      <button onClick={() => acceptFriend(r)} className="acc-btn">Accept</button>
                    </div>
                  ))
                  : <p className="empty-txt">{t.noRequests}</p>
              )}

              {activeTab === 'add' && (
                <div className="search-wrapper">
                  <input
                    type="text"
                    className="myinput"
                    placeholder={t.searchUser}
                    value={searchUser}
                    onChange={e => handleSearch(e.target.value)}
                  />
                  {searchError && <p className="search-error-msg">{searchError}</p>}
                  {suggestions.length > 0 && (
                    <div className="autosuggest-box">
                      {suggestions.map(s => (
                        <div key={s} className="suggest-item" onClick={() => sendRequest(s)}>
                          <img src={usersData[s]?.photo} className="user-avatar-small" referrerPolicy="no-referrer" alt="" />
                          <span dir="ltr" style={{ unicodeBidi: 'embed' }}>{highlightMatch(s, searchUser)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="groups-tab-layout">
              <div className="groups-list-area">
                {groups.length > 0
                  ? groups.map(g => (
                    <div key={g.id} className="item group-item" onClick={() => openGroupChat(g)}>
                      <div className="item-info">
                        <div className="group-item-avatar">
                          <span className="material-symbols-outlined">group</span>
                        </div>
                        <div className="group-item-text">
                          <span className="group-item-name">{g.name}</span>
                          <span className="group-item-count">{g.members?.length || 0} members</span>
                        </div>
                      </div>
                    </div>
                  ))
                  : <p className="empty-txt">No groups yet</p>
                }
              </div>

              <div className={`add-group-section ${addGroupExpanded ? 'expanded' : ''}`}>
                <div className="add-group-header">
                  <span className="add-group-label">Create Group</span>
                  <button
                    className={`add-group-arrow-btn ${addGroupExpanded ? 'rotated' : ''}`}
                    onClick={() => {
                      if (addGroupExpanded) {
                        resetAddGroup()
                      } else {
                        setAddGroupExpanded(true)
                        setGroupCreationStep('select')
                      }
                    }}
                  >
                    <span className="material-symbols-outlined">expand_less</span>
                  </button>
                </div>

                <div className="add-group-body">
                  {groupCreationStep === 'select' && (
                    <>
                      <p className="add-group-hint">Select friends to add:</p>
                      <div className="group-member-select-list">
                        {friends.length > 0
                          ? friends.map(f => (
                            <div
                              key={f}
                              className={`group-member-item ${selectedMembersForGroup.includes(f) ? 'selected' : ''}`}
                              onClick={() => toggleMemberSelection(f)}
                            >
                              <div className="group-member-item-left">
                                <img
                                  src={usersData[f]?.photo || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                  className="user-avatar-small"
                                  referrerPolicy="no-referrer"
                                  alt=""
                                />
                                <span>{f}</span>
                              </div>
                              <div className={`group-member-checkbox ${selectedMembersForGroup.includes(f) ? 'checked' : ''}`}>
                                {selectedMembersForGroup.includes(f) && (
                                  <span className="material-symbols-outlined">check</span>
                                )}
                              </div>
                            </div>
                          ))
                          : <p className="empty-txt" style={{ padding: '8px 0' }}>{t.noFriends}</p>
                        }
                      </div>
                      {selectedMembersForGroup.length > 0 && (
                        <button className="acc-btn-full" style={{ marginTop: '10px' }} onClick={handleCreateGroupProceed}>
                          Next ({selectedMembersForGroup.length} selected)
                        </button>
                      )}
                    </>
                  )}

                  {groupCreationStep === 'name' && (
                    <>
                      <p className="add-group-hint">Name your group:</p>
                      <input
                        className="myinput"
                        placeholder="Group name..."
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button
                          className="acc-btn"
                          style={{ flex: 1, padding: '10px' }}
                          onClick={() => setGroupCreationStep('select')}
                        >
                          Back
                        </button>
                        <button
                          className="acc-btn-full"
                          style={{ flex: 2, marginTop: 0 }}
                          onClick={handleCreateGroupFinalize}
                        >
                          Create
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="tab-icons">
            <div className="tab-icon-wrapper">
              <span className={`material-symbols-outlined tab-icon ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>group</span>
            </div>
            <div className="tab-icon-wrapper">
              <span className={`material-symbols-outlined tab-icon ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>person_add</span>
              {requests.length > 0 && <span className="notif-badge"></span>}
            </div>
            <span className={`material-symbols-outlined tab-icon ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>person_search</span>
            <span className={`material-symbols-outlined tab-icon ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}>forum</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App