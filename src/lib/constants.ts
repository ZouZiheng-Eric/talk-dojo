export const SESSION_REPORT_KEY = "talk-dojo-last-report";

/** 本地视频经 `/api/video-parse` 得到的语境，供 `/train?url=` 与战报对齐 */
export const SESSION_PARSE_KEY = "talk-dojo-session-parse";

/** 本地上传解析成功后写入 session，训练页 `?url=` 需与此一致 */
export const LOCAL_VIDEO_SESSION_URL = "local://video";

/** 首页「老板 / 导师」二选一写入 sessionStorage 的键名 */
export const HOME_STORED_AUTHORITY_CHOICE_KEY = "talk-dojo-home-authority-choice";

/** 首页「同学 / 室友」二选一写入 sessionStorage 的键名 */
export const HOME_STORED_PEER_CHOICE_KEY = "talk-dojo-home-peer-choice";

/** 与 {@link HOME_STORED_AUTHORITY_CHOICE_KEY} 对应的取值 */
export type HomeStoredAuthorityChoice = "boss" | "mentor";

/** 与 {@link HOME_STORED_PEER_CHOICE_KEY} 对应的取值 */
export type HomeStoredPeerChoice = "classmate" | "roommate";
