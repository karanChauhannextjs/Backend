import "dotenv/config";
import connectDB from "./db/index.js";
import app from "./app.js";

const port = process.env.PORT;
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is started on PORT : ${port}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
