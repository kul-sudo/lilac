import { get, getDatabase, push, ref, set } from 'firebase/database'
import './firebase'

const db = getDatabase()

export const addRoom = roomUid => {
  const roomsListRef = ref(db, '/rooms')

  const newRoomRef = push(roomsListRef)

  set(newRoomRef, {
    uid: roomUid
  })
}

export const retrieveRooms = async () => {
  const snapshot = await get(ref(db, 'rooms'))
  return snapshot.val()
}
