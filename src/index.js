import dotenv from "dotenv";

import connectDB from "./db/index.js";
import express from "express";
const app = express();
dotenv.config();
const port = process.env.PORT || 8000;
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at ${port}`);
    });
  })
  .catch((err) => {
    console.log(`Mongo DB connection failed !!!`, err);
  });

// async () => {
//   try {
//       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//       app.on('error', (error) => {
//           console.log("ERR:", error)
//           throw error
//       })

//       app.listen(process.env.PORT, (port) => {
//           console.log(`App is Listening on port ${port}`)
//       })
//   } catch (error) {
//     console.error("Error", error);
//     throw error;
//   }
// };
