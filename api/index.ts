// The Vercel build generates this JavaScript bundle without declaration files.
// @ts-expect-error Generated server bundle is intentionally consumed as the runtime app.
import app from "../dist/vercel.js";

export default function handler(req: Parameters<typeof app>[0], res: Parameters<typeof app>[1]) {
  return app(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

