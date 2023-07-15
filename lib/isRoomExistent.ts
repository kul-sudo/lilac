import { retrieveRooms } from './firebaseOperations'

export const isRoomExistent = async (roomUid: string): Promise<boolean> => {
  const rooms = await retrieveRooms()
  
  if (rooms === null) {
    return false 
  }

  return Object.values(rooms).some(room => room.uid === roomUid)
}
