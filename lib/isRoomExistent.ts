import { retrieveRooms } from './firebaseOperations'

export const isRoomExistent = async (roomUid: string) => {
  const rooms: Record<string, Record<string, string>> | null = await retrieveRooms()
  
  if (rooms === null) {
    return false 
  }

  return Object.values(rooms).some(room => room.uid === roomUid)
}
