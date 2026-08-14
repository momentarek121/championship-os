import app from "../dist/vercel.js";

export default function handler(req: Parameters<typeof app>[0], res: Parameters<typeof app>[1]) {
  return app(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

