/**
 * Shim for @livekit/components-react on React Native.
 *
 * The real package uses browser DOM APIs (document, <div>, etc.) that crash
 * React Native.  @livekit/react-native imports a handful of hooks and
 * contexts from it; we re-export lightweight stubs so the module graph
 * resolves without pulling in any DOM code.
 */
console.log("[SHIM] livekit-components-shim loaded");
const React = require("react");

// Contexts
const RoomContext = React.createContext(null);
const ParticipantContext = React.createContext(null);
const TrackRefContext = React.createContext(null);
const LKFeatureContext = React.createContext(null);

// Context accessors
const useRoomContext = () => React.useContext(RoomContext);
const useMaybeRoomContext = () => React.useContext(RoomContext);
const useEnsureRoom = (room) => room ?? React.useContext(RoomContext);
const useParticipantContext = () => React.useContext(ParticipantContext);
const useMaybeTrackRefContext = () => React.useContext(TrackRefContext);
const useTrackRefContext = () => React.useContext(TrackRefContext);
const useEnsureTrackRef = (ref) => ref ?? React.useContext(TrackRefContext);

// Stub hooks – return sensible defaults
const noop = () => {};
const useConnectionState = () => "disconnected";
const useLocalParticipant = () => ({ localParticipant: null });
const useLocalParticipantPermissions = () => ({});
const useParticipants = () => [];
const useRemoteParticipants = () => [];
const useRemoteParticipant = () => null;
const useSortedParticipants = () => [];
const useSpeakingParticipants = () => [];
const useParticipantInfo = () => ({});
const useParticipantTracks = () => [];
const useTracks = () => [];
const useIsMuted = () => false;
const useIsSpeaking = () => false;
const useIsEncrypted = () => false;
const useTrackMutedIndicator = () => ({ isMuted: false });
const useTrackTranscription = () => ({ segments: [] });
const useVisualStableUpdate = (participants) => participants;
const useRoomInfo = () => ({});
const useChat = () => ({ messages: [], send: noop });
const useDataChannel = () => ({ message: null, send: noop });
const useVoiceAssistant = () => ({ state: "idle" });
const isTrackReference = () => false;
const setLogLevel = noop;
const setLogExtension = noop;

// useLiveKitRoom – used by LiveKitRoom component
const useLiveKitRoom = (props) => ({
  room: props.room ?? null,
  htmlProps: {},
});

module.exports = {
  RoomContext,
  ParticipantContext,
  TrackRefContext,
  LKFeatureContext,
  useRoomContext,
  useMaybeRoomContext,
  useEnsureRoom,
  useParticipantContext,
  useMaybeTrackRefContext,
  useTrackRefContext,
  useEnsureTrackRef,
  useConnectionState,
  useLocalParticipant,
  useLocalParticipantPermissions,
  useParticipants,
  useRemoteParticipants,
  useRemoteParticipant,
  useSortedParticipants,
  useSpeakingParticipants,
  useParticipantInfo,
  useParticipantTracks,
  useTracks,
  useIsMuted,
  useIsSpeaking,
  useIsEncrypted,
  useTrackMutedIndicator,
  useTrackTranscription,
  useVisualStableUpdate,
  useRoomInfo,
  useChat,
  useDataChannel,
  useVoiceAssistant,
  useLiveKitRoom,
  isTrackReference,
  setLogLevel,
  setLogExtension,
};
