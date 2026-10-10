import type { R } from "../contracts/records"; import { config } from "../utilities/config"; export const listAll = (): R[] => [{ id: config.siteUrl }];
