/**
 * Avatar Components - Barrel Export
 */

export { AIAvatar } from './AIAvatar';
export { AvatarControls } from './AvatarControls';
export { AvatarStatus } from './AvatarStatus';
export { AvatarToggle } from './AvatarToggle';
export { MicButton } from './MicButton';
export { HandsFreeMode } from './HandsFreeMode';

// Re-export types
export type {
  AvatarEmotion,
  AvatarState,
  AvatarConfig,
  VoiceConfig,
  TTSProvider,
  Viseme,
  VisemeType,
} from '../../types/avatar';

// Re-export store
export { useAvatarStore } from '../../stores/avatarStore';
