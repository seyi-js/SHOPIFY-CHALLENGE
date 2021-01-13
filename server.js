const express = require( 'express' );
const app = express();
const PORT = process.env.PORT ||5703 ;
const path = require( 'path' );
const GridFsStorage = require( 'multer-gridfs-storage' );
const multer = require( 'multer' );

const crypto = require('crypto')
let db;
( process.env.NODE_ENV !== 'production' ) ? db = 'mongodb://localhost:27017/shopify' : db = process.env.MONGO_URL;

const storage = new GridFsStorage( {
    url: db,
    file: ( req, file ) => {
        return new Promise( ( resolve, reject ) => {
            crypto.randomBytes( 16, ( err, buff ) => {
                if ( err ) {
                    console.log( err )
                }
                
                const filename = buff.toString( 'hex' ) + path.extname( file.originalname );
                const fileInfo = {
                    filename,
                    bucketName: 'uploads'
                };
                resolve( fileInfo )
            } )
        } );
    }
} );

exports.upload = multer( { storage } );
// console.log(gfs)



//Body Parser
app.use( express.json( { urlenncoded: true } ) );

//Routes
const apis = require( './routes/api/index' );

app.use( '/api', apis );
app.get('*', (req,res)=>{
    res.send('hello world!')
})
app.listen( PORT, () => console.log( `Server started on Port ${ PORT }` ) );

