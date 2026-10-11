// CMP-A01 ContentAccess の内部：Astro の Content Collections から読む ContentSource（RES-01）
import { getCollection, getEntry } from "astro:content";
import type { ContentSource } from "./index";

export const astroContentSource: ContentSource = {
  async profile() {
    const entry = await getEntry("profile", "profile");
    if (!entry) throw new Error("src/content/profile.md がありません");
    return { id: entry.id, data: entry.data, html: entry.rendered?.html ?? "" };
  },
  async skillGroups() {
    return (await getCollection("skills")).map((e) => ({ id: e.id, data: e.data }));
  },
  async works() {
    return (await getCollection("works")).map((e) => ({ id: e.id, data: e.data }));
  },
  async services() {
    return (await getCollection("services")).map((e) => ({ id: e.id, data: e.data, html: e.rendered?.html ?? "" }));
  },
  async presentation() {
    const entry = await getEntry("presentation", "main");
    if (!entry) throw new Error("src/content/settings/presentation.yaml がありません");
    return entry.data;
  },
};
