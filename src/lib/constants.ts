export const SESSION_REPORT_KEY = "talk-dojo-last-report";

/** 本地视频经 `/api/video-parse` 得到的语境，供 `/train?url=` 与战报对齐 */
export const SESSION_PARSE_KEY = "talk-dojo-session-parse";

/** 本地上传解析成功后写入 session，训练页 `?url=` 需与此一致 */
export const LOCAL_VIDEO_SESSION_URL = "local://video";

/** 本地视频上传 `/api/video-parse` 默认上限；可用 `LLM_VIDEO_UPLOAD_MAX_BYTES` 覆盖 */
export const VIDEO_UPLOAD_MAX_MB = 30;
export const VIDEO_UPLOAD_MAX_BYTES_DEFAULT =
  VIDEO_UPLOAD_MAX_MB * 1024 * 1024;

/** 首页「老板 / 导师」二选一写入 sessionStorage 的键名 */
export const HOME_STORED_AUTHORITY_CHOICE_KEY = "talk-dojo-home-authority-choice";

/** 首页「同学 / 同事」二选一写入 sessionStorage 的键名 */
export const HOME_STORED_PEER_CHOICE_KEY = "talk-dojo-home-peer-choice";

/** 与 {@link HOME_STORED_AUTHORITY_CHOICE_KEY} 对应的取值 */
export type HomeStoredAuthorityChoice = "boss" | "mentor";

/** 与 {@link HOME_STORED_PEER_CHOICE_KEY} 对应的取值 */
export type HomeStoredPeerChoice = "classmate" | "colleague";

