const express = require( 'express' );
const app = express();
const PORT = 5703 || process.env.PORT;
const mongoose = require( 'mongoose' );
mongoose.set( 'useCreateIndex', true );
let db;



//Body Parser
app.use( express.json( { urlenncoded: true } ) );

//Routes
const apis = require( './routes/api/index' );

app.use( '/api', apis );

app.listen( PORT, () => console.log( `Server started on Port ${ PORT }` ) );