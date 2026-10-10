import { listAll } from "../resource-access/content-access"; import { config } from "../utilities/config"; export const pick = () => [listAll(), config];
