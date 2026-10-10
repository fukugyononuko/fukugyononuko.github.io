import { pick } from "../engines/curation-engine"; import { listAll } from "../resource-access/content-access"; export const home = () => [pick(), listAll()];
