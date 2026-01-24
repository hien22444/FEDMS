export * from './icons';
export * from './routes';
export * from './static-menu';
export * from './dayjs';

export const UserType = {
  USER: 'USER',
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
};

export const SortType = {
  asc: 'asc',
  desc: 'desc',
};

export const AuthAction = {
  REGISTER: 'REGISTER',
  RESET_PASSWORD: 'RESET_PASSWORD',
  VERIFY_EMAIL: 'VERIFY_EMAIL',
};

//Template
export const TemplateStatus = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  DEPRECATED: 'Deprecated',
};

//Project
export const ProjectStatus = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  DEPRECATED: 'Deprecated',
};

//editor
export const EditorNodeType = {
  COMPONENT: 'Component',
  RESOURCE: 'Resource',
};

export const AgentSettingStatus = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
};

export const CategoryType = {
  TEMPLATE: 'Template', //systems
  //agent setting
  EXPERTISE: 'Expertise', //systems
  TONE: 'Tone', //systems
  AGENT_STYLE: 'Agent Style', //systems

  //user creation
  RESOURCE: 'Resource',
};

//thread
export const ThreadStatus = {
  ALL: '',
  LIVE: 'live',
  NON_LIVE: 'non-live',
};

export const NodeType = {
  IMAGE: 'Image',
  SECTION: 'Section',
  TEXT: 'Text',
  BUTTON: 'Button',
  STREAM_SECTION: 'Stream Section',
  NAVIGATION: 'Navigation',
  LINK: 'Link',
  TEXTAREA: 'Textarea',
  METADATA: 'Metadata',
};

export const SocketKeys = {
  PROJECT_PUBLISH: 'PROJECT_PUBLISH',
};

export const ColumnType = {
  SHORT_TEXT: 'Short Text',
  LONG_TEXT: 'Long Text',
  FILE: 'File',
  URL: 'URL',
  NUMBER: 'Number',
  DATE: 'Date',
};

export const DomainStatus = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

export const MessageRole = {
  USER: 'User',
  ASSISTANT: 'Assistant',
  HOST: 'Host',
};

export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export const webUrl = import.meta.env.VITE_BASE_WEB_URL || '';
