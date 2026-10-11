/**
 * Apparence (clair, sombre ou automatique) : un choix par appareil, gardé dans le
 * navigateur. Ce n'est pas une donnée du foyer, elle ne passe donc pas par la base.
 */
export const THEME_KEY = "apo-theme";
export type ThemeChoice = "light" | "dark" | "auto";
export const THEME_COLORS = { light: "#fff8ef", dark: "#0b1c16" } as const;

/**
 * Script exécuté dans <head> avant le premier affichage : pose data-theme sur <html> pour
 * éviter un flash de la mauvaise couleur, et suit le système en mode automatique.
 */
export const THEME_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_KEY)},c=${JSON.stringify(THEME_COLORS)},m=window.matchMedia("(prefers-color-scheme: dark)");function a(){var v=null;try{v=localStorage.getItem(k)}catch(e){}var t=v==="light"||v==="dark"?v:(m.matches?"dark":"light");document.documentElement.setAttribute("data-theme",t);document.querySelectorAll('meta[name="theme-color"]').forEach(function(x){x.setAttribute("content",c[t])})}a();window.__apoApplyTheme=a;m.addEventListener("change",a);document.addEventListener("DOMContentLoaded",a)}catch(e){}})();`;
