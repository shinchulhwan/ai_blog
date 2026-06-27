export interface NaverAccountRecord {
  id: string;
  username: string;
  label: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterNaverAccountInput {
  username: string;
  password: string;
  label?: string;
}

export interface NaverAccountCredentials {
  accountId: string;
  username: string;
  password?: string;
}
