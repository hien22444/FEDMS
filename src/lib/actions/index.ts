export * from './auth';
export * from './user';
export * from './violation';
// admin.ts exports deleteUser too — re-export explicitly to avoid conflict
export {
  adminLogin,
  fetchDorms, createDorm, updateDorm, deleteDorm,
  fetchBlocks, getBlockById, createBlock, updateBlock, deleteBlock,
  fetchRooms, getRoomById, createRoom, updateRoom, deleteRoom,
  fetchRoomTypePricing, updateRoomTypePricing,
  fetchUsers,
  importUsersFromExcel,
  fetchEquipmentCategories, createEquipmentCategory, updateEquipmentCategory, deleteEquipmentCategory,
  fetchEquipmentTemplates, createEquipmentTemplate, updateEquipmentTemplate, deleteEquipmentTemplate,
  fetchRoomTypeConfigs, createRoomTypeConfig, updateRoomTypeConfig, deleteRoomTypeConfig,
} from './admin';
export type {
  AdminLoginDto, AdminLoginResponse,
  Dorm, DormListResponse,
  Block, BlockListResponse,
  Room, RoomListResponse, RoomStatus, RoomType,
  RoomTypePriceMap, RoomTypePricingResponse,
  UserRecord, UserListResponse,
  ImportedRecord, ImportError, ImportExcelResponse,
  EquipmentCategory, EquipmentCategoryListResponse,
  EquipmentTemplate, EquipmentTemplateListResponse,
  RoomTypeEquipmentConfig, RoomTypeConfigListResponse,
} from './admin';
export * from './visitor';
export * from './notification';
export * from './chat';
