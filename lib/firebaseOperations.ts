import { get, getDatabase, push, ref, set } from 'firebase/database'
import './firebase'

const db = getDatabase()

export const addRoom = (roomUid: string) => {
  const roomsListRef = ref(db, '/rooms')

  const newRoomRef = push(roomsListRef)

  set(newRoomRef, {
    uid: roomUid
  })
}

export const retrieveRooms = async (): Promise<Record<string, Record<string, string>> | null> => {
  const snapshot = await get(ref(db, 'rooms'))
  
  return snapshot.val()
}
