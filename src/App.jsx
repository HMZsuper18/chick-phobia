import React from 'react'
import logo from './assets/logo.png'
import { initializeApp } from "firebase/app"
import { 
  getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, 
  deleteField, collection, getDocs, deleteDoc, 
  query, orderBy, limit, addDoc, serverTimestamp 
} from "firebase/firestore"
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyAuoY__cctnuVBUHvldAxLhp7kVbJSFk-U",
  authDomain: "chick-phobia.firebaseapp.com",
  databaseURL: "https://chick-phobia-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "chick-phobia",
  storageBucket: "chick-phobia.firebasestorage.app",
  messagingSenderId: "465447309915",
  appId: "1:465447309915:web:1cd775260fc5a56abf657e",
  measurementId: "G-F3L4QDTKSN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

function App() {
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
  const scrollRef = React.useRef()

  const CLOUD_NAME = "dbgqro4d3";
  const UPLOAD_PRESET = "chick phobia"; 

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
          setNickname(found.id); setNewNickname(found.id); setIsRegistered(true); listenToData(found.id)
        } else {
          setIsRegistered(false)
        }
      } else { 
        setUser(null); setIsRegistered(false); setNickname('') 
      }
    })
    return () => unsub()
  }, [])

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const dataMap = {}
      const names = []
      snap.docs.forEach(d => {
        dataMap[d.id] = {
          photo: d.data().photo || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
          online: d.data().online || false
        }
        names.push(d.id)
      })
      setUsersData(dataMap)
      setAllUsers(names)
    })
    return () => unsub()
  }, [isRegistered])

  React.useEffect(() => {
    if (isRegistered && nickname) {
      const userRef = doc(db, "users", nickname)
      updateDoc(userRef, { online: true })
      const handleOffline = () => updateDoc(userRef, { online: false })
      window.addEventListener('beforeunload', handleOffline)
      return () => {
        handleOffline()
        window.removeEventListener('beforeunload', handleOffline)
      }
    }
  }, [isRegistered, nickname])

  React.useEffect(() => {
    if (!selectedFriend || !nickname) return
    const chatId = [nickname, selectedFriend].sort().join('_')
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"), limit(50))
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    })
    return () => unsub()
  }, [selectedFriend, nickname])

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
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    localStorage.setItem('appLang', newLang);
  };

  const handleUpdateNickname = async () => {
    if (!newNickname || newNickname === nickname) return
    const cleanId = newNickname.toLowerCase().trim().replace(/\s/g, '')
    const oldRef = doc(db, "users", nickname); const newRef = doc(db, "users", cleanId)
    try {
      const check = await getDoc(newRef)
      if (check.exists()) return alert(language === 'ar' ? "الاسم مستخدم!" : "Taken!")
      const oldSnap = await getDoc(oldRef)
      await setDoc(newRef, oldSnap.data()); await deleteDoc(oldRef)
      setNickname(cleanId); alert(language === 'ar' ? "تم التحديث!" : "Updated!")
    } catch (e) { alert("Error") }
  }

  const handleSetNickname = async (e) => {
    e.preventDefault(); if (!nickname || !user) return
    const cleanNick = nickname.toLowerCase().trim().replace(/\s/g, '')
    const userRef = doc(db, "users", cleanNick)
    try {
      const docSnap = await getDoc(userRef)
      if (docSnap.exists()) { alert(language === 'ar' ? "مستخدم!" : "Taken!") } 
      else {
        await setDoc(userRef, { 
          uid: user.uid, 
          email: user.email, 
          photo: user.photoURL,
          friends: {}, 
          requests: {},
          sentRequests: {},
          online: true
        })
        setNickname(cleanNick); setIsRegistered(true); listenToData(cleanNick)
      }
    } catch (err) { alert("Error") }
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
    } else { setSuggestions([]) }
  }

  const sendRequest = async (target) => {
    const t = target || searchUser; if (!t || t === nickname) return
    const tRef = doc(db, "users", t)
    const myRef = doc(db, "users", nickname)
    try {
      await updateDoc(tRef, { [`requests.${nickname}`]: true })
      await updateDoc(myRef, { [`sentRequests.${t}`]: true })
      setSearchUser(''); setSuggestions([]); setSearchError(language === 'ar' ? 'تم الإرسال!' : 'Sent!')
      setTimeout(() => setSearchError(''), 2000)
    } catch (e) { setSearchError('Error!') }
  }

  const acceptFriend = async (sender) => {
    const myRef = doc(db, "users", nickname); const sRef = doc(db, "users", sender)
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
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
        method: 'POST',
        body: formData
      })
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

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!msgInput.trim() || !selectedFriend) return
    const chatId = [nickname, selectedFriend].sort().join('_')
    const text = msgInput
    setMsgInput('')
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: nickname,
      createdAt: serverTimestamp()
    })
  }

  const highlightMatch = (name, query) => {
    const parts = name.split(new RegExp(`(${query})`, 'giu'))
    return (
      <span style={{direction: 'ltr', unicodeBidi: 'embed', display: 'inline-block'}}>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
          ? <span key={i} className="highlight">{part}</span> 
          : part
        )}
      </span>
    )
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
          <button onClick={() => signInWithPopup(auth, provider)} className="mybutton" style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}>
            <img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" width="20" alt="G"/>
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
          <h2>{language === 'ar' ? 'اختر اسم المستخدم' : 'Choose Nickname'}</h2>
          <form onSubmit={handleSetNickname}>
            <input type="text" className="myinput" value={nickname} onChange={e => setNickname(e.target.value)} />
            <button type="submit" className="mybutton">{language === 'ar' ? 'ابدأ' : 'Start'}</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className={`app-container ${language === 'ar' ? 'rtl-mode' : ''} ${isSettingsOpen ? 'settings-active' : ''}`}>
      {isSettingsOpen && <div className="overlay overlay-settings" onClick={() => setIsSettingsOpen(false)}></div>}
      {isFriendsOpen && <div className="overlay overlay-friends" style={{zIndex: 2500}} onClick={() => setIsFriendsOpen(false)}></div>}

      <div className={`sidebar ${isSettingsOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          {user?.photoURL && <img src={user.photoURL} className="avatar-large" alt="User" referrerPolicy="no-referrer" />}
          <h2 className="nickname-large">{nickname}</h2>
        </div>
        <div className="setting-box">
          <label>{language === 'ar' ? 'تغيير الاسم:' : 'Change Name:'}</label>
          <input className="myinput" value={newNickname} onChange={e => setNewNickname(e.target.value)} />
          <button onClick={handleUpdateNickname} className="acc-btn-full">{language === 'ar' ? 'حفظ' : 'Save'}</button>
        </div>
        <div className="setting-box">
          <label>{language === 'ar' ? 'اللغة:' : 'Language:'}</label>
          <div className="lang-switch" onClick={toggleLanguage}>
            <div className={`switch-knob ${language === 'en' ? 'move-to-en' : 'move-to-ar'}`}></div>
            <span className="lang-text">AR</span>
            <span className="lang-text">EN</span>
          </div>
        </div>
        <button className="logout-btn-sidebar" onClick={() => { updateDoc(doc(db, "users", nickname), {online: false}); signOut(auth); }}>{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</button>
      </div>

      <div className="top-bar">
        <button className="menu-btn" onClick={() => setIsFriendsOpen(true)}>☰</button>
        <div className="user-info-top" onClick={() => setIsSettingsOpen(prev => !prev)}>
          <div style={{position: 'relative'}}>
            <img src={user?.photoURL} className="user-avatar" alt="User" referrerPolicy="no-referrer" />
            <span className="status-dot online"></span>
          </div>
          <span className="user-nickname-top">{nickname}</span>
        </div>
        <h2 className="welcome-msg">{language === 'ar' ? `أهلاً بك، ${nickname}` : `Welcome, ${nickname}`}</h2>
        <div className="top-bar-spacer"></div>
      </div>

      <div className="main-layout">
        <div className="chat-section">
          {selectedFriend ? (
            <div className="chat-container">
              <div className="messages-list">
                {messages.map((m, index) => {
                  const isMe = m.sender === nickname;
                  const senderPhoto = isMe ? user?.photoURL : usersData[m.sender]?.photo;
                  const isSameAsPrevious = index > 0 && messages[index - 1].sender === m.sender;
                  return (
                    <div key={m.id} className={`msg-wrapper ${isMe ? 'sent' : 'received'}${isSameAsPrevious ? ' consecutive' : ''}`} 
                         style={{ marginTop: isSameAsPrevious ? '2px' : '15px' }}>
                      {!isMe && (
                        <div className="msg-avatar-container">
                          {!isSameAsPrevious && <img src={senderPhoto} className="user-avatar-chat" referrerPolicy="no-referrer" />}
                        </div>
                      )}
                      <div className="msg-content-wrapper">
                        {!isSameAsPrevious && <span className="msg-sender-name">{m.sender}</span>}
                        <div className="message">
                          {m.image && <img src={m.image} alt="sent" className="msg-media" />}
                          {m.video && <video controls className="msg-media"><source src={m.video} type="video/mp4" /></video>}
                          {m.text && m.text}
                        </div>
                      </div>
                      {isMe && (
                        <div className="msg-avatar-container">
                          {!isSameAsPrevious && <img src={senderPhoto} className="user-avatar-chat" referrerPolicy="no-referrer" />}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={scrollRef}></div>
              </div>
              <form className="chat-input-area" onSubmit={sendMessage}>
                <input type="file" id="img-upload" style={{display: 'none'}} accept="image/*" onChange={(e) => handleMediaUpload(e.target.files[0])} />
                <label htmlFor="img-upload" className="media-label"><img src="https://cdn-icons-png.flaticon.com/512/8191/8191581.png" width="24" style={{filter: 'invert(1)'}} alt="img" /></label>
                <input type="file" id="vid-upload" style={{display: 'none'}} accept="video/*" onChange={(e) => handleMediaUpload(e.target.files[0])} />
                <label htmlFor="vid-upload" className="media-label"><img src="https://cdn-icons-png.flaticon.com/512/1179/1179069.png" width="24" style={{filter: 'invert(1)'}} alt="vid" /></label>
                <input className="myinput" value={msgInput} onChange={e => setMsgInput(e.target.value)} placeholder={language === 'ar' ? 'اكتب رسالة...' : 'Type...'} />
                <button type="submit" className="acc-btn">{language === 'ar' ? 'إرسال' : 'Send'}</button>
              </form>
            </div>
          ) : (
            <div className="chat-placeholder">{language === 'ar' ? 'اختر صديقاً' : 'Select a friend'}</div>
          )}
        </div>

        <div className={`friends-section ${isFriendsOpen ? 'drawer-open' : ''}`}>
          <button className="close-btn" onClick={() => setIsFriendsOpen(false)}>×</button>
          <div className="list-container">
            {activeTab === 'friends' && (friends.length > 0 ? friends.map(f => (
              <div key={f} className="item" onClick={() => { setSelectedFriend(f); setIsFriendsOpen(false); }}>
                <div className="item-info" style={{flexDirection: language === 'ar' ? 'row-reverse' : 'row'}}>
                  <div style={{position: 'relative', flexShrink: 0}}>
                    <img src={usersData[f]?.photo} className="user-avatar" referrerPolicy="no-referrer" />
                    <span className={`status-dot ${usersData[f]?.online ? 'online' : 'offline'}`}></span>
                  </div>
                  <span>{f}</span>
                </div>
              </div>
            )) : activeTab === 'friends' && <p className="empty-txt">{language === 'ar' ? 'لا يوجد أصدقاء' : 'No friends'}</p>)}

            {activeTab === 'requests' && (requests.length > 0 ? requests.map(r => (
              <div key={r} className="item">
                <div className="item-info" style={{flexDirection: language === 'ar' ? 'row-reverse' : 'row'}}>
                  <img src={usersData[r]?.photo} className="user-avatar" referrerPolicy="no-referrer" />
                  <span>{r}</span>
                </div>
                <button onClick={() => acceptFriend(r)} className="acc-btn">{language === 'ar' ? 'قبول' : 'Accept'}</button>
              </div>
            )) : activeTab === 'requests' && <p className="empty-txt">{language === 'ar' ? 'لا يوجد طلبات' : 'No requests'}</p>)}

            {activeTab === 'add' && (
              <div className="search-wrapper">
                <input type="text" className="myinput" placeholder={language === 'ar' ? 'ابحث عن مستخدم...' : 'Search user...'} value={searchUser} onChange={(e) => handleSearch(e.target.value)} />
                {searchError && <p className="search-error-msg">{searchError}</p>}
                {suggestions.length > 0 && (
                  <div className="autosuggest-box">
                    {suggestions.map(s => (
                      <div key={s} className="suggest-item" onClick={() => sendRequest(s)}>
                        <img src={usersData[s]?.photo} className="user-avatar-small" referrerPolicy="no-referrer" />
                        {highlightMatch(s, searchUser)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="tab-icons">
            <div className="tab-icon-wrapper">
              <img src="https://cdn-icons-png.flaticon.com/512/2583/2583118.png" onClick={() => setActiveTab('friends')} className={activeTab === 'friends' ? 'active' : ''} />
            </div>
            <div className="tab-icon-wrapper">
              <img src="https://cdn-icons-png.flaticon.com/512/1182/1182761.png" onClick={() => setActiveTab('requests')} className={activeTab === 'requests' ? 'active' : ''} />
              {requests.length > 0 && <span className="notif-badge"></span>}
            </div>
            <img src="https://cdn-icons-png.flaticon.com/512/748/748113.png" onClick={() => setActiveTab('add')} className={activeTab === 'add' ? 'active' : ''} />
          </div>
        </div>
      </div>
    </div>
  )
}
export default App