export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const getLoginUrl = (returnPath?: string) => {
  return "/auth/google";
};