import 'dotenv/config'
import express from 'express'
import { DB_connection } from './dbconfig.js'
import cors from 'cors'  // Import cors
import routes from './router.js'
const app = express();

app.use(cors()); 

app.use(express.json());
const port = process.env.PORT || 800

DB_connection();
app.use('/api', routes);

app.listen(port, () => console.log(`Server is running on port ${port}`))