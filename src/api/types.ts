// ---------------------------------------------------------------------------
// Shared Xano response types
// ---------------------------------------------------------------------------

export interface XanoRecentCheckInEmotion {
  id: number;
  Display: string;
  emotionColour: string;
  themeColour: string;
  themeFontColour?: string;
  Selectable_Prompts?: string;
  xQuad?: number;
  yQuad?: number;
  definition?: string;
  action?: string;
  zone_name?: string;
  zone_label?: string;
  body_signals?: string;
  emotion_cluster?: string;
  tone?: string;
}

export interface XanoLast7CheckIn {
  id: number;
  emotionState_related: number;
  stateCoordinates_related: number;
  xAxis: number;
  yAxis: number;
  emotionText: string;
  loggedDate: string;
  loggedDateTime: number;
}

export interface XanoUser {
  id: number;
  created_at: number;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email: string;
  phoneNumber?: string | null;
  access?: 'Free' | 'Activator' | 'Workplace';
  status?: 'active' | 'invited' | 'deactivated';
  emailVerified?: boolean;
  phoneVerified?: boolean;
  onboarding_complete?: boolean;
  intro_slides_seen?: boolean;
  running_stats_id?: number | null;
  reminder_frequency?: 'WEEKDAYS' | 'WEEKLY' | 'DAILY' | 'NONE';
  reminder_hour?: number;
  reminder_min?: number;
  timezone?: string;
  country?: string;
  profilePic_url?: string | null;
  app_profile_banner_url?: string | null;
  onesignal_subscription_id?: string | null;
  recent_checkin_emotion?: XanoRecentCheckInEmotion | null;
  last_7_checkins?: XanoLast7CheckIn[] | null;
  lastCheckInDate?: string | null;
}

export interface XanoAuthResponse {
  authToken: string;
}

export interface XanoCheckIn {
  id: number;
  created_at: number;
  emotion_id: number;
  coordinate_id: number;
  related_support_request_id?: number | null;
  user_id?: number;
}

export interface XanoTimelineCheckIn {
  user_id: number;
  loggedDate: string;
  dailyInsight: string;
  state: {
    id: number;
    Display: string;
    emotionColour: string;
    themeColour: string;
    xQuad: number;
    yQuad: number;
    definition?: string;
    zone_name?: string;
    zone_label?: string;
    [key: string]: unknown;
  };
}

export interface XanoCheckInCreateResponse {
  checkin_id: string;
}

export interface XanoCheckInsPage {
  items?: XanoCheckIn[];
  curPage?: number;
  nextPage?: number | null;
  prevPage?: number | null;
  offset?: number;
  itemsReceived?: number;
}

export interface XanoGlobalPulse {
  stateCoordinates: number;
  count: number;
}

export interface XanoEmotionState {
  id: number;
  created_at?: number;
  Display: string;
  emotionColour: string;
  themeColour: string;
  themeFontColour?: string;
  Selectable_Prompts?: string;
  xQuad?: number;
  yQuad?: number;
  MHFR_action?: string;
  definition?: string;
  order?: number;
}

export interface XanoStateCoordinate {
  id: number;
  created_at?: number;
  coordinateDisplay: string;
  orderNumber?: number;
  intensityNumber?: number;
  relatedEmotionState_text?: string;
  xAxis?: number;
  yAxis?: number;
  needs_attention?: boolean;
  emotion_states_id: number;
  order_meta?: number;
}

export interface XanoGroup {
  id: number;
  created_at?: number;
  groupName: string;
  groupRef?: string;
  billing_group?: boolean;
  is_primary?: boolean;
}

export interface XanoUserGroup {
  id: number;
  reqStatus: string;
  groupId: number;
  userID: number;
  role?: string;
  sinceOnDate?: number;
  requestedDate?: number;
  isAutoAccept?: boolean;
}

export interface XanoForestMapEntry {
  id: number;
  group_id?: number;
  invitee_email?: string;
  invited_by?: number;
  invited_user?: number;
  isAutoAccept?: boolean;
}

export interface XanoGroupsResponse {
  active_groups: XanoUserGroup[] | string;
  invites: XanoForestMapEntry[] | string;
}

export interface XanoPair {
  id: number;
  created_at: number;
  pairUserIDs?: number[];
  pairType?: string;
  reqStatus?: string;
  requestFromId?: number;
  requestToId?: number;
  pairedDate?: number;
  token?: string;
  deletedAt?: number | null;
  updatedAt?: number;
  invite_email?: string;
}

export interface XanoPairsResponse {
  active: XanoPair[] | string;
  invites: XanoPair[] | string;
}

export interface XanoPairCheckin {
  id: number;
  created_at: number;
  creator_id: number;
  recipient_id: number;
}

export interface XanoNotification {
  id: number;
  created_at: number;
  sentTo?: number;
  sentFrom?: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  delivered?: boolean;
  requires_action?: boolean;
  payload?: Record<string, unknown>;
}

export interface XanoNotificationList {
  itemsReceived: number;
  curPage: number;
  nextPage: number | null;
  prevPage: number | null;
  offset: number;
  items: XanoNotification[];
}

