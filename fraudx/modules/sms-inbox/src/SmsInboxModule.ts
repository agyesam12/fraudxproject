import { NativeModule, requireOptionalNativeModule } from 'expo';

export type NativeSms = {
  id: string;
  sender: string;
  body: string;
  receivedAt: number;
};

type SmsInboxEvents = {
  onInboxChange: () => void;
};

declare class SmsInboxModule extends NativeModule<SmsInboxEvents> {
  hasPermission(): boolean;
  getMessages(limit: number, sinceMs: number): Promise<NativeSms[]>;
}

// Optional: absent on iOS, web and Expo Go. Callers must handle null.
export default requireOptionalNativeModule<SmsInboxModule>('SmsInbox');
