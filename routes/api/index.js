const express = require( 'express' );
const {upload} = require('../../server')
const Router = express.Router();
const UserModel = require('../../dbModels/index')
const bcrypt = require( "bcryptjs" );
const {generateJwtToken,verifyToken,genHash} = require('../../helper/index')
const Grid = require('gridfs-stream')
const mongoose = require( 'mongoose' );
const Crypto = require('crypto')
mongoose.set( 'useCreateIndex', true );


//DB Config

let db;

//Switch Between DB's in Prod
( process.env.NODE_ENV !== 'production' ) ? db = 'mongodb://localhost:27017/shopify' : db = process.env.MONGO_URL;

let gfs = {};

let dataBase =async () => {
  try {
    let connection = await mongoose.connect( db, { useUnifiedTopology: true, useNewUrlParser: true } );
    Grid.mongo = mongoose.mongo;
    console.log( 'Connected to Shopify Database' );
    gfs = Grid( connection.connection.db);
      gfs.collection( 'uploads' );
      
  } catch (err) {
      console.log( err );
    };
 };
 dataBase();

//@route POST api/login
//@desc  LOGIN
//@ccess  Public
Router.post( '/login', async( req, res ) => {
    const { username, password } = req.body;

    
    if ( !username || !password ) {
        
        res.json( { message: 'Please enter all fields.', code: 400 } );

    };

    try {
        let user = await UserModel.findOne( { username } );
        if ( !user ) {
           return res.json( { message: 'Invalid credentials.', code: 400 } );
            
        };
        //Validate Password
        // console.log(user)
        let isMatch = bcrypt.compareSync( password, user.password );
        if ( !isMatch ) {
            return res.json( { message: 'Invalid credentials', code: 400 } );
        };

        //Generate Jwt
        const JWTtoken = await generateJwtToken(  user._id );
        return res.status( 200 ).json( {JWTtoken} )
    } catch (err) {
        res.json( 'Internal Server Error.' );
        console.log( err );
    }
} );

//@route POST api/register
//@desc  Register Users
//@access  Public

Router.post( '/register', async ( req, res ) => {
    const { username, password } = req.body;

    
    if ( !username || !password ) {
        
        res.json( { message: 'Please enter all fields.', code: 400 } );

    };
  
    // console.log(req.body)
    try {
        
        let user = await UserModel.findOne( { username } );
        // console.log(user)
    if ( user) {
                
        
        return res.json({message:'Choose a different email', code:400}  )
        }
        //Generate password Hash
        let passwordHash = genHash( password );
        
        const newUser = new UserModel( {
            username,
            password: passwordHash
        } );
        
       let regUser = await newUser.save();
        //Generate Jwt
        const JWTtoken = await generateJwtToken(  regUser._id );
        return res.status( 200 ).json( { JWTtoken } );
        
    } catch (err) {
        console.log(err)
        res.json( 'Internal server error' );
    };
} );

//@route POST api/upload
//@desc  upload image
//@access  Private
Router.post( '/upload', verifyToken, upload.array('file'),  async( req, res ) => {
    
    if ( req.files === undefined || req.files === null ) {
        return res.status( 400 ).json( { msg: 'No file uploaded' } );
    }
    
    try {
        let user = await UserModel.findById( req.user.id );
        
        let allFiles = [];
    for ( let i = 0; i < req.files.length; i++ ){
        let filename = req.files[ i ].filename;
        let filestopush = {
            _id: req.files[ i ].id,
            filename,
            content_type:req.files[i].contentType,
            url: "http://" + req.headers.host + "/api/download/" + filename,
            upload_date:Date.now()
        }
        allFiles.push( filestopush );

        //Save Images for the particular user
        user.images.push( filestopush );
    };
    let files = {
        status: 'ok',
        code: 200,
        files: allFiles,
        count: req.files.length
    };
        await user.save();
    res.json( files );
        
    } catch (err) {
        console.log(err)
        res.json('Internal server error.')
    }
    // console.log(req.files)
} );

//@route GET api/download/:filename
//@desc  view image
//@access  Private
Router.get( '/download/:filename',  ( req, res ) => {
    let { filename } = req.params;
    if ( !filename ) {
        res.json({message:'Invalid Request.',code:400})
    }
    var readStream = gfs.createReadStream(filename ).pipe( res );
    readStream.on( 'close', () => {
            
        console.log( 'done' )
    
    } );

readStream.on( 'error', (err) => {
    res.json('File does not exist.')
});
});

//@route GET api/myfiles
//@desc  Get all files for a user
//@access  Private
Router.get( '/myfiles', verifyToken, async ( req,res )=> {
    try{
        let user = await UserModel.findById(req.user.id);
    let files = user.images;
        res.json( files );
    }catch(err){
        console.log(err);
        res.json('Internal server error.')
    }
} );

//@route DELETE api/delete
//@desc  delete image
//@access  Private
Router.delete( '/delete',verifyToken,  async( req, res ) => {
    let { ids } = req.body;
    if ( !ids || ids.length === 0) {
        res.json( { message: 'Invalid Request.', code: 400 } );
    }

    try {

        
        let user = await UserModel.findById(req.user.id);
        let arr = [...user.images];
        
        //Delete Images from user object
        
var result = arr.map((i, idx)=>{
    
    return arr[idx] = ids.includes(i._id.toString())? undefined : arr[idx]
 }).filter(i=>i)
 
 
        user.images = result;
        await user.save();
    //Delete from Files Collections
    for ( let i = 0; i < ids.length; i++){
        let options = {
            _id: ids[i],
            root:'uploads'
        };
      
       await gfs.remove(options);
        // console.log(file)
    }
    res.json( { message: `${ids.length} Files deleted succesfully`, status: 'ok', code: 200 } );
    } catch (err) {
        console.log(err)
    }
} );



module.exports = Router;