export interface XanoRunningStats {
  id: number;
  created_at?: number;
  userID?: number;
  checkInCount?: number;
  currentCheckInDate?: string;
  previousCheckInDate?: string;
  updated_at?: number;
  sum_x?: number;
  sum_y?: number;
  daily_insight?: string;
  weekly_insight?: string;
  direction_t_p?: { directionLabel: string } | null;
  direction_w1_w2?: { directionLabel: string } | null;
  direction_m1_m2?: { directionLabel: string } | null;
  direction_m1_at?: { directionLabel: string } | null;
}

export interface XanoCourse {
  courses?: unknown[];
  [key: string]: unknown;
}

export interface XanoEnrollmentCourse {
  id: number;
  created_at?: number;
  name: string;
  title?: string;
  description?: string;
  module_count?: number;
  order?: number;
  course_modules_id?: number[];
}

export interface XanoEnrollment {
  id: number;
  created_at?: number;
  users_id?: number;
  courses_id: number;
  enrolled_on?: number | null;
  completion_status: 'not started' | 'in progress' | 'completed';
  last_completed_module: XanoNextLesson | number;
  progress_percent: number;
  /** Nested course object from get_enrollment */
  course?: XanoEnrollmentCourse;
  /** Next lesson to show (null when course completed) */
  next_lesson?: XanoNextLesson | null;
  /** Inline modules array from get_enrollment (each is a full XanoNextLesson) */
  modules?: XanoNextLesson[];
  // Flat alternatives (in case backend returns these instead)
  course_name?: string;
  course_description?: string;
  module_count?: number;
  next_lesson_title?: string | null;
  next_lesson_index?: number | null;
}

export interface XanoCourseModule {
  completed: boolean;
  result1: XanoNextLesson;
}

export interface XanoCourseModules {
  my_modules?: XanoCourseModule[] | string;
  last_module_index?: string;
  course_enrollment_id?: string;
  course_id?: string;
}

export interface XanoNextLessonAudio {
  url: string;
  name: string;
  mime: string;
  size: number;
  meta: {
    audio?: { freq: number; codec: string; bitrate: number };
    duration: number;
  };
}

export interface XanoNextLesson {
  id: number;
  created_at: number;
  index: number;
  courses_id: number;
  title: string;
  detail: string;
  script: string;
  is_last_module: boolean;
  audio_url: XanoNextLessonAudio | null;
}

export interface XanoLessonCompletionCourse {
  id: number;
  created_at: number;
  name: string;
  title: string;
  description: string;
  module_count: number;
  order?: number;
  course_modules_id?: number[];
}

export interface XanoLessonCompletionEnrollment {
  id: number;
  created_at: number;
  users_id: number;
  enrolled_on: number;
  completion_status: string;
  last_completed_module: number;
  progress_percent: number;
  course: XanoLessonCompletionCourse;
}

export interface XanoLessonCompletion {
  next_lesson: unknown | null;
  progress: number;
  course_enrollment: XanoLessonCompletionEnrollment;
}

export interface XanoEmotionItem {
  id: number;
  Display: string;
  emotionColour: string;
  themeColour: string;
  xQuad: number;
  yQuad: number;
  Selectable_Prompts?: string;
}

export interface XanoTriggerEmotion {
  emotion_name: string;
  x: number;
  y: number;
  coordinates_id: number;
  emotion_states_id: number;
  timestamp: number | null;
  emotionColour?: string;
  emotion_item: XanoEmotionItem | null;
}

export interface XanoResolvedEmotion {
  Display: string;
  x: number;
  y: number;
  coordinates_id: number;
  emotion_states_id: number;
  timestamp: number | null;
  emotionColour: string;
  emotion_item: XanoEmotionItem | null;
}

export interface XanoUpdatedEmotion {
  Display: string;
  x: number;
  y: number;
  coordinates_id: number;
  emotion_states_id: number;
  timestamp: number | null;
  emotionColour: string;
}

export interface XanoSupportRequestUser {
  fullName: string;
  email: string | null;
  phoneNumber: string;
  profilePic_url: string;
}

export interface XanoSupportRequest {
  id: number;
  users_id: number;
  status: 'OPEN' | 'RESOLVED' | null;
  trigger_Checkin_id: number;
  logged_Date: number | null;
  is_Support_Requested: boolean | null;
  is_Self_Supported: boolean | null;
  is_Supported: boolean | null;
  is_Checkback_Required: boolean | null;
  no_help_needed: boolean | null;
  checkedback: boolean | null;
  checkback_options: '5' | '15' | '30';
  checkback_time: number | null;
  next_MHFR_notification: number | null;
  reminder_count: number;
  groups_notified: number[];
  contact_attempts_count: number;
  supporter_id: number;
  risk_severity: number;
  risk_frequency: number;
  risk_escalation: number;
  risk_score: number;
  support_Action: string;
  supported_Date: string | null;
  resolved_Checkin_id: number;
  resolved_Date: number | null;
  created_at: number;
  trigger_Emotion: XanoTriggerEmotion;
  numbers_viewed: { users_id: number; support_services_id: number; attempted_date: number | null }[];
  Contact_History: { users_id: number; timestamp: number | null }[];
  updated_Emotions_List: XanoUpdatedEmotion[];
  resolved_Emotion: XanoResolvedEmotion;
  requesting_user_details: XanoSupportRequestUser | null;
}
