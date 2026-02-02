export * from './icons';
export * from './routes';
export * from './static-menu';
export * from './dayjs';
export * from './manager.constant';

export enum UserType {
  USER = 'USER',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
}

export enum SortType {
  asc = 'asc',
  desc = 'desc',
}

export enum AuthAction {
  REGISTER = 'REGISTER',
  RESET_PASSWORD = 'RESET_PASSWORD',
  VERIFY_EMAIL = 'VERIFY_EMAIL',
}

//Template
export enum TemplateStatus {
  DRAFT = 'Draft',
  PUBLISHED = 'Published',
  DEPRECATED = 'Deprecated',
}

//Project
export enum ProjectStatus {
  DRAFT = 'Draft',
  PUBLISHED = 'Published',
  DEPRECATED = 'Deprecated',
}

//editor
export enum EditorNodeType {
  COMPONENT = 'Component',
  RESOURCE = 'Resource',
}

export enum AgentSettingStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
}

export enum CategoryType {
  TEMPLATE = 'Template', //systems
  //agent setting
  EXPERTISE = 'Expertise', //systems
  TONE = 'Tone', //systems
  AGENT_STYLE = 'Agent Style', //systems

  //user creation
  RESOURCE = 'Resource',
}

//thread
export enum ThreadStatus {
  ALL = '',
  LIVE = 'live',
  NON_LIVE = 'non-live',
}

export enum NodeType {
  IMAGE = 'Image',
  SECTION = 'Section',
  TEXT = 'Text',
  BUTTON = 'Button',
  STREAM_SECTION = 'Stream Section',
  NAVIGATION = 'Navigation',
  LINK = 'Link',
  TEXTAREA = 'Textarea',
  METADATA = 'Metadata',
}

export enum SocketKeys {
  PROJECT_PUBLISH = 'PROJECT_PUBLISH',
}

export enum ColumnType {
  SHORT_TEXT = 'Short Text',
  LONG_TEXT = 'Long Text',
  FILE = 'File',
  URL = 'URL',
  NUMBER = 'Number',
  DATE = 'Date',
}

export enum DomainStatus {
  PENDING = 'Pending',
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export enum MessageRole {
  USER = 'User',
  ASSISTANT = 'Assistant',
  HOST = 'Host',
}

export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export const webUrl = import.meta.env.VITE_BASE_WEB_URL || '';
