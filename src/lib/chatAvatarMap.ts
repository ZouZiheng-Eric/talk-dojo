import type { ReadonlyURLSearchParams } from "next/navigation";
import {
  HOME_STORED_AUTHORITY_CHOICE_KEY,
  HOME_STORED_PEER_CHOICE_KEY,
  type HomeStoredAuthorityChoice,
  type HomeStoredPeerChoice,
} from "@/lib/constants";

/** 训练页 URL 查询键（与首页跳转一致，勿在业务里散落魔法字符串） */
export const CHAT_AVATAR_QUERY = {
  authority: "authority",
  peer: "peer",
} as const;

/** `public/profile/` 下的静态头像，文件名与素材目录约定一致 */
export const CHAT_PROFILE_FILES = {
  boss: "老板.jpg",
  mentor: "导师.jpg",
  classmate: "同学.jpg",
  colleague: "同事.jpg",
  relative: "烦人亲戚.jpg",
  racist: "海外racist.jpg",
  /** 「我」气泡右侧：用户上传的自定义头像 */
  user: "用户头像.jpg",
} as const;

const PROFILE_BASE = "/profile";

export function profilePublicUrl(file: string): string {
  return `${PROFILE_BASE}/${file}`;
}

/** 三轮结束、战报生成中在聊天区下方循环播放（`public/profile/鞭子.mp4`） */
export const REPORT_GENERATING_WHIP_FILE = "鞭子.mp4";

export function reportGeneratingWhipUrl(): string {
  return profilePublicUrl(REPORT_GENERATING_WHIP_FILE);
}

export function parseAuthorityFromSearch(
  params: ReadonlyURLSearchParams | URLSearchParams
): HomeStoredAuthorityChoice | null {
  const a = params.get(CHAT_AVATAR_QUERY.authority);
  return a === "boss" || a === "mentor" ? a : null;
}

export function parsePeerFromSearch(
  params: ReadonlyURLSearchParams | URLSearchParams
): HomeStoredPeerChoice | null {
  const p = params.get(CHAT_AVATAR_QUERY.peer);
  if (p === "classmate") return "classmate";
  if (p === "colleague" || p === "roommate") return "colleague";
  return null;
}

/**
 * 教练 / 对手气泡左侧头像：严格按首页场景 + 子选项映射到 profile 文件名。
 */
export function coachProfileFilename(
  scene: string,
  authority: HomeStoredAuthorityChoice | null,
  peer: HomeStoredPeerChoice | null
): string {
  const s = scene.trim();
  if (s === "boss") {
    return authority === "mentor"
      ? CHAT_PROFILE_FILES.mentor
      : CHAT_PROFILE_FILES.boss;
  }
  if (s === "colleague" || s === "roommate") {
    return peer === "colleague"
      ? CHAT_PROFILE_FILES.colleague
      : CHAT_PROFILE_FILES.classmate;
  }
  if (s === "relative") return CHAT_PROFILE_FILES.relative;
  if (s === "racist") return CHAT_PROFILE_FILES.racist;
  return CHAT_PROFILE_FILES.boss;
}

/**
 * 「我」气泡右侧头像：统一使用用户上传的 `用户头像.jpg`（`public/profile/`）。
 */
export function userProfileFilename(
  _scene: string,
  _peer: HomeStoredPeerChoice | null
): string {
  return CHAT_PROFILE_FILES.user;
}

export type ResolvedChatAvatar = {
  primary: string;
};

export function resolveCoachAvatar(
  scene: string,
  authority: HomeStoredAuthorityChoice | null,
  peer: HomeStoredPeerChoice | null
): ResolvedChatAvatar {
  const file = coachProfileFilename(scene, authority, peer);
  return { primary: profilePublicUrl(file) };
}

export function resolveUserAvatar(
  scene: string,
  peer: HomeStoredPeerChoice | null
): ResolvedChatAvatar {
  const primary = profilePublicUrl(userProfileFilename(scene, peer));
  return { primary };
}

/** 从 sessionStorage 读取首页已选角色（供非 URL 场景或首屏兜底） */
export function readAuthorityFromSession(): HomeStoredAuthorityChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const a = sessionStorage.getItem(HOME_STORED_AUTHORITY_CHOICE_KEY);
    return a === "boss" || a === "mentor" ? a : null;
  } catch {
    return null;
  }
}

export function readPeerFromSession(): HomeStoredPeerChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const p = sessionStorage.getItem(HOME_STORED_PEER_CHOICE_KEY);
    if (p === "classmate") return "classmate";
    if (p === "colleague" || p === "roommate") return "colleague";
    return null;
  } catch {
    return null;
  }
}

/**
 * 在已有 `/train?...` 链接上追加 `authority` / `peer`（解析页「进入训练」等，刷新后仍对齐头像）。
 * 仅在浏览器环境生效；SSR 返回原 URL。
 */
export function appendStoredRolesToTrainHref(href: string): string {
  if (typeof window === "undefined") return href;
  const a = readAuthorityFromSession();
  const p = readPeerFromSession();
  const parts: string[] = [];
  if (a) {
    parts.push(
      `${CHAT_AVATAR_QUERY.authority}=${encodeURIComponent(a)}`
    );
  }
  if (p) {
    parts.push(`${CHAT_AVATAR_QUERY.peer}=${encodeURIComponent(p)}`);
  }
  if (parts.length === 0) return href;
  const q = parts.join("&");
  return href.includes("?") ? `${href}&${q}` : `${href}?${q}`;
}
