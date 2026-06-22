import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";

const token = jwt.sign(
    {
        idUtilisateur: 1,
        login: "test"
    },
    process.env.JWT_SECRET || "fallback_secret",
    {
        expiresIn: "1h"
    }
);

console.log(token);