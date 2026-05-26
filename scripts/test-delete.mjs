import { config } from "dotenv";
config({ path: ".env.local" });

import { deleteConversation } from "../services/conversations/repository.ts";

const id = process.argv[2] ?? "1da5fcbb-659a-4b3a-9743-60748b8e9052";

deleteConversation(id)
  .then(() => console.log("OK deleted", id))
  .catch((err) => {
    console.error("FAIL:", err);
    process.exit(1);
  });
